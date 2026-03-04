'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import styles from './page.module.css';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);

    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        if (isLogin) {
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
        } else {
            // Executa cadastro
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, companyName })
                });

                if (!response.ok) {
                    const errMsg = await response.text();
                    throw new Error(errMsg || 'Falha ao criar conta.');
                }

                setSuccessMsg('Conta criada com sucesso! Faça seu login.');

                // Volta para login e preenche os ultimos dados
                setIsLogin(true);
                setPassword('');
            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro.');
            } finally {
                setLoading(false);
            }
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
                <h1 className={styles.title}>{isLogin ? 'Acesso à Plataforma' : 'Criar sua Conta'}</h1>
                <p className={styles.subtitle}>{isLogin ? 'Autenticação segura para gestão de campanhas.' : 'Cadastre sua empresa e impulsione suas conversões.'}</p>

                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
                {successMsg && <p style={{ color: '#a3e635', fontSize: '14px', marginBottom: '15px' }}>{successMsg}</p>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Seu Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className={styles.input}
                                    placeholder="João da Silva"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nome da Organização</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                    className={styles.input}
                                    placeholder="Minha Empresa LTDA"
                                />
                            </div>
                        </>
                    )}

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
                        {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div className={styles.switchText}>
                    {isLogin ? (
                        <>Não tem uma conta? <span className={styles.switchLink} onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}>Cadastre-se!</span></>
                    ) : (
                        <>Já possui uma conta? <span className={styles.switchLink} onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}>Faça login</span></>
                    )}
                </div>
            </div>
        </div>
    );
}
