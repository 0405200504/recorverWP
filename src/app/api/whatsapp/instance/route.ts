import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVO_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8083').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

const evoHeaders = () => ({
    'Content-Type': 'application/json',
    'apikey': EVO_KEY,
});

async function waitForQR(instanceName: string): Promise<string | null> {
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
            const res = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, { headers: evoHeaders() });
            const data = await res.json();
            const base64 = data?.base64;
            if (base64 && base64.length > 100) {
                return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
            }
        } catch { }
    }
    return null;
}

// POST — cria instância e retorna QR Code
export async function POST(req: NextRequest) {
    try {
        const { instanceName } = await req.json();
        const name = (instanceName || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');

        // Deleta instância antiga se existir
        await fetch(`${EVO_URL}/instance/delete/${name}`, { method: 'DELETE', headers: evoHeaders() }).catch(() => { });
        await new Promise(r => setTimeout(r, 1000));

        // Cria nova instância
        const res = await fetch(`${EVO_URL}/instance/create`, {
            method: 'POST',
            headers: evoHeaders(),
            body: JSON.stringify({ instanceName: name, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
        });

        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: `Falha ao criar instância: ${txt}` }, { status: 400 });
        }

        const qrBase64 = await waitForQR(name);
        if (!qrBase64) {
            return NextResponse.json({ error: 'QR Code não gerado. Verifique se a Evolution API está online.' }, { status: 504 });
        }

        return NextResponse.json({ qrBase64, instanceName: name });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — verifica status de conexão
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name') || 'default';
    try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${name}`, { headers: evoHeaders() });
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
        await fetch(`${EVO_URL}/instance/delete/${name}`, { method: 'DELETE', headers: evoHeaders() });
        return new NextResponse('OK');
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
