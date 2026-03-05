import styles from '../dashboard.module.css';
import { WhatsAppEmbed } from './WhatsAppInbox';

export default function WhatsAppPage() {
    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>WhatsApp</h1>
                <p className={styles.subtitle}>Sua caixa de entrada — mesma sessão conectada em Integrações</p>
            </div>
            <WhatsAppEmbed />
        </div>
    );
}

