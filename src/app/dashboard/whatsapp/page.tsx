import styles from '../dashboard.module.css';
import { WhatsAppInbox } from './WhatsAppInbox';

export default function WhatsAppPage() {
    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>WhatsApp</h1>
                <p className={styles.subtitle}>Caixa de entrada das suas conversas</p>
            </div>
            <WhatsAppInbox />
        </div>
    );
}
