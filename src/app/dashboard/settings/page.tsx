import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from '../dashboard.module.css';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) return <div>Não autenticado.</div>;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) return <div>Usuário não encontrado no banco de dados.</div>;

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Configurações da Conta</h1>
                <p className={styles.subtitle}>Detalhes e gerenciamento do seu perfil</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Nome de Usuário</div>
                    <div className={styles.cardValue} style={{ fontSize: '18px', marginTop: '8px' }}>{user.name || 'Não informado'}</div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>E-mail</div>
                    <div className={styles.cardValue} style={{ fontSize: '18px', marginTop: '8px' }}>{user.email}</div>
                </div>
            </div>

            <SettingsClient />
        </div>
    );
}
