import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WAHA_URL = process.env.WAHA_URL || 'https://waha-production-xxxx.up.railway.app';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';

function wahaHeaders() {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (WAHA_API_KEY) h['X-Api-Key'] = WAHA_API_KEY;
    return h;
}

// POST /api/whatsapp/instance — inicia sessão e retorna QR Code
export async function POST(req: NextRequest) {
    try {
        const { sessionName } = await req.json();
        const name = (sessionName || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');

        // Tenta deletar sessão antiga
        await fetch(`${WAHA_URL}/api/sessions/${name}`, {
            method: 'DELETE', headers: wahaHeaders()
        }).catch(() => { });

        await new Promise(r => setTimeout(r, 500));

        // Cria nova sessão WAHA
        const createRes = await fetch(`${WAHA_URL}/api/sessions`, {
            method: 'POST',
            headers: wahaHeaders(),
            body: JSON.stringify({ name, config: { webhooks: [] } })
        });

        if (!createRes.ok) {
            const txt = await createRes.text();
            return NextResponse.json({ error: `Erro ao criar sessão: ${txt}` }, { status: 400 });
        }

        // Aguarda WAHA inicializar e gera QR (polling até 30s)
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                const qrRes = await fetch(`${WAHA_URL}/api/sessions/${name}/auth/qr`, {
                    headers: wahaHeaders()
                });
                if (qrRes.ok) {
                    const data = await qrRes.json();
                    const base64 = data?.data || data?.qr || data?.base64;
                    if (base64) {
                        const qrBase64 = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
                        return NextResponse.json({ qrBase64, sessionName: name });
                    }
                }
            } catch { /* continua */ }
        }

        return NextResponse.json({ error: 'QR Code não gerado. Verifique se o WAHA está rodando.' }, { status: 504 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET /api/whatsapp/instance?name=xxx — verifica status da sessão
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name') || 'default';
    try {
        const res = await fetch(`${WAHA_URL}/api/sessions/${name}`, {
            headers: wahaHeaders()
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}

// DELETE — remove sessão
export async function DELETE(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name') || 'default';
    try {
        await fetch(`${WAHA_URL}/api/sessions/${name}`, {
            method: 'DELETE', headers: wahaHeaders()
        });
        return new NextResponse('OK');
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
