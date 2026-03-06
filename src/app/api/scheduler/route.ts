import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTextWithHumanBehavior, sendAudioWithHumanBehavior, isInstanceConnected } from '@/lib/evolution-whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const secretParam = url.searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'cron-recuperei-2024';
    const isForce = url.searchParams.get('force') === 'true';

    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
        console.warn('[SCHEDULER] Tentativa de acesso não autorizado');
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();
        console.log(`[SCHEDULER] Iniciando em ${now.toISOString()}`);

        const where: any = { status: 'pending' };
        if (!isForce) {
            where.scheduledFor = { lte: now };
        }

        // Processar até 20 dispatches por ciclo para manter delays precisos
        const pendingDispatches = await prisma.stepDispatch.findMany({
            where,
            include: {
                run: {
                    include: {
                        order: { include: { lead: true } },
                        organization: {
                            include: {
                                whatsappNumbers: { where: { status: 'active' } }
                            }
                        }
                    }
                },
                step: true
            },
            take: 20,
            orderBy: { scheduledFor: 'asc' }
        });

        if (pendingDispatches.length === 0) {
            return NextResponse.json({ processed: 0, message: 'Nada para enviar' });
        }

        console.log(`[SCHEDULER] ${pendingDispatches.length} dispatch(es) para processar`);

        let sent = 0, skipped = 0, failed = 0;

        for (const dispatch of pendingDispatches) {
            const { run, step } = dispatch;
            const { order, organization } = run;
            const { lead } = order;

            const elapsed = Date.now() - new Date(dispatch.scheduledFor).getTime();
            console.log(`[SCHEDULER] Dispatch ${dispatch.id} — atrasado ${Math.round(elapsed / 1000)}s do horário agendado`);

            // Cancelar se pedido já finalizado ou run parada
            if (order.status === 'approved' || order.status === 'refunded' || run.status === 'stopped') {
                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: { status: 'canceled', lastError: 'Pedido finalizado ou run parada' }
                });
                skipped++;
                continue;
            }

            const waNumbers = organization.whatsappNumbers;
            if (!waNumbers || waNumbers.length === 0) {
                await failDispatch(dispatch.id, dispatch.attempts, 'Nenhum número WhatsApp ativo encontrado');
                failed++;
                continue;
            }

            const instanceName = waNumbers[0].phoneNumberId;
            const connected = await isInstanceConnected(instanceName);
            if (!connected) {
                await failDispatch(dispatch.id, dispatch.attempts, `Instância ${instanceName} desconectada`);
                failed++;
                continue;
            }

            try {
                let messageId: string | undefined;
                const text = replaceVariables(step.contentText || '', lead);

                if (step.messageType === 'audio' && step.mediaUrl) {
                    const result = await sendAudioWithHumanBehavior(instanceName, lead.phoneE164, step.mediaUrl);
                    messageId = result.messageId;
                } else {
                    const result = await sendTextWithHumanBehavior(instanceName, lead.phoneE164, text, lead.name || undefined);
                    messageId = result.messageId;
                }

                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: { status: 'sent', sentAt: new Date(), attempts: dispatch.attempts + 1, lastError: null }
                });

                await prisma.message.create({
                    data: {
                        organizationId: organization.id,
                        leadId: lead.id,
                        orderId: order.id,
                        direction: 'outbound',
                        channel: 'whatsapp',
                        payload: JSON.stringify({ type: step.messageType, content: step.contentText || step.mediaUrl, instanceName }),
                        waMessageId: messageId,
                        status: 'sent',
                    }
                });

                // Atualiza run como running quando primeiro step é enviado
                if (dispatch.step.stepOrder === 1) {
                    await prisma.recoveryRun.update({
                        where: { id: run.id },
                        data: { status: 'running' }
                    }).catch(() => { });
                }

                sent++;
                console.log(`[SCHEDULER] ✅ Enviado para ${lead.phoneE164} — step ${step.stepOrder}`);

                // Pausa APENAS se há mais de 1 mensagem NO MESMO LOTE para diferentes leads (anti-ban)
                // NÃO pausamos entre steps da mesma sequência — cada step já tem seu scheduledFor
                if (pendingDispatches.indexOf(dispatch) < pendingDispatches.length - 1) {
                    const nextDispatch = pendingDispatches[pendingDispatches.indexOf(dispatch) + 1];
                    // Só pausa se for um lead diferente (não a próxima mensagem do mesmo funil)
                    if (nextDispatch?.run?.order?.leadId !== dispatch.run.order.leadId) {
                        await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000)); // 3–7s entre leads diferentes
                    }
                }

            } catch (err: any) {
                console.error(`[SCHEDULER] ❌ Erro: ${err.message}`);
                await failDispatch(dispatch.id, dispatch.attempts, err.message);
                failed++;
            }
        }

        // Verifica se todos os dispatches de alguma run foram concluídos para marcar como completed
        await checkAndCompleteRuns();

        return NextResponse.json({ processed: pendingDispatches.length, sent, skipped, failed });
    } catch (err) {
        console.error('[CRON ERROR]', err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

function replaceVariables(text: string, lead: any): string {
    return text
        .replace(/\{\{nome\}\}/gi, lead.name || 'Cliente')
        .replace(/\{\{name\}\}/gi, lead.name || 'Cliente')
        .replace(/\{\{email\}\}/gi, lead.email || '')
        .replace(/\{\{telefone\}\}/gi, lead.phoneE164 || '');
}

async function checkAndCompleteRuns() {
    // Busca runs que estejam running/active e sem dispatches pendentes
    const activeRuns = await prisma.recoveryRun.findMany({
        where: { status: { in: ['running', 'active'] } },
        include: { dispatches: { where: { status: 'pending' } } }
    });
    for (const run of activeRuns) {
        if (run.dispatches.length === 0) {
            await prisma.recoveryRun.update({ where: { id: run.id }, data: { status: 'completed' } });
        }
    }
}

async function failDispatch(dispatchId: string, currentAttempts: number, errorMsg: string) {
    const newAttempts = currentAttempts + 1;
    if (newAttempts >= 3) {
        await prisma.stepDispatch.update({
            where: { id: dispatchId },
            data: { status: 'failed', attempts: newAttempts, lastError: errorMsg }
        });
    } else {
        // Retry com backoff menor (2min, 5min) para não atrasar muito
        const backoffMinutes = newAttempts === 1 ? 2 : 5;
        const nextRetry = new Date(Date.now() + backoffMinutes * 60000);
        await prisma.stepDispatch.update({
            where: { id: dispatchId },
            data: { attempts: newAttempts, lastError: errorMsg, scheduledFor: nextRetry }
        });
    }
}
