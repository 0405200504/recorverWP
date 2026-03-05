'use client';

import { useState, useEffect } from 'react';

export function WhatsAppEmbed() {
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [instanceId, setInstanceId] = useState<string | null>(null);
    const [evoUrl, setEvoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/whatsapp/chats')
            .then(r => r.json())
            .then(data => {
                if (data.error) { setError(data.error); }
                else if (data.instanceName) {
                    setInstanceName(data.instanceName);
                    setEvoUrl(data.evoUrl);
                    setInstanceId(data.instanceId);
                } else {
                    setError('Nenhum WhatsApp conectado');
                }
            })
            .catch(() => setError('Erro ao buscar instância'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 160px)', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#71717a', fontSize: 14 }}>Carregando...</div>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 160px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 48 }}>📱</div>
            <p style={{ color: '#ef4444', fontSize: 15, margin: 0 }}>{error}</p>
            <p style={{ color: '#52525b', fontSize: 13, margin: 0 }}>Conecte seu WhatsApp na aba <strong style={{ color: '#a1a1aa' }}>Integrações</strong> primeiro.</p>
            <a href="/dashboard/integrations" style={{ background: '#16a34a', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, marginTop: 8 }}>
                Ir para Integrações →
            </a>
        </div>
    );

    const managerUrl = `${evoUrl}/manager/instance/${instanceId || instanceName}/?ngrok-skip-browser-warning=true`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            <div style={{ padding: '12px 16px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                    Visualizando WhatsApp de: <strong style={{ color: '#fff' }}>{instanceName}</strong>
                </span>
                <a
                    href={managerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#25D366', color: '#fff', padding: '6px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    Apareceu um aviso ou erro? Abrir em Nova Guia ↗
                </a>
            </div>
            <div style={{ border: '1px solid #27272a', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', flex: 1 }}>
                <iframe
                    src={managerUrl}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    title="WhatsApp Web"
                    allow="clipboard-write; microphone; camera"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
            </div>
        </div>
    );
}
