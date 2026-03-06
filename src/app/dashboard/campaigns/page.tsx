import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { AddCampaignButton, DeleteCampaignButton, EditCampaignButton } from './CampaignClient';

export default async function CampaignsPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const campaigns = await prisma.campaign.findMany({
        where: { organizationId: orgId },
        include: { _count: { select: { runs: true } }, steps: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div>
                    <h1 className={styles.title}>Campanhas</h1>
                    <p className={styles.subtitle}>Crie e gerencie automações de mensagens para cada etapa do funil</p>
                </div>
                <AddCampaignButton />
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Campanha</th>
                            <th className={styles.th}>Gatilho</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Ativações</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(camp => (
                            <tr key={camp.id} className={styles.tr}>
                                <td className={styles.td} style={{ color: '#fff', fontWeight: 500 }}>{camp.name}</td>
                                <td className={styles.td}>
                                    <span className={styles.codeTag}>
                                        {camp.triggerEventTypes}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${camp.active ? styles.statusActive : styles.statusInactive}`}>
                                        {camp.active ? 'Ativa' : 'Pausada'}
                                    </span>
                                </td>
                                <td className={styles.td}>{camp._count.runs} ativações</td>
                                <td className={styles.td}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <EditCampaignButton
                                            id={camp.id}
                                            name={camp.name}
                                            triggerEvent={JSON.parse(camp.triggerEventTypes)[0] || 'pix_generated'}
                                            steps={camp.steps}
                                        />
                                        <DeleteCampaignButton id={camp.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={5}>
                                    <div className={styles.emptyState}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', color: 'var(--border-3)', display: 'block' }}>
                                            <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                                        </svg>
                                        <div className={styles.emptyStateTitle}>Nenhuma campanha criada</div>
                                        <div className={styles.emptyStateDesc}>Crie sua primeira campanha para começar a recuperar vendas automaticamente.</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
