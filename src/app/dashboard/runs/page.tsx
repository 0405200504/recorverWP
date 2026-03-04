import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import styles from '../dashboard.module.css';
import { StopRunButton, DeleteRunButton } from './RunClient';

export default async function RunsPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const runs = await prisma.recoveryRun.findMany({
        where: { organizationId: orgId },
        include: {
            order: { include: { lead: true } },
            campaign: true,
            dispatches: { orderBy: { scheduledFor: 'asc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div>
            {/* INSTRUCTION BANNER */}
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>
                    Monitoramento de Funis
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    Acompanhe o status das execuções de recuperação em andamento. O sistema interrompe automaticamente automações e cancela envios futuros para leads que tiveram pagamento aprovado.
                </p>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Recuperações em Andamento (Runs)</h1>
                <p className={styles.subtitle}>Supervisione os funis desencadeados individualmente pelas campanhas</p>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Pedido</th>
                            <th className={styles.th}>Lead</th>
                            <th className={styles.th}>Campanha</th>
                            <th className={styles.th}>Status da Run</th>
                            <th className={styles.th}>Progresso/Disparos</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((r) => {
                            const run = r as any;
                            return (
                                <tr key={run.id} className={styles.tr}>
                                    <td className={styles.td}>{run.order?.externalOrderId} ({run.order?.status})</td>
                                    <td className={styles.td}>{run.order?.lead?.name || run.order?.lead?.phoneE164}</td>
                                    <td className={styles.td}><strong>{run.campaign?.name}</strong></td>
                                    <td className={styles.td}>
                                        <span className={`${styles.statusBadge} ${run.status === 'scheduled' ? styles.statusScheduled : run.status === 'stopped' ? styles.statusInactive : styles.statusActive}`}>
                                            {run.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '12px', color: '#a1a1aa' }}>
                                            {run.dispatches.map((d: any) => (
                                                <li key={d.id}>
                                                    Passo {d.stepOrder}: {d.status} {d.sentAt ? `(${new Date(d.sentAt).toLocaleTimeString()})` : ''}
                                                    {d.lastError ? <span style={{ color: '#f87171' }}> Erro: {d.lastError}</span> : ''}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className={styles.td}>
                                        <StopRunButton id={run.id} currentStatus={run.status} />
                                        <DeleteRunButton id={run.id} />
                                    </td>
                                </tr>
                            );
                        })}
                        {runs.length === 0 && (
                            <tr>
                                <td colSpan={5} className={styles.td} style={{ textAlign: 'center' }}>Nenhuma run encontrada</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
