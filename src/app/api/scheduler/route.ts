import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
    // Authentication para a rota de cron (ex: header de bearer token vercel-cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();

        // Buscar dispatches pendentes que já passaram do horário de envio
        const pendingDispatches = await prisma.stepDispatch.findMany({
            where: {
                status: 'pending',
                scheduledFor: { lte: now }
            },
            include: {
                run: {
                    include: {
                        order: { include: { lead: true } },
                        organization: { include: { whatsappNumbers: { where: { status: 'active' } } } } // Simplificação: pega o 1º número
                    }
                },
                step: true
            },
            take: 50 // processar em lotes
        });

        for (const dispatch of pendingDispatches) {
            const { run, step } = dispatch;
            const { order, organization } = run;
            const { lead } = order;

            // Verificações antes de enviar
            if (order.status === 'approved' || order.status === 'refunded' || run.status === 'stopped') {
                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: { status: 'canceled', lastError: 'Run stopped or order finalized' }
                });
                continue;
            }

            if (!lead.consentWhatsapp) {
                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: { status: 'skipped', lastError: 'Lead opt-out or no consent' }
                });
                continue;
            }

            const waNumbers = organization.whatsappNumbers;
            if (!waNumbers || waNumbers.length === 0) {
                await failDispatch(dispatch.id, dispatch.attempts, 'No active WhatsApp Number found');
                continue;
            }

            const waNumber = waNumbers[0];
            const waService = new WhatsAppService(waNumber.phoneNumberId, waNumber.accessToken);

            // Regra de tempo (Janela 24h). Simplificação: se sendOnlyIf for fora_24h, exigiria um template.
            // O motor ideal verifica last_inbound_at, mas aqui validaremos apenas se o template está configurado quando type=template.

            try {
                let result;
                if (step.messageType === 'template') {
                    if (!step.templateName) throw new Error('Template name missing');
                    const language = 'pt_BR'; // Pegaria do DB real

                    // O ideal: resolver placeholders dinamicamente
                    const components: any[] = [
                        {
                            type: 'body',
                            parameters: [{ type: 'text', text: lead.name || 'Cliente' }]
                        }
                    ];

                    result = await waService.sendTemplate(lead.phoneE164, step.templateName, language, components);
                } else {
                    // Freeform text com placeholders simples (aqui só um de exemplo)
                    let body = step.contentText || '';
                    body = body.replace(/{{lead_name}}/g, lead.name || 'Cliente');
                    body = body.replace(/{{amount}}/g, order.amount.toString());

                    result = await waService.sendTextFreeform(lead.phoneE164, body);
                }

                // Sucesso
                await prisma.stepDispatch.update({
                    where: { id: dispatch.id },
                    data: {
                        status: 'sent',
                        sentAt: new Date(),
                        attempts: dispatch.attempts + 1,
                        lastError: null,
                    }
                });

                // Registrar Message enviada
                await prisma.message.create({
                    data: {
                        organizationId: organization.id,
                        leadId: lead.id,
                        orderId: order.id,
                        direction: 'outbound',
                        channel: 'whatsapp',
                        payload: JSON.stringify(step),
                        waMessageId: result.waMessageId,
                        status: 'sent',
                    }
                });

            } catch (err: any) {
                await failDispatch(dispatch.id, dispatch.attempts, err.message);
            }
        }

        return NextResponse.json({ processed: pendingDispatches.length });
    } catch (err) {
        console.error('[CRON ERROR]', err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

async function failDispatch(dispatchId: string, currentAttempts: number, errorMsg: string) {
    const newAttempts = currentAttempts + 1;
    if (newAttempts >= 3) {
        // Falha definitiva
        await prisma.stepDispatch.update({
            where: { id: dispatchId },
            data: { status: 'failed', attempts: newAttempts, lastError: errorMsg }
        });
    } else {
        // Retry: reagendar para X min no futuro (ex: +5min, +20min)
        const backoffMinutes = newAttempts === 1 ? 5 : 20;
        const nextRetry = new Date(Date.now() + backoffMinutes * 60000);
        await prisma.stepDispatch.update({
            where: { id: dispatchId },
            data: {
                attempts: newAttempts,
                lastError: errorMsg,
                scheduledFor: nextRetry,
            }
        });
    }
}
