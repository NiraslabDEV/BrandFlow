# SKILL — connect-zumbopay-recurring

> Integração canónica para pagamentos recorrentes ZumboPay.
> Esta skill implementa subscrições mensais, pagamentos recorrentes, créditos e reconciliação segura.
> Nunca reinventar a arquitetura.

---

# Objetivo

Integrar ZumboPay para:

* subscrição recorrente
* renovação automática
* compra de créditos/upsells
* validação de pagamentos
* webhooks
* reconciliação
* prevenção de cobranças duplicadas

Toda lógica financeira deve existir exclusivamente no servidor.

---

# Regras obrigatórias

## Segurança

1. API Key NUNCA vai para frontend.

ERRADO:

```ts
fetch(zumboUrl,{
 headers:{
   apikey:"xxxx"
 }
})
```

CORRETO:

Frontend:

```ts
POST /api/payments/create
```

Servidor:

```ts
POST ZumboPay
apikey: process.env.ZUMBOPAY_API_KEY
Authorization: Bearer process.env.ZUMBOPAY_API_KEY
```

---

2. Cliente nunca envia:

* amount
* currency
* plan_price
* credits
* tenant_id
* subscription_status

Cliente envia apenas intenção:

```ts
{
   plan:"base"
}
```

Servidor calcula:

```ts
const plan=plans[body.plan]

amount=plan.price
credits=plan.monthlyCredits
```

---

3. Toda operação financeira precisa de idempotência.

Nunca:

```ts
insert payment
credit wallet
activate subscription
```

separadamente.

Sempre:

```ts
BEGIN;

insert payment

activate subscription

credit wallet

COMMIT
```

---

# Estrutura padrão

Tabela subscriptions:

```sql

subscriptions(

id uuid pk,

tenant_id uuid,

plan text,

status text,

provider text,

provider_ref text,

amount_cents int,

started_at timestamptz,

current_period_end timestamptz,

created_at timestamptz

)

```

Tabela payments:

```sql

payments(

id uuid pk,

tenant_id uuid,

kind text,

provider text,

provider_ref text,

reference text unique,

amount_cents int,

status text,

raw_response jsonb,

created_at timestamptz

)

```

---

Estados possíveis

subscription.status

```txt
trial
active
past_due
cancelled
expired
```

payment.status

```txt
pending
confirmed
failed
refunded
```

---

# Fluxo recorrente obrigatório

PASSO 1

Cliente escolhe plano:

```ts
Base
5500 MZN
```

Frontend:

```ts
POST /api/payments/create

{
plan:"base"
}
```

---

PASSO 2

Servidor:

* obtém tenant da sessão
* recalcula preço
* gera referência única

```ts

BFLOW-

timestamp

random

```

cria:

```ts

payment.status="pending"

```

---

PASSO 3

Servidor chama ZumboPay:

```ts

POST /payment_links

{

kind:"recurring",

title:"Plano Base",

amount:5500,

currency:"MZN"

}

```

guardar:

```ts

provider_ref
reference
```

---

PASSO 4

Cliente paga

---

PASSO 5

Webhook chega:

```ts

POST /api/webhooks/zumbopay

```

Verificar:

* assinatura HMAC
* idempotência
* transaction status

---

PASSO 6

Dentro de transação:

```ts

BEGIN

update payment confirmed

activate subscription

set current_period_end=+1 month

credit monthly credits

insert ledger

COMMIT

```

---

# Renovação automática

Cron diário:

```ts

/api/cron/subscription-renew

```

Fluxo:

Buscar:

```sql

current_period_end < now()
status='active'
```

Criar tentativa:

```ts

POST ZumboPay
kind:"recurring"
```

Se sucesso:

```ts

current_period_end +=30 days
```

Se falhar:

```ts

status='past_due'
```

---

# Reconciliação

Nunca confiar apenas em webhook.

Existem 3 caminhos:

1 webhook

2 validação ativa

```ts

POST /rpc/validate_transaction

```

3 cron reconciliação:

```ts

/api/cron/reconcile-payments
```

---

# Validação de transação

```ts

POST /rpc/validate_transaction

{

wallet_id,

merchant_id,

reference

}

```

Se:

```ts

output_ResponseCode==="INS-0"
```

confirmar pagamento.

---

# Erros

401

→ API Key inválida

403

→ scope insuficiente

422

→ payload inválido

429

→ retry exponencial

```ts

1s
2s
4s
8s
```

---

# Nunca fazer

❌ API key no frontend

❌ confiar no client para valores

❌ atualizar subscription fora de transação

❌ webhook sem idempotência

❌ webhook sem assinatura

❌ usar float

❌ ativar plano antes de confirmar pagamento

❌ creditar saldo duas vezes

❌ guardar dinheiro como decimal

---

# Testes obrigatórios

Vitest:

✓ cria subscrição

✓ pagamento confirmado

✓ webhook duplicado

✓ falha de renovação

✓ crédito mensal aplicado

✓ reconciliação funciona

✓ pagamento inválido não ativa plano

✓ callback repetido não duplica saldo

Definition of Done:

pnpm lint

pnpm test

todos verdes
