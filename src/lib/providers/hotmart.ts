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
            const event = rawPayload.event || '';
            const purchaseStatus = data.purchase?.status || '';

            // Mapeamento de Eventos Hotmart para CanonicalEventType
            let eventType: any = 'pix_generated'; // fallback
            let status: any = 'pending';

            if (event === 'PURCHASE_APPROVED') {
                eventType = 'payment_approved';
                status = 'approved';
            } else if (event === 'PURCHASE_BILLET') {
                eventType = 'boleto_generated';
                status = 'pending';
            } else if (event === 'PURCHASE_OUT_OF_DATE') {
                // Hotmart envia esse evento quando o PIX expira ou no momento da geração (dependendo da versão)
                // Aqui vamos considerar como PIX pendente se vier info de pix
                eventType = 'pix_generated';
                status = 'pending';
            } else if (event === 'ABANDONED_CART' || event === 'PURCHASE_STARTED') {
                eventType = event === 'PURCHASE_STARTED' ? 'checkout_started' : 'checkout_abandoned';
                status = 'started';
            } else if (event === 'PURCHASE_DELAYED' || event === 'PURCHASE_PROTEST') {
                eventType = 'payment_failed';
                status = 'failed';
            } else if (event === 'PURCHASE_REFUNDED' || event === 'CHARGEBACK') {
                eventType = 'refund';
                status = 'refunded';
            }

            return {
                externalOrderId: data.purchase?.transaction || data.transaction || String(Date.now()),
                lead: {
                    name: data.buyer?.name || '',
                    phoneE164: String(data.buyer?.checkout_phone || data.buyer?.phone || '').replace(/\D/g, ''),
                    email: data.buyer?.email || '',
                },
                payment: {
                    amount: Number(data.purchase?.price?.value || data.price) || 0,
                    currency: data.purchase?.price?.currency_code || data.currency || 'BRL',
                    method: (data.purchase?.payment?.type || 'card').toLowerCase() as any,
                },
                status: status,
                eventType: eventType,
                timestamp: rawPayload.creation_date ? new Date(rawPayload.creation_date).toISOString() : new Date().toISOString(),
                checkoutUrl: data.purchase?.checkout_url || undefined,
            };

        } catch (e) {
            console.error('[HotmartAdapter] Error normalizing:', e);
            return null;
        }
    },
};
