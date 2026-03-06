import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { AddWhatsAppButton, DeleteWhatsAppButton } from './WhatsAppClient';
import { WebhookGridClient } from './WebhookGridClient';
import { EditWebhookSecretButton } from './WebhookClient';
import { EventFeed } from './EventFeed';
import { WhatsAppStatusBadge } from './WhatsAppStatusBadge';
import { TriggerSchedulerButton } from './TriggerSchedulerButton';

const IconWebhook = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const IconPhone = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
);

export default async function IntegrationsPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { whatsappNumbers: true, webhookConfigs: true }
    }) as any;

    if (!org) return <div>Organização não encontrada.</div>;

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Integrações</h1>
                <p className={styles.subtitle}>Configure canais de entrada (webhooks) e saída (WhatsApp) da sua operação</p>
            </div>

            {/* Feed de eventos em tempo real */}
            <EventFeed />

            <div className={styles.grid}>
                {/* Card Webhooks */}
                <div className={styles.card}>
                    <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={styles.cardIconWrapper} style={{ margin: 0 }}>
                                <IconWebhook />
                            </div>
                            <div>
                                <div className={styles.sectionTitle}>Webhooks & Plataformas</div>
                                <div className={styles.sectionSubtitle}>Endpoints de recebimento de eventos</div>
                            </div>
                        </div>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px', lineHeight: 1.6 }}>
                        Selecione a plataforma para configurar o webhook de recebimento de eventos:
                    </p>

                    <WebhookGridClient configs={org.webhookConfigs} orgId={orgId} />

                    <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                            Webhook Secret Master
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px', lineHeight: 1.5 }}>
                            Usado para autenticação personalizada via HMAC em integrações avançadas.
                        </p>
                        <EditWebhookSecretButton currentSecret={org.webhook_secret} />
                    </div>
                </div>

                {/* Card WhatsApp */}
                <div className={styles.card}>
                    <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={styles.cardIconWrapper} style={{ margin: 0 }}>
                                <IconPhone />
                            </div>
                            <div>
                                <div className={styles.sectionTitle}>Aparelhos Conectados</div>
                                <div className={styles.sectionSubtitle}>Números de WhatsApp ativos</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        {org.whatsappNumbers.map((wn: any) => (
                            <div key={wn.id} className={styles.deviceCard}>
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <DeleteWhatsAppButton id={wn.id} />
                                </div>
                                <div className={styles.deviceName}>{wn.displayName}</div>
                                <div className={styles.deviceId}>{wn.phoneNumberId}</div>
                                <div style={{ marginTop: '10px' }}>
                                    <WhatsAppStatusBadge instanceName={wn.phoneNumberId} />
                                </div>
                            </div>
                        ))}
                        {org.whatsappNumbers.length === 0 && (
                            <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                                Nenhum aparelho configurado. Conecte um número para começar a enviar mensagens.
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <AddWhatsAppButton />
                        <TriggerSchedulerButton />
                    </div>
                </div>
            </div>
        </div>
    );
}
