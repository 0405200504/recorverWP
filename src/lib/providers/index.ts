import { WebhookProviderAdapter } from '../types/webhook';
import { customAdapter } from './custom';
import { hotmartAdapter } from './hotmart';
import { kiwifyAdapter } from './kiwify';
import { caktoAdapter } from './cakto';
import { appmaxAdapter } from './appmax';
import { eduzzAdapter } from './eduzz';
import { monetizzeAdapter } from './monetizze';

export const providers: Record<string, WebhookProviderAdapter> = {
    custom: customAdapter,
    hotmart: hotmartAdapter,
    kiwify: kiwifyAdapter,
    cakto: caktoAdapter,
    appmax: appmaxAdapter,
    eduzz: eduzzAdapter,
    monetizze: monetizzeAdapter,

    // Fallbacks para o customAdapter universal
    shopify: customAdapter,
    cloudfy: customAdapter,
    kuenha: customAdapter,
    ninjapay: customAdapter,
    xgrow: customAdapter,
    ggcheckout: customAdapter,
    panteracheckout: customAdapter,
    nublapay: customAdapter,
};

// Mantido para compatibilidade passada no arquivo
export { kiwifyAdapter, caktoAdapter }
