import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';

export default async function MessagesPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const messages = await prisma.message.findMany({
        where: { organizationId: orgId },
        include: { lead: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Auditoria de Mensagens</h1>
                <p className={styles.subtitle}>Enviadas e recebidas via WhatsApp Oficial</p>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Direção</th>
                            <th className={styles.th}>Lead / Telefone</th>
                            <th className={styles.th}>Conteúdo / Tipo</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Data Env/Rec</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map(msg => (
                            <tr key={msg.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                        background: msg.direction === 'outbound' ? '#e0f2fe' : '#f1f5f9',
                                        color: msg.direction === 'outbound' ? '#0369a1' : '#475569'
                                    }}>
                                        {msg.direction.toUpperCase()}
                                    </span>
                                </td>
                                <td className={styles.td}>{msg.lead?.name || msg.lead?.phoneE164}</td>
                                <td className={styles.td} style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {msg.payload ? JSON.parse(msg.payload).content : 'Mídia/Documento'}
                                    <br />
                                    <small style={{ color: '#9ca3af' }}>{msg.direction === 'outbound' ? 'Enviada' : 'Recebida'}</small>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${msg.status === 'read' || msg.status === 'delivered' ? styles.statusActive : msg.status === 'failed' ? styles.statusInactive : styles.statusPending} `}>
                                        {msg.status}
                                    </span>
                                </td>
                                <td className={styles.td}>{new Date(msg.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                        {messages.length === 0 && (
                            <tr><td colSpan={5} className={styles.td} style={{ textAlign: 'center' }}>Nenhuma mensagem encontrada</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
