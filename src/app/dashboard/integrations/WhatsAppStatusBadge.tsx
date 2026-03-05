'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

/**
 * Verifica o estado REAL da instância na Evolution API (não confia no banco).
 * Estados possíveis: 'open' = conectado, 'connecting' = aguardando scan,
 * 'close' / outros = desconectado.
 */
export function WhatsAppStatusBadge({ instanceName }: { instanceName: string }) {
    const [state, setState] = useState<'checking' | 'open' | 'connecting' | 'closed'>('checking');

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const res = await fetch(`/api/whatsapp/instance?name=${encodeURIComponent(instanceName)}`);
                if (!res.ok) { if (!cancelled) setState('closed'); return; }
                const data = await res.json();
                const raw: string = data?.instance?.state ?? data?.state ?? 'close';
                if (cancelled) return;
                if (raw === 'open') setState('open');
                else if (raw === 'connecting') setState('connecting');
                else setState('closed');
            } catch {
                if (!cancelled) setState('closed');
            }
        };

        check();
        // Revalida a cada 15s para manter o status atualizado
        const iv = setInterval(check, 15_000);
        return () => { cancelled = true; clearInterval(iv); };
    }, [instanceName]);

    if (state === 'checking') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: '#71717a'
            }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3f3f46' }} />
                Verificando...
            </span>
        );
    }

    if (state === 'open') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500,
                color: '#4ade80',
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                padding: '2px 10px', borderRadius: 999,
            }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                Conectado
            </span>
        );
    }

    if (state === 'connecting') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500,
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
                padding: '2px 10px', borderRadius: 999,
            }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s ease-in-out infinite' }} />
                Aguardando
            </span>
        );
    }

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500,
            color: '#f87171',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            padding: '2px 10px', borderRadius: 999,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
            Desconectado
        </span>
    );
}
