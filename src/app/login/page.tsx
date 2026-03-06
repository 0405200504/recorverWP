'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import styles from './page.module.css';

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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

        if (mode === 'login') {
            try {
                const res = await signIn('credentials', {
                    email, password,
                    redirect: false,
                    callbackUrl: '/dashboard'
                });

                if (res?.error) {
                    setError('Credenciais inválidas. Verifique seu e-mail e senha.');
                    setLoading(false);
                } else if (res?.ok) {
                    window.location.href = res.url || '/dashboard';
                } else {
                    setError('Erro inesperado ao autenticar. Tente novamente.');
                    setLoading(false);
                }
            } catch {
                setError('Erro de conexão. Tente novamente.');
                setLoading(false);
            }
        } else if (mode === 'register') {
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

                setSuccessMsg('Conta criada com sucesso. Faça seu login para continuar.');
                setMode('login');
                setPassword('');
            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro.');
            } finally {
                setLoading(false);
            }
        } else if (mode === 'forgot') {
            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    throw new Error('Erro ao solicitar redefinição.');
                }

                setSuccessMsg('O link de recuperação foi "enviado". Verifique a resposta simulada no console do Next.js!');
            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro.');
            } finally {
                setLoading(false);
            }
        }
    };

    const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
        setMode(newMode);
        setError('');
        setSuccessMsg('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logoMark}>
                    <div className={styles.logoDots}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                    </div>
                    <span className={styles.logoName}>RecoverWP</span>
                </div>

                <h1 className={styles.title}>
                    {mode === 'login' && 'Acesso à plataforma'}
                    {mode === 'register' && 'Criar sua conta'}
                    {mode === 'forgot' && 'Recuperar Senha'}
                </h1>
                <p className={styles.subtitle}>
                    {mode === 'login' && 'Entre com suas credenciais para gerenciar suas campanhas.'}
                    {mode === 'register' && 'Cadastre sua empresa e comece a recuperar vendas automaticamente.'}
                    {mode === 'forgot' && 'Informe seu e-mail para receber um link de redefinição de senha.'}
                </p>

                {error && <p className={styles.errorMsg}>{error}</p>}
                {successMsg && <p className={styles.successMsg}>{successMsg}</p>}

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Seu nome</label>
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
                                <label className={styles.label}>Nome da empresa</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                    className={styles.input}
                                    placeholder="Minha Empresa"
                                />
                            </div>
                        </>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="voce@empresa.com"
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label className={styles.label} style={{ marginBottom: 0 }}>Senha</label>
                                {mode === 'login' && (
                                    <button type="button" onClick={() => switchMode('forgot')} className={styles.switchLink} style={{ fontSize: '13px', border: 'none', background: 'none' }}>
                                        Esqueci a senha
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className={styles.input}
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar instruções'}
                    </button>
                </form>

                <div className={styles.switchText}>
                    {mode === 'login' ? (
                        <>Não tem uma conta?<span className={styles.switchLink} onClick={() => switchMode('register')}>Cadastre-se</span></>
                    ) : (
                        <>Voltar para a página de <span className={styles.switchLink} onClick={() => switchMode('login')}>Login</span></>
                    )}
                </div>
            </div>
        </div>
    );
}
