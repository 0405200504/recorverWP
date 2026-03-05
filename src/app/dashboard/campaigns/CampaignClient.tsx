'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import { addCampaign, deleteCampaign, updateCampaign } from '../actions';

// Gatilhos disponíveis para campanhas de recuperação
const TRIGGER_OPTIONS = [
    { value: 'pix_generated', label: '💸 Pix Gerado', desc: 'Dispara quando o Pix é gerado mas não pago' },
    { value: 'boleto_generated', label: '📄 Boleto Gerado', desc: 'Dispara quando o boleto é emitido mas não pago' },
    { value: 'card_pending', label: '💳 Cartão Pendente', desc: 'Dispara quando o cartão está em análise/pendente' },
    { value: 'card_declined', label: '❌ Cartão Recusado', desc: 'Dispara quando o cartão é recusado/negado' },
    { value: 'checkout_started', label: '🛒 Checkout Iniciado', desc: 'Dispara quando o usuário inicia o checkout' },
    { value: 'checkout_abandoned', label: '🚪 Checkout Abandonado', desc: 'Dispara quando o usuário abandona o checkout' },
    { value: 'order_created', label: '📦 Pedido Criado', desc: 'Dispara quando um pedido é criado no sistema' },
    { value: 'payment_failed', label: '⚠️ Pagamento Falhou', desc: 'Dispara quando qualquer pagamento falha' },
    { value: 'subscription_expired', label: '📆 Assinatura Expirada', desc: 'Dispara quando uma assinatura expira sem renovação' },
    { value: 'refund_requested', label: '↩️ Reembolso Solicitado', desc: 'Dispara quando cliente pede reembolso' },
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
        <div className={styles.shadcnCard}>
            <div className={styles.shadcnCardHeader}>
                <h4 className={styles.shadcnCardTitle}>Criar Nova Campanha de Automação</h4>
                <p className={styles.shadcnCardDescription}>Preencha os dados abaixo para configurar os disparos.</p>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Nome da campanha */}
                <div>
                    <label className={styles.shadcnLabel}>Nome da Campanha</label>
                    <input required placeholder="Ex: Recuperação Pix - 10 minutos" className={styles.shadcnInput} value={name} onChange={e => setName(e.target.value)} />
                </div>

                {/* Gatilho / Finalidade */}
                <div>
                    <label className={styles.shadcnLabel}>
                        🎯 Finalidade / Gatilho de Disparo
                    </label>
                    <select
                        className={styles.shadcnSelect}
                        value={triggerEvent}
                        onChange={e => setTriggerEvent(e.target.value)}
                    >
                        {TRIGGER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {selectedTrigger && (
                        <p className={styles.shadcnHelperText}>
                            ℹ️ {selectedTrigger?.desc}
                        </p>
                    )}
                </div>

                {/* Atraso e Formato */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <label className={styles.shadcnLabel}>Atraso no Disparo (minutos)</label>
                        <input required type="number" min="0" placeholder="0" className={styles.shadcnInput} value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className={styles.shadcnLabel}>Formato da Mensagem</label>
                        <select className={styles.shadcnSelect} value={messageType} onChange={e => setMessageType(e.target.value as any)}>
                            <option value="text">💬 Texto</option>
                            <option value="audio">🎙️ Áudio (URL)</option>
                        </select>
                    </div>
                </div>

                {/* Conteúdo */}
                <div>
                    {messageType === 'text' ? (
                        <>
                            <label className={styles.shadcnLabel}>
                                Conteúdo do Texto <span style={{ color: '#71717a', fontWeight: 'normal' }}>(use {'{{nome}}'}, {'{{produto}}'}, {'{{link}}'} para variáveis)</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Oi {{nome}}! Vi que você não finalizou o pagamento do {{produto}}. Seu pix ainda está disponível! Clique aqui: {{link}}"
                                className={styles.shadcnTextarea}
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)}
                            />
                        </>
                    ) : (
                        <>
                            <label className={styles.shadcnLabel}>URL do Áudio (.mp3 / .ogg)</label>
                            <input required type="url" placeholder="https://seudominio.com/audio.mp3" className={styles.shadcnInput} value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" onClick={() => setIsOpen(false)} className={styles.shadcnButtonOutline} disabled={loading}>Cancelar</button>
                    <button type="submit" className={styles.shadcnButtonPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Campanha'}
                    </button>
                </div>
            </form>
        </div>
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

