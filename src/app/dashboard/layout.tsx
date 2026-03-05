import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "@/lib/auth";
import styles from './layout.module.css';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logoDots}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                    </div>
                    <span className={styles.brandName}>RecoverWP</span>
                </div>
                <nav className={styles.nav}>
                    <li><Link href="/dashboard" className={styles.navLink}>Visão Geral</Link></li>
                    <li><Link href="/dashboard/leads" className={styles.navLink}>Leads</Link></li>
                    <li><Link href="/dashboard/campaigns" className={styles.navLink}>Campanhas</Link></li>
                    <li><Link href="/dashboard/runs" className={styles.navLink}>Recuperações</Link></li>
                    <li><Link href="/dashboard/whatsapp" className={styles.navLink}>💬 WhatsApp</Link></li>
                    <li><Link href="/dashboard/integrations" className={styles.navLink}>Integrações</Link></li>
                </nav>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
