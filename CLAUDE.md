# CLAUDE.md — BrandFlow (Marketing OS · SaaS multi-tenant)

> **Marketing operacional automático para restaurantes.** O dono assina (5500 MZN/mês) e o BrandFlow entrega,
> todos os dias, **alertas no celular da equipa** ("Faz story AGORA: equipe chegando — grava 5s, close no produto"),
> seguindo uma **matriz semanal de Stories** (15h→23h) que nunca repete o tema; um **email semanal** de planeamento
> (segunda-feira) com a campanha da semana; um **calendário sazonal** (Dia dos Namorados, Inverno, Festival do
> Hambúrguer…); e um **Estúdio de IA** (Z.ai + Higgsfield) que gera banners/stories a partir do logo, fotos e cores
> da marca, consumindo **créditos** (incluídos no plano + comprados por upsell).
>
> **É multi-tenant.** Um deploy serve muitos restaurantes. Cada cliente = um `tenant` com a sua subscrição, marca,
> matriz e créditos. **Planos e gating EXISTEM.** Pagamentos por **dois gateways selecionáveis no painel** —
> **ZumboPay (recorrência)** + **Paysuite (avulso/créditos)**. Funil de aquisição **medido desde o dia 1**
> (GTM/Pixel/GA4/Ads) com config 100% no painel. Desenvolvido por **Niraslab** (niraslab.dev@gmail.com).

---

## ⚡ COMO TRABALHAR NESTE REPO (regras para o agente de IA)

1. **Uma fase do `ROADMAP.md` por sessão.** Nunca antecipar fases futuras.
2. **Antes de codar:** ler este ficheiro + a fase atual no ROADMAP. Listar os ficheiros que vais criar/alterar
   e o plano de testes. Esperar confirmação se houver dúvida de escopo.
3. **Reaproveitar antes de inventar.** O motor de pagamentos, dinheiro e o esqueleto do monorepo já existem no
   **QR MESAS / Delivery OS** (`C:\Users\Gabriel\Desktop\QR MESAS`). Copiar/adaptar (ver secção 15), não reescrever.
4. **Skeleton-first → tests-before-code → implementação** (Método Akita). Nenhuma lógica de domínio sem teste Vitest escrito ANTES.
5. **Multi-tenant é uma decisão fechada.** TODA tabela de negócio tem `tenant_id`. RLS isola por `membership`. **NUNCA**
   escrever query, RPC ou rota que possa ler/escrever dados de outro tenant. O `tenant_id` vem SEMPRE do servidor
   (sessão), **nunca** do payload do client.
6. **Dinheiro sempre em centavos inteiros.** Preços de plano/créditos/upsell só existem no servidor. O client envia
   intenção (`{ plan:"base" }`, `{ pack:"credits10" }`), **nunca** `amount`, `currency`, `credits`, `tenant_id` ou `status`.
7. **Créditos de IA são dinheiro.** Débito atómico, na mesma transação que cria o job. Nunca confiar no client para saldo, custo ou direito a gerar.
8. **Pagamentos são agnósticos de gateway.** Toda a lógica passa por `packages/payments` (interface única). O gateway
   ativo (ZumboPay/Paysuite) é **config de painel**, nunca hardcoded numa rota. Idempotência + assinatura + transação única **sempre** (skill `/connect-zumbopay-recurring`).
9. **Tracking tem disciplina A/B:** IDs públicos (A) podem ir ao client; tokens secretos (B) **nunca**. `subscribe`/`purchase`
   só disparam quando o pagamento está **confirmado** (nunca no submit). Ver secção 19.
10. **Copiar os padrões canónicos da secção 16** em vez de inventar variações.
11. **Definition of Done de toda fase:** `pnpm lint && pnpm test` verdes + checklist da fase no ROADMAP marcado + commit convencional (`feat(scope): ...`).
12. Em caso de ambiguidade: escolher a opção mais simples que respeite a secção 14 ("O que NUNCA fazer") e documentar com `// DECISÃO:`.

---

## 1. Visão do produto

- **O que é:** um SaaS que dá a restaurantes pequenos/médios um **marketing operacional consistente** sem precisarem
  de equipa de marketing. O produto pensa pela equipa: diz **o que postar, quando e como**, manda a campanha da semana,
  marca as datas sazonais e gera as imagens.
- **Mercado:** Maputo → Moçambique. UI 100% em **português**. Moeda **MZN (MT)**. Fuso `Africa/Maputo` (UTC+2).
- **Dor que resolve:** o erro nº1 dos restaurantes é **repetir o mesmo conteúdo todos os dias**. O BrandFlow mantém a
  *estrutura* fixa (movimento → história → preparação → prova social → escassez → encerramento) mas **muda o tema** a
  cada dia/semana (secção 5).
- **Diferencial:** alertas que chegam como **notificação no celular** (igual às do WhatsApp/X/email) com instrução
  pronta a executar; calendário sazonal moçambicano; Estúdio de IA barato (Z.ai refina prompt → Higgsfield gera).
- **Modelo:** **B2B SaaS recorrente**. Plano base **5500 MZN/mês** + **upsells** (pacotes de créditos de IA, campanha extra).

### 1.1 Planos & gating (AQUI planos EXISTEM — contraste com o Delivery OS)
- O acesso às features é **gated por plano e por saldo de créditos**. Fonte de verdade dos limites: `packages/core/src/plans.ts` (não a BD; a BD só guarda *qual* plano o tenant tem).
- **MVP vende um único plano "Base" (5500 MZN/mês)** que inclui: matriz de Stories + alertas, calendário sazonal,
  email semanal, painel, e **4 créditos de IA/mês**. Upsells em créditos: **+10 imagens = 500 MZN**, **campanha extra = 700 MZN**.
- Tiers **Pro / Premium** (vídeos IA, automações, analytics, WhatsApp, Meta Ads) ficam **definidos em `plans.ts` mas não vendidos no MVP** — entram em fases futuras sem refactor (só "ligar" o flag do plano).
- Gating é sempre **verificado no servidor** (`assertPlan(tenant, feature)` / `assertCredits(tenant, cost)`), nunca só escondendo botão no client.

### 1.2 Decisões fundadoras (travadas — caras de reverter; só mudam por ADR)
Decididas no arranque porque retrofitá-las exige refactor largo ou perda de dados. Respeitar SEMPRE:

1. **Dinheiro é por `tenant`, não por restaurante.** Subscrição, créditos e pagamentos vivem no `tenant`. 1 tenant = 1 restaurante no MVP, mas adicionar restaurantes depois é **aditivo** (nunca re-chavear billing). Conteúdo (stories/campanhas/assets) é por `restaurant_id`.
2. **A equipa não faz login no MVP.** O dono é o utilizador; os alertas vão para `push_subscriptions` com escopo de **tenant** (N celulares por tenant). "Marcar feito" é a nível de tenant. `memberships.role` já existe para ligar contas/roles depois sem dor.
3. **Todo efeito externo passa por outbox durável.** Push, email, CAPI e IA **nunca** disparam inline no request: vão para uma tabela-fila com `status`+`attempts`+retry (`notifications`, `ai_generations`). Falha nunca perde a mensagem nem trava o request (6.3, 16.4).
4. **Créditos têm proveniência e validade.** `credit_ledger.source` (`monthly`/`purchased`/…) + `expires_at`. Mensais expiram na renovação (use-it-or-lose-it); comprados não expiram; o gasto consome **monthly antes de purchased** (8.3). Sem isto, é impossível expirar mensais depois.
5. **Ciclo de vida da subscrição é política fechada:** `trial` → `active` → `past_due` (3 dias de graça; depois bloqueia features pagas mas mantém login+dados) → `canceled` (read-only 30 dias; depois arquiva). Um único gate central `assertActiveSubscription(tenant)` (9.4).
6. **Tempo sempre em UTC; hora local calculada do `restaurants.timezone`.** Nunca guardar hora local crua. Crons são catch-up-safe (`scheduled_for <= now()`), nunca "exatamente às 15h".
7. **Segredos cifrados em repouso.** Os campos (B) de `platform_settings` (chaves de gateway/CAPI/Resend) vivem no **Supabase Vault**, nunca em texto puro. Logs append-only (`event_log`/`ledger`); migrations só aditivas; entidades-chave usam **soft-delete** (`deleted_at`), não hard DELETE.

---

## 2. Stack (decisões fechadas — não mudar sem ADR em `/docs/decisions`)

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript | Landing + painel do cliente + super-admin no mesmo código; route handlers para webhooks/cron/push/IA |
| UI | Tailwind CSS + shadcn/ui | Velocidade; tema por marca via CSS vars |
| Estado no client | TanStack Query | Cache, retry, reconexão |
| Backend/DB | Supabase (Postgres + RLS **multi-tenant** + Realtime + Auth + Storage) | RLS isola tenants; Auth pronto; Storage para logos/fotos/imagens IA |
| Validação | Zod em toda boundary | Inputs nunca confiáveis; `tenant_id`/valores nunca vêm do client |
| Scheduler | **pg_cron** (Supabase) → chama route handler/Edge Function | Matriz 15h→23h, email de segunda, renovação e reconciliação de pagamentos |
| Notificações | **Web Push (VAPID, PWA service worker)** + Email | Notificação de sistema no celular (estilo WhatsApp/X). FCM = upgrade futuro |
| Email | Resend (default, **portado do QR MESAS**) — swappable por SendGrid/SMTP | Email semanal + transacionais |
| **Pagamentos** | **ZumboPay (recorrência) + Paysuite (avulso/créditos)** — abstraídos em `packages/payments`, **gateway selecionável no painel** | Zumbo trata assinatura recorrente; Paysuite trata pacotes avulsos; alternáveis sem mexer em código |
| **Tracking** | GTM + GA4 + Meta Pixel + Google Ads (config no painel) + **Meta CAPI / Google Enhanced** server-side | Medir o funil landing→signup→assinatura desde o dia 1; resistir a iOS/adblock |
| IA | **Z.ai** (refina prompt / análise) + **Higgsfield** (gera imagem) | Fluxo barato: Z.ai monta o prompt, Higgsfield renderiza. Skill `higgsfield-*` disponível |
| Fila de IA | Tabela `ai_generations` (status) + worker que faz poll | Padrão `print_jobs` do QR MESAS. Redis = scale-up futuro |
| Testes | Vitest (unit/integração) + Playwright (e2e) | |
| Monorepo | pnpm workspaces + Turborepo | Igual ao QR MESAS |
| Hosting | Vercel (web) + Supabase Cloud; worker de IA na Vercel/Railway | |

**Regra de ouro:** a equipa do restaurante usa SEMPRE o browser/PWA. Zero instalação de app store.

---

## 3. Estrutura do repositório

```
/apps/web                          # Next.js: landing + painel do cliente + super-admin
  /app/(marketing)/                # landing pública, /precos, /signup (anon) — INSTRUMENTADA (funil)
  /app/(app)/                      # painel do TENANT (autenticado, gated por plano)
    dashboard/                     #   stories de hoje, email enviado, campanha ativa, créditos
    stories/                       #   matriz do dia/semana + marcar "feito"
    calendario/                    #   calendário sazonal + campanhas do mês
    campanhas/                     #   campanha da semana (gerada) + edição
    estudio-ia/                    #   upload de marca + gerar banner/story (debita créditos)
    creditos/                      #   saldo, histórico, comprar pacote (upsell)
    definicoes/                    #   marca (logo/cores/fotos), horários, subscrição
  /app/(admin)/                    # super-admin Niraslab
    tenants/  metricas/            #   tenants, planos, MRR, funil de aquisição
    integracoes/                   #   ⭐ HUB: tags (GTM/Pixel/GA4/Ads) + chaves (Zumbo/Paysuite/Resend) + provider ativo
  /app/api/payments/               # cria checkout (assinatura OU pacote) — escolhe provider via config
  /app/api/webhooks/zumbopay/      # webhook ZumboPay (HMAC + idempotência) — assinatura/renovação/créditos
  /app/api/webhooks/paysuite/      # webhook Paysuite (HMAC + idempotência) — avulso/créditos
  /app/api/payments/verify/        # verificação ATIVA da transação (não depende de webhook)
  /app/api/cron/subscription-renew/   # renovação recorrente (ZumboPay)
  /app/api/cron/reconcile-payments/   # reconciliação (rede de segurança)
  /app/api/cron/dispatch-stories/  # pg_cron por hora → cria/dispara alertas do slot
  /app/api/cron/weekly-email/      # segunda 08h → email semanal por tenant
  /app/api/push/subscribe/         # regista subscription Web Push (VAPID)
  /app/api/ai/generate/            # enfileira geração de imagem (debita créditos, valida plano)
  /app/api/track/                  # eventos first-party do funil (service role)
  /public/sw.js · /public/manifest.json   # PWA + Web Push
  /lib/analytics/track.ts          # ⭐ ÚNICO lugar que toca dataLayer/fbq/gtag
/config/brand.ts                   # identidade do PRÓPRIO produto BrandFlow (não do cliente)
/packages/core                     # money (PORTADO), plans, schemas (Zod), story-matrix, credits, gating
/packages/db                       # migrations multi-tenant + seed + tipos gerados
/packages/payments                 # ⭐ interface única + zumbopay + paysuite + mock (PORTADO/estendido do QR MESAS)
/packages/ai                       # Z.ai + Higgsfield providers + mock + montagem de prompt
/packages/notifications            # web-push (VAPID) + email (Resend) providers + templates
/services/worker                   # poll ai_generations.queued → Z.ai+Higgsfield → Storage
/docs/decisions                    # ADRs
.claude/skills/connect-zumbopay-recurring/SKILL.md   # spec canónica ZumboPay (raiz: SKILL.md)
ROADMAP.md                         # fases de execução com DoD
```

---

## 4. Arquitetura multi-tenant

**Princípio:** uma instância serve N restaurantes. **Todo dado de negócio carrega `tenant_id`.** Isolamento por RLS
baseado em `memberships`. Config **da plataforma** (tags, chaves de gateway, provider ativo) vive num **singleton só do super-admin** (`platform_settings`), **fora** do alcance dos tenants.

### Regras
1. RLS habilitado em TODAS as tabelas com `tenant_id` (template 16.1). `platform_settings` e `seasonal_dates` são geridas só pelo super-admin.
2. O `tenant_id` **NUNCA** vem do payload do client. Vem da sessão (`currentTenant()`) ou do `auth.uid()` via RLS.
3. Preços de plano e custo de créditos são SEMPRE recalculados no servidor a partir de `plans.ts`. O client só diz a intenção.
4. Gating: cada feature server-side chama `assertPlan(tenant, feature)` e/ou `assertCredits(tenant, cost)` antes de agir.
5. Os **IDs públicos de tracking** (A) saem via RPC `get_public_tracking()` (anon, colunas listadas). Os **tokens secretos** (B) e as **chaves de gateway** **nunca** saem num RPC anon — só server-side (service role).

### Schema de referência (migrar em fases — ver ROADMAP)

```
-- PLATAFORMA (singleton, só super-admin) ----------------------------------
platform_settings   (id smallint pk default 1 check (id=1),
                     -- seleção de gateway (alternável no painel):
                     subscription_provider text check in ('zumbopay','paysuite','mock') default 'zumbopay',
                     credits_provider      text check in ('zumbopay','paysuite','mock') default 'paysuite',
                     -- (B) SEGREDOS de gateway/email — cifrados (Supabase Vault), nunca ao client nem em texto puro:
                     zumbopay_api_key text, zumbopay_webhook_secret text,
                     zumbopay_wallet_id text, zumbopay_merchant_id text,
                     paysuite_api_key text, paysuite_webhook_secret text,
                     resend_api_key text,
                     -- (A) IDs PÚBLICOS de tracking — vão ao client via get_public_tracking():
                     gtm_container_id text, meta_pixel_id text, ga4_measurement_id text,
                     gads_conversion_id text, gads_conversion_label text,
                     -- (B) SEGREDOS de tracking — só server-side:
                     meta_capi_token text, gads_developer_token text,
                     updated_at timestamptz)

-- TENANTS -----------------------------------------------------------------
tenants             (id uuid pk, name, slug text unique, plan text check in ('base','pro','premium') default 'base',
                     status text check in ('trial','active','past_due','canceled') default 'trial',
                     trial_ends_at timestamptz, grace_until timestamptz null, deleted_at timestamptz null, created_at)
                     -- billing/créditos/subscrição vivem AQUI (1.2.1), nunca no restaurant
memberships         (id uuid pk, tenant_id, user_id uuid (auth.users), role text default 'owner', created_at,
                     unique(tenant_id, user_id))
restaurants         (id uuid pk, tenant_id, name, slug, logo_url, brand_colors jsonb, photos jsonb,
                     open_hour int default 15, close_hour int default 23, timezone text default 'Africa/Maputo',
                     deleted_at timestamptz null, created_at)
subscriptions       (id uuid pk, tenant_id, plan, status, amount_cents int, provider text, provider_ref text,
                     started_at timestamptz, current_period_end timestamptz, created_at)
story_tasks         (id uuid pk, tenant_id, restaurant_id, scheduled_for timestamptz, week_of_month int, weekday int,
                     hour int, theme text, title text, instructions text,
                     status text check in ('pending','sent','done','skipped') default 'pending',
                     sent_at timestamptz, done_at timestamptz, created_at)
campaigns           (id uuid pk, tenant_id, month date, week_of_month int, theme text, title text, description text,
                     status text check in ('draft','active','done') default 'draft', deleted_at timestamptz null, created_at)
seasonal_dates      (id uuid pk, country text default 'MZ', date date, name text, suggestion text)  -- GLOBAL
push_subscriptions  (id uuid pk, tenant_id, user_id uuid null, label text, endpoint text unique, keys jsonb, created_at)
                     -- escopo de TENANT (equipa sem login no MVP, 1.2.2); user_id null; label = nome do aparelho
notifications       (id uuid pk, tenant_id, channel text check in ('push','email'), title, body, payload jsonb,
                     status text check in ('queued','sent','failed') default 'queued',
                     attempts int default 0, next_attempt_at timestamptz, dedupe_key text unique,  -- OUTBOX: retry + idempotência (6.3)
                     sent_at timestamptz, created_at)
ai_generations      (id uuid pk, tenant_id, restaurant_id, kind text check in ('story','feed','banner'),
                     prompt text, refined_prompt text, credits_cost int check (>=0),
                     status text check in ('queued','processing','done','failed') default 'queued',
                     image_url text, error text, created_at, completed_at)
credit_wallets      (id uuid pk, tenant_id unique, balance int default 0 check (balance >= 0), updated_at)
                     -- balance = soma das entradas NÃO expiradas do ledger; gasto consome monthly antes de purchased (8.3)
credit_ledger       (id bigserial pk, tenant_id, delta int,
                     source text check in ('monthly','purchased','refund','adjust','expiry'),
                     expires_at timestamptz null, reason text, ref_id uuid null, created_at)  -- append-only; mensais expiram, comprados não
payments            (id uuid pk, tenant_id, kind text check in ('subscription','credits'),
                     provider text check in ('zumbopay','paysuite','mock'),
                     provider_ref text, reference text unique,            -- 'BFLOW-<ts>-<rand>'
                     amount_cents int, credits_granted int default 0,
                     status text check in ('pending','confirmed','failed','refunded') default 'pending',
                     idempotency_key text unique, raw_response jsonb, created_at)
marketing_events    (id bigserial pk, session_id text, tenant_id uuid null, type text, value_cents int null,
                     utm jsonb, payload jsonb, created_at)  -- append-only; INSERT só via /api/track (service role)
event_log           (id bigserial pk, tenant_id null, type text, payload jsonb, created_at)  -- append-only
```

Notas:
- `payments.reference` único = âncora de idempotência (formato `BFLOW-<timestamp>-<random>`).
- `credit_ledger`, `marketing_events` e `event_log` append-only. `credit_wallets.balance` é a soma materializada, atualizada atomicamente com o ledger.
- A marca **do cliente** vive em `restaurants`; a marca **do produto** em `config/brand.ts`; as **chaves/tags da plataforma** em `platform_settings`.

---

## 5. A Matriz de Stories (coração do produto — `packages/core/src/story-matrix.ts`)

**A REGRA DE OURO:** a *estrutura* do dia é **fixa**; o *tema* muda. É o que mantém consistência sem parecer repetição.

### Estrutura fixa de cada dia (9 slots, 15h→23h)
```
15h → Movimento        16h → História         17h → Preparação
18h → Aberto           19h → Primeiros pedidos 20h → Produção
21h → Prova social     22h → Escassez          23h → Encerramento
```

### Temas que rodam (4 semanas, sem repetir — repete o ciclo no mês seguinte)
- **Semana 1 — operação por dia:** Seg Bastidores · Ter Produto · Qua Prova Social · Qui Experiência · Sex Alta Demanda · Sáb Evento · Dom Família.
- **Semana 2 — Pessoas:** Conheça a Cozinha / o Chapeiro / o Atendente / o Gerente / os Entregadores / História da Empresa / Cultura da Equipa.
- **Semana 3 — Autoridade:** Ingredientes Premium · Higiene · Controle de Qualidade · Receitas Exclusivas · Nº de Clientes · Tempo Médio · Diferenciais.
- **Semana 4 — Conversão:** Oferta do Dia · Combo do Dia · Mais Vendido · Mais Lucrativo · Favorito dos Clientes · Desafio da Equipa · Melhor Semana.

> A matriz completa (slot × tema → `title` + `instructions`) é uma **constante tipada** em `story-matrix.ts` — fonte única.

### Como vira alerta
1. `generateStoryTasks(tenantId, restaurant, fromDate, days)` materializa `story_tasks` (1 por slot/dia) com `scheduled_for` em UTC, derivado do `timezone`/`open_hour`/`close_hour`.
2. O **pg_cron** chama `/api/cron/dispatch-stories` de hora a hora → apanha tasks `pending` vencidas → dispara push (secção 6) → marca `sent`.
3. **A instrução é sempre rica, nunca "faz story agora":** ex.: *"Faz story AGORA: mostra a equipa a preparar o molho. Grava 5s, faz close no produto."*
4. A equipa marca **"Feito"** (`done`) — alimenta dashboard e métricas de adesão.

---

## 6. Notificações — Web Push (PWA) + Email

> **O alerta tem de aparecer como notificação no celular da equipa** (na barra de notificações, igual às do WhatsApp/X/email).
> No MVP isto é **Web Push** (VAPID + service worker), sem app store. FCM = upgrade futuro (ADR).

### 6.1 Web Push (canal primário dos alertas de Stories)
- A equipa instala o PWA (`manifest.json` + `sw.js`) e aceita notificações → `POST /api/push/subscribe` grava `push_subscriptions` (ligado ao tenant/user).
- `packages/notifications/src/web-push.ts` (lib `web-push`, `VAPID_*`) envia: título curto + instrução do slot + deep link `/stories`.
- Falha de envio **nunca** quebra o cron: loga em `event_log` e segue. Subscription 404/410 → apaga a row.

### 6.2 Email
- **Resend** (portado do QR MESAS), swappable. Usado em: boas-vindas, pagamento confirmado/falhou, e o **email semanal** (secção 7).
- Push = "faz agora"; email = "o plano da semana". O email é redundância + planeamento, não substitui o push.

### 6.3 Outbox durável (push + email + CAPI) — decisão fundadora 1.2.3
- `notifications` é uma **fila com retry**, não um log: `status` (`queued`→`sent`/`failed`), `attempts`, `next_attempt_at`, `dedupe_key` (idempotência). Push e email são **enfileirados**, nunca enviados inline no request que os origina.
- Um worker/cron processa `queued` com backoff exponencial; `dedupe_key` impede duplicados (ex.: 2 crons a apanhar a mesma `story_task`, ou retry de email). Esgotadas as tentativas → `failed` + `event_log`, reentregável à mão.
- **Nenhuma falha de notificação trava o fluxo que a originou** (dispatch de stories, confirmação de pagamento, etc.). O mesmo princípio vale para Meta CAPI (19.5): fire-and-forget enfileirado, log em falha.

---

## 7. Calendário sazonal + Email semanal

- **`seasonal_dates`** é GLOBAL (sem `tenant_id`), curada pelo super-admin: data + nome + sugestão (Dia dos Namorados, Inverno, Festival do Hambúrguer, Copa, férias…).
- No início do mês, o sistema gera `campaigns` do tenant a partir das datas sazonais + rotação de temas.
- **Email semanal (segunda 08h, por tenant)** — pg_cron → `/api/cron/weekly-email`: assunto *"Planeamento da semana — <restaurante>"*; conteúdo = campanha da semana + datas próximas + sugestões + CTA.

---

## 8. Estúdio de IA (Z.ai + Higgsfield) + Créditos

### 8.1 Fluxo
1. **Marca:** em `/definicoes`, sobe logo + fotos + cores → Storage + `restaurants.{logo_url,photos,brand_colors}`.
2. **Pedido:** em `/estudio-ia`, escolhe tipo (`story`/`feed`/`banner`), tema/sazonalidade e foto base opcional.
3. **Montagem do prompt (`packages/ai` + Z.ai):** combina marca + cores + tema num prompt refinado.
4. **Geração (Higgsfield):** o worker renderiza → bucket `ai-assets` (privado, por tenant).
5. **Entrega:** imagem no estúdio para download/partilha.

### 8.2 Fila de jobs (padrão `print_jobs` do QR MESAS)
- `POST /api/ai/generate` valida `assertPlan`, **debita créditos atomicamente** (16.3) e cria `ai_generations` em `queued`. Resposta imediata.
- `services/worker` faz poll `queued` → `processing` → Z.ai+Higgsfield → `done`/`failed` (com **estorno** do crédito).
- `packages/ai` tem **provider mock** (`AI_PROVIDER=mock`).

### 8.3 Créditos (são dinheiro)
- `credit_wallets.balance` + `credit_ledger` (append-only). Débito/crédito **sempre** na mesma transação (16.3).
- Plano Base inclui **4 créditos/mês** (recarregados na renovação). Upsell: **+10 = 500 MZN**, **campanha extra = 700 MZN** (via `credits_provider`).
- Gerar 1 imagem = **1 crédito** (`plans.ts`). Sem saldo → 402 + CTA de compra. Job `failed` → crédito **estornado** (`source='refund'`).
- **Validade (decisão fundadora 1.2.4):** créditos `monthly` expiram na renovação (use-it-or-lose-it, `expires_at` = fim do período); `purchased` não expiram. O gasto consome **monthly antes de purchased**. `balance` = soma das entradas não expiradas; na renovação, o remanescente `monthly` é zerado por uma entrada de ledger (`source='expiry'`) **antes** de conceder os novos 4. Sem `source`/`expires_at` no ledger, isto é impossível de retrofitar.

---

## 9. Pagamentos — dois gateways selecionáveis (`packages/payments`)

> **Decisão fechada:** ZumboPay e Paysuite coexistem atrás de **uma interface única**. Qual gateway trata o quê é
> **config de painel** (`platform_settings.subscription_provider` / `credits_provider`), alternável a qualquer momento
> sem mexer em código. **Padrões default:** `subscription_provider = zumbopay` (recorrência), `credits_provider = paysuite` (avulso).
> Toda a lógica financeira é **server-side**, com idempotência, assinatura e transação única. Spec canónica do ZumboPay:
> skill **`/connect-zumbopay-recurring`** (raiz: `SKILL.md`).

### 9.1 Interface (`packages/payments/src/provider.ts`)
```ts
interface PaymentProvider {
  createCheckout(input: { kind:'subscription'|'credits', amountCents:Cents, reference:string, title:string,
                          returnUrl:string, callbackUrl:string }): Promise<{ providerRef:string, checkoutUrl:string }>;
  verifyWebhook(rawBody:string, headers:Headers): { ok:boolean, reference?:string, status?:'confirmed'|'failed' };
  validateTransaction(reference:string): Promise<'confirmed'|'pending'|'failed'>;   // verificação ativa
}
// fábrica: getProvider(purpose:'subscription'|'credits') lê platform_settings → instancia zumbopay|paysuite|mock
```
- Implementações: `zumbopay.ts`, `paysuite.ts` (PORTADO do QR MESAS), `mock.ts` (testes/dev).
- O cliente envia só intenção (`{ plan:"base" }` / `{ pack:"credits10" }`). O servidor obtém o tenant da sessão, **recalcula** o valor a partir de `plans.ts`, gera `reference = BFLOW-<ts>-<rand>`, cria `payments.pending`, chama o provider, guarda `provider_ref`.

### 9.2 ZumboPay (recorrência) — conforme `SKILL.md`
- Checkout: `POST /payment_links` `{ kind:'recurring', title, amount, currency:'MZN' }`.
- **Renovação automática:** cron diário `/api/cron/subscription-renew` busca `status='active' AND current_period_end < now()`, tenta cobrar; sucesso → `current_period_end += 30d` + recarrega créditos; falha → `past_due`.
- **Verificação ativa:** `POST /rpc/validate_transaction { wallet_id, merchant_id, reference }` → `output_ResponseCode === 'INS-0'` confirma.
- Erros: 401 (key inválida), 403 (scope), 422 (payload), 429 (retry exponencial 1s/2s/4s/8s).

### 9.3 Confirmação (idempotente, transação única) — qualquer gateway
```
BEGIN
  payments: ON CONFLICT (idempotency_key) DO NOTHING  -- 0 linhas = duplicado → 200, sem efeito
  update payments set status='confirmed'
  -- subscription: subscriptions.active + tenants.active + current_period_end=+1mês + recarrega 4 créditos
  -- credits:      grant_credits(tenant, credits_granted)  (16.3)
  insert credit_ledger / event_log
COMMIT
```
- **3 caminhos** (herdados do QR MESAS): webhook (`/api/webhooks/{zumbopay|paysuite}`, HMAC), verificação ativa (`/api/payments/verify`), cron de reconciliação (`/api/cron/reconcile-payments`). Todos convergem na mesma confirmação idempotente.
- **NUNCA** ativar plano/creditar antes de `confirmed`. **NUNCA** creditar duas vezes (idempotência por `reference`/`idempotency_key`).
- Gotchas herdados: `reference` alfanumérico; `return_url`/`callback_url` com esquema; pago = status terminal do gateway.

### 9.4 Ciclo de vida da subscrição (política fundadora 1.2.5)
`trial` → `active` → `past_due` → `canceled`. **Um único gate central `assertActiveSubscription(tenant)`** (não espalhar a lógica):
- **`past_due`** (renovação falhou): `tenants.grace_until = now()+3d` com acesso total; passado isso, bloqueia features pagas (matriz/IA) mas **mantém login e dados** + CTA "Regularizar".
- **`canceled`**: **read-only 30 dias** (vê histórico, não gera nada); depois arquiva (`tenants.deleted_at`; dados retidos para auditoria, **nunca** hard delete).
- Reativar (novo pagamento confirmado) → `active` + recarrega créditos mensais. Toda transição grava `event_log`.

---

## 10. Painel do cliente (tabs do tenant)

Auth Supabase. Tabs: **Dashboard · Stories · Calendário · Campanhas · Estúdio IA · Créditos · Definições.** Tudo gated por plano/saldo no servidor.

- **Dashboard:** ✅ stories de hoje (X/9 feitos), ✅ email semanal enviado, ✅ campanha ativa, ✅ saldo de créditos.
- **Stories:** matriz do dia (9 slots) com instrução, estado e botão **"Feito"**; vista semana.
- **Calendário / Campanhas:** datas sazonais + campanhas geradas; campanha da semana editável.
- **Estúdio IA:** upload de marca + gerar `story`/`feed`/`banner` (debita crédito) + galeria.
- **Créditos:** saldo, histórico (`credit_ledger`), comprar pacote (via `credits_provider`).
- **Definições:** marca, horários/timezone, subscrição (plano, próximo débito, estado).

---

## 11. Super-admin (Niraslab)

Rota `(admin)` restrita ao Niraslab (role próprio, **não** é um tenant):
- **Tenants:** plano, estado, MRR, adesão à matriz; forçar plano/estado; ver pagamentos.
- **Métricas:** assinantes ativos, churn, créditos consumidos, jobs IA falhados, e o **funil de aquisição** (secção 19.6).
- **Integrações (secção 18):** colar tags (GTM/Pixel/GA4/Ads) + chaves (ZumboPay/Paysuite/Resend), escolher o **gateway ativo** por finalidade, testar ligação.
- Curadoria de `seasonal_dates` (global) e da matriz padrão.

---

## 12. Comandos

```bash
pnpm dev            # web em localhost:3000
pnpm test           # vitest run (CI/DoD)
pnpm test:watch     # vitest watch
pnpm test:e2e       # playwright
pnpm lint           # eslint + tsc --noEmit por package
pnpm db:migrate     # supabase db reset (aplica migrations + seed)
pnpm db:types       # regenera tipos do schema
pnpm worker:dev     # worker de IA com provider mock
pnpm cron:local     # dispara crons localmente (dispatch-stories / weekly-email / renew / reconcile)
```

---

## 13. Variáveis de ambiente (`.env.example`)

> Precedência: o que está em `platform_settings` (painel) tem **prioridade**; se vazio, cai no `.env`. Assim funciona tanto "tudo no painel" como "tudo no `.env`".

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # só servidor
APP_BASE_URL=
CRON_SECRET=                      # protege /api/cron/* e /api/webhooks/* internos
# Pagamentos (fallback do painel):
ZUMBOPAY_API_KEY=                 # recorrência
ZUMBOPAY_WEBHOOK_SECRET=
ZUMBOPAY_WALLET_ID=
ZUMBOPAY_MERCHANT_ID=
PAYSUITE_API_KEY=                 # avulso/créditos
PAYSUITE_WEBHOOK_SECRET=
# Email:
RESEND_API_KEY=
# Web Push (VAPID):
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
# Tracking (fallback do painel; IDs públicos podem viver no painel):
META_CAPI_TOKEN=                  # segredo (B)
GOOGLE_ADS_DEVELOPER_TOKEN=       # segredo (B)
# IA:
AI_PROVIDER=mock|live
ZAI_API_KEY=
HIGGSFIELD_API_KEY=
```

---

## 14. O que NUNCA fazer

- ❌ Float para dinheiro ou créditos. Sempre inteiros (centavos / unidades).
- ❌ Aceitar `tenant_id`, `amount`, `currency`, `credits` ou `status` do client. Vêm do servidor.
- ❌ Query/RPC/rota sem isolamento de tenant — **vazar dados entre restaurantes é o pior bug possível**.
- ❌ Chave de API (gateway, CAPI, Ads dev token, Resend) no frontend ou num RPC anon. Só server-side.
- ❌ Confiar no client para plano, saldo, custo de geração, preço ou estado de pagamento.
- ❌ Hardcodar o gateway numa rota. O provider ativo vem de `platform_settings` (alternável).
- ❌ Ativar plano/creditar **antes** de `confirmed`; creditar duas vezes; atualizar subscrição fora de transação.
- ❌ Webhook sem assinatura verificada e sem idempotência (por `reference`/`idempotency_key`).
- ❌ Gerar imagem de IA sem `assertPlan` + débito atómico; job falhado sem estorno.
- ❌ Disparar `subscribe`/`purchase` no submit do checkout — só quando o pagamento está **confirmado** (19.1).
- ❌ Expor token secreto (B) no `get_public_tracking()`; carregar GTM/Pixel/Ads sem consentimento (`dl_consent`).
- ❌ Mandar alerta "faz story agora" sem contexto; hardcodar matriz/sazonalidades fora da fonte única.
- ❌ Pôr billing/subscrição/créditos no `restaurant` — vivem no `tenant` (1.2.1).
- ❌ Assumir 1 user por tenant — a equipa partilha push por tenant; `memberships.role` é para o futuro (1.2.2).
- ❌ Disparar push/email/CAPI inline no request — sempre via outbox com retry (1.2.3 / 6.3).
- ❌ Guardar créditos sem `source`/`expires_at`, ou deixar os mensais acumularem (1.2.4 / 8.3).
- ❌ Hard DELETE em entidades-chave — usar `deleted_at` (soft-delete). Espalhar o gate de subscrição em vez de `assertActiveSubscription` (9.4).
- ❌ Guardar chaves de API em texto puro — Supabase Vault (1.2.7).
- ❌ Pular fase do ROADMAP ou alterar contrato de fase concluída sem ADR.

---

## 15. Reaproveitamento do QR MESAS / Delivery OS (copiar, depois adaptar)

Fonte: `C:\Users\Gabriel\Desktop\QR MESAS`.

| Trazer para cá | De | O que mudar |
|---|---|---|
| `money.ts` | `packages/core/src/money.ts` | Nada — `Cents`, `formatMT` |
| Esqueleto monorepo | pnpm + Turborepo + tsconfig/eslint/vitest base | Adaptar nomes dos packages |
| Paysuite (provider/mock/real/`reference`) | `packages/paysuite/src/*` | Vira **uma** implementação de `packages/payments` (interface 9.1) |
| Padrão de tracking A/B + módulo | Delivery OS secção 16 + `lib/analytics/track.ts` | Funil novo (landing→signup→assinatura); config no painel (18) |
| Email (Resend) + idempotência de webhook + verificação ativa | route handlers do QR MESAS | Templates novos; idempotência por `payments.reference` |
| Padrão de fila (`print_jobs`) | `services/print-bridge` | Vira `ai_generations` + `services/worker` |
| Higgsfield | skill `higgsfield-*` (disponível) | Wrapper em `packages/ai` |

**O que NÃO trazer:** lógica single-tenant do Delivery OS (aqui `tenant_id` é obrigatório), `order-machine.ts`.

---

## 16. PADRÕES CANÓNICOS (copiar, não reinventar)

### 16.1 RLS multi-tenant
```sql
create or replace function public.auth_tenant_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select tenant_id from memberships where user_id = auth.uid();
$$;
alter table campaigns enable row level security;
create policy "tenant_isolation" on campaigns for all to authenticated
  using (tenant_id in (select auth_tenant_ids()))
  with check (tenant_id in (select auth_tenant_ids()));
-- anon: NENHUMA policy. platform_settings/seasonal_dates: escrita só super-admin.
```

### 16.2 Pagamento idempotente, agnóstico de gateway
```ts
const { ok, reference, status } = getProvider(purpose).verifyWebhook(raw, headers);
if (!ok) return new Response('invalid', { status: 401 });
// INSERT payments ... ON CONFLICT (idempotency_key) DO NOTHING → 0 rows = duplicado → 200
const inserted = await confirmPayment(reference, status); // ativa subscrição OU credita, na MESMA tx (9.3)
return Response.json({ ok: true, duplicate: !inserted });
```

### 16.3 Crédito atómico (débito ao gerar, estorno ao falhar, grant ao pagar)
```sql
update credit_wallets set balance = balance - v_cost, updated_at = now()
where tenant_id = v_tenant and balance >= v_cost;   -- row_count=0 → raise 'insufficient_credits' → rollback
insert into credit_ledger(tenant_id, delta, reason, ref_id) values (v_tenant, -v_cost, 'ai_generate', v_job_id);
-- estorno: job 'failed' → +v_cost + ledger 'ai_refund'. grant: pagamento confirmado → +credits_granted.
```

### 16.4 Fila de jobs de IA (padrão `print_jobs`)
```ts
const job = await claimNext('ai_generations'); // queued→processing (UPDATE ... FOR UPDATE SKIP LOCKED)
if (!job) return;
try { const url = await higgsfield.generate(await zai.refinePrompt(job)); await markDone(job.id, url); }
catch (e) { await markFailed(job.id, e); await refundCredit(job); }   // falha nunca trava o sistema
```

### 16.5 Dinheiro & créditos
`packages/core/src/money.ts` (dinheiro) e `credits.ts` (inteiros) são os únicos lugares que calculam valores. Nunca float.

### 16.6 Web Push & Tracking (um único lugar cada)
- `packages/notifications/src/web-push.ts`: único a chamar `web-push`; filtra subscriptions por `tenant_id`; remove em 404/410.
- `apps/web/lib/analytics/track.ts`: único a tocar `dataLayer`/`fbq`/`gtag`. Componentes chamam só `track*()` (19.3).

---

## 17. Onboarding de um cliente novo (signup self-service)

1. Dono entra em `/signup` → conta (Supabase Auth) → `create_tenant(name)` cria `tenant`+`membership(owner)`+`restaurant`+`credit_wallet` (trial).
2. Configura marca em `/definicoes` (logo, cores, fotos, horários/timezone).
3. Assina o **plano Base** → checkout do `subscription_provider` (ZumboPay por padrão, 5500 MZN) → webhook ativa subscrição + 4 créditos.
4. Aceita notificações (instala PWA) → `push_subscriptions`.
5. O sistema gera `story_tasks` + `campaign`; alertas 15h→23h; email de segunda.
6. Usa o Estúdio IA (debita créditos; compra mais via `credits_provider`).

> **Setup da plataforma (uma vez, Niraslab):** colar todas as chaves/tags em **Integrações** (secção 18) e escolher os gateways ativos. Sem isto, pagamentos e tracking caem no `.env`.

---

## 18. Integrações — o hub de tags & chaves (super-admin, **desde o início**)

> Objetivo: **um único sítio** onde o Niraslab cola **tudo** — tags de marketing e chaves de API — e escolhe o **gateway
> ativo**. Vive em `platform_settings` (singleton, só super-admin). Há **duas classes de campo** com exposição diferente.
> **NUNCA** misturar as duas no mesmo SELECT público.

### 18.1 As duas classes
- **(A) IDs públicos** — `gtm_container_id`, `meta_pixel_id`, `ga4_measurement_id`, `gads_conversion_id`, `gads_conversion_label`. Vão ao client (carregam os scripts). OK no `get_public_tracking()`.
- **(B) Segredos** — `meta_capi_token`, `gads_developer_token`, **e todas as chaves de gateway/email** (`zumbopay_*`, `paysuite_*`, `resend_api_key`). **Só servidor** (service role). **Nunca** num RPC `to anon`.

### 18.2 Seleção de gateway (alternável)
- `subscription_provider` e `credits_provider` ∈ `{zumbopay, paysuite, mock}`. Default: assinatura=ZumboPay, créditos=Paysuite. O painel deixa trocar a qualquer momento; `getProvider(purpose)` passa a usar o novo na próxima cobrança.

### 18.3 UI da tab Integrações (owner only)
- Inputs por ID/chave com link "onde encontrar". Tokens/chaves **mascarados** (`••••1234` + "Substituir").
- **Selectores** do gateway ativo (assinatura / créditos).
- **Botão "Testar ligação"** por integração (valida ZumboPay/Paysuite/CAPI/Ads **sem expor** o segredo — chamada server-side que devolve só ok/erro).
- **Preview do `dataLayer`** para conferir o tracking.
- `get_public_tracking()` (anon, SECURITY DEFINER) devolve **só** os campos (A), com colunas listadas explicitamente (nunca `select *`).

---

## 19. Marketing & Tracking — funil de aquisição (medido desde o dia 1)

> Objetivo: medir o funil **landing → /precos → signup → escolha de plano → assinatura** em **GTM + GA4 + Meta Pixel +
> Google Ads**, com eventos first-party (`marketing_events`) como fonte de verdade, e proteger a atribuição (iOS/adblock)
> com **Meta CAPI** + **Google Enhanced Conversions** server-side. KPIs no super-admin (11). Config no painel (18).

### 19.1 Regra crítica (escrita em código antes de tudo)
- **`subscribe`/`purchase` NUNCA dispara no submit do checkout.** Dispara **APENAS** quando o pagamento está
  `confirmed` (em `/assinatura/sucesso` ou `/creditos/sucesso`, lendo o estado real via verificação ativa).
- **Idempotência dupla:** guard `useRef` **+** `localStorage['tracked_<reference>']`.
- `eventID = 'subscribe_<subscriptionId>'` / `'purchase_<paymentId>'` em todos os destinos (dedup browser↔server).
- `value` em **MT decimal** via `money.ts`; `transaction_id = reference` em GA4/Ads.

### 19.2 Eventos do funil
| Evento | Gatilho | Condição |
|---|---|---|
| `view_landing` | landing `/` mount | sempre |
| `view_pricing` | `/precos` | sempre |
| `sign_up` | conta criada | sempre |
| `begin_checkout` | escolher plano | sempre |
| `add_payment_info` | iniciar checkout do gateway | sempre |
| `subscribe` | `/assinatura/sucesso` | **APENAS** subscrição `confirmed` |
| `purchase` (créditos) | `/creditos/sucesso` | **APENAS** pagamento `confirmed` |

### 19.3 Módulo canónico (`apps/web/lib/analytics/track.ts`)
Único lugar que toca `dataLayer`/`fbq`/`gtag`. Expõe `loadGTM`, `trackViewLanding`, `trackViewPricing`, `trackSignUp`, `trackBeginCheckout`, `trackAddPaymentInfo`, `trackSubscribe`, `trackPurchase`. Componentes **nunca** chamam direto. Ordem do push no conversion: `dataLayer.push({ ecommerce:null })` → GA4 → Google Ads `conversion` → `fbq('track', …, { eventID })`.

### 19.4 First-party (fonte de verdade)
`POST /api/track` (Zod + `session_id` cookie 1st-party + `tenant_id` se já autenticado) → insere em `marketing_events` via **service role** (anon nunca direto). Sobrevive a adblock/iOS.

### 19.5 Consentimento + Server-side
- Banner PT (cookie `dl_consent`): **GTM/Pixel/Ads só carregam após "Aceitar"**; sem consentimento, só `session_id` + first-party.
- Na **confirmação** do pagamento (webhook/verify): disparar **fire-and-forget** (nunca bloqueia) Meta CAPI (`event_id` igual ao browser) + Google Enhanced (`transaction_id = reference`). Tokens de `platform_settings` (B) → fallback `.env`. Falha → log em `event_log`, segue.

### 19.6 KPIs (super-admin)
Funil com taxas de conversão por etapa (view→signup→checkout→assinatura), origem (`utm_*` em `marketing_events`), ROAS aproximado se Ads ligado — view SQL sobre `marketing_events` + `payments`.
