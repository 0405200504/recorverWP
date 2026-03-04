'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { updateWebhookSecret } from '../actions';

export function EditWebhookSecretButton({ currentSecret }: { currentSecret: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [secret, setSecret] = useState(currentSecret);

    const handleSave = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateWebhookSecret(secret);
            setIsEditing(false);
        } catch (err) {
            alert('Erro ao atualizar Webhook Secret');
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <code style={{ fontSize: '13px', color: '#4ade80', background: '#022c22', padding: '10px', borderRadius: '8px', border: '1px solid #064e3b', flex: 1, wordBreak: 'break-all' }}>
                    {currentSecret}
                </code>
                <button onClick={() => setIsEditing(true)} className={styles.btnSecondary} style={{ padding: '8px 16px' }}>Editar</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input required placeholder="Novo Secret..." className={styles.input} style={{ flex: 1 }} value={secret} onChange={e => setSecret(e.target.value)} />
            <button type="button" onClick={() => { setIsEditing(false); setSecret(currentSecret); }} className={styles.btnSecondary} disabled={loading}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} style={{ width: 'auto', padding: '10px 16px' }} disabled={loading}>{loading ? '...' : 'Salvar'}</button>
        </form>
    );
}
