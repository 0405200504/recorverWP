import { prisma } from './prisma';
import { NormalizedWebhookPayload } from './types/webhook';
import { evaluateCampaigns } from './campaign-engine';

export async function processWebhookPayload(organizationId: string, provider: string, payload: NormalizedWebhookPayload, rawBody: string) {
    console.log(`[WebhookProcessor] Evento recebido: ${payload.eventType} (Status: ${payload.status}) para o pedido ${payload.externalOrderId}`);

    // 1. Lógica de Idempotência: verificar se evento já existe
    const orderEventKey = `${provider}_${payload.externalOrderId}_${payload.eventType}_${payload.status}`;

    // Usar upsert para Order
    let order = await prisma.order.findUnique({
        where: {
            organizationId_provider_externalOrderId: {
                organizationId,
                provider,
                externalOrderId: payload.externalOrderId,
            },
        }
    });

    // Upsert Lead
    const lead = await prisma.lead.upsert({
        where: {
            organizationId_phoneE164: {
                organizationId,
                phoneE164: payload.lead.phoneE164,
            }
        },
        update: {
            name: payload.lead.name || undefined,
            email: payload.lead.email || undefined,
            lastSeenAt: new Date(payload.timestamp),
        },
        create: {
            organizationId,
            name: payload.lead.name,
            phoneE164: payload.lead.phoneE164,
            email: payload.lead.email,
            consentWhatsapp: true, // consentimento implícito ao iniciar checkout
            consentSource: 'webhook',
            consentAt: new Date(),
            lastSeenAt: new Date(payload.timestamp),
        }
    });


    const statusPriority: Record<string, number> = {
        'approved': 4,
        'refunded': 4,
        'pending': 3,
        'pix_generated': 3,
        'boleto_generated': 3,
        'card_declined': 2,
        'payment_failed': 2,
        'failed': 2,
        'started': 1,
        'checkout_abandoned': 1
    };

    if (!order) {
        order = await prisma.order.create({
            data: {
                organizationId,
                leadId: lead.id,
                externalOrderId: payload.externalOrderId,
                provider,
                status: payload.status,
                paymentMethod: payload.payment.method,
                amount: payload.payment.amount,
                currency: payload.payment.currency,
                checkoutUrl: payload.checkoutUrl,
                pixCopyPaste: payload.pixCopyPaste,
            }
        });
    } else {
        const currentPriority = statusPriority[order.status] || 0;
        const newPriority = statusPriority[payload.status] || 0;

        // Só atualiza status se for uma prioridade MAIOR ou IGUAL (para casos de novo PIX, por ex)
        // Mas nunca regredir de PIX/Pago para Abandono
        const shouldUpdateStatus = newPriority >= currentPriority;

        order = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: shouldUpdateStatus ? payload.status : order.status,
                leadId: lead.id,
                paymentMethod: payload.payment.method || order.paymentMethod,
                amount: payload.payment.amount || order.amount,
                checkoutUrl: payload.checkoutUrl || order.checkoutUrl,
                pixCopyPaste: payload.pixCopyPaste || order.pixCopyPaste,
            }
        });
    }

    // Verifica se o OrderEvent já foi processado (Idempotência rigorosa)
    const existingEvent = await prisma.orderEvent.findFirst({
        where: {
            orderId: order.id,
            eventType: payload.eventType,
            createdAt: { gte: new Date(Date.now() - 5000) } // Janela de 5 segundos para evitar race condition
        }
    });

    if (existingEvent) {
        console.log('[WebhookProcessor] Evento ignorado: Evento idêntico processado nos últimos 5 segundos.', existingEvent.id);
        return { status: 'ignored', reason: 'idempotency_race_condition' };
    }

    // Registra OrderEvent
    const newEvent = await prisma.orderEvent.create({
        data: {
            orderId: order.id,
            eventType: payload.eventType,
            rawPayload: rawBody,
            normalizedPayload: JSON.stringify(payload),
        }
    });

    // Chamar o serviço de avaliação de campanhas (Campaign Engine)
    await evaluateCampaigns(organizationId, order.id, newEvent.id);

    return { status: 'processed', eventId: newEvent.id };
}
