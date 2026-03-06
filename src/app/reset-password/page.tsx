'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../login/page.module.css';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    if (!token) return <div style={{ padding: 40, color: 'white' }}>Link inválido.</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMsg('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao redefinir.');

            setMsg('Senha atualizada com sucesso! Redirecionando...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Redefinir Senha</h1>
                <p className={styles.subtitle}>Crie uma nova senha de acesso.</p>

                {error && <p className={styles.errorMsg}>{error}</p>}
                {msg && <p className={styles.successMsg}>{msg}</p>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className={styles.input}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Aguarde...' : 'Salvar nova senha'}
                    </button>
                    <div className={styles.switchText} style={{ marginTop: '16px' }}>
                        <a href="/login" className={styles.switchLink}>Voltar ao login</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
