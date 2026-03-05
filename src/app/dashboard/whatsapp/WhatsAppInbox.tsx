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

    const managerUrl = `${evoUrl}/manager/instance/${instanceId || instanceName}/`;

    return (
        <div style={{ border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden', height: 'calc(100vh - 160px)' }}>
            <iframe
                src={managerUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="WhatsApp Web"
                allow="clipboard-write; microphone; camera"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
        </div>
    );
}
