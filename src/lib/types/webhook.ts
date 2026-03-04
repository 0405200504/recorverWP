export type CanonicalEventType =
    | 'checkout_started'
    | 'pix_generated'
    | 'boleto_generated'
    | 'payment_failed'
    | 'payment_approved'
    | 'refund';

export type PaymentMethod = 'pix' | 'boleto' | 'card' | 'other';
export type OrderStatus = 'started' | 'pending' | 'failed' | 'approved' | 'refunded';

export interface NormalizedWebhookPayload {
    externalOrderId: string;
    externalCheckoutId?: string;
    lead: {
        name: string;
        phoneE164: string;
        email: string;
    };
    product?: {
        id: string;
        name?: string;
        offerId?: string;
    };
    payment: {
        amount: number;
        currency: string;
        method: PaymentMethod;
    };
    status: OrderStatus;
    eventType: CanonicalEventType;
    timestamp: string; // ISO 8601
    checkoutUrl?: string;
    pixCopyPaste?: string;
}

export interface WebhookProviderAdapter {
    verifySignature(payload: string, signature: string, secret: string): boolean;
    normalize(rawPayload: Record<string, any>): NormalizedWebhookPayload | null;
}
