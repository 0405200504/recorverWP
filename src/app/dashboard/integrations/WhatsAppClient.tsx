'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';
import { addWhatsAppNumber, deleteWhatsAppNumber } from '../actions';

export function AddWhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [phase, setPhase] = useState<'credentials' | 'loading' | 'qr' | 'connected'>('credentials');
    const [instanceId, setInstanceId] = useState('');
    const [token, setToken] = useState('');
    const [qrBase64, setQrBase64] = useState('');
    const [error, setError] = useState('');

    const handleClose = () => {
        setIsOpen(false);
        setPhase('credentials');
        setQrBase64('');
        setError('');
    };

    const loadQR = async () => {
        if (!instanceId.trim() || !token.trim()) { setError('Preencha ambos os campos.'); return; }
        setPhase('loading');
        setError('');
        try {
            const res = await fetch('/api/whatsapp/instance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceId: instanceId.trim(), token: token.trim() })
            });
            const data = await res.json();
            if (data?.qrBase64) {
                setQrBase64(data.qrBase64);
                setPhase('qr');
            } else {
                setError(data?.error || 'Erro ao carregar QR Code. Verifique as credenciais.');
                setPhase('credentials');
            }
        } catch {
            setError('Erro de rede. Tente novamente.');
            setPhase('credentials');
        }
    };

    const checkStatus = useCallback(async () => {
        if (phase !== 'qr' || !instanceId || !token) return;
        try {
            const res = await fetch(`/api/whatsapp/instance?instanceId=${instanceId}&token=${token}`);
            const data = await res.json();
            // Z-API: connected = true quando conectado
            if (data?.connected === true || data?.status === 'connected') {
                setPhase('connected');
                await addWhatsAppNumber({
                    phoneNumberId: instanceId,
                    wabaId: 'zapi',
                    accessToken: token,
                    displayName: data?.phone || instanceId
                });
                setTimeout(handleClose, 2500);
            } else if (phase === 'qr') {
                // Atualiza QR periodicamente (Z-API expira em ~20s)
                const qrRes = await fetch('/api/whatsapp/instance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceId, token })
                });
                const qrData = await qrRes.json();
                if (qrData?.qrBase64 && qrData.qrBase64 !== qrBase64) setQrBase64(qrData.qrBase64);
            }
        } catch { /* ignora */ }
    }, [phase, instanceId, token, qrBase64]);

    useEffect(() => {
        if (phase !== 'qr') return;
        const iv = setInterval(checkStatus, 5000);
        return () => clearInterval(iv);
    }, [phase, checkStatus]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={styles.btnPrimary}
                style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /></svg>
                Conectar WhatsApp via QR Code
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 420, background: '#111', borderRadius: 16, border: '1px solid #27272a', padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>

                {phase === 'credentials' && (
                    <>
                        <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: 20, textAlign: 'center' }}>Conectar WhatsApp</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 13, textAlign: 'center', marginBottom: 6, lineHeight: 1.6 }}>
                            Usando <strong style={{ color: '#a3e635' }}>Z-API</strong> — o líder de WhatsApp no Brasil.
                        </p>
                        <a href="https://z-api.io" target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#60a5fa', marginBottom: 20, textDecoration: 'underline' }}>
                            Crie sua conta gratuita em z-api.io →
                        </a>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>
                                {error}
                            </div>
                        )}

                        <label style={{ display: 'block', fontSize: 12, color: '#a1a1aa', marginBottom: 5 }}>Instance ID (Z-API)</label>
                        <input
                            className={styles.input} value={instanceId} placeholder="Ex: 3C8A4AA..."
                            onChange={e => setInstanceId(e.target.value)} style={{ marginBottom: 12 }}
                        />
                        <label style={{ display: 'block', fontSize: 12, color: '#a1a1aa', marginBottom: 5 }}>Token (Z-API)</label>
                        <input
                            className={styles.input} value={token} placeholder="Ex: F5BC4D8A..."
                            onChange={e => setToken(e.target.value)} style={{ marginBottom: 20 }}
                        />

                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
                            <p style={{ color: '#a1a1aa', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                <strong style={{ color: '#fff' }}>Como obter:</strong><br />
                                1. Acesse z-api.io → Criar conta gratuita<br />
                                2. Clique em <strong>"Nova Instância"</strong><br />
                                3. Copie o <strong>Instance ID</strong> e o <strong>Token</strong>
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={handleClose} className={styles.btnSecondary} style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={loadQR} className={styles.btnPrimary} style={{ flex: 2 }} disabled={!instanceId || !token}>
                                → Gerar QR Code
                            </button>
                        </div>
                    </>
                )}

                {phase === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ width: 40, height: 40, border: '3px solid #27272a', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: '#a1a1aa', fontSize: 13, margin: 0 }}>Carregando QR Code...</p>
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                )}

                {phase === 'qr' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 18 }}>Escaneie com o WhatsApp</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 12, textAlign: 'center', margin: '0 0 16px', lineHeight: 1.5 }}>
                            WhatsApp → <strong>Aparelhos Conectados</strong> → <strong>Conectar aparelho</strong>
                        </p>
                        <div style={{ width: 220, height: 220, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: 8 }}>
                            {qrBase64
                                ? <img src={qrBase64} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                : <p style={{ color: '#000', fontSize: 12 }}>Carregando...</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                            <span style={{ color: '#a1a1aa', fontSize: 12 }}>Aguardando escaneamento...</span>
                        </div>
                        <button onClick={handleClose} style={{ background: 'transparent', border: '1px solid #27272a', borderRadius: 8, color: '#71717a', padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                    </div>
                )}

                {phase === 'connected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                        <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10b981' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <h3 style={{ margin: 0, color: '#10b981', fontSize: 20 }}>WhatsApp Conectado!</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 13, textAlign: 'center', margin: 0 }}>Número conectado com sucesso.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function DeleteWhatsAppButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
        if (!confirm('Remover este número?')) return;
        setLoading(true);
        try { await deleteWhatsAppNumber(id); }
        catch { alert('Erro ao remover'); setLoading(false); }
    };
    return (
        <button onClick={handleDelete} disabled={loading} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444', fontSize: 12, padding: 0 }}>
            {loading ? 'Removendo...' : 'Remover'}
        </button>
    );
}
