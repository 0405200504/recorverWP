import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error('Nenhuma organizacao encontrada.');
        return;
    }

    const payload = {
        event_type: 'cart_abandoned',
        status: 'pending',
        order_id: `SIM_TESTE_${Date.now()}`,
        checkout_id: 'chk_123',
        customer: {
            name: 'Luiz Checkout Teste',
            phone: '5511999998888',
            email: 'testcheckout@recoverwp.com'
        },
        product: {
            id: 'prod_999',
            name: 'Curso Mestre do Frontend'
        },
        payment: {
            amount: 997.00,
            currency: 'BRL',
            method: 'pix'
        },
        checkout_url: 'https://checkout.com/recover/123',
        pix_code: '00020101021226580014br.gov.bcb.pi...'
    };

    const payloadStr = JSON.stringify(payload);

    // Gerar assinatura Custom
    const secret = org.webhook_secret;
    const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    const url = `http://localhost:3009/api/webhooks/checkout/custom?orgId=${org.id}`;

    console.log(`Disparando webhook para: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-signature': signature
        },
        body: payloadStr
    });

    const body = await response.json();
    console.log('Status HTTP:', response.status);
    console.log('Response Body:', body);

    await prisma.$disconnect();
}

run().catch(console.error);
