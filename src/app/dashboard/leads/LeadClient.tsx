'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';
import { addLead, deleteLead } from '../actions';

export function AddLeadButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const handleAdd = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addLead({ name, phoneE164: phone, email });
            setIsOpen(false);
            setName('');
            setPhone('');
            setEmail('');
        } catch (err) {
            alert('Erro ao criar lead. Verifique se o telefone (ex: 5511999999999) já não existe nesta org.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return <button onClick={() => setIsOpen(true)} className={styles.btnPrimary}>+ Adicionar Lead Manual</button>;
    }

    return (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#111111', borderRadius: '12px', border: '1px solid #27272a' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#ffffff' }}>Novo Lead (Manual)</h4>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input required placeholder="Nome do Cliente" className={styles.input} style={{ flex: 1, minWidth: '200px' }} value={name} onChange={e => setName(e.target.value)} />
                <input required placeholder="WhatsApp (5511999999999)" className={styles.input} style={{ flex: 1, minWidth: '200px' }} value={phone} onChange={e => setPhone(e.target.value)} />
                <input type="email" placeholder="E-mail (opcional)" className={styles.input} style={{ flex: 1, minWidth: '200px' }} value={email} onChange={e => setEmail(e.target.value)} />

                <button type="button" onClick={() => setIsOpen(false)} className={styles.btnSecondary} disabled={loading}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Contato'}</button>
            </form>
        </div>
    );
}

export function DeleteLeadButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Deseja realmente apagar este lead da base e seu histórico de recuperações associadas?')) return;
        setLoading(true);
        try {
            await deleteLead(id);
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
