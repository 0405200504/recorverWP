import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';

export default async function SettingsPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
    });

    if (!org) return <div>Organização não encontrada no banco de dados.</div>;

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Configurações da Conta</h1>
                <p className={styles.subtitle}>Detalhes e preferências da sua organização</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Nome da Organização</div>
                    <div className={styles.cardValue} style={{ fontSize: '18px', marginTop: '8px' }}>{org.name}</div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Fuso Horário</div>
                    <div className={styles.cardValue} style={{ fontSize: '18px', marginTop: '8px' }}>{org.timezone}</div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Moeda</div>
                    <div className={styles.cardValue} style={{ fontSize: '18px', marginTop: '8px' }}>{org.currency}</div>
                </div>
            </div>

            <div className={styles.tableContainer} style={{ marginTop: '24px' }}>
                <div className={styles.tableHeader}>
                    <div>
                        <div className={styles.sectionTitle}>Webhook Secret</div>
                        <div className={styles.sectionSubtitle}>Chave secreta para validação de webhooks de entrada</div>
                    </div>
                </div>
                <div style={{ padding: '20px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-2)' }}>
                    {org.webhook_secret}
                </div>
            </div>
        </div>
    );
}
