'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { addWhatsAppNumber, deleteWhatsAppNumber } from '../actions';

const STEPS = [
    {
        icon: '1',
        title: 'Acesse o Meta Business',
        desc: 'Vá em business.whatsapp.com e entre com a conta Meta da sua empresa.'
    },
    {
        icon: '2',
        title: 'Crie um App',
        desc: 'Em "Meus Apps" crie um novo app do tipo "Business" e adicione o produto "WhatsApp".'
    },
    {
        icon: '3',
        title: 'Copie as credenciais',
        desc: 'Na seção WhatsApp > Primeiros Passos, copie seu "Token de Acesso Temporário", "ID do Número de Telefone" e "ID da Conta do WhatsApp Business (WABA ID)".'
    },
];

export function AddWhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'guide' | 'form'>('guide');
    const [error, setError] = useState('');

    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Valida o token fazendo uma chamada real na API do Meta
        try {
            const verifyRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}?access_token=${accessToken}`);
            const verifyData = await verifyRes.json();

            if (verifyData.error) {
                setError(`Erro da API do Meta: ${verifyData.error.message}. Verifique suas credenciais.`);
                setLoading(false);
                return;
            }

            // Se chegou aqui, o token é válido - salva no banco
            await addWhatsAppNumber({
                phoneNumberId,
                wabaId,
                accessToken,
                displayName: displayName || verifyData.display_phone_number || displayName || 'Meu WhatsApp'
            });

            setIsOpen(false);
            setStep('guide');
            setPhoneNumberId('');
            setWabaId('');
            setAccessToken('');
            setDisplayName('');
        } catch (err: any) {
            setError('Falha ao conectar. Verifique as credenciais e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className={styles.btnPrimary} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /></svg>
                Conectar WhatsApp (API Oficial)
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto', background: '#111111', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)' }}>

                {/* Abas */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <button onClick={() => setStep('guide')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: step === 'guide' ? '#a3e635' : '#27272a', background: step === 'guide' ? 'rgba(163,230,53,0.1)' : 'transparent', color: step === 'guide' ? '#a3e635' : '#a1a1aa', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' }}>
                        📋 Como Obter as Credenciais
                    </button>
                    <button onClick={() => setStep('form')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: step === 'form' ? '#a3e635' : '#27272a', background: step === 'form' ? 'rgba(163,230,53,0.1)' : 'transparent', color: step === 'form' ? '#a3e635' : '#a1a1aa', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' }}>
                        🔑 Inserir Credenciais
                    </button>
                </div>

                {step === 'guide' && (
                    <>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>Integração via API Oficial do Meta</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
                            Esta é a forma <strong style={{ color: '#a3e635' }}>oficial e segura</strong> de conectar seu WhatsApp. Utiliza a API Cloud do Meta — a mesma tecnologia dos maiores SaaS de marketing do mundo. Nenhum risco de banimento.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {STEPS.map((s) => (
                                <div key={s.icon} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ width: '28px', height: '28px', background: '#a3e635', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: '13px', flexShrink: 0 }}>{s.icon}</div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{s.title}</div>
                                        <div style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5' }}>{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <a href="https://business.facebook.com/wa/manage/phone-numbers/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#1877f2', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>
                            🔗 Acessar Meta Business Platform
                        </a>

                        <button onClick={() => setStep('form')} className={styles.btnPrimary} style={{ width: '100%' }}>
                            Já tenho as credenciais →
                        </button>
                        <button onClick={() => setIsOpen(false)} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'transparent', border: '1px solid #27272a', borderRadius: '10px', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}>
                            Cancelar
                        </button>
                    </>
                )}

                {step === 'form' && (
                    <>
                        <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px' }}>Inserir Credenciais da API</h3>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>Nome de Exibição (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Suporte Empresa"
                                    className={styles.input}
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>Phone Number ID <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: 123456789012345"
                                    className={styles.input}
                                    value={phoneNumberId}
                                    onChange={e => setPhoneNumberId(e.target.value)}
                                />
                                <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Encontrado em: WhatsApp &gt; API Setup &gt; Phone Number ID</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>WABA ID (WhatsApp Business Account ID) <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: 987654321098765"
                                    className={styles.input}
                                    value={wabaId}
                                    onChange={e => setWabaId(e.target.value)}
                                />
                                <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Encontrado em: WhatsApp &gt; API Setup &gt; WhatsApp Business Account ID</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>Access Token (Token Permanente) <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="EAAxxxxxx... (Cole aqui o seu token de acesso permanente)"
                                    className={styles.input}
                                    value={accessToken}
                                    onChange={e => setAccessToken(e.target.value)}
                                    style={{ fontFamily: 'monospace', fontSize: '11px', resize: 'vertical' }}
                                />
                                <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>⚠️ Use um Token Permanente (do System User), não o token temporário de 24h.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button type="button" onClick={() => setStep('guide')} className={styles.btnSecondary} style={{ flex: 1 }} disabled={loading}>← Guia</button>
                                <button type="submit" className={styles.btnPrimary} style={{ flex: 2 }} disabled={loading}>
                                    {loading ? 'Validando e conectando...' : '✓ Conectar WhatsApp'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export function DeleteWhatsAppButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja remover este número? Campanhas associadas a ele podem falhar.')) return;
        setLoading(true);
        try {
            await deleteWhatsAppNumber(id);
        } catch (err) {
            alert('Erro ao remover');
            setLoading(false);
        }
    };

    return (
        <button onClick={handleDelete} disabled={loading} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', padding: 0 }}>
            {loading ? 'Excluindo...' : 'Remover'}
        </button>
    );
}
