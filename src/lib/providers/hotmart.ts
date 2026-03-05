import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

// Implementação "Mock/TODO" que adapta o formato da Hotmart para o interno
export const hotmartAdapter: WebhookProviderAdapter = {
    verifySignature(payload: string, signature: string, secret: string): boolean {
        // TODO: Implement actual Hotmart token verification
        // Hotmart uses "hottok" sent in headers usually, comparing with the one configured.
        return signature === secret;
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            const data = rawPayload.data || rawPayload;
            return {
                externalOrderId: data.purchase?.transaction || data.transaction || String(Date.now()),
                lead: {
                    name: data.buyer?.name || '',
                    phoneE164: String(data.buyer?.checkout_phone || data.buyer?.phone || ''),
                    email: data.buyer?.email || '',
                },
                payment: {
                    amount: Number(data.purchase?.price?.value || data.price) || 0,
                    currency: data.purchase?.price?.currency_code || data.currency || 'BRL',
                    method: 'pix',
                },
                status: 'pending',
                eventType: 'pix_generated',
                timestamp: rawPayload.creation_date ? new Date(rawPayload.creation_date).toISOString() : new Date().toISOString(),
            };

        } catch (e) {
            return null;
        }
    },
};
