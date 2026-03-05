'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function timeStr(ts: number | string) {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function chatName(chat: any): string {
    return chat.name || chat.pushName || chat.id?.replace('@s.whatsapp.net', '').replace('@g.us', ' (grupo)') || 'Desconhecido';
}

export function WhatsAppInbox() {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchChats = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp/chats');
            const data = await res.json();
            if (data.error) { setError(data.error); }
            else { setChats(data.chats || []); setError(''); }
        } catch { setError('Erro ao conectar à Evolution API'); }
        setLoading(false);
    }, []);

    const fetchMessages = useCallback(async (jid: string) => {
        try {
            const res = await fetch(`/api/whatsapp/chats?jid=${encodeURIComponent(jid)}`);
            const data = await res.json();
            setMessages(data.messages || []);
        } catch { }
    }, []);

    useEffect(() => { fetchChats(); }, [fetchChats]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
            const iv = setInterval(() => fetchMessages(selectedChat.id), 8000);
            return () => clearInterval(iv);
        }
    }, [selectedChat, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || !selectedChat) return;
        setSending(true);
        const text = inputText;
        setInputText('');
        try {
            await fetch('/api/whatsapp/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jid: selectedChat.id, text })
            });
            await fetchMessages(selectedChat.id);
        } catch { setInputText(text); }
        setSending(false);
    };

    const filteredChats = chats.filter(c =>
        chatName(c).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 120px)', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden', background: '#0a0a0a' }}>

            {/* PAINEL ESQUERDO — LISTA DE CHATS */}
            <div style={{ width: 320, borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #27272a' }}>
                    <h2 style={{ margin: '0 0 12px', color: '#fff', fontSize: 16, fontWeight: 600 }}>💬 WhatsApp</h2>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar conversa..."
                        style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading && <p style={{ color: '#71717a', fontSize: 13, textAlign: 'center', padding: 24 }}>Carregando...</p>}
                    {error && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', padding: 16, margin: 0 }}>{error}</p>}
                    {!loading && !error && filteredChats.length === 0 && (
                        <p style={{ color: '#52525b', fontSize: 13, textAlign: 'center', padding: 24 }}>Nenhuma conversa encontrada</p>
                    )}
                    {filteredChats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => { setSelectedChat(chat); setMessages([]); }}
                            style={{
                                width: '100%', textAlign: 'left', background: selectedChat?.id === chat.id ? '#1c1c1f' : 'transparent',
                                border: 'none', borderBottom: '1px solid #18181b', padding: '14px 16px', cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (selectedChat?.id !== chat.id) e.currentTarget.style.background = '#111'; }}
                            onMouseLeave={e => { if (selectedChat?.id !== chat.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                                    {chat.id?.includes('@g.us') ? '👥' : '👤'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chatName(chat)}
                                    </div>
                                    <div style={{ color: '#71717a', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                                        {chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || '...'}
                                    </div>
                                </div>
                                {chat.lastMessage?.messageTimestamp && (
                                    <span style={{ color: '#52525b', fontSize: 11, whiteSpace: 'nowrap' }}>
                                        {timeStr(chat.lastMessage.messageTimestamp)}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* PAINEL DIREITO — MENSAGENS */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {!selectedChat ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 48 }}>💬</div>
                        <p style={{ color: '#52525b', fontSize: 14, margin: 0 }}>Selecione uma conversa para começar</p>
                    </div>
                ) : (
                    <>
                        {/* Header do chat */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 12, background: '#0d0d0d' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                {selectedChat.id?.includes('@g.us') ? '👥' : '👤'}
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 600 }}>{chatName(selectedChat)}</p>
                                <p style={{ margin: 0, color: '#52525b', fontSize: 12 }}>
                                    {selectedChat.id?.replace('@s.whatsapp.net', '').replace('@g.us', '')}
                                </p>
                            </div>
                        </div>

                        {/* Mensagens */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, background: '#0a0a0a' }}>
                            {messages.length === 0 && (
                                <p style={{ color: '#52525b', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Carregando mensagens...</p>
                            )}
                            {messages.map((msg: any, i: number) => {
                                const isMe = msg.key?.fromMe;
                                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || (msg.message?.imageMessage ? '🖼 Imagem' : msg.message?.audioMessage ? '🎵 Áudio' : '📎 Mídia');
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '70%', padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                            background: isMe ? '#16a34a' : '#1c1c1f',
                                            color: '#fff', fontSize: 14, lineHeight: 1.5,
                                        }}>
                                            <p style={{ margin: 0 }}>{text}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 10, color: isMe ? '#bbf7d0' : '#71717a', textAlign: 'right' }}>
                                                {timeStr(msg.messageTimestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input de envio */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid #27272a', display: 'flex', gap: 8, background: '#0d0d0d' }}>
                            <input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder="Digite uma mensagem..."
                                style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !inputText.trim()}
                                style={{ background: '#16a34a', border: 'none', borderRadius: 8, padding: '0 16px', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: (!inputText.trim() || sending) ? 0.5 : 1, transition: 'opacity 0.2s' }}
                            >
                                ➤
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
