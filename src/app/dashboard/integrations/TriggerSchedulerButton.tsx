'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';

export function TriggerSchedulerButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleTrigger = async () => {
        setLoading(true);
        setResult(null);
        try {
            // Usa o secret padrão e força o processamento imediato (parâmetro force=true)
            const res = await fetch('/api/scheduler?secret=cron-recuperei-2024&force=true');
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ error: 'Erro ao conectar com o scheduler' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '24px', borderTop: '1px solid #27272a', paddingTop: '24px' }}>
            <h4 style={{ color: '#fff', fontSize: '14px', margin: '0 0 8px 0' }}>Ferramenta de Diagnóstico</h4>
            <p style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '16px' }}>
                Se você acabou de enviar um webhook de teste, clique no botão abaixo para forçar o sistema a processar e enviar as mensagens agendadas imediatamente.
            </p>

            <button
                onClick={handleTrigger}
                disabled={loading}
                className={styles.btnPrimary}
                style={{
                    background: '#3f3f46',
                    fontSize: '13px',
                    padding: '8px 16px',
                    borderColor: '#52525b'
                }}
            >
                {loading ? 'Processando...' : '⚡ Forçar Disparo Manual'}
            </button>

            {result && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#000',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: result.error ? '#ef4444' : '#10b981'
                }}>
                    <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                        {result.error ? '❌ Falha' : '✅ Resultado do Processamento:'}
                    </div>
                    <pre style={{ margin: 0, whitespace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
