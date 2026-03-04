import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { providers } from '@/lib/providers';
import { processWebhookPayload } from '@/lib/webhook-processor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
    try {
        const { provider } = await params;

        // TODO: em produção, o organizationId seria passado na URL (ex: /api/webhooks/checkout/[provider]/[orgId])
        // ou resolvido via um token/secret. Por simplicidade do MVP, vamos buscar pelo webhook_secret se enviado no header/query,
        // ou pegar da primeira Org logada.

        // Simulação: Pegando organizationId da query string
        const url = new URL(req.url);
        const orgId = url.searchParams.get('orgId');
        if (!orgId) {
            return NextResponse.json({ error: 'Missing orgId in query params' }, { status: 400 });
        }

        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const adapter = providers[provider];
        if (!adapter) {
            return NextResponse.json({ error: 'Provider not supported' }, { status: 400 });
        }

        const rawBodyText = await req.text();
        let bodyJson: any = {};
        try {
            bodyJson = JSON.parse(rawBodyText);
        } catch {
            // Ignora erro de JSON
        }

        const signature = req.headers.get('x-signature') || req.headers.get('webhook-signature') || ''; // Adjust per provider

        // Verificação de assinatura
        if (provider === 'custom') {
            const isValid = adapter.verifySignature(rawBodyText, signature, org.webhook_secret);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const normalized = adapter.normalize(bodyJson);
        if (!normalized) {
            return NextResponse.json({ error: 'Failed to normalize payload' }, { status: 400 });
        }

        const result = await processWebhookPayload(org.id, provider, normalized, rawBodyText);

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('[WEBHOOK ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
