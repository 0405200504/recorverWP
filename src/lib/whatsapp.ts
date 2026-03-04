import { prisma } from './prisma';

interface WhatsAppMessagePayload {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text?: { body: string };
    template?: { name: string; language: { code: string }; components: any[] };
    context?: { message_id: string };
}

export class WhatsAppService {
    constructor(private readonly phoneNumberId: string, private readonly accessToken: string) { }

    async sendTextFreeform(toE164: string, text: string) {
        const payload: WhatsAppMessagePayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toE164.replace(/\D/g, ''),
            type: 'text',
            text: { body: text },
        };
        return this.sendMessage(payload);
    }

    async sendTemplate(toE164: string, templateName: string, languageCode: string, components: any[]) {
        const payload: WhatsAppMessagePayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toE164.replace(/\D/g, ''),
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                components,
            },
        };
        return this.sendMessage(payload);
    }

    private async sendMessage(payload: WhatsAppMessagePayload) {
        const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;

        // NOTE: Simulação. Evita erro de network no teste sem credenciais reais.
        console.log(`[WhatsApp API Mock] POST ${url}`, JSON.stringify(payload, null, 2));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[WhatsApp API] Error', errorText);
                throw new Error(`WhatsApp API Error: ${errorText}`);
            }

            const data = await response.json();
            return { success: true, waMessageId: data.messages?.[0]?.id };
        } catch (e: any) {
            console.error('[WhatsApp API] Exception', e);
            // For MVP without real tokens, return a mock success
            if (this.accessToken === 'mock') {
                return { success: true, waMessageId: 'wamid.MOCK.' + Date.now() };
            }
            throw e;
        }
    }
}
