import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Testar conexão com o banco
        const orgCount = await prisma.organization.count();
        const lastEvent = await prisma.orderEvent.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        return NextResponse.json({
            status: 'online',
            db_connected: true,
            org_count: orgCount,
            last_event_at: lastEvent?.createdAt,
            version_id: 'v25-anti-duplication-logs-public', // ID manual para rastreio
            latest_commit: 'b4df227-limit-3',
            now: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'degraded',
            error: error.message,
            db_connected: false,
            version_id: 'v25-anti-duplication-logs-public'
        }, { status: 500 });
    }
}
