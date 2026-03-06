'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import { addCampaign, deleteCampaign, updateCampaign, CampaignStep } from '../actions';
import { FlowBuilder } from '@/components/FlowBuilder';

const TRIGGER_OPTIONS = [
    { value: 'pix_generated', label: 'Pix Gerado', desc: 'Dispara quando o Pix é gerado mas não pago' },
    { value: 'boleto_generated', label: 'Boleto Gerado', desc: 'Dispara quando o boleto é emitido mas não pago' },
    { value: 'card_pending', label: 'Cartão Pendente', desc: 'Dispara quando o cartão está em análise' },
    { value: 'card_declined', label: 'Cartão Recusado', desc: 'Dispara quando o cartão é recusado' },
    { value: 'checkout_started', label: 'Checkout Iniciado', desc: 'Dispara quando o usuário inicia o checkout' },
    { value: 'checkout_abandoned', label: 'Checkout Abandonado', desc: 'Dispara quando o usuário abandona o checkout' },
    { value: 'order_created', label: 'Pedido Criado', desc: 'Dispara quando um pedido é criado no sistema' },
    { value: 'payment_failed', label: 'Pagamento Falhou', desc: 'Dispara quando qualquer pagamento falha' },
    { value: 'subscription_expired', label: 'Assinatura Expirada', desc: 'Dispara quando uma assinatura expira sem renovação' },
    { value: 'refund_requested', label: 'Reembolso Solicitado', desc: 'Dispara quando o cliente solicita reembolso' },
];

const IconClose = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconText = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const IconAudio = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const inputStyle: React.CSSProperties = {
    height: '40px', background: 'var(--surface-2)', border: '1px solid var(--border-2)',
    borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '14px', padding: '0 14px',
    outline: 'none', width: '100%', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
};

const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none', paddingRight: '36px', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2352525b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px',
};

function onFocusGlow(e: React.FocusEvent<any>) { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }
function onBlurGlow(e: React.FocusEvent<any>) { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; }

function createDefaultStep(): CampaignStep {
    return {
        delayValue: 10,
        delayUnit: 'minutes',
        messageType: 'text',
        textContent: '',
        mediaUrl: ''
    };
}

// ─── Add Campaign ─────────────────────────────────────────────────
export function AddCampaignButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [triggerEvent, setTriggerEvent] = useState('pix_generated');
    const [steps, setSteps] = useState<CampaignStep[]>([createDefaultStep()]);

    const handleAdd = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addCampaign({ name, triggerEvent, steps });
            setIsOpen(false);
            setName('');
            setTriggerEvent('pix_generated');
            setSteps([createDefaultStep()]);
        } catch (err: any) {
            alert(err.message || 'Erro ao criar campanha');
        } finally {
            setLoading(false);
        }
    };

    const updateStep = (index: number, field: keyof CampaignStep, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const removeStep = (index: number) => {
        if (steps.length === 1) return;
        setSteps(steps.filter((_, i) => i !== index));
    };

    const addStep = () => {
        setSteps([...steps, createDefaultStep()]);
    };

    if (!isOpen) return (
        <button onClick={() => setIsOpen(true)} className={styles.btnPrimary}>
            <IconPlus /> Nova Campanha
        </button>
    );

    return (
        <>
            <div className={styles.overlay} onClick={() => !loading && setIsOpen(false)} />
            <div className={styles.modal} style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.modalHeader} style={{ flexShrink: 0 }}>
                    <div>
                        <p className={styles.modalEyebrow}>Nova Campanha</p>
                        <h2 className={styles.modalTitle}>Configurar Automação</h2>
                    </div>
                    <button type="button" onClick={() => !loading && setIsOpen(false)} className={styles.modalCloseBtn}>
                        <IconClose />
                    </button>
                </div>

                <form onSubmit={handleAdd} style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                    <div className={styles.modalSection}>
                        <p className={styles.modalSectionLabel}>Identificação</p>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Nome da campanha</label>
                            <input required placeholder="Ex: Recuperação Pix" value={name} onChange={e => setName(e.target.value)} style={inputStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                        </div>
                    </div>

                    <div className={styles.modalDivider} />

                    <div className={styles.modalSection}>
                        <p className={styles.modalSectionLabel}>Disparo Base</p>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Gatilho inicial</label>
                            <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} style={selectStyle} onFocus={onFocusGlow} onBlur={onBlurGlow}>
                                {TRIGGER_OPTIONS.map(opt => <option key={opt.value} value={opt.value} style={{ background: '#111' }}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.modalDivider} />

                    <div className={styles.modalSection}>
                        <p className={styles.modalSectionLabel}>Fluxo Visual de Mensagens</p>
                        <FlowBuilder steps={steps} setSteps={setSteps} triggerEvent={TRIGGER_OPTIONS.find(o => o.value === triggerEvent)?.label || ''} />
                    </div>

                    <div className={styles.modalFooter} style={{ padding: '24px 0 0' }}>
                        <button type="button" onClick={() => !loading && setIsOpen(false)} disabled={loading} className={styles.btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Criando...' : 'Criar Automação'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Delete Campaign ──────────────────────────────────────────────
export function DeleteCampaignButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Excluir esta campanha apagará também as regras dela. Continuar?')) return;
        setLoading(true);
        try { await deleteCampaign(id); }
        catch { alert('Erro ao remover'); setLoading(false); }
    };

    return <button onClick={handleDelete} disabled={loading} className={styles.btnDanger}>{loading ? '...' : 'Excluir'}</button>;
}

// ─── Edit Campaign ────────────────────────────────────────────────
export function EditCampaignButton({ id, name: initialName, triggerEvent: initialTrigger, steps: initialSteps }: {
    id: string; name: string; triggerEvent: string; steps: any[];
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Converte os steps do DB para o state
    const parsedSteps: CampaignStep[] = initialSteps.length > 0 ? initialSteps.map(s => {
        let delayV = s.delaySeconds;
        let delayU: 'seconds' | 'minutes' | 'hours' = 'seconds';

        if (delayV > 0 && delayV % 3600 === 0) { delayV = delayV / 3600; delayU = 'hours'; }
        else if (delayV > 0 && delayV % 60 === 0) { delayV = delayV / 60; delayU = 'minutes'; }

        return {
            delayValue: delayV,
            delayUnit: delayU,
            messageType: s.messageType as any,
            textContent: s.contentText || '',
            mediaUrl: s.mediaUrl || ''
        };
    }) : [createDefaultStep()];

    const [name, setName] = useState(initialName);
    const [triggerEvent, setTriggerEvent] = useState(initialTrigger);
    const [steps, setSteps] = useState<CampaignStep[]>(parsedSteps);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateCampaign(id, { name, triggerEvent, steps });
            setIsOpen(false);
            router.refresh();
        } catch { alert('Erro ao salvar'); }
        finally { setLoading(false); }
    };

    const updateStep = (index: number, field: keyof CampaignStep, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const removeStep = (index: number) => {
        if (steps.length === 1) return;
        setSteps(steps.filter((_, i) => i !== index));
    };

    const addStep = () => setSteps([...steps, createDefaultStep()]);

    if (!isOpen) return <button onClick={() => setIsOpen(true)} className={styles.btnEdit}>Editar</button>;

    return (
        <>
            <div className={styles.overlay} onClick={() => !loading && setIsOpen(false)} />
            <div className={styles.modal} style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.modalHeader} style={{ flexShrink: 0 }}>
                    <div>
                        <p className={styles.modalEyebrow}>Campanha</p>
                        <h2 className={styles.modalTitle}>Editar Automação</h2>
                    </div>
                    <button type="button" onClick={() => !loading && setIsOpen(false)} className={styles.modalCloseBtn}>
                        <IconClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                    <div className={styles.modalSection}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Nome</label>
                            <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Gatilho inicial</label>
                            <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} style={selectStyle}>
                                {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.modalDivider} />

                    <div className={styles.modalSection}>
                        <p className={styles.modalSectionLabel}>Fluxo Visual de Mensagens</p>
                        <FlowBuilder steps={steps} setSteps={setSteps} triggerEvent={TRIGGER_OPTIONS.find(o => o.value === triggerEvent)?.label || ''} />
                    </div>

                    <div className={styles.modalFooter} style={{ padding: '24px 0 0' }}>
                        <button type="button" onClick={() => setIsOpen(false)} className={styles.btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
