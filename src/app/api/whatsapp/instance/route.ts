import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-52c7.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'recoverWP2024secret';

const headers = { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' };

// Busca QR com polling (até 20 tentativas, 2s de intervalo)
async function fetchQRWithPolling(instanceName: string): Promise<string | null> {
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers });
            const data = await res.json();
            const base64 = data?.base64 || data?.qrcode?.base64;
            if (base64 && base64.startsWith('data:image')) return base64;
            if (base64 && base64.length > 100) return `data:image/png;base64,${base64}`;
        } catch { /* continua tentando */ }
    }
    return null;
}

// POST — cria instância e retorna QR Code
export async function POST(req: NextRequest) {
    try {
        const { instanceName } = await req.json();

        // Tenta deletar instância antiga com mesmo nome (se existir)
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers,
        }).catch(() => { });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Cria nova instância
        const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            }),
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            return NextResponse.json({ error: 'Falha ao criar instância: ' + err }, { status: 400 });
        }

        // Faz polling até o QR estar disponível
        const qrBase64 = await fetchQRWithPolling(instanceName);

        if (!qrBase64) {
            return NextResponse.json({ error: 'QR Code não foi gerado a tempo. Tente novamente.' }, { status: 504 });
        }

        return NextResponse.json({ qrBase64 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — verifica status da conexão
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) return new NextResponse('Missing name', { status: 400 });

    try {
        const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${name}`, { headers });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}

// DELETE — remove instância
export async function DELETE(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) return new NextResponse('Missing name', { status: 400 });

    try {
        await fetch(`${EVOLUTION_URL}/instance/delete/${name}`, { method: 'DELETE', headers });
        return new NextResponse('OK');
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
