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
            // Expecting a predefined format for the custom adapter
            return {
                externalOrderId: rawPayload.order_id,
                externalCheckoutId: rawPayload.checkout_id,
                lead: {
                    name: rawPayload.customer?.name || '',
                    phoneE164: rawPayload.customer?.phone || '',
                    email: rawPayload.customer?.email || '',
                },
                product: {
                    id: rawPayload.product?.id || '',
                    name: rawPayload.product?.name,
                },
                payment: {
                    amount: Number(rawPayload.payment?.amount) || 0,
                    currency: rawPayload.payment?.currency || 'BRL',
                    method: rawPayload.payment?.method || 'other',
                },
                status: rawPayload.status, // assume correctly mapped
                eventType: rawPayload.event_type, // assume correctly mapped
                timestamp: rawPayload.timestamp || new Date().toISOString(),
                checkoutUrl: rawPayload.checkout_url,
                pixCopyPaste: rawPayload.pix_code,
            };
        } catch (error) {
            console.error('Error normalizing custom payload', error);
            return null;
        }
    },
};
