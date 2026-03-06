'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) throw new Error('Não autenticado');

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) throw new Error('Usuário não encontrado');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Senha atual incorreta');

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
    });
}
