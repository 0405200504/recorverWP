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

    // Permite Bearer token ou query param ?secret=...
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
        console.warn('[SCHEDULER] Tentativa de acesso não autorizado');
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();
        console.log(`[SCHEDULER] Iniciando processamento em ${now.toISOString()} (Force: ${isForce})`);

        const where: any = { status: 'pending' };
        if (!isForce) {
            where.scheduledFor = { lte: now };
        }

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
            take: isForce ? 10 : 1,
            orderBy: { scheduledFor: 'asc' }
        });

        if (pendingDispatches.length === 0) {
            console.log('[SCHEDULER] Nenhum dispatch pendente no momento.');
            return NextResponse.json({ processed: 0, message: 'Nada para enviar' });
        }

        console.log(`[SCHEDULER] Processando ${pendingDispatches.length} dispatch(es)...`);

        let sent = 0, skipped = 0, failed = 0;

        for (const dispatch of pendingDispatches) {
            const { run, step } = dispatch;
            const { order, organization } = run;
            const { lead } = order;

            // 1. Verifica se a ordem já foi concluída (compra aprovada ou reembolso)
            if (order.status === 'approved' || order.status === 'refunded' || run.status === 'stopped') {
                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: { status: 'canceled', lastError: 'Pedido finalizado ou run parada' }
                });
                skipped++;
                continue;
            }

            // 2. Verifica se tem número WhatsApp configurado
            const waNumbers = organization.whatsappNumbers;
            if (!waNumbers || waNumbers.length === 0) {
                console.warn(`[SCHEDULER] Org ${organization.id} sem números ativos.`);
                await failDispatch(dispatch.id, dispatch.attempts, 'Nenhum número WhatsApp ativo encontrado');
                failed++;
                continue;
            }

            // 3. O instanceName é salvo em phoneNumberId quando conectado via Evolution API
            const waNumber = waNumbers[0];
            const instanceName = waNumber.phoneNumberId;

            console.log(`[SCHEDULER] Verificando conexão da instância: ${instanceName}`);
            const connected = await isInstanceConnected(instanceName);
            if (!connected) {
                console.error(`[SCHEDULER] Instância ${instanceName} desconectada da Evolution API.`);
                await failDispatch(dispatch.id, dispatch.attempts, `Instância ${instanceName} desconectada`);
                failed++;
                continue;
            }

            console.log(`[SCHEDULER] Enviando mensagem para ${lead.phoneE164}...`);
            // 5. Envia a mensagem com comportamento humano anti-ban
            try {
                let messageId: string | undefined;

                if (step.messageType === 'audio' && step.mediaUrl) {
                    console.log(`[SCHEDULER] Tipo Áudio: ${step.mediaUrl}`);
                    const result = await sendAudioWithHumanBehavior(
                        instanceName,
                        lead.phoneE164,
                        step.mediaUrl
                    );
                    messageId = result.messageId;
                } else {
                    const text = step.contentText || '';
                    console.log(`[SCHEDULER] Tipo Texto: "${text.substring(0, 30)}..."`);
                    const result = await sendTextWithHumanBehavior(
                        instanceName,
                        lead.phoneE164,
                        text,
                        lead.name || undefined
                    );
                    messageId = result.messageId;
                }

                console.log(`[SCHEDULER] ✅ Sucesso! MessageId: ${messageId}`);

                // Atualiza como enviado
                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: {
                        status: 'sent',
                        sentAt: new Date(),
                        attempts: dispatch.attempts + 1,
                        lastError: null,
                    }
                });

                // Registra a mensagem no histórico
                await prisma.message.create({
                    data: {
                        organizationId: organization.id,
                        leadId: lead.id,
                        orderId: order.id,
                        direction: 'outbound',
                        channel: 'whatsapp',
                        payload: JSON.stringify({
                            type: step.messageType,
                            content: step.contentText || step.mediaUrl,
                            instanceName,
                        }),
                        waMessageId: messageId,
                        status: 'sent',
                    }
                });

                sent++;

                // Pausa entre mensagens diferentes (40s-90s) para evitar spam
                if (pendingDispatches.indexOf(dispatch) < pendingDispatches.length - 1) {
                    await new Promise(r => setTimeout(r, Math.random() * 50000 + 40000));
                }

            } catch (err: any) {
                console.error(`[SCHEDULER] Erro ao enviar para ${lead.phoneE164}:`, err.message);
                await failDispatch(dispatch.id, dispatch.attempts, err.message);
                failed++;
            }
        }

        return NextResponse.json({ processed: pendingDispatches.length, sent, skipped, failed });
    } catch (err) {
        console.error('[CRON ERROR]', err);
        return new NextResponse('Internal Error', { status: 500 });
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
        const backoffMinutes = newAttempts === 1 ? 10 : 30;
        const nextRetry = new Date(Date.now() + backoffMinutes * 60000);
        await prisma.stepDispatch.update({
            where: { id: dispatchId },
            data: { attempts: newAttempts, lastError: errorMsg, scheduledFor: nextRetry }
        });
    }
}
