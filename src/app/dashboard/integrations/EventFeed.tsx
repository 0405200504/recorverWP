'use client';

import { useState, useEffect } from 'react';

const EVENT_LABELS: Record<string, string> = {
    pix_generated: '💸 Pix Gerado',
    boleto_generated: '📄 Boleto Gerado',
    card_pending: '💳 Cartão Pendente',
    card_declined: '❌ Cartão Recusado',
    checkout_started: '🛒 Checkout Iniciado',
    checkout_abandoned: '🚪 Checkout Abandonado',
    order_created: '📦 Pedido Criado',
    payment_failed: '⚠️ Pagamento Falhou',
    payment_approved: '✅ Pagamento Aprovado',
    refunded: '↩️ Reembolso',
};

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `${min}m atrás`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
}

export function EventFeed() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastCount, setLastCount] = useState(0);
    const [flash, setFlash] = useState(false);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events/recent');
            const data = await res.json();
            if (Array.isArray(data)) {
                if (data.length > lastCount && lastCount > 0) {
                    setFlash(true);
                    setTimeout(() => setFlash(false), 2000);
                }
                setLastCount(data.length);
                setEvents(data);
            }
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
        const iv = setInterval(fetchEvents, 10000); // atualiza a cada 10s
        return () => clearInterval(iv);
    }, []);

    return (
        <div style={{
            background: flash ? '#0a1f0a' : '#0a0a0a',
            border: `1px solid ${flash ? '#16a34a' : '#27272a'}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            transition: 'all 0.5s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 6px #16a34a' }}></span>
                    Feed de Eventos em Tempo Real
                </h3>
                <span style={{ fontSize: '11px', color: '#52525b' }}>atualiza a cada 10s</span>
            </div>

            {loading && <p style={{ color: '#52525b', fontSize: '13px', margin: 0 }}>Carregando eventos...</p>}

            {!loading && events.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ color: '#52525b', fontSize: '13px', margin: '0 0 4px' }}>Nenhum evento recebido ainda.</p>
                    <p style={{ color: '#3f3f46', fontSize: '12px', margin: 0 }}>
                        Configure o webhook abaixo e dispare um evento de teste na sua plataforma.
                    </p>
                </div>
            )}

            {events.map((ev, i) => (
                <div key={ev.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: i === 0 && flash ? '#052e16' : '#111',
                    borderRadius: '8px',
                    marginBottom: '6px',
                    border: '1px solid #1c1c1f',
                    transition: 'background 0.5s ease',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#e4e4e7' }}>
                            {EVENT_LABELS[ev.eventType] || ev.eventType}
                        </span>
                        <span style={{ fontSize: '12px', color: '#71717a' }}>
                            {ev.leadName || ev.leadPhone} · R${ev.amount?.toFixed(2)} · {ev.provider}
                        </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#52525b', whiteSpace: 'nowrap' }}>{timeAgo(ev.createdAt)}</span>
                </div>
            ))}
        </div>
    );
}
