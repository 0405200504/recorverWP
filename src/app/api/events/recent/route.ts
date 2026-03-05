import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const events = await prisma.orderEvent.findMany({
        where: { order: { organizationId: orgId } },
        include: { order: { include: { lead: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return NextResponse.json(events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        leadName: e.order.lead.name,
        leadPhone: e.order.lead.phoneE164,
        amount: e.order.amount,
        provider: e.order.provider,
        createdAt: e.createdAt,
    })));
}
