'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';
import { addWhatsAppNumber, deleteWhatsAppNumber } from '../actions';

export function AddWhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'qr' | 'connected'>('form');
    const [instanceName, setInstanceName] = useState('');
    const [qrCodeBase64, setQrCodeBase64] = useState('');
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);

    // Gera o nome da instância baseado na data
    const generateInstanceName = () => `recuperei_${Date.now()}`;

    const startConnection = async () => {
        if (!instanceName.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/whatsapp/instance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName: instanceName.trim() })
            });
            const data = await res.json();

            // Extrai o QR Code da resposta
            const qr = data?.qrcode?.base64 || data?.qr?.base64 || data?.base64;
            if (qr) {
                setQrCodeBase64(qr);
                setStep('qr');
                setPolling(true);
            } else {
                setError('Não foi possível gerar o QR Code. Tente outro nome de instância.');
            }
        } catch (err: any) {
            setError('Erro ao conectar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Polling para verificar se o WhatsApp foi conectado
    const checkConnectionStatus = useCallback(async () => {
        if (!instanceName || !polling) return;
        try {
            const res = await fetch(`/api/whatsapp/instance?name=${encodeURIComponent(instanceName)}`);
            const data = await res.json();
            const state = data?.instance?.state || data?.state;

            if (state === 'open') {
                // Conectado! Salva no banco
                setPolling(false);
                setStep('connected');
                await addWhatsAppNumber({
                    phoneNumberId: instanceName,
                    wabaId: 'evolution_api',
                    accessToken: instanceName,
                    displayName: data?.instance?.profileName || instanceName
                });
                setTimeout(() => {
                    setIsOpen(false);
                    setStep('form');
                    setQrCodeBase64('');
                    setInstanceName('');
                }, 2000);
            } else if (state === 'connecting' || state === 'close') {
                // Ainda aguardando — busca novo QR se necessário
                const qrRes = await fetch(`/api/whatsapp/instance/qr?name=${encodeURIComponent(instanceName)}`);
                const qrData = await qrRes.json();
                const newQr = qrData?.qrcode?.base64 || qrData?.base64;
                if (newQr && newQr !== qrCodeBase64) setQrCodeBase64(newQr);
            }
        } catch { /* ignora erros de polling */ }
    }, [instanceName, polling, qrCodeBase64]);

    useEffect(() => {
        if (!polling) return;
        const interval = setInterval(checkConnectionStatus, 3000);
        return () => clearInterval(interval);
    }, [polling, checkConnectionStatus]);

    const handleClose = async () => {
        setPolling(false);
        if (instanceName && step === 'qr') {
            // Limpa instância não conectada
            fetch(`/api/whatsapp/instance?name=${encodeURIComponent(instanceName)}`, { method: 'DELETE' }).catch(() => { });
        }
        setIsOpen(false);
        setStep('form');
        setQrCodeBase64('');
        setInstanceName('');
        setError('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => { setInstanceName(generateInstanceName()); setIsOpen(true); }}
                className={styles.btnPrimary}
                style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /></svg>
                Conectar WhatsApp via QR Code
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '400px', background: '#111111', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.6)' }}>

                {step === 'form' && (
                    <>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px', textAlign: 'center' }}>Conectar WhatsApp</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6' }}>
                            Conecte seu WhatsApp lendo o QR Code com o celular. É simples e rápido!
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Nome da Conexão</label>
                            <input
                                className={styles.input}
                                value={instanceName}
                                onChange={e => setInstanceName(e.target.value)}
                                placeholder="Ex: meu_whatsapp_vendas"
                            />
                            <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Use apenas letras, números e underscore (_)</p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleClose} className={styles.btnSecondary} style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={startConnection} className={styles.btnPrimary} style={{ flex: 2 }} disabled={loading || !instanceName}>
                                {loading ? 'Gerando QR Code...' : '→ Gerar QR Code'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'qr' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px' }}>Escaneie o QR Code</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>
                            Abra o WhatsApp → <strong>Aparelhos Conectados</strong> → <strong>Conectar aparelho</strong> → aponte a câmera
                        </p>

                        <div style={{ width: '220px', height: '220px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', padding: '8px' }}>
                            {qrCodeBase64 ? (
                                <img src={qrCodeBase64} alt="QR Code WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ color: '#000', textAlign: 'center', fontSize: '13px' }}>Carregando QR Code...</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ color: '#a1a1aa', fontSize: '13px' }}>Aguardando leitura do QR Code...</span>
                        </div>

                        <button onClick={handleClose} style={{ background: 'transparent', border: '1px solid #27272a', borderRadius: '8px', color: '#a1a1aa', padding: '8px 24px', cursor: 'pointer', fontSize: '13px' }}>
                            Cancelar
                        </button>
                    </div>
                )}

                {step === 'connected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10b981' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <h3 style={{ margin: 0, color: '#10b981', fontSize: '20px' }}>WhatsApp Conectado!</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', textAlign: 'center', margin: 0 }}>Seu WhatsApp foi conectado com sucesso. Fechando...</p>
                    </div>
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
        } catch {
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
