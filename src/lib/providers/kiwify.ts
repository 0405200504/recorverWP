import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

export const kiwifyAdapter: WebhookProviderAdapter = {
    // A Kiwify envia o signature no header `x-kiwify-signature` que é um HMAC SHA-1 da string JSON
    verifySignature(payload: string, signature: string, secret: string): boolean {
        if (!secret) return true;
        if (!signature) return false;
        try {
            const crypto = require('crypto');
            const expected = crypto.createHmac('sha1', secret).update(payload).digest('hex');
            return signature === expected;
        } catch {
            return false;
        }
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            const data = rawPayload.data || rawPayload;

            // Kiwify webhooks (https://docs.kiwify.com.br/webhooks)
            // Eventos comuns: order_approved, order_refunded, order_canceled, order_waiting_payment

            const rawEvent = data.order_status || data.webhook_event_type || '';
            const method = String(data.payment_method || '').toLowerCase();

            let eventType: any = 'order_created';
            let status: any = 'pending';

            if (rawEvent === 'paid' || rawEvent === 'approved') {
                eventType = 'payment_approved';
                status = 'approved';
            } else if (rawEvent === 'waiting_payment') {
                status = 'pending';
                if (method === 'pix') eventType = 'pix_generated';
                else if (method === 'boleto') eventType = 'boleto_generated';
            } else if (rawEvent === 'refused' || rawEvent === 'canceled') {
                eventType = 'payment_failed';
                status = 'failed';
            } else if (rawEvent === 'refunded' || rawEvent === 'chargeback') {
                eventType = 'refund';
                status = 'refunded';
            } else if (rawEvent === 'abandoned_cart' || (data.webhook_event_type && data.webhook_event_type.includes('abandoned'))) {
                eventType = 'checkout_abandoned';
                status = 'started';
            }

            const customer = data.Customer || {};
            const commissions = data.Commissions || {};

            return {
                externalOrderId: data.order_id || String(Date.now()),
                lead: {
                    name: customer.full_name || '',
                    phoneE164: String(customer.mobile || '').replace(/\\D/g, ''),
                    email: customer.email || '',
                },
                payment: {
                    amount: Number(data.payment?.amount || commissions.charge_amount || 0),
                    currency: commissions.currency || 'BRL',
                    method: method as any,
                },
                status: status,
                eventType: eventType,
                timestamp: data.created_at || data.updated_at || new Date().toISOString(),
                checkoutUrl: data.payment_url || data.pix_qrcode || undefined, // URL para boleto/cartao ou fallback
                pixCopyPaste: data.pix_qrcode || undefined, // Kiwify não manda o copia e cola puro fácil, mas o qrcode funciona em alguns casos
            };

        } catch (e) {
            console.error('[KiwifyAdapter] Error normalizing:', e);
            return null;
        }
    },
};
