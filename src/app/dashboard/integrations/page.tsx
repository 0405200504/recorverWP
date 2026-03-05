import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { AddWhatsAppButton, DeleteWhatsAppButton } from './WhatsAppClient';
import { WebhookGridClient } from './WebhookGridClient';
import { EditWebhookSecretButton } from './WebhookClient';
import { EventFeed } from './EventFeed';
import { WhatsAppStatusBadge } from './WhatsAppStatusBadge';


export default async function IntegrationsPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { whatsappNumbers: true, webhookConfigs: true }
    });

    if (!org) return <div>Organização não encontrada.</div>;

    // Apenas para display no painel, omitindo validações completas
    const webhookUrls = ['hotmart', 'kiwify', 'cakto', 'shopify', 'custom'].map(provider => {
        return {
            name: provider.toUpperCase(),
            url: `https://yourdomain.com/api/webhooks/checkout/${provider}`
        }
    });

    return (
        <div>
            {/* INSTRUCTION BANNER */}
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>
                    Configuração de Integrações
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    Para habilitar o envio automático de mensagens, conecte seu aparelho através de um <strong>QR Code</strong> abaixo. Aproveite nossa tecnologia Anti-Ban ativada por padrão. Em seguida, cadastre o <strong>Webhook</strong> do nosso sistema na sua plataforma de checkout.
                </p>
            </div>

            {/* FEED DE EVENTOS EM TEMPO REAL */}
            <EventFeed />


            <div className={styles.header}>
                <h1 className={styles.title}>Integrações e Webhooks</h1>
                <p className={styles.subtitle}>Configure os recebimentos de checkout e números ativos de WhatsApp</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.title} style={{ fontSize: '18px', marginBottom: '16px' }}>🔗 Webhooks & Plataformas</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Selecione a plataforma para configurar seu webhook de recebimento de eventos:</p>

                    <WebhookGridClient configs={org.webhookConfigs} orgId={orgId} />

                    <div style={{ marginTop: '32px', borderTop: '1px solid #27272a', paddingTop: '24px' }}>
                        <p style={{ fontSize: '14px' }}><strong>Webhook Secret Master (para Custom Auth via HMAC):</strong></p>
                        <EditWebhookSecretButton currentSecret={org.webhook_secret} />
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.title} style={{ fontSize: '18px', marginBottom: '16px' }}>📱 Aparelhos Conectados (WhatsApp)</h2>
                    {org.whatsappNumbers.map(wn => (
                        <div key={wn.id} style={{ border: '1px solid #27272a', background: '#18181b', padding: '16px', borderRadius: '12px', marginBottom: '16px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                                <DeleteWhatsAppButton id={wn.id} />
                            </div>
                            <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#ffffff', fontSize: 15 }}>📱 {wn.displayName}</p>
                            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#71717a' }}>Sessão: {wn.phoneNumberId}</p>
                            <WhatsAppStatusBadge instanceName={wn.phoneNumberId} />
                        </div>
                    ))}
                    {org.whatsappNumbers.length === 0 && <p style={{ fontSize: '14px', color: '#a1a1aa' }}>Nenhum número configurado para enviar mensagens.</p>}
                    <AddWhatsAppButton />
                </div>
            </div>
        </div>
    );
}
