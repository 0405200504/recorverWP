import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { StopRunButton, DeleteRunButton } from './RunClient';

function statusClass(status: string, s: Record<string, string>) {
    if (status === 'scheduled') return s.statusScheduled;
    if (status === 'stopped' || status === 'failed') return s.statusInactive;
    if (status === 'completed') return s.statusActive;
    return s.statusPending;
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        scheduled: 'Agendado',
        running: 'Em andamento',
        stopped: 'Interrompido',
        completed: 'Concluído',
        failed: 'Falha',
    };
    return map[status] ?? status;
}

function dispatchStatusLabel(status: string) {
    const map: Record<string, string> = {
        pending: 'Pendente',
        sent: 'Enviado',
        failed: 'Falhou',
        cancelled: 'Cancelado',
    };
    return map[status] ?? status;
}

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
            <div className={styles.header}>
                <h1 className={styles.title}>Recuperações</h1>
                <p className={styles.subtitle}>Funis de automação disparados individualmente por campanha</p>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Pedido</th>
                            <th className={styles.th}>Lead</th>
                            <th className={styles.th}>Campanha</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Disparos</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((r) => {
                            const run = r as any;
                            return (
                                <tr key={run.id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <span className={styles.codeTag}>{run.order?.externalOrderId}</span>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>{run.order?.status}</span>
                                    </td>
                                    <td className={styles.td} style={{ color: '#fff' }}>
                                        {run.order?.lead?.name || run.order?.lead?.phoneE164 || '—'}
                                    </td>
                                    <td className={styles.td} style={{ fontWeight: 500, color: '#fff' }}>{run.campaign?.name}</td>
                                    <td className={styles.td}>
                                        <span className={`${styles.statusBadge} ${statusClass(run.status, styles)}`}>
                                            {statusLabel(run.status)}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            {run.dispatches.map((d: any) => (
                                                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                                    <span style={{ color: 'var(--text-3)' }}>#{d.stepOrder}</span>
                                                    <span className={`${styles.statusBadge} ${d.status === 'sent' ? styles.statusActive : d.status === 'failed' ? styles.statusInactive : styles.statusPending}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                                        {dispatchStatusLabel(d.status)}
                                                    </span>
                                                    {d.sentAt && <span style={{ color: 'var(--text-3)' }}>{new Date(d.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                    {d.lastError && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{d.lastError}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                                            <StopRunButton id={run.id} currentStatus={run.status} />
                                            <DeleteRunButton id={run.id} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {runs.length === 0 && (
                            <tr>
                                <td colSpan={6}>
                                    <div className={styles.emptyState}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', color: 'var(--border-3)', display: 'block' }}>
                                            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        <div className={styles.emptyStateTitle}>Nenhuma recuperação em andamento</div>
                                        <div className={styles.emptyStateDesc}>Os funis aparecem automaticamente quando um lead aciona uma campanha ativa.</div>
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
