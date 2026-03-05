import crypto from 'crypto';
import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

export const customAdapter: WebhookProviderAdapter = {
    verifySignature(payload: string, signature: string, secret: string): boolean {
        if (!signature || !secret) return false;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        return signature === expectedSignature;
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            // Flexible extraction for Custom/Cakto/Others
            const evtId = rawPayload.order_id || rawPayload.transaction?.id || rawPayload.id || `evt_${Date.now()}`;
            const customerName = rawPayload.customer?.name || rawPayload.client?.name || rawPayload.name || 'Cliente Desconhecido';
            const customerPhone = rawPayload.customer?.phone || rawPayload.client?.phone || rawPayload.phone || '00000000000';
            const customerEmail = rawPayload.customer?.email || rawPayload.client?.email || rawPayload.email || 'sem@email.com';

            const eventType = rawPayload.event_type || rawPayload.event || 'unknown';
            const status = rawPayload.status || rawPayload.transaction?.status || 'pending';
            const amount = Number(rawPayload.payment?.amount || rawPayload.transaction?.amount || rawPayload.amount) || 0;

            return {
                externalOrderId: String(evtId),
                externalCheckoutId: rawPayload.checkout_id || '',
                lead: {
                    name: customerName,
                    phoneE164: customerPhone,
                    email: customerEmail,
                },
                product: {
                    id: rawPayload.product?.id || 'prod_1',
                    name: rawPayload.product?.name || 'Produto Principal',
                },
                payment: {
                    amount: amount,
                    currency: rawPayload.payment?.currency || rawPayload.transaction?.currency || 'BRL',
                    method: rawPayload.payment?.method || rawPayload.transaction?.payment_type || 'other',
                },
                status: status,
                eventType: eventType,
                timestamp: rawPayload.timestamp || rawPayload.created_at || new Date().toISOString(),
                checkoutUrl: rawPayload.checkout_url || '',
                pixCopyPaste: rawPayload.pix_code || rawPayload.transaction?.pix_qrcode || '',
            };
        } catch (error) {
            console.error('Error normalizing custom payload', error);
            return null;
        }
    },
};
