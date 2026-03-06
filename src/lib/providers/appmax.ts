import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

export const appmaxAdapter: WebhookProviderAdapter = {
    // Appmax uses a secret token in the webhook configuration
    verifySignature(payload: string, signature: string, secret: string): boolean {
        if (!secret) return true;
        // signature is typically sent as access-token in the body or header
        try {
            const data = JSON.parse(payload);
            if (data.access_token === secret) return true;
        } catch { }
        return signature === secret;
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            const data = rawPayload.data || rawPayload;

            // Appmax webhooks (https://docs.appmax.com.br/)
            // Events: OrderApproved, OrderBilletPrinted, OrderPixCreated, OrderCanceled, OrderRefunded, AbandonedCheckout
            const rawEvent = String(data.event || data.event_type || data.status || '').toLowerCase();
            const method = String(data.payment_type || data.payment_method || '').toLowerCase();

            let eventType: any = 'order_created';
            let status: any = 'pending';

            if (rawEvent.includes('approved') || rawEvent.includes('pagamento_aprovado')) {
                eventType = 'payment_approved';
                status = 'approved';
            } else if (rawEvent.includes('pixcreated') || rawEvent.includes('pix_criado') || (method === 'pix' && rawEvent.includes('pending'))) {
                eventType = 'pix_generated';
                status = 'pending';
            } else if (rawEvent.includes('billetprinted') || rawEvent.includes('boleto_impresso') || (method === 'boleto' && rawEvent.includes('pending'))) {
                eventType = 'boleto_generated';
                status = 'pending';
            } else if (rawEvent.includes('canceled') || rawEvent.includes('refused') || rawEvent.includes('recusado') || rawEvent.includes('cancelado')) {
                eventType = 'payment_failed';
                status = 'failed';
            } else if (rawEvent.includes('refunded') || rawEvent.includes('reembolsado')) {
                eventType = 'refund';
                status = 'refunded';
            } else if (rawEvent.includes('abandoned') || rawEvent.includes('carrinho_abandonado')) {
                eventType = 'checkout_abandoned';
                status = 'started';
            }

            const customer = data.customer || data.Customer || {};

            return {
                externalOrderId: data.id || data.order_id || String(Date.now()),
                lead: {
                    name: customer.firstname ? `${customer.firstname} ${customer.lastname || ''}` : customer.name,
                    phoneE164: String(customer.telephone || customer.phone || '').replace(/\D/g, ''),
                    email: customer.email || '',
                },
                payment: {
                    amount: Number(data.total || data.amount || 0),
                    currency: 'BRL', // Appmax is primary BRL
                    method: method.includes('pix') ? 'pix' : (method.includes('boleto') ? 'boleto' : 'card'),
                },
                status: status,
                eventType: eventType,
                timestamp: data.date_created || data.created_at || new Date().toISOString(),
                checkoutUrl: data.payment_url || undefined,
                pixCopyPaste: data.pix_qrcode || data.pix_emv || undefined,
            };

        } catch (e) {
            console.error('[AppmaxAdapter] Error normalizing:', e);
            return null;
        }
    },
};
