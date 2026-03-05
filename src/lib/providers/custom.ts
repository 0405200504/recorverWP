import crypto from 'crypto';
import { WebhookProviderAdapter, NormalizedWebhookPayload } from '../types/webhook';

/**
 * Adaptador Universal Inteligente
 * Tenta normalizar payloads de diversas plataformas de checkout (Kiwify, Cakto, Shopify, etc)
 * utilizando uma lógica de busca por chaves comuns e heurística de status.
 */
export const customAdapter: WebhookProviderAdapter = {
    verifySignature(payload: string, signature: string, secret: string): boolean {
        // Se não houver secret configurado, assume que é válido (facilitando configuração inicial)
        if (!secret) return true;
        if (!signature) return false;

        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');
            return signature === expectedSignature;
        } catch {
            return false;
        }
    },

    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null {
        try {
            // Tenta achar o corpo real (alguns enviam dentro de 'data' ou 'payload')
            const data = rawPayload.data || rawPayload.payload || rawPayload.body || rawPayload;

            // 1. Extração do ID do Pedido
            const extId = String(
                data.order_id ||
                data.order_number ||
                data.transaction?.id ||
                data.purchase?.transaction ||
                data.id ||
                data.transaction_id ||
                data.checkout_id ||
                `evt_${Date.now()}`
            );

            // 2. Extração do Cliente (Nome, Email, Telefone)
            const customer = data.customer || data.client || data.buyer || data.cliente || data;
            const name = customer.name || customer.full_name || customer.nome || customer.first_name || 'Cliente';
            const email = customer.email || customer.email_address || customer.contact_email || 'sem@email.com';

            // Telefone: tenta várias chaves comuns
            let phone = String(
                customer.phone ||
                customer.mobile ||
                customer.telephone ||
                customer.phone_number ||
                customer.checkout_phone ||
                customer.whatsapp ||
                customer.whatsapp_number ||
                data.phone ||
                data.mobile ||
                ''
            ).replace(/\D/g, '');

            // 3. Mapeamento de Status e Evento
            const rawStatus = String(data.status || data.order_status || data.purchase?.status || data.transaction?.status || data.financial_status || '').toLowerCase();
            const rawEvent = String(data.event || data.event_type || data.eventType || data.type || '').toUpperCase();
            const method = String(data.payment_method || data.paymentMethod || data.method || data.payment?.method || data.type || '').toLowerCase();

            let status: any = 'pending';
            let eventType: any = 'order_created';

            // Lógica Heurística para Status/Evento
            if (['approved', 'paid', 'pago', 'concluida', 'sucesso', 'complete', 'confirmed', 'vendido', 'success'].some(s => rawStatus.includes(s)) || rawEvent.includes('APPROVED') || rawEvent.includes('PAID')) {
                status = 'approved';
                eventType = 'payment_approved';
            } else if (['refused', 'canceled', 'cancelado', 'failed', 'rejeitado', 'error', 'declined', 'rejeit'].some(s => rawStatus.includes(s)) || rawEvent.includes('DECLINED') || rawEvent.includes('FAILED')) {
                status = 'failed';
                eventType = 'payment_failed';
            } else if (['refunded', 'reembolsado', 'devolvido', 'chargeback'].some(s => rawStatus.includes(s)) || rawEvent.includes('REFUND')) {
                status = 'refunded';
                eventType = 'refund';
            } else if (['waiting', 'pending', 'aguardando', 'pendente', 'processing', 'unpaid', 'atrasado'].some(s => rawStatus.includes(s)) || rawEvent.includes('PENDING') || rawEvent.includes('WAITING') || rawEvent.includes('BILLE') || rawEvent.includes('PIX') || rawEvent.includes('GERADO')) {
                status = 'pending';

                const pixKeys = ['pix', 'qrc', 'static'];
                const boletoKeys = ['billet', 'boleto', 'bank_transfer', 'bol', 'bil'];

                if (method.includes('pix') || rawEvent.includes('PIX') || pixKeys.some(k => method.includes(k))) {
                    eventType = 'pix_generated';
                } else if (method.includes('billet') || method.includes('boleto') || rawEvent.includes('BILLET') || rawEvent.includes('BOLETO') || boletoKeys.some(k => method.includes(k))) {
                    eventType = 'boleto_generated';
                }
            } else if (rawEvent.includes('ABANDONED') || rawEvent.includes('CART') || rawEvent.includes('CHECKOUT') || rawEvent.includes('ABANDONO')) {
                status = 'started';
                eventType = 'checkout_abandoned';
            }

            // 4. Valores Monetários
            const amount = Number(data.amount || data.price || data.total || data.total_price || data.payment?.amount || data.purchase?.price?.value || 0);

            return {
                externalOrderId: extId,
                lead: {
                    name: name,
                    phoneE164: phone,
                    email: email,
                },
                payment: {
                    amount: amount,
                    currency: data.currency || data.payment?.currency || 'BRL',
                    method: method as any,
                },
                status: status,
                eventType: eventType,
                timestamp: data.created_at || data.timestamp || data.updated_at || new Date().toISOString(),
                checkoutUrl: data.checkout_url || data.url || data.checkout_payment_url || undefined,
                pixCopyPaste: data.pix_code || data.pix_qrcode || data.pixCopyPaste || data.transaction?.pix_qrcode || data.pix?.qrCode || undefined,
            };
        } catch (error) {
            console.error('[UniversalAdapter] Erro ao normalizar payload:', error);
            return null;
        }
    },
};
