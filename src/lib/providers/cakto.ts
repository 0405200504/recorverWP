import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

export const caktoAdapter: WebhookProviderAdapter = {
    verifySignature(payload: string, signature: string, secret: string): boolean {
        // Cakto documentation isn't always publicly standardized for HMAC, usually a token is passed in header or query
        if (!secret) return true;
        return signature === secret;
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            const data = rawPayload.data || rawPayload;

            // Cakto webhooks
            const rawEvent = String(rawPayload.event || rawPayload.event_name || data.event || data.event_name || '').toLowerCase();
            const method = String(data.payment_method || data.method || '').toLowerCase();

            let eventType: any = 'order_created';
            let status: any = 'pending';

            if (rawEvent.includes('approved') || rawEvent.includes('paid') || rawEvent.includes('pago')) {
                eventType = 'payment_approved';
                status = 'approved';
            } else if (rawEvent.includes('pix')) {
                eventType = 'pix_generated';
                status = 'pending';
            } else if (rawEvent.includes('waiting_payment') || rawEvent.includes('pending') || rawEvent.includes('waiting') || rawEvent.includes('aguardando')) {
                status = 'pending';
                if (method.includes('pix')) eventType = 'pix_generated';
                else if (method.includes('boleto') || method.includes('billet')) eventType = 'boleto_generated';
            } else if (rawEvent.includes('failed') || rawEvent.includes('refused') || rawEvent.includes('recusado') || rawEvent.includes('cancel')) {
                eventType = 'card_declined';
                status = 'failed';
            } else if (rawEvent.includes('refund') || rawEvent.includes('estornado')) {
                eventType = 'refund';
                status = 'refunded';
            } else if (rawEvent.includes('abandoned') || rawEvent.includes('checkout') || rawEvent.includes('lead')) {
                // Se já identificamos como aprovado ou pix acima, não deve cair aqui
                if (eventType === 'order_created') {
                    eventType = 'checkout_abandoned';
                    status = 'started';
                }
            }

            const customer = data.customer || data.client || {};
            const clientName = data.customerName || customer.name || customer.full_name || '';
            const clientEmail = data.customerEmail || customer.email || '';
            const clientPhone = data.customerCellphone || customer.phone || customer.mobile || '';

            return {
                externalOrderId: data.transaction_id || data.order_id || (data.product ? data.product.short_id : '') || String(Date.now()),
                lead: {
                    name: clientName,
                    phoneE164: String(clientPhone).replace(/\D/g, ''),
                    email: clientEmail,
                },
                payment: {
                    amount: Number(data.amount || data.price || data.total || (data.offer ? data.offer.price : 0) || 0),
                    currency: data.currency || (data.offer ? data.offer.currency : 'BRL'),
                    method: method as any,
                },
                status: status,
                eventType: eventType,
                timestamp: data.created_at || data.createdAt || new Date().toISOString(),
                checkoutUrl: data.checkout_url || data.checkoutUrl || data.payment_url || undefined,
                pixCopyPaste: data.pix_code || data.pix_qrcode || undefined,
            };

        } catch (e) {
            console.error('[CaktoAdapter] Error normalizing:', e);
            return null;
        }
    },
};
