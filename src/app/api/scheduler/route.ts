import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTextWithHumanBehavior, sendAudioWithHumanBehavior, isInstanceConnected } from '@/lib/evolution-whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Autenticação do cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();

        // Busca o próximo dispatch pendente (apenas 1 por execução para não causar timeout na Vercel)
        const pendingDispatches = await prisma.stepDispatch.findMany({
            where: {
                status: 'pending',
                scheduledFor: { lte: now }
            },
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
            take: 1, // 1 por execução — o cron roda a cada 1 minuto naturalmente
            orderBy: { scheduledFor: 'asc' }
        });


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
                await failDispatch(dispatch.id, dispatch.attempts, 'Nenhum número WhatsApp ativo encontrado');
                failed++;
                continue;
            }

            // 3. O instanceName é salvo em phoneNumberId quando conectado via Evolution API
            const waNumber = waNumbers[0];
            const instanceName = waNumber.phoneNumberId; // nome da instância na Evolution API

            // 4. Verifica se a instância está conectada
            const connected = await isInstanceConnected(instanceName);
            if (!connected) {
                await failDispatch(dispatch.id, dispatch.attempts, `Instância ${instanceName} desconectada`);
                failed++;
                continue;
            }

            // 5. Envia a mensagem com comportamento humano anti-ban
            try {
                let messageId: string | undefined;

                if (step.messageType === 'audio' && step.mediaUrl) {
                    // Áudio: simula "gravando áudio..." (4-10s) antes de enviar
                    const result = await sendAudioWithHumanBehavior(
                        instanceName,
                        lead.phoneE164,
                        step.mediaUrl
                    );
                    messageId = result.messageId;
                } else {
                    // Texto: simula "digitando..." proporcional ao tamanho (3-8s)
                    const text = step.contentText || '';
                    const result = await sendTextWithHumanBehavior(
                        instanceName,
                        lead.phoneE164,
                        text,
                        lead.name || undefined
                    );
                    messageId = result.messageId;
                }

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
