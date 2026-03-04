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
        const rawBody = await req.json();

        // Verifica eventos do object = 'whatsapp_business_account'
        if (rawBody.object === 'whatsapp_business_account') {
            for (const entry of rawBody.entry || []) {
                for (const change of entry.changes || []) {
                    const value = change.value;

                    // Process statuses (sent, delivered, read, failed)
                    if (value.statuses && value.statuses.length > 0) {
                        for (const status of value.statuses) {
                            const { id: waMessageId, status: statusValue, errors } = status;

                            const message = await prisma.message.findUnique({
                                where: { waMessageId }
                            });

                            if (message) {
                                await prisma.message.update({
                                    where: { id: message.id },
                                    data: {
                                        status: statusValue,
                                        // Registrar errors payload via status info if needed
                                    }
                                });
                            }
                        }
                    }

                    // Process inbound messages
                    if (value.messages && value.messages.length > 0) {
                        for (const msg of value.messages) {
                            const waMessageId = msg.id;
                            const phoneE164 = msg.from; // +5511999999999 typically without + inside Cloud API

                            // Find lead
                            const lead = await prisma.lead.findFirst({
                                where: { phoneE164: { endsWith: phoneE164.replace(/\D/g, '') } }
                            });

                            if (lead) {
                                // A message received! We should log it and update lead's last_seen_at
                                await prisma.lead.update({
                                    where: { id: lead.id },
                                    data: { lastSeenAt: new Date() } // Update 24h window
                                });

                                await prisma.message.create({
                                    data: {
                                        organizationId: lead.organizationId,
                                        leadId: lead.id,
                                        direction: 'inbound',
                                        channel: 'whatsapp',
                                        waMessageId,
                                        payload: JSON.stringify(msg),
                                        status: 'received'
                                    }
                                });
                            }
                        }
                    }

                }
            }
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } catch (err) {
        console.error('[WA WEBHOOK]', err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
