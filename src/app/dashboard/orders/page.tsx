import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';

export default async function OrdersPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const orders = await prisma.order.findMany({
        where: { organizationId: orgId },
        include: { lead: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Pedidos e Transações</h1>
                <p className={styles.subtitle}>Histórico dos últimos pedidos e status de pagamento</p>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>ID Externo</th>
                            <th className={styles.th}>Produto</th>
                            <th className={styles.th}>Valor</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Cliente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className={styles.tr}>
                                <td className={styles.td}>{order.externalOrderId}</td>
                                <td className={styles.td}>{(order as any).productName || 'Não informado'}</td>
                                <td className={styles.td}>R$ {order.amount.toFixed(2)}</td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${order.status === 'approved' ? styles.statusActive :
                                        order.status === 'abandoned' || order.status === 'pending' ? styles.statusPending : styles.statusInactive
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className={styles.td}>{order.lead.name || order.lead.phoneE164}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
