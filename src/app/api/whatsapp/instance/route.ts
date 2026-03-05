import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-52c7.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'recoverWP2024secret';

// POST /api/whatsapp/instance — cria e conecta instância
export async function POST(req: NextRequest) {
    try {
        const { instanceName } = await req.json();

        // 1. Cria a instância
        const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_KEY,
            },
            body: JSON.stringify({
                instanceName,
                token: instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            }),
        });
        const createData = await createRes.json();

        if (!createRes.ok && !createData.hash) {
            // Talvez instância já exista — tenta conectar
            const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_KEY }
            });
            const connectData = await connectRes.json();
            return NextResponse.json(connectData);
        }

        // 2. Busca o QR Code
        const qrRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
            headers: { 'apikey': EVOLUTION_KEY }
        });
        const qrData = await qrRes.json();

        return NextResponse.json({ ...createData, qr: qrData });
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}

// GET /api/whatsapp/instance?name=xxx — verifica status da instância
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) return new NextResponse('Missing name', { status: 400 });

    try {
        const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${name}`, {
            headers: { 'apikey': EVOLUTION_KEY }
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}

// DELETE /api/whatsapp/instance?name=xxx — deleta instância
export async function DELETE(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) return new NextResponse('Missing name', { status: 400 });

    try {
        await fetch(`${EVOLUTION_URL}/instance/delete/${name}`, {
            method: 'DELETE',
            headers: { 'apikey': EVOLUTION_KEY }
        });
        return new NextResponse('OK');
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
