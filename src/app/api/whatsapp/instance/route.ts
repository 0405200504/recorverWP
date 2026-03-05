import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ZAPI_BASE = 'https://api.z-api.io/instances';
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || '';

// POST — cria instância Z-API e retorna QR Code
export async function POST(req: NextRequest) {
    try {
        const { instanceId, token } = await req.json();
        if (!instanceId || !token) {
            return NextResponse.json({ error: 'instanceId e token são obrigatórios' }, { status: 400 });
        }

        // Busca o QR code da instância Z-API
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN;

        const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/qr-code/image`, { headers });

        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: `Z-API retornou: ${txt}` }, { status: 400 });
        }

        // Z-API retorna a imagem do QR como bytes — converte para base64
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return NextResponse.json({ qrBase64: `data:image/png;base64,${base64}` });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — verifica status de conexão de uma instância Z-API
export async function GET(req: NextRequest) {
    const instanceId = req.nextUrl.searchParams.get('instanceId');
    const token = req.nextUrl.searchParams.get('token');
    if (!instanceId || !token) return new NextResponse('Missing params', { status: 400 });

    try {
        const headers: Record<string, string> = {};
        if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN;

        const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/status`, { headers });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}

// DELETE — desconecta instância Z-API
export async function DELETE(req: NextRequest) {
    const instanceId = req.nextUrl.searchParams.get('instanceId');
    const token = req.nextUrl.searchParams.get('token');
    if (!instanceId || !token) return new NextResponse('Missing params', { status: 400 });

    try {
        const headers: Record<string, string> = {};
        if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN;

        await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/disconnect`, { method: 'DELETE', headers });
        return new NextResponse('OK');
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
