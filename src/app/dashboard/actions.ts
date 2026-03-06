'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from 'next/cache';

// Utilitário para validar sessão
async function getOrgId() {
    const session = await getServerSession(authOptions) as any;
    if (!session?.orgId) throw new Error("Não autorizado");
    return session.orgId;
}

// ==== ORGANIZATION ====
export async function updateWebhookSecret(secret: string) {
    const orgId = await getOrgId();
    await prisma.organization.update({ where: { id: orgId }, data: { webhook_secret: secret } });
    revalidatePath('/dashboard/integrations');
}

// ==== WEBHOOK CONFIGS ====
export async function addWebhookConfig(data: { provider: string, name: string, clientId?: string, clientSecret?: string, webhookToken?: string }) {
    const orgId = await getOrgId();
    await prisma.webhookConfig.create({
        data: {
            organizationId: orgId,
            provider: data.provider,
            name: data.name,
            clientId: data.clientId || null,
            clientSecret: data.clientSecret || null,
            webhookToken: data.webhookToken || null,
        }
    });
    revalidatePath('/dashboard/integrations');
}

export async function deleteWebhookConfig(id: string) {
    const orgId = await getOrgId();
    await prisma.webhookConfig.delete({ where: { id, organizationId: orgId } });
    revalidatePath('/dashboard/integrations');
}

// ==== INTEGRAÇÕES (WhatsApp Numbers) ====
export async function addWhatsAppNumber(data: { phoneNumberId: string, wabaId: string, accessToken: string, displayName?: string }) {
    const orgId = await getOrgId();
    await prisma.whatsAppNumber.create({
        data: {
            organizationId: orgId,
            phoneNumberId: data.phoneNumberId,
            wabaId: data.wabaId,
            accessToken: data.accessToken,
            displayName: data.displayName || null,
            status: 'active'
        }
    });
    revalidatePath('/dashboard/integrations');
}

export async function deleteWhatsAppNumber(id: string) {
    const orgId = await getOrgId();
    await prisma.whatsAppNumber.delete({ where: { id, organizationId: orgId } });
    revalidatePath('/dashboard/integrations');
}

// ==== LEADS ====
export async function addLead(data: { name: string, phoneE164: string, email?: string }) {
    const orgId = await getOrgId();
    await prisma.lead.create({
        data: { organizationId: orgId, name: data.name, phoneE164: data.phoneE164, email: data.email || null }
    });
    revalidatePath('/dashboard/leads');
}

export async function deleteLead(id: string) {
    const orgId = await getOrgId();
    await prisma.lead.delete({ where: { id, organizationId: orgId } });
    revalidatePath('/dashboard/leads');
}

// ==== CAMPANHAS (suporte multi-step) ====

export interface CampaignStep {
    delayValue: number;
    delayUnit: 'minutes' | 'seconds' | 'hours';
    messageType: 'text' | 'audio';
    textContent: string;
    mediaUrl: string;
}

export async function addCampaign(data: {
    name: string;
    triggerEvent: string;
    steps: CampaignStep[];
}) {
    const orgId = await getOrgId();

    if (!data.steps || data.steps.length === 0) {
        throw new Error('A campanha deve ter pelo menos uma mensagem.');
    }

    await prisma.campaign.create({
        data: {
            organizationId: orgId,
            name: data.name,
            active: true,
            triggerEventTypes: JSON.stringify([data.triggerEvent]),
            stopOnEventTypes: JSON.stringify(['payment_approved', 'refunded']),
            maxAttemptsPerLeadPerOrder: 3,
            steps: {
                create: data.steps.map((step, idx) => {
                    const delaySeconds = toSeconds(step.delayValue, step.delayUnit);
                    return {
                        stepOrder: idx + 1,
                        delaySeconds,
                        delayMinutes: Math.floor(delaySeconds / 60),
                        messageType: step.messageType,
                        contentText: step.messageType === 'text' ? step.textContent : null,
                        mediaUrl: step.messageType === 'audio' ? step.mediaUrl : null,
                        sendOnlyIf: 'qualquer'
                    };
                })
            }
        }
    });
    revalidatePath('/dashboard/campaigns');
}

export async function updateCampaign(id: string, data: {
    name: string;
    triggerEvent: string;
    steps: CampaignStep[];
}) {
    const orgId = await getOrgId();
    const campaign = await prisma.campaign.findUnique({ where: { id, organizationId: orgId } });
    if (!campaign) throw new Error('Campanha não encontrada');

    // Apaga todos os steps antigos e recria (replace completo)
    await prisma.cadenceStep.deleteMany({ where: { campaignId: id } });

    await prisma.campaign.update({
        where: { id },
        data: {
            name: data.name,
            triggerEventTypes: JSON.stringify([data.triggerEvent]),
            steps: {
                create: data.steps.map((step, idx) => {
                    const delaySeconds = toSeconds(step.delayValue, step.delayUnit);
                    return {
                        stepOrder: idx + 1,
                        delaySeconds,
                        delayMinutes: Math.floor(delaySeconds / 60),
                        messageType: step.messageType,
                        contentText: step.messageType === 'text' ? step.textContent : null,
                        mediaUrl: step.messageType === 'audio' ? step.mediaUrl : null,
                        sendOnlyIf: 'qualquer'
                    };
                })
            }
        }
    });
    revalidatePath('/dashboard/campaigns');
}

export async function deleteCampaign(id: string) {
    const orgId = await getOrgId();
    await prisma.cadenceStep.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id, organizationId: orgId } });
    revalidatePath('/dashboard/campaigns');
}

// ==== RECUPERAÇÕES (Runs) ====
export async function stopRun(id: string) {
    const orgId = await getOrgId();
    await prisma.recoveryRun.update({
        where: { id, organizationId: orgId },
        data: { status: 'stopped' }
    });
    await prisma.stepDispatch.updateMany({
        where: { runId: id, status: 'pending' },
        data: { status: 'canceled', lastError: 'Run parada manualmente' }
    });
    revalidatePath('/dashboard/runs');
}

export async function deleteRun(id: string) {
    const orgId = await getOrgId();
    await prisma.stepDispatch.deleteMany({ where: { runId: id } });
    await prisma.recoveryRun.delete({ where: { id, organizationId: orgId } });
    revalidatePath('/dashboard/runs');
}

// ==== UTILS ====
function toSeconds(value: number, unit: 'minutes' | 'seconds' | 'hours'): number {
    if (unit === 'hours') return value * 3600;
    if (unit === 'minutes') return value * 60;
    return value;
}
