'use client';

import { useState } from 'react';
import { stopRun, deleteRun } from '../actions';

export function StopRunButton({ id, currentStatus }: { id: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false);

    if (currentStatus === 'stopped' || currentStatus === 'completed') return null;

    const handleStop = async () => {
        if (!confirm('Deseja parar os disparos dessa recuperação imediatamente?')) return;
        setLoading(true);
        try {
            await stopRun(id);
        } catch (err) {
            alert('Erro ao parar');
            setLoading(false);
        }
    };

    return (
        <button onClick={handleStop} disabled={loading} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#f59e0b', fontSize: '12px', padding: 0, marginRight: '8px' }}>
            {loading ? '...' : 'Pausar'}
        </button>
    );
}

export function DeleteRunButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Excluir o histórico dessa recuperação pra sempre?')) return;
        setLoading(true);
        try {
            await deleteRun(id);
        } catch (err) {
            alert('Erro ao remover');
            setLoading(false);
        }
    };

    return (
        <button onClick={handleDelete} disabled={loading} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', padding: 0 }}>
            {loading ? '...' : 'Excluir'}
        </button>
    );
}
