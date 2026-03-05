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
            {/* INSTRUCTION BANNER */}
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>
                    Estratégia de Campanhas
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    Defina as regras de negócio para recuperação. Crie campanhas vinculadas a gatilhos e eventos específicos recebidos pelo checkout. O disparo de mensagens será interrompido automaticamente e imediatamente em caso de detecção de conversão de pagamento aprovado.
                </p>
            </div>

            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className={styles.title}>Campanhas</h1>
                    <p className={styles.subtitle}>Crie e gerencie sua esteira de automações 1:1 de mensagens</p>
                </div>
            </div>

            <AddCampaignButton />

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Nome da Campanha</th>
                            <th className={styles.th}>Gatilhos (Eventos)</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Recuperações Ativas</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(camp => (
                            <tr key={camp.id} className={styles.tr}>
                                <td className={styles.td}><strong>{camp.name}</strong></td>
                                <td className={styles.td}>
                                    <code style={{ background: '#18181b', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#38bdf8', border: '1px solid #27272a' }}>
                                        {camp.triggerEventTypes}
                                    </code>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${camp.active ? styles.statusActive : styles.statusInactive}`}>
                                        {camp.active ? 'Ativa' : 'Pausada'}
                                    </span>
                                </td>
                                <td className={styles.td}>{camp._count.runs} funis acionados</td>
                                <td className={styles.td}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <EditCampaignButton
                                            id={camp.id}
                                            name={camp.name}
                                            triggerEvent={JSON.parse(camp.triggerEventTypes)[0] || 'pix_generated'}
                                            delayMinutes={camp.steps[0]?.delayMinutes || 10}
                                            messageType={camp.steps[0]?.messageType || 'text'}
                                            textContent={camp.steps[0]?.contentText || ''}
                                            mediaUrl={camp.steps[0]?.mediaUrl || ''}
                                        />
                                        <DeleteCampaignButton id={camp.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={5} className={styles.td} style={{ textAlign: 'center' }}>Nenhuma campanha encontrada</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
