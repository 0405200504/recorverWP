'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../dashboard.module.css';

const CRON_SECRET = 'cron-recuperei-2024';

export function TriggerSchedulerButton() {
    const [autoMode, setAutoMode] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [lastResult, setLastResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [manualNumber, setManualNumber] = useState('');
    const [manualMessage, setManualMessage] = useState('Olá! Este é um teste do RecoverWP. Se você recebeu isso, sua conexão está funcionando!');

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const runScheduler = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/scheduler?secret=${CRON_SECRET}`);
            const data = await res.json();
            setLastResult({ ...data, ts: new Date().toLocaleTimeString('pt-BR') });
        } catch {
            setLastResult({ error: 'Falha ao conectar com o agendador', ts: new Date().toLocaleTimeString('pt-BR') });
        } finally {
            setLoading(false);
        }
    };

    const startAutoMode = () => {
        setAutoMode(true);
        setCountdown(30);
        runScheduler();

        intervalRef.current = setInterval(() => {
            runScheduler();
            setCountdown(30);
        }, 30000);

        countdownRef.current = setInterval(() => {
            setCountdown(c => (c <= 1 ? 30 : c - 1));
        }, 1000);
    };

    const stopAutoMode = () => {
        setAutoMode(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const handleManualSend = async () => {
        if (!manualNumber) { alert('Digite um número (com DDD + 55).'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/whatsapp/test-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: manualNumber, message: manualMessage })
            });
            const data = await res.json();
            setLastResult({ ...data, ts: new Date().toLocaleTimeString('pt-BR') });
        } catch {
            setLastResult({ error: 'Erro ao enviar mensagem manual', ts: new Date().toLocaleTimeString('pt-BR') });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-2)',
        borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px',
        padding: '8px 12px', outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
    };

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Ferramentas de Diagnóstico
            </p>

            {/* Auto-Scheduler */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                            {autoMode ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: 7, height: 7, background: '#a3e635', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px rgba(163,230,53,0.6)', animation: 'pulse 2s infinite' }} />
                                    Agendador Ativo — próximo em {countdown}s
                                </span>
                            ) : 'Agendador de Mensagens'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                            {autoMode ? 'Processando dispatches automaticamente a cada 30s' : 'Ativa o processamento contínuo de mensagens agendadas'}
                        </div>
                    </div>
                    <button
                        onClick={autoMode ? stopAutoMode : startAutoMode}
                        disabled={loading && !autoMode}
                        style={{
                            padding: '7px 14px',
                            background: autoMode ? 'rgba(239,68,68,0.1)' : 'rgba(163,230,53,0.1)',
                            border: `1px solid ${autoMode ? 'rgba(239,68,68,0.3)' : 'rgba(163,230,53,0.3)'}`,
                            borderRadius: 'var(--radius-md)',
                            color: autoMode ? '#f87171' : '#a3e635',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap' as const,
                            fontFamily: 'inherit',
                        }}
                    >
                        {autoMode ? 'Pausar' : 'Ativar'}
                    </button>
                </div>
                {!autoMode && (
                    <button
                        onClick={runScheduler}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '7px', background: 'var(--surface-3)',
                            border: '1px solid var(--border-2)', borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        {loading ? 'Processando...' : 'Executar Agora (Manual)'}
                    </button>
                )}
            </div>

            {/* Envio Manual */}
            <button
                onClick={() => setShowManual(!showManual)}
                style={{
                    width: '100%', padding: '8px', background: 'transparent',
                    border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-md)',
                    color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'inherit', marginBottom: '10px',
                }}
            >
                {showManual ? '— Fechar Envio Manual Direto' : '+ Envio Direto de Teste'}
            </button>

            {showManual && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Número (com 55 + DDD)</label>
                        <input type="text" placeholder="5511999999999" value={manualNumber} onChange={e => setManualNumber(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Mensagem</label>
                        <textarea value={manualMessage} onChange={e => setManualMessage(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <button
                        onClick={handleManualSend}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '8px', background: '#a3e635', border: 'none',
                            borderRadius: 'var(--radius-md)', color: '#000', fontSize: '13px',
                            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        {loading ? 'Enviando...' : 'Enviar Agora'}
                    </button>
                </div>
            )}

            {/* Resultado */}
            {lastResult && (
                <div style={{
                    padding: '10px 12px', background: '#0a0a0a',
                    borderRadius: 'var(--radius-md)', border: `1px solid ${lastResult.error ? 'rgba(239,68,68,0.2)' : 'rgba(163,230,53,0.15)'}`,
                    fontSize: '11px', fontFamily: 'monospace',
                }}>
                    <div style={{ marginBottom: '4px', fontWeight: 'bold', color: lastResult.error ? '#f87171' : '#a3e635' }}>
                        {lastResult.error ? '✗ Erro' : '✓ OK'} · {lastResult.ts}
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: lastResult.error ? '#f87171' : '#71717a' }}>
                        {JSON.stringify({ processed: lastResult.processed, sent: lastResult.sent, skipped: lastResult.skipped, failed: lastResult.failed, error: lastResult.error }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
