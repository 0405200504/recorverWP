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
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [detectedProvider, setDetectedProvider] = useState<any>(null);

    useEffect(() => {
        const origin = window.location.origin;
        setBaseUrl(origin.includes('localhost') ? 'https://recorver-wp.vercel.app' : origin);
    }, []);

    const detectProvider = (url: string) => {
        setCheckoutUrl(url);
        if (!url) {
            setDetectedProvider(null);
            return;
        }

        const lowerUrl = url.toLowerCase();
        let found = null;

        if (lowerUrl.includes('cakto')) found = PROVIDERS.find(p => p.id === 'cakto');
        else if (lowerUrl.includes('hotmart') || lowerUrl.includes('pay.hotmart')) found = PROVIDERS.find(p => p.id === 'hotmart');
        else if (lowerUrl.includes('kiwify')) found = PROVIDERS.find(p => p.id === 'kiwify');
        else if (lowerUrl.includes('hubla')) found = PROVIDERS.find(p => p.id === 'hubla');
        else if (lowerUrl.includes('myshopify') || lowerUrl.includes('shopify')) found = PROVIDERS.find(p => p.id === 'shopify');
        else if (lowerUrl.includes('eduzz')) found = PROVIDERS.find(p => p.id === 'eduzz') || { id: 'custom', name: 'Eduzz' };
        else if (lowerUrl.includes('braip')) found = PROVIDERS.find(p => p.id === 'braip') || { id: 'custom', name: 'Braip' };
        else if (lowerUrl.includes('ticto')) found = PROVIDERS.find(p => p.id === 'ticto') || { id: 'custom', name: 'Ticto' };

        setDetectedProvider(found);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('URL copiada para a área de transferência!');
    };

    const handleQuickAdd = async () => {
        if (!detectedProvider) return;
        setLoading(true);
        try {
            await addWebhookConfig({
                name: `Integração ${detectedProvider.name}`,
                provider: detectedProvider.id,
                clientId: '',
                clientSecret: '',
                webhookToken: ''
            });
            setCheckoutUrl('');
            setDetectedProvider(null);
            router.refresh();
        } catch (err) {
            alert('Erro ao criar webhook');
        } finally {
            setLoading(false);
        }
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
            {/* MAGIC DETECTOR */}
            <div style={{ marginBottom: '32px', background: 'linear-gradient(145deg, #0f172a, #1e293b)', padding: '24px', borderRadius: '16px', border: '1px solid #38bdf840', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span> Configuração Mágica
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
                    Cole a URL do seu produto ou checkout e nós configuramos tudo para você.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        placeholder="Ex: https://pay.cakto.com.br/meu-produto"
                        value={checkoutUrl}
                        onChange={(e) => detectProvider(e.target.value)}
                        className={styles.input}
                        style={{ flex: 1, height: '48px', fontSize: '14px', background: '#0f172a' }}
                    />
                </div>

                {detectedProvider && (
                    <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#07598530', padding: '12px', borderRadius: '10px', border: '1px solid #0ea5e950' }}>
                            <div style={{ height: '40px', width: '40px', background: '#0ea5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                🚀
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: '600' }}>Plataforma Detectada: {detectedProvider.name}</p>
                                <p style={{ margin: 0, color: '#7dd3fc', fontSize: '12px' }}>Seu webhook está pronto para ser configurado.</p>
                            </div>
                            <button
                                onClick={handleQuickAdd}
                                disabled={loading}
                                style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                            >
                                {loading ? 'Configurando...' : 'Confirmar e Criar'}
                            </button>
                        </div>
                        <div style={{ marginTop: '12px', background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px dashed #334155' }}>
                            <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL do Webhook para copiar:</p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <code style={{ flex: 1, fontSize: '12px', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {baseUrl}/api/webhooks/checkout/{detectedProvider.id}?orgId={orgId}
                                </code>
                                <button onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/checkout/${detectedProvider.id}?orgId=${orgId}`)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>COPIAR</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ height: '1px', flex: 1, background: '#27272a' }}></div>
                <span style={{ fontSize: '12px', color: '#52525b', textTransform: 'uppercase' }}>Ou escolha manualmente</span>
                <div style={{ height: '1px', flex: 1, background: '#27272a' }}></div>
            </div>

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
