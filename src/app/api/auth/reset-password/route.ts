import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();
        if (!token || !password) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

        const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!resetToken || resetToken.expires < new Date()) {
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
        if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 });

        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash }
        });

        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
