# RecoverWP - Checkout Recovery System

Sistema de recuperação automática de carrinho e faturamento (Pix/Boleto) focado em **WhatsApp** usando a Meta Cloud API. Suporte a Webhooks de plataformas como Hotmart, Kiwify, Cakto, Shopify (e Custom).

## Tecnologias e Arquitetura

- **Frontend & Backend**: Next.js 14+ (App Router)
- **Banco de Dados**: SQLite (para MVP via Prisma ORM) // Pode ser facilmente trocado para PostgreSQL
- **Autenticação**: NextAuth.js com Credentials
- **Disparos Automáticos**: Scheduler que lê fila do banco e aciona via Meta Cloud API

## Guia de Instalação Rápida

1. Inicialize o projeto e instale dependências:
   ```bash
   npm install
   ```
2. Crie e popule o Banco de Dados com as migrações e seed iniciais:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```
   > **Nota**: O seed criará seu usuário admin: `admin@recoverwp.com` / `admin123`.

3. Inicie o servidor:
   ```bash
   npm run dev
   ```

## Configuração de Webhook (Plataformas / Checkout)

Para interligar sua plataforma (Ex: Hotmart, Kiwify), aponte as notificações de Postback/Webhook para:
`https://SEU_DOMINIO/api/webhooks/checkout/[PROVIDER]?orgId=ID_DA_SUA_ORG`

_Providers mapeados suportados: `hotmart`, `kiwify`, `cakto`, `shopify`, `custom`._

### Validação HMAC do Payload (`custom`)
Para provedores Customizados, você pode setar um secret (copiado no menu Integrações).
Assinatura em NodeJS:
```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', SECRET).update(JSON.stringify(payload)).digest('hex');
// Envie header: X-Signature: hmac
```

## Configurando o WhatsApp Cloud API

1. Crie um APP no [Meta for Developers](https://developers.facebook.com/).
2. Adicione o produto **WhatsApp** e pegue seu *Phone Number ID*, *WABA ID* e o *Access Token*.
3. Cadastre esses dados na interface do RecoverWP (menu Integrações / Banco).
4. Configure o webhook do WhatsApp na Meta apontando para:
   `https://SEU_DOMINIO/api/webhooks/whatsapp`
   Configure o *Verify Token* usando as variáveis de ambiente (padrão local: `recoverwp-token-123`).
   Marque os eventos `messages` e `message_template_status_update`.

## Job Scheduler (Disparos / Retries)

O sistema exige chamadas constantes para a rota `/api/scheduler` para engatilhar as validações de delay (ex: "Enviar mensagem 15 minutos após Pix Gerado").
Em produção (Vercel, AWS, etc):
- Configure o **Cron Job** a cada 1 minuto batendo em `GET /api/scheduler` passando o header `Authorization: Bearer dev-cron-secret` (Configurável via .env).

## Testando Evento (Mock de Recuperação Automática)

Para injetar e simular um Abandono de Carrinho sem plataforma real:

```bash
curl -X POST http://localhost:3000/api/webhooks/checkout/custom?orgId=$(npx prisma studio para pegar O ID gerado) \
-H "Content-Type: application/json" \
-d '{
  "order_id": "TESTE_PIX_01",
  "customer": { "name": "João", "phone": "5511999999999", "email": "joao@teste.com" },
  "payment": { "amount": 197.9, "currency": "BRL", "method": "pix" },
  "status": "pending",
  "event_type": "pix_generated"
}'
```

*(Obs: Exige o Secret correto se não alterar as configs de Bypass)*
