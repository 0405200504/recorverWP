import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed...');

    // 1. Limpar banco para semente controlada (Opcional, mas útil p/ dev)
    // await prisma.organization.deleteMany();

    // 2. Criar Organization
    const org = await prisma.organization.create({
        data: {
            name: 'Loja Exemplo',
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
        }
    });

    // 3. Criar User (Owner)
    const passwordHash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@recoverwp.com' },
        update: {},
        create: {
            email: 'admin@recoverwp.com',
            name: 'Admin RecoverWP',
            passwordHash,
            memberships: {
                create: {
                    organizationId: org.id,
                    role: 'owner',
                }
            }
        }
    });

    // 4. Configurar Mock WhatsApp Number
    await prisma.whatsAppNumber.create({
        data: {
            organizationId: org.id,
            phoneNumberId: 'mock_phone_id_12345',
            wabaId: 'mock_waba_id_8888',
            accessToken: 'mock', // Isso garante que o mock funcionará
            displayName: 'Atendimento (Mock)',
        }
    });

    // 5. Criar campanha de Pix/Boleto com 3 passos (15min, 2h, 24h)
    await prisma.campaign.create({
        data: {
            organizationId: org.id,
            name: 'Recuperação Padrão (Pix/Boleto)',
            triggerEventTypes: JSON.stringify(['pix_generated', 'boleto_generated']),
            stopOnEventTypes: JSON.stringify(['payment_approved', 'refunded']),
            steps: {
                create: [
                    {
                        stepOrder: 1,
                        delayMinutes: 15, // 15 minutos
                        messageType: 'freeform',
                        contentText: 'Oi {{lead_name}}! Vi que você gerou um Pix para {{product_name}}, mas não finalizou. Tem alguma dúvida? Valor: R$ {{amount}}.',
                        sendOnlyIf: 'dentro_24h'
                    },
                    {
                        stepOrder: 2,
                        delayMinutes: 120, // 2 horas
                        messageType: 'freeform',
                        contentText: 'Oi {{lead_name}}, seu Pix está quase expirando! Pague pelo link para garantir: {{checkout_url}}',
                        sendOnlyIf: 'dentro_24h'
                    },
                    {
                        stepOrder: 3,
                        delayMinutes: 1440, // 24 horas
                        messageType: 'template',
                        templateName: 'ultimato_desconto_recoverwp',
                        sendOnlyIf: 'qualquer'
                    }
                ]
            }
        }
    });

    console.log('✅ Seed concluído! Email: admin@recoverwp.com | Senha: admin123');
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
