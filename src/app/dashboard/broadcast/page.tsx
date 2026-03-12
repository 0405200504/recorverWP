import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { BroadcastClient } from './BroadcastClient';

export default async function BroadcastPage() {
    const session = await getServerSession(authOptions) as any;
    const orgId = session?.orgId;

    if (!orgId) return <div>Organização não encontrada.</div>;

    const whatsappNumbers = await prisma.whatsAppNumber.findMany({
        where: { organizationId: orgId, status: 'active' }
    });

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Disparo em Massa</h1>
                <p className={styles.subtitle}>Envie mensagens para leads de grupos com comportamento humano</p>
            </div>

            <BroadcastClient whatsappNumbers={whatsappNumbers} />
        </div>
    );
}
