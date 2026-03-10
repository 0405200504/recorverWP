import { prisma } from './prisma';
import { sendTextWithHumanBehavior, sendAudioWithHumanBehavior, isInstanceConnected } from './evolution-whatsapp';

/**
 * Avalia se existem campanhas que devem ser acionadas para um evento de pedido.
 */
export async function evaluateCampaigns(organizationId: string, orderId: string, eventTypeId: string) {
    console.log(`[CampaignEngine] Avaliando campanhas para Org: ${organizationId}, Order: ${orderId}, Event: ${eventTypeId}`);

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { lead: true }
    });
    if (!order) {
        console.warn('[CampaignEngine] Pedido não encontrado');
        return;
    }

    const event = await prisma.orderEvent.findUnique({
        where: { id: eventTypeId }
    });
    if (!event) {
        console.warn('[CampaignEngine] Evento não encontrado');
        return;
    }

    console.log(`[CampaignEngine] Tipo do Evento: ${event.eventType}`);

    // 1. Trava Global: Se o pedido já está pago ou reembolsado, para tudo.
    if (order.status === 'approved' || order.status === 'refunded') {
        console.log(`[CampaignEngine] Pedido ${order.id} já finalizado (${order.status}). Parando TUDO.`);
        await stopActiveRuns(order.id);
        return;
    }

    // 2. Interrupção Dinâmica: Cancela runs ativos se o evento atual for um gatilho de parada
    const activeRuns = await prisma.recoveryRun.findMany({
        where: { orderId, status: { in: ['active', 'scheduled', 'running'] } },
        include: { campaign: true }
    });

    for (const run of activeRuns) {
        try {
            const stopEvents: string[] = JSON.parse(run.campaign.stopOnEventTypes || '[]');
            if (stopEvents.includes(event.eventType)) {
                console.log(`[CampaignEngine] Evento "${event.eventType}" é gatilho de parada para campanha "${run.campaign.name}". Cancelando run.`);
                await prisma.recoveryRun.update({
                    where: { id: run.id },
                    data: { status: 'stopped' }
                });
                await prisma.stepDispatch.updateMany({
                    where: { runId: run.id, status: 'pending' },
                    data: { status: 'canceled', lastError: `Stop trigger: ${event.eventType}` }
                });
            }
        } catch (e) {
            console.error(`[CampaignEngine] Erro ao processar stopOnEventTypes da run ${run.id}:`, e);
        }
    }

    // 3. Avalia novas campanhas
    const activeCampaigns = await prisma.campaign.findMany({
        where: { organizationId, active: true },
        include: { steps: { orderBy: { stepOrder: 'asc' } } }
    });

    console.log(`[CampaignEngine] Encontradas ${activeCampaigns.length} campanhas ativas.`);

    for (const campaign of activeCampaigns) {
        let triggered = false;
        try {
            const triggerTypes: string[] = JSON.parse(campaign.triggerEventTypes);
            if (triggerTypes.includes(event.eventType)) {
                triggered = true;
                console.log(`[CampaignEngine] ✅ Campanha "${campaign.name}" engatilhada!`);
            }
        } catch (e) {
            console.error(`[CampaignEngine] Erro ao parsear gatilhos da campanha ${campaign.id}:`, e);
        }

        if (!triggered) continue;

        // Busca RecoveryRun existente para (orderId, campaignId)
        const existingRun = await prisma.recoveryRun.findUnique({
            where: {
                orderId_campaignId: { orderId, campaignId: campaign.id }
            },
            include: { dispatches: { take: 1 } }
        });

        // Se a run já existe MAS está parada/concluída OU não tem nenhum dispatch, permitimos reiniciar
        // NOVIDADE: Também permitimos reiniciar se a run estiver 'active' mas houver um novo gatilho,
        // garantindo que novos abandonos/pix reiniciem a cadência de mensagens.
        const needsRestart = existingRun && (
            ['stopped', 'completed', 'failed'].includes(existingRun.status) ||
            existingRun.dispatches.length === 0 ||
            existingRun.status === 'active' 
        );

        if (!existingRun || needsRestart) {
            console.log(`[CampaignEngine] Criando/Reiniciando RecoveryRun para pedido ${orderId} e campanha ${campaign.name}`);

            if (existingRun) {
                // Ao reiniciar, limpamos TODOS os disparos pendentes anteriores desta run
                await prisma.stepDispatch.deleteMany({
                    where: { runId: existingRun.id, status: 'pending' }
                });
            }

            const run = await prisma.recoveryRun.upsert({
                where: {
                    orderId_campaignId: { orderId, campaignId: campaign.id }
                },
                update: {
                    status: 'active',
                    updatedAt: new Date()
                },
                create: {
                    organizationId,
                    orderId,
                    campaignId: campaign.id,
                    status: 'active',
                }
            });

            const now = new Date();
            for (const step of campaign.steps) {
                const secondsFromMinutes = (step.delayMinutes || 0) * 60;
                const secondsToWait = secondsFromMinutes + (step.delaySeconds || 0);
                const scheduledTime = new Date(now.getTime() + secondsToWait * 1000);

                // Trava de Anti-Duplicidade (30 min): 
                // Não permite criar um novo agendamento para o MESMO passo se já existe um registro (pendente ou enviado) 
                // criado nos últimos 30 minutos para este pedido. Isso evita duplicidade por webhooks redundantes da plataforma.
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                const existingDispatch = await prisma.stepDispatch.findFirst({
                    where: { 
                        runId: run.id, 
                        stepId: step.id,
                        createdAt: { gte: thirtyMinutesAgo }
                    }
                });

                if (existingDispatch) {
                    console.log(`[CampaignEngine] Dispatch recente (${existingDispatch.status}) já existe para o Step ${step.id} na Run ${run.id}. Pulando para evitar duplicidade.`);
                    continue;
                }

                // Cria o registro de dispatch
                const dispatch = await prisma.stepDispatch.create({
                    data: {
                        runId: run.id,
                        stepId: step.id,
                        scheduledFor: scheduledTime,
                        status: 'pending'
                    },
                    include: {
                        run: {
                            include: {
                                order: { include: { lead: true } },
                                organization: { include: { whatsappNumbers: { where: { status: 'active' } } } }
                            }
                        },
                        step: true
                    }
                });

                // NOVIDADE: Se o delay for 0, dispara IMEDIATAMENTE sem esperar o cron
                if (secondsToWait === 0) {
                    console.log(`[CampaignEngine] Delay 0 detectado no Step ${step.id}. Disparando imediatamente...`);
                    // Não aguardamos o envio para não travar o processo do webhook (fire and forget controlado)
                    executeImmediateDispatch(dispatch.id).catch(err => {
                        console.error(`[CampaignEngine] Erro no disparo instantâneo:`, err);
                    });
                } else {
                    console.log(`[CampaignEngine] Agendando step ${step.stepOrder} para ${scheduledTime.toISOString()} (Delay: ${secondsToWait}s)`);
                }
            }
        }
    }
}

/**
 * Executa o disparo de uma mensagem imediatamente.
 * Útil para steps com delay 0.
 */
async function executeImmediateDispatch(dispatchId: string) {
    const dispatch = await prisma.stepDispatch.findUnique({
        where: { id: dispatchId },
        include: {
            run: {
                include: {
                    order: { include: { lead: true } },
                    organization: { include: { whatsappNumbers: { where: { status: 'active' } } } }
                }
            },
            step: true
        }
    });

    if (!dispatch || dispatch.status !== 'pending') return;

    const { run, step } = dispatch;
    const { order, organization, lead } = { ...run, ...run.order };
    const waNumbers = organization.whatsappNumbers;

    if (!waNumbers || waNumbers.length === 0) return;

    const instanceName = waNumbers[0].phoneNumberId;

    try {
        // Trava atômica: Só prossegue se o status ainda for 'pending'
        const updated = await prisma.stepDispatch.updateMany({
            where: { id: dispatch.id, status: 'pending' },
            data: { status: 'sent', sentAt: new Date(), attempts: 1 }
        });

        if (updated.count === 0) {
            console.log(`[ImmediateDispatch] 🛑 Dispatch ${dispatch.id} já está sendo processado ou já foi enviado.`);
            return;
        }

        const connected = await isInstanceConnected(instanceName);
        if (!connected) throw new Error(`Instância ${instanceName} desconectada`);

        let messageId: string | undefined;

        if (step.messageType === 'audio' && step.mediaUrl) {
            const result = await sendAudioWithHumanBehavior(instanceName, lead.phoneE164, step.mediaUrl);
            messageId = result.messageId;
        } else {
            const result = await sendTextWithHumanBehavior(instanceName, lead.phoneE164, step.contentText || '', lead.name || undefined);
            messageId = result.messageId;
        }

        // Registra no histórico
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

        console.log(`[ImmediateDispatch] ✅ Sucesso no disparo direto para ${lead.phoneE164}`);

    } catch (err: any) {
        console.error(`[ImmediateDispatch] ❌ Falha:`, err.message);
        await prisma.stepDispatch.update({
            where: { id: dispatch.id },
            data: { status: 'failed', lastError: err.message, attempts: 1 }
        });
    }
}

async function stopActiveRuns(orderId: string) {
    const runs = await prisma.recoveryRun.findMany({
        where: {
            orderId,
            status: { in: ['scheduled', 'running', 'active'] }
        }
    });

    for (const run of runs) {
        await prisma.recoveryRun.update({
            where: { id: run.id },
            data: { status: 'stopped' }
        });

        await prisma.stepDispatch.updateMany({
            where: { runId: run.id, status: 'pending' },
            data: { status: 'canceled', lastError: 'Order finalized (approved/refunded)' }
        });
    }
}
