import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EVO_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8083').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

// GET /api/whatsapp/instance/qr?name=xxx — busca QR Code atualizado
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) return new NextResponse('Missing name', { status: 400 });

    try {
        const res = await fetch(`${EVO_URL}/instance/connect/${name}`, {
            headers: { 'apikey': EVO_KEY }
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
