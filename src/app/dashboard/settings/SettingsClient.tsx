'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { changePassword } from './actions';

export function SettingsClient() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            alert('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            alert(error.message || 'Erro ao alterar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.card} style={{ marginTop: '24px' }}>
            <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={styles.cardIconWrapper} style={{ margin: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <div>
                        <div className={styles.sectionTitle}>Alterar Senha</div>
                        <div className={styles.sectionSubtitle}>Atualize sua senha de acesso</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-2)' }}>Senha Atual</label>
                    <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'inherit', fontSize: '14px', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-2)' }}>Nova Senha</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'inherit', fontSize: '14px', outline: 'none' }}
                    />
                </div>
                <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                    {loading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
            </div>
        </form>
    );
}
