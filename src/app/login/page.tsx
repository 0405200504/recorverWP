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
        } else {
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
                setIsLogin(true);
                setPassword('');
            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro.');
            } finally {
                setLoading(false);
            }
        }
    };

    const switchMode = (toLogin: boolean) => {
        setIsLogin(toLogin);
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
                    {isLogin ? 'Acesso à plataforma' : 'Criar sua conta'}
                </h1>
                <p className={styles.subtitle}>
                    {isLogin
                        ? 'Entre com suas credenciais para gerenciar suas campanhas.'
                        : 'Cadastre sua empresa e comece a recuperar vendas automaticamente.'}
                </p>

                {error && <p className={styles.errorMsg}>{error}</p>}
                {successMsg && <p className={styles.successMsg}>{successMsg}</p>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
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
                        {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
                    </button>
                </form>

                <div className={styles.switchText}>
                    {isLogin ? (
                        <>Não tem uma conta?<span className={styles.switchLink} onClick={() => switchMode(false)}>Cadastre-se</span></>
                    ) : (
                        <>Já tem uma conta?<span className={styles.switchLink} onClick={() => switchMode(true)}>Fazer login</span></>
                    )}
                </div>
            </div>
        </div>
    );
}
