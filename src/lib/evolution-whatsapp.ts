/**
 * Evolution API WhatsApp Service
 * Envia mensagens com comportamento humano para evitar banimento
 */

const EVO_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8083').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

const headers = {
    'Content-Type': 'application/json',
    'apikey': EVO_KEY,
};

// Remove o + do número E.164 (Evolution API espera só dígitos)
function normalizePhone(phone: string): string {
    return phone.replace(/^\+/, '').replace(/\D/g, '');
}

// Delay humano aleatório dentro de um intervalo
function randomDelay(minMs: number, maxMs: number): Promise<void> {
    const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Envia presença (composing ou recording audio)
async function sendPresence(instanceName: string, phone: string, presence: 'composing' | 'recording audio') {
    try {
        await fetch(`${EVO_URL}/instance/sendPresence/${instanceName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ number: phone, options: { delay: 1000, presence } }),
        });
    } catch { /* ignora erros de presença */ }
}

// Para a presença (volta para "disponível")
async function stopPresence(instanceName: string, phone: string) {
    try {
        await fetch(`${EVO_URL}/instance/sendPresence/${instanceName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ number: phone, options: { delay: 500, presence: 'available' } }),
        });
    } catch { /* ignora */ }
}

/**
 * Envia texto com simulação de digitação humana
 * 1. Mostra "digitando..." por 3-7 segundos
 * 2. Envia o texto
 */
export async function sendTextWithHumanBehavior(
    instanceName: string,
    toPhone: string,
    text: string,
    leadName?: string
): Promise<{ messageId?: string }> {
    const phone = normalizePhone(toPhone);

    // Substituição de variáveis básicas
    let finalText = text
        .replace(/\{\{nome\}\}/gi, leadName || 'você')
        .replace(/\{\{name\}\}/gi, leadName || 'você');

    // Calcula tempo de "digitação" proporcional ao tamanho do texto (mín 3s, máx 8s)
    const typingMs = Math.min(8000, Math.max(3000, finalText.length * 40));

    // Começa a digitar
    await sendPresence(instanceName, phone, 'composing');
    await randomDelay(typingMs * 0.8, typingMs * 1.2);
    await stopPresence(instanceName, phone);

    // Pequena pausa antes de enviar (humano termina de digitar e clica enviar)
    await randomDelay(400, 900);

    const res = await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            number: phone,
            text: finalText,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Evolution API sendText error: ${err}`);
    }

    const data = await res.json();
    return { messageId: data?.key?.id || data?.id };
}

/**
 * Envia áudio com simulação de gravação de áudio humana
 * 1. Mostra "gravando áudio..." por 4-10 segundos  
 * 2. Envia o áudio como mensagem de voz
 */
export async function sendAudioWithHumanBehavior(
    instanceName: string,
    toPhone: string,
    audioUrl: string
): Promise<{ messageId?: string }> {
    const phone = normalizePhone(toPhone);

    // Simula gravação de áudio (entre 4 e 10 segundos)
    await sendPresence(instanceName, phone, 'recording audio');
    await randomDelay(4000, 10000);
    await stopPresence(instanceName, phone);

    // Pausa antes de enviar
    await randomDelay(600, 1200);

    const res = await fetch(`${EVO_URL}/message/sendMedia/${instanceName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            number: phone,
            mediatype: 'audio',
            media: audioUrl,
            mimetype: 'audio/mpeg',
            audioVoice: true, // torna o áudio "mensagem de voz" no WhatsApp
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Evolution API sendAudio error: ${err}`);
    }

    const data = await res.json();
    return { messageId: data?.key?.id || data?.id };
}

/**
 * Verifica se uma instância está conectada
 */
export async function isInstanceConnected(instanceName: string): Promise<boolean> {
    try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, { headers });
        const data = await res.json();
        return data?.instance?.state === 'open';
    } catch {
        return false;
    }
}
