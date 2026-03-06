import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Não expor existência do usuário (segurança)
            return NextResponse.json({ success: true });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60);

        await prisma.passwordResetToken.create({
            data: { email, token, expires }
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        console.log(`\n\n[RECOVERWP - SIMULAÇÃO E-MAIL] Link de recuperação para ${email}: \n${resetUrl}\n\n`);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
