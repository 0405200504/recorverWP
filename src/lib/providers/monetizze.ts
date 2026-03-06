import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

export const monetizzeAdapter: WebhookProviderAdapter = {
    // Monetizze pode usar Basic Auth ou token fixo
    verifySignature(payload: string, signature: string, secret: string): boolean {
        if (!secret) return true;
        try {
            const data = JSON.parse(payload);
            if (data.token === secret || data.chave_unica === secret) return true;
        } catch { }
        return signature === secret;
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            const data = rawPayload.venda || rawPayload.transaction || rawPayload;
            const comissoes = rawPayload.comissoes || {};
            const comprador = rawPayload.comprador || data.comprador || {};

            // Status na Monetizze: 
            // 1-Aguardando pagamento, 2-Finalizada(Aprovada), 3-Cancelada, 4-Devolvida, 5-Bloqueada, 6-Completa
            const rawStatus = parseInt(data.statusId || data.status || '0');
            const paymentType = parseInt(data.formaPagamentoId || data.forma_pagamento || data.paymentType || '0');

            let eventType: any = 'order_created';
            let status: any = 'pending';

            if (rawStatus === 2 || rawStatus === 6 || String(data.status).toLowerCase().includes('aprovada')) {
                eventType = 'payment_approved';
                status = 'approved';
            } else if (rawStatus === 1 || String(data.status).toLowerCase().includes('aguardando')) {
                status = 'pending';
                // 1=Boleto, 2=Cartão, 3=Boleto, 7=Pix (Variável de acordo com a API deles)
                if (paymentType === 7 || paymentType === 6 || String(data.formaPagamento).toLowerCase().includes('pix')) {
                    eventType = 'pix_generated';
                } else if (paymentType === 1 || paymentType === 3 || String(data.formaPagamento).toLowerCase().includes('boleto')) {
                    eventType = 'boleto_generated';
                } else {
                    eventType = 'card_pending';
                }
            } else if (rawStatus === 3 || String(data.status).toLowerCase().includes('cancelada') || String(data.status).toLowerCase().includes('recusada')) {
                eventType = 'payment_failed';
                status = 'failed';
            } else if (rawStatus === 4 || String(data.status).toLowerCase().includes('devolvida')) {
                eventType = 'refund';
                status = 'refunded';
            } else if (rawPayload.tipoEvento === 'abandono' || rawPayload.evento === 'abandono') {
                eventType = 'checkout_abandoned';
                status = 'started';
            }

            return {
                externalOrderId: String(data.codigo || data.transaction_id || data.id || Date.now()),
                lead: {
                    name: comprador.nome || '',
                    phoneE164: String(comprador.telefone || comprador.celular || '').replace(/\D/g, ''),
                    email: comprador.email || '',
                },
                payment: {
                    amount: Number(data.valor || comissoes.valor || data.amount || 0),
                    currency: 'BRL', // Predominante
                    method: eventType.includes('pix') ? 'pix' : (eventType.includes('boleto') ? 'boleto' : 'card'),
                },
                status: status,
                eventType: eventType,
                timestamp: data.dataInicio || data.data || data.date || new Date().toISOString(),
                checkoutUrl: data.linkBoleto || data.link_boleto || data.urlPix || undefined,
                pixCopyPaste: data.linhaDigitavelPix || data.linha_digitavel_pix || data.qrCodePix || undefined,
            };

        } catch (e) {
            console.error('[MonetizzeAdapter] Error normalizing:', e);
            return null;
        }
    },
};
