'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { addCampaign, deleteCampaign } from '../actions';

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
        <div style={{ marginBottom: '24px', padding: '20px', background: '#111111', borderRadius: '12px', border: '1px solid #27272a' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#ffffff', fontSize: '16px' }}>Criar Nova Campanha de Automação</h4>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Nome da campanha */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Nome da Campanha</label>
                    <input required placeholder="Ex: Recuperação Pix - 10 minutos" className={styles.input} value={name} onChange={e => setName(e.target.value)} />
                </div>

                {/* Gatilho / Finalidade */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
                        🎯 Finalidade / Gatilho de Disparo
                    </label>
                    <select
                        className={styles.input}
                        value={triggerEvent}
                        onChange={e => setTriggerEvent(e.target.value)}
                        style={{ cursor: 'pointer' }}
                    >
                        {TRIGGER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {selectedTrigger && (
                        <p style={{ fontSize: '12px', color: '#71717a', margin: '6px 0 0 0' }}>
                            ℹ️ {selectedTrigger.desc}
                        </p>
                    )}
                </div>

                {/* Atraso e Formato */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Atraso no Disparo (minutos)</label>
                        <input required type="number" min="0" placeholder="0" className={styles.input} value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Formato da Mensagem</label>
                        <select className={styles.input} value={messageType} onChange={e => setMessageType(e.target.value as any)}>
                            <option value="text">💬 Texto</option>
                            <option value="audio">🎙️ Áudio (URL)</option>
                        </select>
                    </div>
                </div>

                {/* Conteúdo */}
                <div>
                    {messageType === 'text' ? (
                        <>
                            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
                                Conteúdo do Texto <span style={{ color: '#71717a' }}>(use {'{{nome}}'}, {'{{produto}}'}, {'{{link}}'} para variáveis)</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Oi {{nome}}! Vi que você não finalizou o pagamento do {{produto}}. Seu pix ainda está disponível! Clique aqui: {{link}}"
                                className={styles.input}
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)}
                                style={{ resize: 'vertical' }}
                            />
                        </>
                    ) : (
                        <>
                            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>URL do Áudio (.mp3 / .ogg)</label>
                            <input required type="url" placeholder="https://seudominio.com/audio.mp3" className={styles.input} value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setIsOpen(false)} className={styles.btnSecondary} disabled={loading}>Cancelar</button>
                    <button type="submit" className={styles.btnPrimary} style={{ width: 'auto', padding: '10px 28px' }} disabled={loading}>
                        {loading ? 'Salvando...' : '✓ Salvar Campanha'}
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
