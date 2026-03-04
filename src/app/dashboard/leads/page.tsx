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
            {/* INSTRUCTION BANNER */}
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>
                    Gestão de Leads
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    Central de contatos processados pela plataforma. O sistema possui inteligência nativa de deduplicação para assegurar que um mesmo lead não receba comunicações simultâneas em fluxos isolados.
                </p>
            </div>

            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className={styles.title}>Leads e Contatos</h1>
                    <p className={styles.subtitle}>Sua base de clientes que iniciaram uma compra (abandonos e aprovados)</p>
                </div>
            </div>

            <AddLeadButton />

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Nome e Telefone</th>
                            <th className={styles.th}>E-Mail</th>
                            <th className={styles.th}>Data de Criação</th>
                            <th className={styles.th}>Último Visto</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <strong style={{ color: '#ffffff' }}>{lead.name || 'Sem nome'}</strong><br />
                                    <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{lead.phoneE164}</span>
                                </td>
                                <td className={styles.td}>{lead.email || '-'}</td>
                                <td className={styles.td}>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className={styles.td}>{new Date(lead.lastSeenAt).toLocaleString('pt-BR')}</td>
                                <td className={styles.td}>
                                    <DeleteLeadButton id={lead.id} />
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={5} className={styles.td} style={{ textAlign: 'center' }}>Nenhum lead encontrado</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
