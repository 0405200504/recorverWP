'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { addCampaign, deleteCampaign } from '../actions';

export function AddCampaignButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
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
                delayMinutes: parseInt(delayMinutes),
                messageType,
                textContent: messageType === 'text' ? textContent : '',
                mediaUrl: messageType === 'audio' ? mediaUrl : ''
            });
            setIsOpen(false);
            setName('');
            setTextContent('');
            setMediaUrl('');
        } catch (err) {
            alert('Erro ao criar campanha');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return <button onClick={() => setIsOpen(true)} className={styles.btnPrimary}>+ Nova Campanha</button>;
    }

    return (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#111111', borderRadius: '12px', border: '1px solid #27272a' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#ffffff' }}>Criar Nova Campanha de Automação</h4>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Nome da Campanha</label>
                        <input required placeholder="Ex: Carrinho Abandonado (Audio)" className={styles.input} value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Atraso no Disparo (Min)</label>
                        <input required type="number" min="0" placeholder="Minutos" className={styles.input} value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Formato da Mensagem</label>
                        <select className={styles.input} value={messageType} onChange={e => setMessageType(e.target.value as any)}>
                            <option value="text">Texto</option>
                            <option value="audio">Áudio (URL Gravado)</option>
                        </select>
                    </div>
                    <div style={{ flex: 2 }}>
                        {messageType === 'text' ? (
                            <>
                                <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Conteúdo do Texto (use {'{{nome}}'} para variável)</label>
                                <textarea required rows={2} placeholder="Oi {{nome}}, vi que não finalizou o pix..." className={styles.input} value={textContent} onChange={e => setTextContent(e.target.value)} />
                            </>
                        ) : (
                            <>
                                <label style={{ fontSize: '12px', color: '#a1a1aa' }}>URL do Link de Áudio (.mp3 / .ogg)</label>
                                <input required type="url" placeholder="https://seudominio.com/audio.mp3" className={styles.input} value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" onClick={() => setIsOpen(false)} className={styles.btnSecondary} disabled={loading}>Cancelar</button>
                    <button type="submit" className={styles.btnPrimary} style={{ width: 'auto', padding: '10px 24px' }} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Campanha'}</button>
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
