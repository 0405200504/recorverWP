import { NextRequest, NextResponse } from 'next/server';
import { startBroadcast, activeBroadcasts } from '@/lib/broadcast-service';
import { fetchGroupParticipants } from '@/lib/evolution-whatsapp';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST — Inicia um novo broadcast
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.orgId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const { instanceName, groupJid, messageType, content } = await req.json();

        if (!instanceName || !groupJid || !content) {
            return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
        }

        // 1. Busca os participantes do grupo
        const participants = await fetchGroupParticipants(instanceName, groupJid);
        if (participants.length === 0) {
            return NextResponse.json({ error: "Nenhum participante encontrado no grupo ou erro na API" }, { status: 400 });
        }

        // 2. Cria um ID único para este broadcast
        const broadcastId = `bc_${Date.now()}`;

        // 3. Inicia o processo em background
        await startBroadcast(broadcastId, {
            organizationId: session.orgId,
            instanceName,
            targets: participants,
            messageType,
            content
        });

        return NextResponse.json({ broadcastId, targetCount: participants.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET — Monitora o status de um broadcast específico
export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ active: Array.from(activeBroadcasts.keys()) });

    const stats = activeBroadcasts.get(id);
    if (!stats) return NextResponse.json({ error: "Broadcast não encontrado" }, { status: 404 });

    return NextResponse.json(stats);
}

// DELETE — Para um broadcast
export async function DELETE(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID não informado" }, { status: 400 });

    const stats = activeBroadcasts.get(id);
    if (stats) {
        stats.status = 'stopped';
        stats.logs.push("Interrompido manualmente pelo usuário.");
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Broadcast não encontrado" }, { status: 404 });
}
