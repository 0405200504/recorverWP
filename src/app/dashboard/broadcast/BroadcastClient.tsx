'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

interface WhatsAppNumber {
    id: string;
    phoneNumberId: string;
    displayName: string | null;
}

interface Group {
    id: string;
    subject: string;
    size: number;
}

interface BroadcastStats {
    total: number;
    sent: number;
    failed: number;
    status: 'running' | 'completed' | 'stopped';
    logs: string[];
}

export function BroadcastClient({ whatsappNumbers }: { whatsappNumbers: WhatsAppNumber[] }) {
    const [selectedInstance, setSelectedInstance] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [messageType, setMessageType] = useState<'text' | 'audio'>('text');
    const [content, setContent] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [activeBroadcastId, setActiveBroadcastId] = useState<string | null>(null);
    const [stats, setStats] = useState<BroadcastStats | null>(null);

    // Busca grupos ao selecionar uma instância
    useEffect(() => {
        if (!selectedInstance) {
            setGroups([]);
            return;
        }

        const fetchInstanceGroups = async () => {
            setLoadingGroups(true);
            try {
                const res = await fetch(`/api/whatsapp/groups?instance=${selectedInstance}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setGroups(data.map(g => ({
                        id: g.id,
                        subject: g.subject || g.id,
                        size: g.size || 0
                    })));
                }
            } catch (err) {
                console.error("Erro ao buscar grupos:", err);
            } finally {
                setLoadingGroups(false);
            }
        };

        fetchInstanceGroups();
    }, [selectedInstance]);

    // Polling de status do broadcast ativo
    useEffect(() => {
        if (!activeBroadcastId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/whatsapp/broadcast?id=${activeBroadcastId}`);
                const data = await res.json();
                setStats(data);
                if (data.status === 'completed' || data.status === 'stopped') {
                    setActiveBroadcastId(null);
                    setIsBroadcasting(false);
                }
            } catch (err) {
                console.error("Erro no polling do broadcast:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [activeBroadcastId]);

    const handleStart = async () => {
        if (!selectedInstance || !selectedGroup || !content) {
            alert("Preencha todos os campos");
            return;
        }

        if (!confirm(`Confirmar o disparo para os participantes do grupo selecionado? O processo simulará comportamento humano e levará algum tempo.`)) {
            return;
        }

        setIsBroadcasting(true);
        try {
            const res = await fetch('/api/whatsapp/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instanceName: selectedInstance,
                    groupJid: selectedGroup,
                    messageType,
                    content
                })
            });
            const data = await res.json();
            if (data.broadcastId) {
                setActiveBroadcastId(data.broadcastId);
            } else {
                alert(data.error || "Erro ao iniciar disparo");
                setIsBroadcasting(false);
            }
        } catch (err) {
            alert("Erro de conexão");
            setIsBroadcasting(false);
        }
    };

    const handleStop = async () => {
        if (!activeBroadcastId) return;
        if (!confirm("Deseja interromper o disparo?")) return;

        try {
            await fetch(`/api/whatsapp/broadcast?id=${activeBroadcastId}`, { method: 'DELETE' });
        } catch (err) {
            alert("Erro ao parar disparo");
        }
    };

    return (
        <div className={styles.grid} style={{ gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px' }}>
            <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ marginBottom: '20px' }}>Configurar Disparo</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label className={styles.label}>1. Selecione a Conexão</label>
                        <select 
                            className={styles.input} 
                            value={selectedInstance}
                            onChange={(e) => setSelectedInstance(e.target.value)}
                            disabled={isBroadcasting}
                        >
                            <option value="">Selecione um número conectado...</option>
                            {whatsappNumbers.map(n => (
                                <option key={n.id} value={n.phoneNumberId}>
                                    {n.displayName || n.phoneNumberId}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={styles.label}>2. Selecione o Grupo Origem</label>
                        <select 
                            className={styles.input} 
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            disabled={isBroadcasting || !selectedInstance || loadingGroups}
                        >
                            <option value="">{loadingGroups ? 'Carregando grupos...' : 'Selecione um grupo...'}</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.subject} ({g.size} membros)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={styles.label}>3. Tipo de Mensagem</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setMessageType('text')}
                                className={messageType === 'text' ? styles.btnPrimary : styles.btnSecondary}
                                style={{ flex: 1 }}
                                disabled={isBroadcasting}
                            >
                                Texto
                            </button>
                            <button 
                                onClick={() => setMessageType('audio')}
                                className={messageType === 'audio' ? styles.btnPrimary : styles.btnSecondary}
                                style={{ flex: 1 }}
                                disabled={isBroadcasting}
                            >
                                Áudio (Voz)
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={styles.label}>4. {messageType === 'text' ? 'Conteúdo da Mensagem' : 'URL do Áudio (.mp3)'}</label>
                        {messageType === 'text' ? (
                            <textarea 
                                className={styles.input} 
                                style={{ minHeight: '120px', resize: 'vertical' }}
                                placeholder="Olá! Vi que você está no grupo..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={isBroadcasting}
                            />
                        ) : (
                            <input 
                                className={styles.input}
                                placeholder="https://exemplo.com/audio.mp3"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={isBroadcasting}
                            />
                        )}
                        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
                            Dica: O sistema embaralha os contatos e envia com delays aleatórios (20-60s) para simular uma pessoa real.
                        </p>
                    </div>

                    <button 
                        className={styles.btnPrimary} 
                        style={{ height: '48px', marginTop: '10px' }}
                        onClick={handleStart}
                        disabled={isBroadcasting || !selectedGroup || !content}
                    >
                        {isBroadcasting ? 'Disparo em Andamento...' : 'Iniciar Disparo em Massa'}
                    </button>
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Status do Envio</h2>
                
                {!stats ? (
                    <div className={styles.emptyState} style={{ padding: '40px 0' }}>
                        <p className={styles.emptyStateDesc}>Nenhum disparo ativo no momento.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span className={`${styles.statusBadge} ${stats.status === 'running' ? styles.statusPending : stats.status === 'completed' ? styles.statusActive : styles.statusInactive}`}>
                                {stats.status === 'running' ? 'Processando' : stats.status === 'completed' ? 'Concluído' : 'Interrompido'}
                            </span>
                            {stats.status === 'running' && (
                                <button onClick={handleStop} style={{ color: 'var(--danger)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Parar Tudo
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                            <div style={{ flex: 1, background: 'var(--bg-3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Total</div>
                                <div style={{ fontSize: '20px', fontWeight: 600 }}>{stats.total}</div>
                            </div>
                            <div style={{ flex: 1, background: 'var(--bg-3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-actives)', textTransform: 'uppercase' }}>Enviados</div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-actives)' }}>{stats.sent}</div>
                            </div>
                        </div>

                        <div className={styles.label} style={{ marginBottom: '8px' }}>Logs de Atividade</div>
                        <div style={{ 
                            height: '350px', 
                            background: '#0a0a0a', 
                            borderRadius: '8px', 
                            padding: '12px', 
                            fontFamily: 'monospace', 
                            fontSize: '11px', 
                            overflowY: 'auto',
                            color: '#00ff00',
                            border: '1px solid #1a1a1a'
                        }}>
                            {stats.logs.map((log, i) => (
                                <div key={i} style={{ marginBottom: '4px', opacity: i === stats.logs.length - 1 ? 1 : 0.7 }}>
                                    {log}
                                </div>
                            ))}
                            <div id="logs-end" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
