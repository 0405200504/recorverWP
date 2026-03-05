import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const EVO_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8083').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || '';
const evoHeaders = { 'Content-Type': 'application/json', 'apikey': EVO_KEY };

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Pega instância conectada
    const waNumber = await prisma.whatsAppNumber.findFirst({
        where: { organizationId: orgId, status: 'active' }
    });
    if (!waNumber) return NextResponse.json({ error: 'Nenhum WhatsApp conectado', chats: [] });

    const instanceName = waNumber.phoneNumberId;
    const { searchParams } = new URL(req.url);
    const jid = searchParams.get('jid');

    // Buscar mensagens de um chat específico
    if (jid) {
        try {
            const res = await fetch(`${EVO_URL}/chat/findMessages/${instanceName}?remoteJid=${encodeURIComponent(jid)}&limit=50`, {
                headers: evoHeaders
            });
            const data = await res.json();
            return NextResponse.json({ messages: data?.messages?.records || data || [] });
        } catch {
            return NextResponse.json({ messages: [] });
        }
    }

    // Buscar lista de chats
    try {
        const res = await fetch(`${EVO_URL}/chat/findChats/${instanceName}`, {
            method: 'POST',
            headers: evoHeaders,
            body: JSON.stringify({})
        });
        const data = await res.json();
        return NextResponse.json({ chats: Array.isArray(data) ? data : [], instanceName });
    } catch {
        return NextResponse.json({ chats: [], instanceName });
    }
}

// POST — envia mensagem
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const waNumber = await prisma.whatsAppNumber.findFirst({
        where: { organizationId: orgId, status: 'active' }
    });
    if (!waNumber) return NextResponse.json({ error: 'Nenhum WhatsApp conectado' }, { status: 400 });

    const { jid, text } = await req.json();
    const instanceName = waNumber.phoneNumberId;

    const res = await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: evoHeaders,
        body: JSON.stringify({ number: jid.replace('@s.whatsapp.net', '').replace('@g.us', ''), text })
    });
    const data = await res.json();
    return NextResponse.json(data);
}
