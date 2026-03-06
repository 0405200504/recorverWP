import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from './dashboard.module.css';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const leadsCount = await prisma.lead.count({ where: { organizationId: orgId } });
    const runsCount = await prisma.recoveryRun.count({ where: { organizationId: orgId } });
    const msgsCount = await prisma.message.count({ where: { organizationId: orgId, direction: 'outbound' } });

    const totalRecovered = await prisma.order.aggregate({
        where: { organizationId: orgId, status: 'approved' },
        _sum: { amount: true }
    });

    const recoveredBRL = (totalRecovered._sum.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className={styles.title}>Visão Geral</h1>
                        <p className={styles.subtitle}>Desempenho da operação de recuperação — últimos 30 dias</p>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Card principal — receita */}
                <div className={`${styles.card} ${styles.cardLime}`}>
                    <div className={styles.cardIconWrapper} style={{ borderColor: 'rgba(163,230,53,0.2)', background: 'rgba(163,230,53,0.08)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className={styles.cardTitle}>Receita Recuperada</div>
                    <div className={styles.cardValue}>{recoveredBRL}</div>
                    <span className={`${styles.badge} ${styles.badgeAccent}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                        Vendas aprovadas
                    </span>
                </div>

                {/* Card leads */}
                <div className={styles.card}>
                    <div className={styles.cardIconWrapper}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className={styles.cardTitle}>Leads Capturados</div>
                    <div className={styles.cardValue}>{leadsCount}</div>
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                        Monitorados
                    </span>
                </div>

                {/* Card runs */}
                <div className={styles.card}>
                    <div className={styles.cardIconWrapper}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </div>
                    <div className={styles.cardTitle}>Recuperações</div>
                    <div className={styles.cardValue}>{runsCount}</div>
                    <span className={styles.badge}>Funis acionados</span>
                </div>

                {/* Card messages */}
                <div className={styles.card}>
                    <div className={styles.cardIconWrapper}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <div className={styles.cardTitle}>Mensagens Enviadas</div>
                    <div className={styles.cardValue}>{msgsCount}</div>
                    <span className={styles.badge}>Via WhatsApp</span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <div>
                        <div className={styles.sectionTitle}>Atividade Recente</div>
                        <div className={styles.sectionSubtitle}>Acesse as abas específicas para relatórios detalhados</div>
                    </div>
                </div>
                <div className={styles.emptyState}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', color: 'var(--border-3)', display: 'block' }}>
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <div className={styles.emptyStateTitle}>Nenhuma atividade recente</div>
                    <div className={styles.emptyStateDesc}>Configure uma campanha e integre seu checkout para ver os eventos aqui.</div>
                </div>
            </div>
        </div>
    );
}
