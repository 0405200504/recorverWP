import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, companyName } = body;

        if (!email || !password || !name || !companyName) {
            return new NextResponse('Missing required fields (name, email, password, companyName)', { status: 400 });
        }

        // 1. Check se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse('User with this email already exists', { status: 409 });
        }

        // 2. Hash da senha
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Criar Organização, Usuário e a Associação (Membership) numa transação
        const result = await prisma.$transaction(async (tx) => {
            // A) Cria a Org
            const org = await tx.organization.create({
                data: {
                    name: companyName,
                    // defaults pro webhook_secret, currency etc já declarados no schema
                }
            });

            // B) Cria o User
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                }
            });

            // C) Vincula o User à Org com permissão máxima (owner)
            await tx.membership.create({
                data: {
                    userId: user.id,
                    organizationId: org.id,
                    role: 'owner'
                }
            });

            return { user: { id: user.id, email: user.email }, org: { id: org.id, name: org.name } };
        });

        return NextResponse.json({ message: 'Account created successfully', data: result }, { status: 201 });

    } catch (error: any) {
        console.error('[SIGNUP_ERROR]', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
