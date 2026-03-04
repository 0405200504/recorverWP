'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
            callbackUrl: '/dashboard'
        });

        if (res?.error) {
            setError('Credenciais inválidas. Tente novamente.');
            setLoading(false);
        } else if (res?.url) {
            window.location.href = res.url;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logoMark}>
                    <div className={styles.logoDots}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                    </div>
                </div>
                <h1 className={styles.title}>Acesso à Plataforma</h1>
                <p className={styles.subtitle}>Autenticação segura para gestão de campanhas.</p>

                {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Endereço de Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="admin@recoverwp.com"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
