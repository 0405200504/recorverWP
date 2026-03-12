import { NextRequest, NextResponse } from 'next/server';
import { fetchGroups } from '@/lib/evolution-whatsapp';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.orgId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const instanceName = req.nextUrl.searchParams.get('instance');
        if (!instanceName) return NextResponse.json({ error: "Instância não informada" }, { status: 400 });

        const groups = await fetchGroups(instanceName);
        return NextResponse.json(groups);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
