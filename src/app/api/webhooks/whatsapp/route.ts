import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Webhook verification req via Facebook/Meta
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Verify token (hardcoded for brevity, use env variable)
    if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'recoverwp-token-123')) {
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const event = body.event;
        const instance = body.instance;
        const data = body.data;

        if (!event || !data) {
            return new NextResponse('Invalid Payload', { status: 400 });
        }

        // 1. Processar Atualizações de Status (Entregue, Lido, etc)
        if (event === 'messages.update') {
            const waMessageId = data.key?.id;
            const statusMap: Record<string, string> = {
                'PENDING': 'sent',
                'SERVER_ACK': 'sent',
                'DELIVERY_ACK': 'delivered',
                'READ': 'read',
                'PLAYED': 'played',
                'ERROR': 'failed'
            };

            const newStatus = statusMap[data.status] || data.status.toLowerCase();

            if (waMessageId) {
                const message = await prisma.message.findUnique({
                    where: { waMessageId }
                });

                if (message) {
                    await prisma.message.update({
                        where: { id: message.id },
                        data: { status: newStatus }
                    });
                }
            }
        }

        // 2. Processar Mensagens Recebidas (Inbound)
        if (event === 'messages.upsert') {
            const waMessageId = data.key?.id;
            const remoteJid = data.key?.remoteJid || ''; // "5511999999999@s.whatsapp.net"
            const fromMe = data.key?.fromMe;

            // Ignora se for mensagem enviada por nós (já registramos no scheduler)
            if (fromMe) return new NextResponse('OK', { status: 200 });

            const phoneE164 = remoteJid.replace(/\D/g, '');

            // Busca lead que coincida com o final do número (para evitar problemas de 9º dígito)
            const lead = await prisma.lead.findFirst({
                where: { phoneE164: { endsWith: phoneE164.slice(-8) } }
            });

            if (lead) {
                // Atualiza janela de 24h
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { lastSeenAt: new Date() }
                });

                // Extrai texto se possível
                const text = data.message?.conversation ||
                    data.message?.extendedTextMessage?.text ||
                    data.message?.imageMessage?.caption ||
                    '';

                await prisma.message.create({
                    data: {
                        organizationId: lead.organizationId,
                        leadId: lead.id,
                        direction: 'inbound',
                        channel: 'whatsapp',
                        waMessageId,
                        payload: JSON.stringify(data),
                        status: 'received',
                        // Se tiver texto, poderíamos salvar num campo contentText se existisse
                    }
                });
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (err) {
        console.error('[Evolution-Webhook Error]', err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
