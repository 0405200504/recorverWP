'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import { addWebhookConfig, deleteWebhookConfig } from '../actions';


const PROVIDERS = [
    { id: 'cloudfy', name: 'Cloudfy' },
    { id: 'kuenha', name: 'Kuenha' },
    { id: 'ninjapay', name: 'NinjaPay' },
    { id: 'xgrow', name: 'Xgrow' },
    { id: 'ggcheckout', name: 'ggCheckout' },
    { id: 'panteracheckout', name: 'PanteraCheckout' },
    { id: 'nublapay', name: 'NublaPay' },
    { id: 'hotmart', name: 'Hotmart' },
    { id: 'kiwify', name: 'Kiwify' },
    { id: 'cakto', name: 'Cakto' },
    { id: 'shopify', name: 'Shopify' },
    { id: 'custom', name: 'Personalizado' },
];

export function WebhookGridClient({ configs, orgId }: { configs: any[], orgId: string }) {
    const router = useRouter();
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', clientId: '', clientSecret: '', webhookToken: '' });
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('URL copiada para a área de transferência!');
    };

    const handleAdd = async (e: any) => {
        e.preventDefault();
        if (!selectedProvider) return;
        setLoading(true);
        try {
            await addWebhookConfig({ ...formData, provider: selectedProvider });
            setSelectedProvider(null);
            setFormData({ name: '', clientId: '', clientSecret: '', webhookToken: '' });
            router.refresh();
        } catch (err) {
            alert('Erro ao criar webhook');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover este webhook?')) return;
        setLoading(true);
        try {
            await deleteWebhookConfig(id);
            router.refresh();
        } catch (err) {
            alert('Erro ao remover webhook');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {/* GRID OF PROVIDERS */}
            {!selectedProvider && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                    {PROVIDERS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProvider(p.id)}
                            style={{
                                background: '#1c1c1f',
                                border: '1px solid #3f3f46',
                                color: '#e4e4e7',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#fff' }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#e4e4e7' }}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* ADD FORM */}
            {selectedProvider && (
                <div style={{ background: '#111111', padding: '24px', borderRadius: '12px', border: '1px solid #27272a', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Adicionar Webhook: <span style={{ color: '#38bdf8' }}>{PROVIDERS.find(p => p.id === selectedProvider)?.name}</span></h4>
                        <button onClick={() => setSelectedProvider(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                    </div>

                    <p style={{ color: '#38bdf8', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', textDecoration: 'none' }}>
                        Clique aqui para ver como integrar com a {PROVIDERS.find(p => p.id === selectedProvider)?.name}
                    </p>

                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Nome</label>
                            <input required placeholder="Nome do Webhook" className={styles.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Client ID</label>
                            <input placeholder="Client ID" className={styles.input} value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Client Secret</label>
                            <input type="password" placeholder="..............." className={styles.input} value={formData.clientSecret} onChange={e => setFormData({ ...formData, clientSecret: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Token do Webhook</label>
                            <input type="password" placeholder="..............." className={styles.input} value={formData.webhookToken} onChange={e => setFormData({ ...formData, webhookToken: e.target.value })} />
                        </div>

                        <div style={{ marginTop: '8px' }}>
                            <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', fontWeight: '600' }} disabled={loading}>
                                {loading ? 'Criando...' : 'Criar Webhook'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST OF CONFIGS */}
            {configs.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#fff' }}>Webhooks Configurados</h4>
                    {configs.map(cfg => (
                        <div key={cfg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #27272a', marginBottom: '12px' }}>
                            <div>
                                <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '15px' }}>{cfg.name} <span style={{ fontSize: '12px', color: '#38bdf8', background: '#082f49', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{cfg.provider.toUpperCase()}</span></h5>
                                <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa', wordBreak: 'break-all', paddingRight: '16px' }}><strong>URL:</strong> {baseUrl}/api/webhooks/checkout/{cfg.provider}?orgId={orgId}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/checkout/${cfg.provider}?orgId=${orgId}`)} style={{ background: '#38bdf820', color: '#38bdf8', border: '1px solid #38bdf850', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Copiar URL</button>
                                <button onClick={() => handleDelete(cfg.id)} disabled={loading} style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444450', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Excluir</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
