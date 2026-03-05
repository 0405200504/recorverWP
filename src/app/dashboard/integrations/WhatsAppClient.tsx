'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';
import { addWhatsAppNumber, deleteWhatsAppNumber } from '../actions';

export function AddWhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [phase, setPhase] = useState<'form' | 'loading' | 'qr' | 'connected'>('form');
    const [instanceName, setInstanceName] = useState('');
    const [qrBase64, setQrBase64] = useState('');
    const [error, setError] = useState('');

    const handleClose = () => {
        if (instanceName && phase === 'qr') {
            fetch(`/api/whatsapp/instance?name=${encodeURIComponent(instanceName)}`, { method: 'DELETE' }).catch(() => { });
        }
        setIsOpen(false);
        setPhase('form');
        setQrBase64('');
        setInstanceName('');
        setError('');
    };

    const startConnection = async () => {
        if (!instanceName.trim()) { setError('Digite um nome para a conexão.'); return; }
        setPhase('loading');
        setError('');
        try {
            const res = await fetch('/api/whatsapp/instance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName: instanceName.trim() })
            });
            const data = await res.json();
            if (data?.qrBase64) {
                setQrBase64(data.qrBase64);
                setPhase('qr');
            } else {
                setError(data?.error || 'Não foi possível gerar o QR Code. Tente novamente.');
                setPhase('form');
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
            setPhase('form');
        }
    };

    // Polling de status
    const checkStatus = useCallback(async () => {
        if (!instanceName || phase !== 'qr') return;
        try {
            const res = await fetch(`/api/whatsapp/instance?name=${encodeURIComponent(instanceName)}`);
            const data = await res.json();
            if (data?.instance?.state === 'open') {
                setPhase('connected');
                await addWhatsAppNumber({
                    phoneNumberId: instanceName,
                    wabaId: 'evolution_api',
                    accessToken: instanceName,
                    displayName: data?.instance?.profileName || instanceName
                });
                setTimeout(handleClose, 2500);
            }
        } catch { /* ignora */ }
    }, [instanceName, phase]);

    useEffect(() => {
        if (phase !== 'qr') return;
        const iv = setInterval(checkStatus, 3000);
        return () => clearInterval(iv);
    }, [phase, checkStatus]);

    if (!isOpen) {
        return (
            <button
                onClick={() => { setInstanceName(''); setIsOpen(true); }}
                className={styles.btnPrimary}
                style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /></svg>
                Conectar WhatsApp via QR Code
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '380px', background: '#111111', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>

                {/* ---- FORM ---- */}
                {phase === 'form' && (
                    <>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px', textAlign: 'center' }}>Conectar WhatsApp</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
                            Conecte lendo o QR Code com o celular — simples e rápido!
                        </p>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>
                                {error}
                            </div>
                        )}
                        <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Nome da Conexão</label>
                        <input
                            className={styles.input}
                            value={instanceName}
                            onChange={e => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            placeholder="Ex: meu_whatsapp"
                            style={{ marginBottom: '6px' }}
                        />
                        <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', marginBottom: '20px' }}>Apenas letras, números e _ (sem espaços)</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleClose} className={styles.btnSecondary} style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={startConnection} className={styles.btnPrimary} style={{ flex: 2 }} disabled={!instanceName}>
                                → Gerar QR Code
                            </button>
                        </div>
                    </>
                )}

                {/* ---- LOADING ---- */}
                {phase === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ width: '48px', height: '48px', border: '3px solid #27272a', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                        <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '18px' }}>Gerando QR Code...</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0 }}>Aguarde alguns segundos</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* ---- QR CODE ---- */}
                {phase === 'qr' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>Escaneie com o WhatsApp</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '12px', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
                            WhatsApp → <strong>Aparelhos Conectados</strong> → <strong>Conectar aparelho</strong>
                        </p>
                        <div style={{ width: '210px', height: '210px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', padding: '8px' }}>
                            {qrBase64 ? (
                                <img src={qrBase64} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <p style={{ color: '#000', fontSize: '12px', textAlign: 'center' }}>QR Code carregando...</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                            <span style={{ color: '#a1a1aa', fontSize: '12px' }}>Aguardando leitura...</span>
                        </div>
                        <button onClick={handleClose} style={{ background: 'transparent', border: '1px solid #27272a', borderRadius: '8px', color: '#71717a', padding: '8px 20px', cursor: 'pointer', fontSize: '13px' }}>
                            Cancelar
                        </button>
                    </div>
                )}

                {/* ---- CONNECTED ---- */}
                {phase === 'connected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10b981' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <h3 style={{ margin: 0, color: '#10b981', fontSize: '20px' }}>WhatsApp Conectado!</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', textAlign: 'center', margin: 0 }}>Seu número foi conectado com sucesso.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function DeleteWhatsAppButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
        if (!confirm('Remover este número? Campanhas associadas podem falhar.')) return;
        setLoading(true);
        try { await deleteWhatsAppNumber(id); }
        catch { alert('Erro ao remover'); setLoading(false); }
    };
    return (
        <button onClick={handleDelete} disabled={loading} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', padding: 0 }}>
            {loading ? 'Removendo...' : 'Remover'}
        </button>
    );
}
