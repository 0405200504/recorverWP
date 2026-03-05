import type { Config } from '@netlify/functions';

/**
 * Netlify Scheduled Function — executa a cada 1 minuto.
 * Chama o endpoint interno /api/scheduler que processa os StepDispatches pendentes.
 * Autenticação via Bearer token (CRON_SECRET).
 */
export default async function handler() {
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || 'cron-recuperei-2024';

    try {
        const response = await fetch(`${siteUrl}/api/scheduler`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cronSecret}`,
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        console.log('[Scheduler Cron] Resultado:', JSON.stringify(result));

        if (!response.ok) {
            console.error('[Scheduler Cron] Erro:', response.status, result);
        }
    } catch (err) {
        console.error('[Scheduler Cron] Falha na requisição:', err);
    }
}

export const config: Config = {
    schedule: '* * * * *', // Executa a cada 1 minuto
};
