'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import { addCampaign, deleteCampaign, updateCampaign } from '../actions';

// Gatilhos disponíveis para campanhas de recuperação
const TRIGGER_OPTIONS = [
    { value: 'pix_generated', label: 'Pix Gerado', desc: 'Dispara quando o Pix é gerado mas não pago' },
    { value: 'boleto_generated', label: 'Boleto Gerado', desc: 'Dispara quando o boleto é emitido mas não pago' },
    { value: 'card_pending', label: 'Cartão Pendente', desc: 'Dispara quando o cartão está em análise/pendente' },
    { value: 'card_declined', label: 'Cartão Recusado', desc: 'Dispara quando o cartão é recusado/negado' },
    { value: 'checkout_started', label: 'Checkout Iniciado', desc: 'Dispara quando o usuário inicia o checkout' },
    { value: 'checkout_abandoned', label: 'Checkout Abandonado', desc: 'Dispara quando o usuário abandona o checkout' },
    { value: 'order_created', label: 'Pedido Criado', desc: 'Dispara quando um pedido é criado no sistema' },
    { value: 'payment_failed', label: 'Pagamento Falhou', desc: 'Dispara quando qualquer pagamento falha' },
    { value: 'subscription_expired', label: 'Assinatura Expirada', desc: 'Dispara quando uma assinatura expira sem renovação' },
    { value: 'refund_requested', label: 'Reembolso Solicitado', desc: 'Dispara quando cliente pede reembolso' },
];

export function AddCampaignButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [triggerEvent, setTriggerEvent] = useState('pix_generated');
    const [delayMinutes, setDelayMinutes] = useState('10');
    const [messageType, setMessageType] = useState<'text' | 'audio'>('text');
    const [textContent, setTextContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');

    const handleAdd = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addCampaign({
                name,
                triggerEvent,
                delayMinutes: parseInt(delayMinutes),
                messageType,
                textContent: messageType === 'text' ? textContent : '',
                mediaUrl: messageType === 'audio' ? mediaUrl : ''
            });
            setIsOpen(false);
            setName('');
            setTextContent('');
            setMediaUrl('');
            setTriggerEvent('pix_generated');
        } catch (err) {
            alert('Erro ao criar campanha');
        } finally {
            setLoading(false);
        }
    };

    const selectedTrigger = TRIGGER_OPTIONS.find(t => t.value === triggerEvent);

    if (!isOpen) {
        return <button onClick={() => setIsOpen(true)} className={styles.btnPrimary}>+ Nova Campanha</button>;
    }

    return (
        <>
            {/* Overlay */}
            <div
                onClick={() => !loading && setIsOpen(false)}
                style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 40,
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
                width: '100%',
                maxWidth: '640px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1f1f1f',
                borderRadius: '16px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 28px 20px',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#a3e635', textTransform: 'uppercase', marginBottom: '6px' }}>Nova Campanha</p>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.025em' }}>Configurar Automação</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => !loading && setIsOpen(false)}
                        style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}
                    >✕</button>
                </div>

                <form onSubmit={handleAdd} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '0' }}>

                    {/* Seção 1 — Identificação */}
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#52525b', textTransform: 'uppercase', marginBottom: '14px' }}>Identificação</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>Nome da Campanha</label>
                            <input
                                required
                                placeholder="Ex: Recuperação Pix — 10 min"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={{
                                    height: '42px',
                                    background: '#111111',
                                    border: '1px solid #262626',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    padding: '0 14px',
                                    outline: 'none',
                                    width: '100%',
                                    transition: 'border-color 0.15s',
                                    fontFamily: 'inherit',
                                }}
                                onFocus={e => e.target.style.borderColor = '#a3e635'}
                                onBlur={e => e.target.style.borderColor = '#262626'}
                            />
                        </div>
                    </div>

                    {/* Divisor */}
                    <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '24px' }} />

                    {/* Seção 2 — Disparo (grid 2 colunas) */}
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#52525b', textTransform: 'uppercase', marginBottom: '14px' }}>Disparo</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / span 2' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>Gatilho</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={triggerEvent}
                                        onChange={e => setTriggerEvent(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '42px',
                                            background: '#111111',
                                            border: '1px solid #262626',
                                            borderRadius: '10px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            padding: '0 40px 0 14px',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {TRIGGER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value} style={{ background: '#111' }}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none', fontSize: '12px' }}>▾</span>
                                </div>
                                {selectedTrigger && (
                                    <p style={{ fontSize: '12px', color: '#52525b', margin: '4px 0 0', lineHeight: 1.5 }}>{selectedTrigger.desc}</p>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>Atraso (min)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    placeholder="10"
                                    value={delayMinutes}
                                    onChange={e => setDelayMinutes(e.target.value)}
                                    style={{
                                        height: '42px',
                                        background: '#111111',
                                        border: '1px solid #262626',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        padding: '0 14px',
                                        outline: 'none',
                                        width: '100%',
                                        fontFamily: 'inherit',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#a3e635'}
                                    onBlur={e => e.target.style.borderColor = '#262626'}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>Formato</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={messageType}
                                        onChange={e => setMessageType(e.target.value as any)}
                                        style={{
                                            width: '100%',
                                            height: '42px',
                                            background: '#111111',
                                            border: '1px solid #262626',
                                            borderRadius: '10px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            padding: '0 40px 0 14px',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        <option value="text" style={{ background: '#111' }}>Texto</option>
                                        <option value="audio" style={{ background: '#111' }}>Áudio (URL)</option>
                                    </select>
                                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none', fontSize: '12px' }}>▾</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divisor */}
                    <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '24px' }} />

                    {/* Seção 3 — Mensagem */}
                    <div style={{ marginBottom: '28px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#52525b', textTransform: 'uppercase', marginBottom: '14px' }}>Mensagem</p>
                        {messageType === 'text' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>Conteúdo</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder={'Oi {{nome}}! Seu pagamento não foi finalizado. Clique aqui: {{link}}'}
                                    value={textContent}
                                    onChange={e => setTextContent(e.target.value)}
                                    style={{
                                        background: '#111111',
                                        border: '1px solid #262626',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        padding: '12px 14px',
                                        outline: 'none',
                                        resize: 'vertical',
                                        lineHeight: 1.6,
                                        fontFamily: 'inherit',
                                        width: '100%',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#a3e635'}
                                    onBlur={e => e.target.style.borderColor = '#262626'}
                                />
                                <p style={{ fontSize: '11px', color: '#3f3f46', marginTop: '6px' }}>Variáveis: {'{{nome}}'} · {'{{produto}}'} · {'{{link}}'}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>URL do Áudio</label>
                                <input
                                    required
                                    type="url"
                                    placeholder="https://cdn.seusite.com/audio.mp3"
                                    value={mediaUrl}
                                    onChange={e => setMediaUrl(e.target.value)}
                                    style={{
                                        height: '42px',
                                        background: '#111111',
                                        border: '1px solid #262626',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        padding: '0 14px',
                                        outline: 'none',
                                        width: '100%',
                                        fontFamily: 'inherit',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#a3e635'}
                                    onBlur={e => e.target.style.borderColor = '#262626'}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'flex-end',
                        paddingTop: '4px',
                        borderTop: '1px solid #1a1a1a',
                    }}>
                        <button
                            type="button"
                            onClick={() => !loading && setIsOpen(false)}
                            disabled={loading}
                            style={{
                                height: '40px',
                                padding: '0 20px',
                                background: 'transparent',
                                border: '1px solid #262626',
                                borderRadius: '10px',
                                color: '#71717a',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#3f3f46'; (e.target as HTMLButtonElement).style.color = '#a1a1aa'; }}
                            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#262626'; (e.target as HTMLButtonElement).style.color = '#71717a'; }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                height: '40px',
                                padding: '0 24px',
                                background: loading ? '#52522a' : '#a3e635',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#000000',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {loading ? 'Salvando...' : 'Criar Campanha'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export function DeleteCampaignButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Excluir esta campanha apagará também as regras dela. Continuar?')) return;
        setLoading(true);
        try {
            await deleteCampaign(id);
        } catch (err) {
            alert('Erro ao remover');
            setLoading(false);
        }
    };

    return (
        <button onClick={handleDelete} disabled={loading} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', padding: 0 }}>
            {loading ? '...' : 'Excluir'}
        </button>
    );
}

export function EditCampaignButton({ id, name, triggerEvent, delayMinutes, messageType, textContent, mediaUrl }: {
    id: string; name: string; triggerEvent: string; delayMinutes: number;
    messageType: string; textContent: string; mediaUrl: string;
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name, triggerEvent, delayMinutes, messageType, textContent, mediaUrl
    });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateCampaign(id, form);
            setIsOpen(false);
            router.refresh();
        } catch { alert('Erro ao salvar'); }
        finally { setLoading(false); }
    };

    if (!isOpen) return (
        <button onClick={() => setIsOpen(true)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #3f3f46', color: '#a1a1aa', fontSize: '13px', padding: '4px 10px', borderRadius: 6 }}>
            Editar
        </button>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <form onSubmit={handleSubmit} style={{ background: '#111', border: '1px solid #27272a', borderRadius: 16, padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>✏️ Editar Campanha</h2>

                <div>
                    <label style={{ color: '#a1a1aa', fontSize: 13, display: 'block', marginBottom: 6 }}>Nome</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                    <label style={{ color: '#a1a1aa', fontSize: 13, display: 'block', marginBottom: 6 }}>Gatilho</label>
                    <select value={form.triggerEvent} onChange={e => setForm({ ...form, triggerEvent: e.target.value })}
                        style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                        {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ color: '#a1a1aa', fontSize: 13, display: 'block', marginBottom: 6 }}>Delay (minutos)</label>
                    <input type="number" min={1} max={10080} value={form.delayMinutes} onChange={e => setForm({ ...form, delayMinutes: Number(e.target.value) })} required
                        style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                    <label style={{ color: '#a1a1aa', fontSize: 13, display: 'block', marginBottom: 6 }}>Tipo de Mensagem</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['text', 'audio'].map(t => (
                            <button type="button" key={t} onClick={() => setForm({ ...form, messageType: t })}
                                style={{
                                    flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13,
                                    borderColor: form.messageType === t ? '#16a34a' : '#27272a',
                                    background: form.messageType === t ? '#052e16' : '#18181b',
                                    color: form.messageType === t ? '#4ade80' : '#71717a'
                                }}>
                                {t === 'text' ? '💬 Texto' : '🎙️ Áudio'}
                            </button>
                        ))}
                    </div>
                </div>

                {form.messageType === 'text' ? (
                    <div>
                        <label style={{ color: '#a1a1aa', fontSize: 13, display: 'block', marginBottom: 6 }}>Texto da Mensagem</label>
                        <textarea rows={4} value={form.textContent} onChange={e => setForm({ ...form, textContent: e.target.value })} required
                            style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                ) : (
                    <div>
                        <label style={{ color: '#a1a1aa', fontSize: 13, display: 'block', marginBottom: 6 }}>URL do Áudio</label>
                        <input value={form.mediaUrl} onChange={e => setForm({ ...form, mediaUrl: e.target.value })} required
                            style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setIsOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', cursor: 'pointer', fontSize: 14 }}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

