import { prisma } from './prisma';

export async function evaluateCampaigns(organizationId: string, orderId: string, eventTypeId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { lead: true }
    });
    if (!order) return;

    const event = await prisma.orderEvent.findUnique({
        where: { id: eventTypeId }
    });
    if (!event) return;

    // Se o pedido já está pago ou reembolsado, devemos parar runs ativos e não criar novos
    if (order.status === 'approved' || order.status === 'refunded') {
        await stopActiveRuns(order.id);
        return;
    }

    // Busca campanhas ativas para esta organização
    const activeCampaigns = await prisma.campaign.findMany({
        where: { organizationId, active: true },
        include: { steps: true }
    });

    for (const campaign of activeCampaigns) {
        let triggered = false;
        try {
            const triggerTypes: string[] = JSON.parse(campaign.triggerEventTypes);
            if (triggerTypes.includes(event.eventType)) {
                triggered = true;
            }
        } catch (e) { }

        if (!triggered) continue;

        // TODO: Evaluate matching rules here (e.g., minimum amount, specific offer)

        // Create RecoveryRun se não existir para (orderId, campaignId)
        const existingRun = await prisma.recoveryRun.findUnique({
            where: {
                orderId_campaignId: { orderId, campaignId: campaign.id }
            }
        });

        if (!existingRun) {
            const run = await prisma.recoveryRun.create({
                data: {
                    organizationId,
                    orderId,
                    campaignId: campaign.id,
                    status: 'scheduled',
                }
            });

            // Agendar os StepDispatches
            const now = new Date();
            for (const step of campaign.steps) {
                const scheduledTime = new Date(now.getTime() + step.delayMinutes * 60000);
                await prisma.stepDispatch.create({
                    data: {
                        runId: run.id,
                        stepId: step.id,
                        scheduledFor: scheduledTime,
                    }
                });
            }
        }
    }
}

async function stopActiveRuns(orderId: string) {
    // Encontra ruas ativas
    const runs = await prisma.recoveryRun.findMany({
        where: {
            orderId,
            status: { in: ['scheduled', 'running'] }
        }
    });

    for (const run of runs) {
        // Para a run
        await prisma.recoveryRun.update({
            where: { id: run.id },
            data: { status: 'stopped' }
        });

        // Cancela os dispatches pendentes
        await prisma.stepDispatch.updateMany({
            where: {
                runId: run.id,
                status: 'pending'
            },
            data: {
                status: 'canceled',
                lastError: 'Order finalized (approved/refunded)'
            }
        });
    }
}
