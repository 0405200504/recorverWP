import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVO_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8083').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const evoHeaders = { 'Content-Type': 'application/json', 'apikey': EVO_KEY };

// POST — cria instância e retorna IMEDIATAMENTE (sem polling - evita timeout na Vercel)
export async function POST(req: NextRequest) {
    try {
        const { instanceName } = await req.json();
        const name = (instanceName || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');

        // Deleta instância antiga se existir
        await fetch(`${EVO_URL}/instance/delete/${name}`, { method: 'DELETE', headers: evoHeaders }).catch(() => { });
        await new Promise(r => setTimeout(r, 800));

        // Cria nova instância
        const res = await fetch(`${EVO_URL}/instance/create`, {
            method: 'POST',
            headers: evoHeaders,
            body: JSON.stringify({
                instanceName: name,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
            }),
        });

        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: `Falha ao criar instância: ${txt}` }, { status: 400 });
        }

        // Aplica configurações cruciais separadamente para garantir aplicação na Evolution API
        await fetch(`${EVO_URL}/settings/set/${name}`, {
            method: 'POST',
            headers: evoHeaders,
            body: JSON.stringify({
                rejectCall: true,
                msgCall: '',
                groupsIgnore: true,
                alwaysOnline: false,
                readMessages: false,
                readStatus: false,
                syncFullHistory: false
            })
        }).catch(err => console.error("Erro ao definir settings na API do whats", err));

        // Registra o webhook (usando a URL de origem da request)
        const appUrl = req.nextUrl.origin.includes('localhost') ? 'http://host.docker.internal:3000' : req.nextUrl.origin;
        await fetch(`${EVO_URL}/webhook/set/${name}`, {
            method: 'POST',
            headers: evoHeaders,
            body: JSON.stringify({
                webhook: {
                    url: `${appUrl}/api/webhooks/whatsapp`,
                    byEvents: false,
                    base64: false,
                    events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE', 'CONNECTION_UPDATE']
                }
            })
        }).catch(err => console.error("Erro ao registrar webhook do whats", err));

        // Retorna imediatamente — o frontend vai fazer polling do QR via /qr
        return NextResponse.json({ instanceName: name, creating: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — verifica status de conexão
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name') || 'default';
    try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${name}`, { headers: evoHeaders });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}

// DELETE — remove instância
export async function DELETE(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name') || 'default';
    try {
        await fetch(`${EVO_URL}/instance/delete/${name}`, { method: 'DELETE', headers: evoHeaders });
        return new NextResponse('OK');
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
