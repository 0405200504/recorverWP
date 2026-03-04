import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error('Nenhuma organizacao encontrada.');
        return;
    }

    // Criar Campanha Ativa
    const campaign = await prisma.campaign.create({
        data: {
            organizationId: org.id,
            name: 'Recuperação de Abandono de Carrinho Simulado',
            active: true,
            triggerEventTypes: JSON.stringify(['cart_abandoned']),
            stopOnEventTypes: JSON.stringify(['payment_approved']),
            maxAttemptsPerLeadPerOrder: 3,
            steps: {
                create: [
                    {
                        stepOrder: 1,
                        delayMinutes: 0, // Disparo Imediato para teste
                        messageType: 'freeform',
                        contentText: 'Opa, vi que você tentou comprar o {{product.name}} e não finalizou. Posso ajudar?',
                        sendOnlyIf: 'qualquer'
                    }
                ]
            }
        }
    });

    console.log('Campanha Criada:', campaign);

    await prisma.$disconnect();
}

run().catch(console.error);
