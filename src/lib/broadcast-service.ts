import { prisma } from './prisma';
import { sendTextWithHumanBehavior, sendAudioWithHumanBehavior, isInstanceConnected } from './evolution-whatsapp';

interface BroadcastOptions {
    organizationId: string;
    instanceName: string;
    targets: string[]; // Lista de números E.164
    messageType: 'text' | 'audio';
    content: string; // texto ou mediaUrl
}

// Mapa para acompanhar o progresso de disparos em massa ativos (em memória)
export const activeBroadcasts = new Map<string, {
    total: number;
    sent: number;
    failed: number;
    status: 'running' | 'completed' | 'stopped';
    logs: string[];
}>();

/**
 * Delay aleatório entre as mensagens dos leads para evitar bloqueio
 * 30 a 90 segundos é o ideal para disparos manuais simulados
 */
function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Inicia um disparo em massa em background
 */
export async function startBroadcast(id: string, options: BroadcastOptions) {
    const { organizationId, instanceName, targets, messageType, content } = options;
    
    activeBroadcasts.set(id, {
        total: targets.length,
        sent: 0,
        failed: 0,
        status: 'running',
        logs: [`Iniciando disparo para ${targets.length} contatos...`]
    });

    // Inicia o processo sem dar await (background)
    processBroadcast(id, options).catch(err => {
        console.error(`[BroadcastService] Erro crítico no broadcast ${id}:`, err);
        const current = activeBroadcasts.get(id);
        if (current) {
            current.status = 'stopped';
            current.logs.push(`ERRO CRÍTICO: ${err.message}`);
        }
    });

    return id;
}

async function processBroadcast(id: string, options: BroadcastOptions) {
    const { organizationId, instanceName, targets, messageType, content } = options;
    const stats = activeBroadcasts.get(id);
    if (!stats) return;

    // Embaralha os alvos para não ser sequencial (comportamento humano)
    const shuffledTargets = [...targets].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledTargets.length; i++) {
        // Verifica se o broadcast foi parado manualmente
        if (stats.status === 'stopped') break;

        const phone = shuffledTargets[i];
        
        try {
            // Verifica conexão antes de cada envio importante
            const connected = await isInstanceConnected(instanceName);
            if (!connected) {
                throw new Error("Instância desconectada no meio do processo.");
            }

            let messageId: string | undefined;

            if (messageType === 'audio') {
                const result = await sendAudioWithHumanBehavior(instanceName, phone, content);
                messageId = result.messageId;
            } else {
                const result = await sendTextWithHumanBehavior(instanceName, phone, content);
                messageId = result.messageId;
            }

            // Busca ou cria o lead para registrar a mensagem no histórico
            const lead = await prisma.lead.upsert({
                where: { organizationId_phoneE164: { organizationId, phoneE164: phone } },
                update: { lastSeenAt: new Date() },
                create: { organizationId, phoneE164: phone, name: 'Contato Broadcast' }
            });

            // Registra no histórico de mensagens
            await prisma.message.create({
                data: {
                    organizationId,
                    leadId: lead.id,
                    direction: 'outbound',
                    channel: 'whatsapp',
                    payload: JSON.stringify({ type: messageType, content, isBroadcast: true, broadcastId: id }),
                    waMessageId: messageId,
                    status: 'sent',
                }
            });

            stats.sent++;
            stats.logs.push(`[${i+1}/${targets.length}] Sucesso: ${phone}`);

        } catch (err: any) {
            console.error(`[BroadcastService] Falha ao enviar para ${phone}:`, err.message);
            stats.failed++;
            stats.logs.push(`[${i+1}/${targets.length}] Falha: ${phone} - ${err.message}`);
        }

        // Delay entre mensagens
        if (i < shuffledTargets.length - 1) {
            // Simula pausa humana: 30-90 segundos
            const delaySeconds = randomBetween(20, 60); // Reduzi um pouco para o teste não ser eterno, mas sugerido 30-90
            stats.logs.push(`Aguardando ${delaySeconds}s para o próximo envio...`);
            await sleep(delaySeconds * 1000);

            // Pausa longa a cada 20 envios (batching)
            if ((i + 1) % 20 === 0) {
                const longPausaMinutes = randomBetween(5, 15);
                stats.logs.push(`Pausa longa de ${longPausaMinutes}m para evitar detecção...`);
                await sleep(longPausaMinutes * 60 * 1000);
            }
        }
    }

    stats.status = 'completed';
    stats.logs.push("Disparo em massa finalizado.");
}
