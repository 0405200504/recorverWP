import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTextWithHumanBehavior, isInstanceConnected } from '@/lib/evolution-whatsapp';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const orgId = session?.orgId;

        if (!orgId) {
            return NextResponse.json({ error: 'Sessão inválida ou organização não encontrada' }, { status: 401 });
        }

        const { number, message } = await req.json();

        if (!number || !message) {
            return NextResponse.json({ error: 'Número e mensagem são obrigatórios' }, { status: 400 });
        }

        // Busca o primeiro número de WhatsApp ativo da organização
        const waNumber = await prisma.whatsAppNumber.findFirst({
            where: { organizationId: orgId, status: 'active' }
        });

        if (!waNumber) {
            return NextResponse.json({ error: 'Nenhum número de WhatsApp ativo configurado nesta organização' }, { status: 404 });
        }

        const instanceName = waNumber.phoneNumberId;

        // Verifica conexão
        const connected = await isInstanceConnected(instanceName);
        if (!connected) {
            return NextResponse.json({ error: `A instância "${waNumber.displayName}" está desconectada da Evolution API.` }, { status: 400 });
        }

        // Dispara mensagem
        console.log(`[TEST-SEND] Enviando teste para ${number} via ${instanceName}`);
        const result = await sendTextWithHumanBehavior(instanceName, number, message);

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            details: `Mensagem enviada com sucesso via ${waNumber.displayName}`
        });

    } catch (error: any) {
        console.error('[TEST-SEND ERROR]', error);
        return NextResponse.json({ error: error.message || 'Erro interno ao enviar mensagem' }, { status: 500 });
    }
}
