import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { providers } from '@/lib/providers';
import { processWebhookPayload } from '@/lib/webhook-processor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
    try {
        const { provider } = await params;
        console.log(`[Webhook] Recebendo do provedor: ${provider}`);

        const url = new URL(req.url);
        const orgId = url.searchParams.get('orgId');
        
        if (!orgId) {
            console.error('[Webhook] Erro: orgId ausente na query string');
            return NextResponse.json({ error: 'Missing orgId in query params' }, { status: 400 });
        }

        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            console.error(`[Webhook] Erro: Organização ${orgId} não encontrada`);
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const adapter = providers[provider];
        if (!adapter) {
            console.error(`[Webhook] Erro: Adaptador não encontrado para ${provider}`);
            return NextResponse.json({ error: 'Provider not supported' }, { status: 400 });
        }

        const rawBodyText = await req.text();
        console.log(`[Webhook] Raw Body capturado. Tamanho: ${rawBodyText.length}`);

        let bodyJson: any = {};
        try {
            bodyJson = JSON.parse(rawBodyText);
        } catch (e) {
            console.error('[Webhook] Erson ao parsear JSON:', e);
        }

        const signature = req.headers.get('x-signature') || req.headers.get('webhook-signature') || '';

        const normalized = adapter.normalize(bodyJson);
        if (!normalized) {
            console.error(`[Webhook] Erro ao normalizar payload de ${provider}`);
            return NextResponse.json({ error: 'Failed to normalize payload' }, { status: 400 });
        }

        console.log(`[Webhook] Sucesso na normalização. Evento: ${normalized.eventType}`);
        const result = await processWebhookPayload(org.id, provider, normalized, rawBodyText);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('[WEBHOOK ERROR CRITICAL]', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
