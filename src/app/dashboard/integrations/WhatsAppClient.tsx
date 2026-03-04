'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { addWhatsAppNumber, deleteWhatsAppNumber } from '../actions';
import QRCode from 'react-qr-code';

export function AddWhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Info, 2: QR Code
    const [antiBanEnabled, setAntiBanEnabled] = useState(true);

    const handleConnect = async () => {
        setLoading(true);
        // Simulando a conexão via QR Code
        setTimeout(async () => {
            try {
                // Mockando o salvamento no banco como se o QR Code tivesse sido lido
                await addWhatsAppNumber({
                    phoneNumberId: 'session_' + Math.floor(Math.random() * 10000),
                    wabaId: 'qr_code_connection',
                    accessToken: 'anti_ban_active:' + antiBanEnabled,
                    displayName: 'Meu WhatsApp'
                });
                setIsOpen(false);
                setStep(1);
            } catch (err) {
                alert('Erro ao conectar WhatsApp');
            } finally {
                setLoading(false);
            }
        }, 3000);
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className={styles.btnPrimary} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
                Conectar WhatsApp
            </button>
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '450px', background: '#111111', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>

                {step === 1 && (
                    <>
                        <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '20px', textAlign: 'center' }}>Conectar via QR Code</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '14px', textAlign: 'center', marginBottom: '24px', lineHeight: '1.5' }}>
                            Conecte seu aparelho celular lendo o QR Code. Para evitar o bloqueio (banimento) do seu número, desenvolvemos um motor Anti-Ban automático.
                        </p>

                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#fff', fontWeight: '500', fontSize: '15px' }}>🛡️ Escudo Anti-Ban</span>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={antiBanEnabled} onChange={(e) => setAntiBanEnabled(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }} />
                                </label>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#a1a1aa', fontSize: '13px', lineHeight: '1.6' }}>
                                <li>Simulação humana de digitação ("gravando áudio...", "digitando...")</li>
                                <li>Pausa aleatória entre 5s a 15s antes de cada envio</li>
                                <li>Spintax (variações nas saudações: "Oi", "Olá", "Opa")</li>
                            </ul>
                            <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#f59e0b' }}>
                                * Recomendado manter ATIVADO para números novos.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setIsOpen(false)} className={styles.btnSecondary} style={{ flex: 1, padding: '12px' }}>Cancelar</button>
                            <button onClick={() => setStep(2)} className={styles.btnPrimary} style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff' }}>Gerar QR Code</button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '20px' }}>Escaneie o QR Code</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                            Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera para a tela.
                        </p>

                        <div style={{ width: '220px', height: '220px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', padding: '16px' }}>
                            {loading ? (
                                <div style={{ color: '#000', fontWeight: 'bold' }}>Conectando...</div>
                            ) : (
                                <QRCode value="2@WnK3K9zRQY/L+wYx7Y7+ZlQ==,E/J+YlQ==,oRQY/L+wYx7Y7+ZlQ==" size={180} />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button onClick={() => setStep(1)} className={styles.btnSecondary} style={{ flex: 1 }} disabled={loading}>Voltar</button>
                            <button onClick={handleConnect} className={styles.btnPrimary} style={{ flex: 2, background: loading ? '#3f3f46' : '#10b981' }} disabled={loading}>
                                {loading ? 'Aguardando leitura...' : 'Já escaneei o QR Code'}
                            </button>
                        </div>
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
