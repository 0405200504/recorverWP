import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

export const eduzzAdapter: WebhookProviderAdapter = {
    // Eduzz envia token (codificado) configurado no painel (API Key/Token)
    verifySignature(payload: string, signature: string, secret: string): boolean {
        if (!secret) return true;
        // Na Eduzz, as vezes o secret vem dentro do body `api_key` ou num header `token`
        try {
            const data = JSON.parse(payload);
            if (data.api_key === secret || data.token === secret) return true;
        } catch { }
        return signature === secret;
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            // Eduzz as vezes envelopa com "transacao" ou vem solto (MyEduzz / Nutror)
            const data = rawPayload.transacao || rawPayload;

            // Status codes Eduzz: 1-Aguardando Pgto, 3-Pago, 4-Cancelado, 6-Devolvido, 7-Aguardando Reembolso, 15-Aguardando Pgto Pix, etc.
            const rawStatus = data.trans_status || data.status || '';
            const paymentType = parseInt(data.trans_paymentmethod || data.payment_method || '0');

            let eventType: any = 'order_created';
            let status: any = 'pending';

            // Heurística de status (1 = pending boleto/pix, 3 = pago, 4 = cancelado, 6/7 = chargeback/refund)
            if (rawStatus == 3 || rawStatus === 'PAGO' || rawStatus === 'pago') {
                eventType = 'payment_approved';
                status = 'approved';
            } else if (rawStatus == 1 || rawStatus == 15 || rawStatus === 'Aguardando Pagamento' || rawStatus === 'open') {
                status = 'pending';
                // Eduzz Payment Methods: 4 = Pix, 2 = Boleto, 1 = Cartão
                if (paymentType === 4 || rawPayload.pix_qrcode) {
                    eventType = 'pix_generated';
                } else if (paymentType === 2 || rawPayload.boleto_url) {
                    eventType = 'boleto_generated';
                } else {
                    eventType = 'card_pending';
                }
            } else if (rawStatus == 4 || rawStatus === 'Cancelado' || rawStatus === 'canceled' || rawStatus === 'Recusado') {
                eventType = 'payment_failed';
                status = 'failed';
            } else if (rawStatus == 6 || rawStatus == 7 || rawStatus === 'Reembolsado' || rawStatus === 'refunded') {
                eventType = 'refund';
                status = 'refunded';
            } else if (rawStatus === 'abandoned' || rawPayload.abandoned_checkout) {
                eventType = 'checkout_abandoned';
                status = 'started';
            }

            const customerName = data.cus_name || data.cliente_nome || data.name || '';
            const customerEmail = data.cus_email || data.cliente_email || data.email || '';
            const customerPhone = data.cus_tel || data.cus_cel || data.cliente_telefone || data.phone || '';

            return {
                externalOrderId: String(data.trans_cod || data.eduzz_id || data.id || data.transaction_id || Date.now()),
                lead: {
                    name: customerName,
                    phoneE164: String(customerPhone).replace(/\D/g, ''),
                    email: customerEmail,
                },
                payment: {
                    amount: Number(data.trans_value || data.valor || data.amount || 0),
                    currency: data.trans_currency || 'BRL',
                    method: paymentType === 4 ? 'pix' : (paymentType === 2 ? 'boleto' : 'card'),
                },
                status: status,
                eventType: eventType,
                timestamp: data.trans_createdate || data.created_at || new Date().toISOString(),
                checkoutUrl: data.trans_paymenturl || data.boleto_url || data.pix_qrcode || undefined,
                pixCopyPaste: data.pix_qrcode || undefined, // A Eduzz as vezes envia o EMV puro em pix_qrcode
            };

        } catch (e) {
            console.error('[EduzzAdapter] Error normalizing:', e);
            return null;
        }
    },
};
