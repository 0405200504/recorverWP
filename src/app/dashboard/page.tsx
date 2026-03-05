import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from './dashboard.module.css';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    // Métricas
    const leadsCount = await prisma.lead.count({ where: { organizationId: orgId } });
    const runsCount = await prisma.recoveryRun.count({ where: { organizationId: orgId } });
    const msgsCount = await prisma.message.count({ where: { organizationId: orgId, direction: 'outbound' } });

    // (Simulando Vendas Totais para MVP)
    const totalRecovered = await prisma.order.aggregate({
        where: { organizationId: orgId, status: 'approved' },
        _sum: { amount: true }
    });

    const recoveredBRL = (totalRecovered._sum.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div>
            {/* INSTRUCTION BANNER */}
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>
                    Visão Geral da Operação
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    Acompanhe o desempenho das suas campanhas de recuperação automática e monitore indicadores chave em tempo real. Para configuração inicial, acesse a aba <strong>Integrações</strong>.
                </p>
            </div>

            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 className={styles.title}>Visão Geral</h1>
                        <p className={styles.subtitle}>Métricas de desempenho da sua operação de recuperação (Últimos 30 dias)</p>
                    </div>

                    {/* Shadcn Avatar Group */}
                    <div className={styles.avatarGroupContainer} style={{ marginBottom: 0 }}>
                        <div className={styles.avatar}>
                            <img src="https://github.com/shadcn.png" alt="@shadcn" className={`${styles.avatarImage} grayscale`} style={{ filter: 'grayscale(100%)' }} />
                        </div>
                        <div className={styles.avatar}>
                            <img src="https://github.com/evilrabbit.png" alt="@evilrabbit" className={styles.avatarImage} />
                            <span className={styles.avatarBadge}></span>
                        </div>
                        <div className={styles.avatarGroup} style={{ filter: 'grayscale(100%)' }}>
                            <div className={styles.avatar}>
                                <img src="https://github.com/shadcn.png" alt="@shadcn" className={styles.avatarImage} />
                            </div>
                            <div className={styles.avatar}>
                                <img src="https://github.com/maxleiter.png" alt="@maxleiter" className={styles.avatarImage} />
                            </div>
                            <div className={styles.avatar}>
                                <img src="https://github.com/evilrabbit.png" alt="@evilrabbit" className={styles.avatarImage} />
                            </div>
                            <div className={styles.avatar} style={{ backgroundColor: '#18181b', color: '#fafafa' }}>
                                +3
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.grid}>
                <div className={`${styles.card} ${styles.cardLime}`}>
                    <div className={styles.cardTitle}>Vendas Recuperadas</div>
                    <div className={styles.cardValue}>{recoveredBRL}</div>
                    <span className={styles.badge} style={{ background: 'rgba(255,255,255,0.4)' }}>+12% vs last week</span>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Leads Capturados</div>
                    <div className={styles.cardValue}>{leadsCount}</div>
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Crescimento</span>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Tentativas de Recuperação (Runs)</div>
                    <div className={styles.cardValue}>{runsCount}</div>
                    <span className={styles.badge}>Processando</span>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Mensagens Enviadas</div>
                    <div className={styles.cardValue}>{msgsCount}</div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <h2 className={styles.title} style={{ fontSize: '20px', marginBottom: '20px' }}>Atividade Recente</h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Acesse as abas específicas para relatórios detalhados.</p>
            </div>
        </div>
    );
}
