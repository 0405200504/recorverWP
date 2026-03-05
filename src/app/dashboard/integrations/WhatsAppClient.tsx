'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';
import { addWhatsAppNumber, deleteWhatsAppNumber } from '../actions';

export function AddWhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [phase, setPhase] = useState<'form' | 'loading' | 'qr' | 'connected'>('form');
    const [sessionName, setSessionName] = useState('');
    const [qrBase64, setQrBase64] = useState('');
    const [error, setError] = useState('');

    const handleClose = () => {
        if (sessionName && phase === 'qr') {
            fetch(`/api/whatsapp/instance?name=${encodeURIComponent(sessionName)}`, { method: 'DELETE' }).catch(() => { });
        }
        setIsOpen(false);
        setPhase('form');
        setQrBase64('');
        setError('');
    };

    const startQR = async () => {
        if (!sessionName.trim()) { setError('Digite um nome para a sessão.'); return; }
        setPhase('loading');
        setError('');
        try {
            const res = await fetch('/api/whatsapp/instance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionName: sessionName.trim() })
            });
            const data = await res.json();
            if (data?.qrBase64) {
                setQrBase64(data.qrBase64);
                setPhase('qr');
            } else {
                setError(data?.error || 'Não foi possível gerar QR Code. Tente novamente.');
                setPhase('form');
            }
        } catch {
            setError('Erro de rede. Verifique sua conexão e tente novamente.');
            setPhase('form');
        }
    };

    const checkStatus = useCallback(async () => {
        if (phase !== 'qr' || !sessionName) return;
        try {
            const res = await fetch(`/api/whatsapp/instance?name=${encodeURIComponent(sessionName)}`);
            const data = await res.json();
            // WAHA: status = WORKING quando conectado
            if (data?.status === 'WORKING') {
                setPhase('connected');
                await addWhatsAppNumber({
                    phoneNumberId: sessionName,
                    wabaId: 'waha',
                    accessToken: sessionName,
                    displayName: data?.me?.pushname || sessionName
                });
                setTimeout(handleClose, 2500);
            } else if (data?.status === 'SCAN_QR_CODE' || data?.status === 'STARTING') {
                // Tenta renovar o QR Code
                const qrRes = await fetch('/api/whatsapp/instance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionName })
                });
                const qrData = await qrRes.json();
                if (qrData?.qrBase64 && qrData.qrBase64 !== qrBase64) setQrBase64(qrData.qrBase64);
            }
        } catch { /* ignora */ }
    }, [phase, sessionName, qrBase64]);

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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                </svg>
                Conectar WhatsApp via QR Code
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 400, background: '#111', borderRadius: 16, border: '1px solid #27272a', padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>

                {phase === 'form' && (
                    <>
                        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 20, textAlign: 'center' }}>Conectar WhatsApp</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                            Escaneie o QR Code com seu WhatsApp para conectar.
                        </p>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>
                                {error}
                            </div>
                        )}
                        <label style={{ display: 'block', fontSize: 12, color: '#a1a1aa', marginBottom: 5 }}>Nome da sessão</label>
                        <input
                            className={styles.input}
                            value={sessionName}
                            onChange={e => setSessionName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                            placeholder="Ex: minha_empresa"
                            style={{ marginBottom: 6 }}
                        />
                        <p style={{ fontSize: 11, color: '#71717a', marginBottom: 20, marginTop: 4 }}>Apenas letras, números, _ e -</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={handleClose} className={styles.btnSecondary} style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={startQR} className={styles.btnPrimary} style={{ flex: 2 }} disabled={!sessionName}>
                                → Gerar QR Code
                            </button>
                        </div>
                    </>
                )}

                {phase === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ width: 44, height: 44, border: '3px solid #27272a', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: 18 }}>Gerando QR Code...</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 13, margin: 0 }}>Aguarde alguns segundos</p>
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
                                ? <img src={qrBase64} alt="QR Code WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                : <p style={{ color: '#000', fontSize: 12, textAlign: 'center' }}>Carregando QR...</p>
                            }
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                            <span style={{ color: '#a1a1aa', fontSize: 12 }}>Aguardando escaneamento...</span>
                        </div>
                        <button onClick={handleClose} style={{ background: 'transparent', border: '1px solid #27272a', borderRadius: 8, color: '#71717a', padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>
                            Cancelar
                        </button>
                    </div>
                )}

                {phase === 'connected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                        <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10b981' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h3 style={{ margin: 0, color: '#10b981', fontSize: 20 }}>WhatsApp Conectado!</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 13, textAlign: 'center', margin: 0 }}>Seu WhatsApp foi conectado com sucesso!</p>
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
