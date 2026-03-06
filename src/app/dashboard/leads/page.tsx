import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { AddLeadButton, DeleteLeadButton } from './LeadClient';

export default async function LeadsPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const leads = await prisma.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    return (
        <div>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div>
                    <h1 className={styles.title}>Leads e Contatos</h1>
                    <p className={styles.subtitle}>Base de clientes capturados — deduplicação automática ativa</p>
                </div>
                <AddLeadButton />
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Contato</th>
                            <th className={styles.th}>E-mail</th>
                            <th className={styles.th}>Cadastro</th>
                            <th className={styles.th}>Último evento</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <span style={{ color: '#fff', fontWeight: 500, display: 'block' }}>{lead.name || 'Sem nome'}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'monospace' }}>{lead.phoneE164}</span>
                                </td>
                                <td className={styles.td}>{lead.email || '—'}</td>
                                <td className={styles.td}>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className={styles.td}>{new Date(lead.lastSeenAt).toLocaleString('pt-BR')}</td>
                                <td className={styles.td}>
                                    <DeleteLeadButton id={lead.id} />
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={5}>
                                    <div className={styles.emptyState}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', color: 'var(--border-3)', display: 'block' }}>
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <div className={styles.emptyStateTitle}>Nenhum lead capturado ainda</div>
                                        <div className={styles.emptyStateDesc}>Configure o webhook do checkout para começar a receber leads automaticamente.</div>
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
