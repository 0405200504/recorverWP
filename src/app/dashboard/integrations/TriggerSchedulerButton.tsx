'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';

export function TriggerSchedulerButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Estados para o teste manual
    const [showManual, setShowManual] = useState(false);
    const [manualNumber, setManualNumber] = useState('');
    const [manualMessage, setManualMessage] = useState('Olá! Este é um teste do RecupereiWP. Se você recebeu isso, sua conexão está funcionando! 🚀');

    const handleTrigger = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/scheduler?secret=cron-recuperei-2024&force=true');
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ error: 'Erro ao conectar com o agendador de mensagens.' });
        } finally {
            setLoading(false);
        }
    };

    const handleManualSend = async () => {
        if (!manualNumber) {
            alert('Por favor, digite um número de WhatsApp (com DDD).');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/whatsapp/test-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: manualNumber,
                    message: manualMessage
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ error: 'Erro ao enviar mensagem manual.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '24px', borderTop: '1px solid #27272a', paddingTop: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '14px', margin: '0 0 8px 0' }}>Ferramentas de Teste Integrado</h4>
            <p style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '16px' }}>
                Use estas ferramentas para validar se sua conta está disparando mensagens corretamente.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                    onClick={handleTrigger}
                    disabled={loading}
                    className={styles.btnPrimary}
                    style={{
                        background: '#18181b',
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderColor: '#27272a',
                        flex: 1
                    }}
                >
                    {loading ? 'Processando...' : '⚡ Processar Agendados'}
                </button>

                <button
                    onClick={() => setShowManual(!showManual)}
                    className={styles.btnPrimary}
                    style={{
                        background: showManual ? '#16a34a' : '#3f3f46',
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderColor: showManual ? '#22c55e' : '#52525b',
                        flex: 1
                    }}
                >
                    {showManual ? 'Fechar Teste Direto' : '📱 Envio Manual Direto'}
                </button>
            </div>

            {showManual && (
                <div style={{
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                }}>
                    <label style={{ display: 'block', color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>Número (com DDD + 55):</label>
                    <input
                        type="text"
                        placeholder="Ex: 5511999999999"
                        value={manualNumber}
                        onChange={(e) => setManualNumber(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '13px',
                            padding: '8px',
                            marginBottom: '10px'
                        }}
                    />

                    <label style={{ display: 'block', color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>Mensagem de Teste:</label>
                    <textarea
                        value={manualMessage}
                        onChange={(e) => setManualMessage(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '13px',
                            padding: '8px',
                            height: '60px',
                            marginBottom: '10px',
                            resize: 'none'
                        }}
                    />

                    <button
                        onClick={handleManualSend}
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Enviando...' : '🚀 Enviar Mensagem Agora'}
                    </button>
                </div>
            )}

            {result && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: result.error ? '#ef4444' : '#10b981'
                }}>
                    <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                        {result.error ? '❌ Falha no Teste' : '✅ Resultado do Processamento'}
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
