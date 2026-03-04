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
            // TODO: Map exact hotmart fields
            // Exemplo genérico
            return {
                externalOrderId: rawPayload.transaction || String(Date.now()),
                lead: {
                    name: rawPayload.buyer?.name || '',
                    phoneE164: rawPayload.buyer?.checkout_phone || '',
                    email: rawPayload.buyer?.email || '',
                },
                payment: {
                    amount: Number(rawPayload.purchase?.price?.value) || 0,
                    currency: rawPayload.purchase?.price?.currency_code || 'BRL',
                    method: 'pix', // TODO mapear method real
                },
                status: 'pending', // TODO mapear status real
                eventType: 'pix_generated', // TODO mapear evento real (ex: 'PIX_CHARGE')
                timestamp: rawPayload.creation_date ? new Date(rawPayload.creation_date).toISOString() : new Date().toISOString(),
            };
        } catch (e) {
            return null;
        }
    },
};
