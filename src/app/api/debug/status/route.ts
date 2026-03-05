import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Busca dados de diagnóstico completos
    const [orders, campaigns, runs, dispatches, waNumbers] = await Promise.all([
        prisma.order.findMany({
            where: { organizationId: orgId },
            include: { lead: true, events: { orderBy: { createdAt: 'desc' }, take: 3 } },
            orderBy: { createdAt: 'desc' }, take: 10
        }),
        prisma.campaign.findMany({
            where: { organizationId: orgId },
            include: { steps: true }
        }),
        prisma.recoveryRun.findMany({
            where: { organizationId: orgId },
            include: { dispatches: { orderBy: { scheduledFor: 'asc' } } },
            orderBy: { createdAt: 'desc' }, take: 10
        }),
        prisma.stepDispatch.findMany({
            where: { run: { organizationId: orgId } },
            orderBy: { scheduledFor: 'asc' }, take: 20
        }),
        prisma.whatsAppNumber.findMany({ where: { organizationId: orgId } })
    ]);

    const now = new Date();

    return NextResponse.json({
        timestamp: now.toISOString(),
        orgId,
        whatsapp: waNumbers.map(w => ({ id: w.id, instance: w.phoneNumberId, status: w.status })),
        campaigns: campaigns.map(c => ({
            id: c.id, name: c.name, active: c.active,
            triggerEventTypes: JSON.parse(c.triggerEventTypes),
            stopOnEventTypes: JSON.parse(c.stopOnEventTypes),
            steps: c.steps.map(s => ({ delay: s.delayMinutes, type: s.messageType, content: s.contentText?.slice(0, 50) }))
        })),
        orders: orders.map(o => ({
            id: o.id, status: o.status, provider: o.provider, amount: o.amount,
            lead: o.lead?.phoneE164,
            events: o.events.map(e => ({ type: e.eventType, at: e.createdAt }))
        })),
        runs: runs.map(r => ({
            id: r.id, status: r.status, orderId: r.orderId, campaignId: r.campaignId,
            dispatches: r.dispatches.map(d => ({
                id: d.id, status: d.status,
                scheduledFor: d.scheduledFor,
                isPast: new Date(d.scheduledFor) < now,
                error: d.lastError
            }))
        })),
        pendingDispatches: dispatches.filter(d => d.status === 'pending').length,
        problems: [
            waNumbers.length === 0 ? '🔴 Nenhum WhatsApp conectado' : null,
            campaigns.length === 0 ? '🔴 Nenhuma campanha criada' : null,
            campaigns.some(c => !c.active) ? '🟡 Alguma campanha está inativa' : null,
            orders.length === 0 ? '🟡 Nenhuma order recebida (webhook não chegou?)' : null,
            runs.length === 0 && orders.length > 0 ? '🔴 Orders existem mas nenhum run foi criado (evento não bateu com gatilho?)' : null,
        ].filter(Boolean)
    });
}
