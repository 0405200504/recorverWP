import { WebhookProviderAdapter } from '../types/webhook';
import { customAdapter } from './custom';
import { hotmartAdapter } from './hotmart';

// TODO: Implment specific adapters properly mapping fields
export const kiwifyAdapter: WebhookProviderAdapter = customAdapter;
export const caktoAdapter: WebhookProviderAdapter = customAdapter;
export const shopifyAdapter: WebhookProviderAdapter = customAdapter;

export const providers: Record<string, WebhookProviderAdapter> = {
    custom: customAdapter,
    hotmart: hotmartAdapter,
    kiwify: customAdapter,
    cakto: customAdapter,
    shopify: customAdapter,
    cloudfy: customAdapter,
    kuenha: customAdapter,
    ninjapay: customAdapter,
    xgrow: customAdapter,
    ggcheckout: customAdapter,
    panteracheckout: customAdapter,
    nublapay: customAdapter,
};
