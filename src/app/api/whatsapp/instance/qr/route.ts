import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-52c7.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'recoverWP2024secret';

// GET /api/whatsapp/instance/qr?name=xxx — busca QR Code atualizado
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) return new NextResponse('Missing name', { status: 400 });

    try {
        const res = await fetch(`${EVOLUTION_URL}/instance/connect/${name}`, {
            headers: { 'apikey': EVOLUTION_KEY }
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
