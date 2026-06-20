# ROADMAP.md — BrandFlow: Roteiro de Execução em Fases (MVP)

> **Como usar:** abrir o Claude Code na raiz do repo. Colar o PROMPT da fase atual, exatamente como está.
> Uma fase por sessão. A fase só está concluída quando TODO o checklist de DoD estiver verde.
> Nunca avançar com testes a falhar. Nunca deixar o agente "adiantar" a fase seguinte.

Legenda: 🔴 bloqueia tudo · 🟡 bloqueia a entrega ao 1º cliente · 🟢 melhoria
DoD: `[x]` feito (código + gate/commit) · `[x] ⏳` código pronto, falta confirmar em runtime com Supabase local · `[ ]` por fazer

> **Estado atual (2026-06-20): M0 e M1 concluídas (Checkpoints 1 e 2).** Gate real (`pnpm lint && pnpm test` = 71 verdes). Próximo passo: **FASE M2.1** (calendário sazonal + campanhas).
> Decisões fechadas do MVP: **multi-tenant SaaS** (planos/créditos com gating); stack **Next.js + Supabase**; alertas como
> **notificação no celular via Web Push (PWA)** + email semanal; **Estúdio de IA** (Z.ai + Higgsfield) **incluído**;
> **dois gateways de pagamento selecionáveis no painel** — **ZumboPay (recorrência)** + **Paysuite (avulso/créditos)**;
> e **tracking do funil de aquisição (GTM/Pixel/GA4/Ads) configurado no painel DESDE O INÍCIO** (hub de Integrações).
>
> **⚠️ Decisões fundadoras (CLAUDE.md 1.2) — aplicar em TODAS as fases:** billing/créditos por `tenant` (não restaurante);
> equipa sem login (push por tenant); todo efeito externo via **outbox com retry**; créditos com `source`/`expires_at`
> (mensais expiram); ciclo de vida da subscrição com `assertActiveSubscription`; tempo em UTC; segredos no **Supabase Vault**;
> soft-delete (`deleted_at`) e logs append-only.

> **Disciplina:** ler `CLAUDE.md` inteiro + a fase. Antes de codar, listar ficheiros a criar/alterar e plano de testes.
> Reaproveitar do QR MESAS (CLAUDE.md secção 15). Multi-tenant: `tenant_id` em TODA tabela; isolamento por RLS; `tenant_id`/valores nunca vêm do client. Chaves só no servidor.

---

## FASE M0 — Fundação (monorepo + multi-tenant + auth + Integrações + tracking)

🎯 Objetivo do checkpoint: **um dono cria conta → cria o tenant → faz login no painel vazio; o Niraslab já tem o hub de
Integrações para colar tags e chaves; e o funil (landing→signup) já é medido.** Isolamento de tenant a funcionar.

### M0.1 🔴 Esqueleto do monorepo + reaproveitamento

**PROMPT:**
> Lê o `CLAUDE.md` (secções 2, 3, 15, ⚡). Cria o esqueleto: pnpm workspaces + Turborepo com `apps/web` (Next.js 14 App Router + TS + Tailwind + shadcn/ui), `packages/core`, `packages/db`, `packages/payments`, `packages/ai`, `packages/notifications`, `services/worker`, e `config/brand.ts` (marca do produto). **Porta do QR MESAS** (`C:\Users\Gabriel\Desktop\QR MESAS`): `packages/core/src/money.ts` (intacto); o provider Paysuite vira **uma implementação** de `packages/payments` atrás da interface `PaymentProvider` (CLAUDE.md 9.1), ao lado de stubs `zumbopay.ts` e `mock.ts`. **NÃO** portar lógica single-tenant nem `order-machine.ts`. Configura Vitest, ESLint, tsconfig partilhado e os scripts da secção 12 (os que ainda não funcionam → `echo TODO`). 1 teste trivial por package.

**DoD:**
- [x] `pnpm install && pnpm lint && pnpm test && pnpm dev` funcionam (lint/test/build verdes)
- [x] `apps/web` abre com o tema do BrandFlow
- [x] `money.ts` portado; `packages/payments` com interface única + `paysuite`/`zumbopay`/`mock` (stubs), teste do mock verde
- [x] Commit `chore: monorepo skeleton + payments abstraction (money/paysuite/zumbopay/mock)`

### M0.2 🔴 Banco multi-tenant + RLS + platform_settings

**PROMPT:**
> Lê o `CLAUDE.md` (secções 1.2, 4, 14, 16.1). Cria `packages/db/migrations/0001_core.sql`: tabelas `tenants`, `memberships`, `restaurants`, `credit_wallets`, `platform_settings` (singleton só super-admin), `event_log` (DDL da secção 4) + helper `auth_tenant_ids()`. **Decisões fundadoras já no schema:** `deleted_at` (soft-delete) em `tenants`/`restaurants`, `tenants.grace_until`, billing por `tenant`. RLS em TODAS (template 16.1 — `anon` sem policy; `platform_settings` escrita só super-admin). RPC `SECURITY DEFINER` `create_tenant(p_name)` que cria atomicamente `tenant`(trial)+`membership`(owner)+`restaurant`+`credit_wallet`(0). Seed mínimo (1 tenant demo + `platform_settings` vazio). `tests/rls.test.ts`: (a) anon não lê nada; (b) tenant A não vê tenant B; (c) `create_tenant` cria as 4 linhas atomicamente; (d) tenant comum não lê `platform_settings`.

**DoD:**
- [x] ⏳ `supabase db reset` aplica migration + seed
- [x] ⏳ Isolamento: tenant A não lê tenant B; tenant não lê `platform_settings` — requer `supabase start`
- [x] ⏳ `create_tenant` atómico (tenant+membership+restaurant+wallet)
- [x] Soft-delete (`deleted_at`) nas entidades-chave; billing/créditos ancorados no `tenant`
- [x] `pnpm db:types` gera tipos
- [x] Commit `feat(db): multi-tenant core + platform_settings + RLS isolation`

### M0.3 🔴 Auth + signup + onboarding do tenant

**PROMPT:**
> Lê o `CLAUDE.md` (secções 10, 17). Supabase Auth: `/signup` e `/login` (anon, na `(marketing)`). Ao registar → `create_tenant` → painel `(app)`. Helper `currentTenant()` (tenant da sessão, **nunca** do client). Shell do painel com as tabs (**Dashboard · Stories · Calendário · Campanhas · Estúdio IA · Créditos · Definições**) — só **Dashboard** (vazio) e **Definições** (nome/marca do restaurante, Storage) funcionais. Middleware protege `(app)` (sem sessão → `/login`). Distinguir o **role super-admin** (Niraslab) que entra em `(admin)` e não é tenant.

**DoD:**
- [X] ⏳ Criar conta → tenant → Dashboard; logout; super-admin acede `(admin)`, tenant não
- [X] ⏳ Definições: editar nome/logo/cores (Storage)
- [X] `currentTenant()` resolve pela sessão; `(app)` bloqueado sem login
- [X] Commit `feat(auth): signup, login, tenant onboarding shell + roles`

### M0.4 🔴 Integrações — hub de tags & chaves + seleção de gateway (DESDE O INÍCIO)

**PROMPT:**
> Lê o `CLAUDE.md` (secção 18). Migration `0002`: colunas em `platform_settings` para **(A) IDs públicos** (`gtm_container_id`, `meta_pixel_id`, `ga4_measurement_id`, `gads_conversion_id`, `gads_conversion_label`) e **(B) segredos** (`meta_capi_token`, `gads_developer_token`, `zumbopay_api_key/webhook_secret/wallet_id/merchant_id`, `paysuite_api_key/webhook_secret`, `resend_api_key`) + seleção de gateway (`subscription_provider` default `zumbopay`, `credits_provider` default `paysuite`). Tab `(admin)/integracoes` (owner only): inputs com link "onde encontrar", **segredos mascarados** (`••••1234` + "Substituir"), **selectores** do gateway ativo, **botão "Testar ligação"** (server-side, sem expor segredo), **preview do `dataLayer`**. RPC `get_public_tracking()` (anon, SECURITY DEFINER) devolve **só** os campos (A), colunas explícitas (nunca `select *`). **Segredos (B) cifrados via Supabase Vault** (nunca texto puro); leitura só server-side. `getProvider(purpose)` em `packages/payments` lê `platform_settings`→`.env`. Testes: `get_public_tracking` nunca devolve um campo (B); `getProvider` respeita a seleção do painel e cai no `.env` quando vazio.

**DoD:**
- [x] Niraslab cola IDs **e** chaves (Zumbo/Paysuite/Resend/tracking) na tab Integrações; escolhe gateway por finalidade
- [x] ⏳ `get_public_tracking()` devolve só (A); **nenhum** segredo (B) sai em RPC anon (teste escrito; requer `supabase start`)
- [x] Segredos (B) cifrados no Vault, mascarados na UI (`••••1234`); "Testar ligação" valida sem expor; `getProvider` segue a seleção
- [x] Commit `feat(admin): integrations hub — tracking tags + gateway keys (Vault) + provider selection`

### M0.5 🟡 Módulo de tracking + consentimento + topo do funil

**PROMPT:**
> Lê o `CLAUDE.md` (secções 19.1–19.4). Cria `apps/web/lib/analytics/track.ts` (ÚNICO lugar com `dataLayer`/`fbq`/`gtag`): `loadGTM`, `trackViewLanding`, `trackViewPricing`, `trackSignUp`, `trackBeginCheckout`, `trackAddPaymentInfo` (+ `trackSubscribe`/`trackPurchase` usados na M3). Banner de consentimento PT (cookie `dl_consent`): GTM/Pixel/Ads só após "Aceitar"; carrega os IDs (A) via `get_public_tracking()`. Migration `0003`: `marketing_events` (append-only). Rota `POST /api/track` (Zod + `session_id` cookie 1st-party + `tenant_id` se autenticado; insere via service role, anon nunca direto). Instrumenta `(marketing)`: `view_landing`, `view_pricing`, `sign_up`, `begin_checkout`. NENHUM componente chama `fbq`/`gtag` direto. Testes: sem consentimento não carrega script; anon não insere em `marketing_events` direto; eventos disparam nos gatilhos certos.

**DoD:**
- [x] Eventos de topo de funil disparam (`view_landing`/`view_pricing`/`sign_up`/`begin_checkout`); só via `track*()`
- [x] Sem `dl_consent` → não carrega GTM/Pixel/Ads; IDs vêm de `get_public_tracking()`
- [x] ⏳ `marketing_events` só via `/api/track` (service role); anon não insere direto
- [x] Commit `feat(web): tracking module + consent + top-funnel events`

🎉 **CHECKPOINT 1: multi-tenant + auth + Integrações + funil medido. Base pronta — já mede aquisição desde o dia 1.**

---

## FASE M1 — Matriz de Stories + Notificação no celular (o coração)

🎯 Objetivo: **a equipa recebe, no celular, "Faz story AGORA: …" nos horários 15h→23h, com instrução pronta, e marca "Feito".**

### M1.1 🔴 Motor da matriz (core) + geração de tasks

**PROMPT:**
> Lê o `CLAUDE.md` (secção 5). Cria `packages/core/src/story-matrix.ts`: constante tipada com os 9 slots fixos (15h→23h) e a rotação de 4 semanas (S1 operação; S2 Pessoas; S3 Autoridade; S4 Conversão), cada slot×tema → `{ title, instructions }` ricos (nunca "faz story agora"). Função pura `generateStoryTasks(restaurant, fromDate, days)` com `scheduled_for` em UTC derivado de `timezone`/`open_hour`/`close_hour`. Migration `0004_stories.sql` (`story_tasks`, RLS 16.1) + RPC `materialize_story_tasks(p_days)` idempotente (não duplica slot/dia). Testes: estrutura fixa nos 9 slots; semana 2 ≠ semana 1; fuso correto; materializar 2× não duplica.

**DoD:**
- [x] Matriz cobre 9 slots × 7 dias × 4 semanas sem repetir tema (teste verde)
- [x] `generateStoryTasks` calcula `scheduled_for` correto para `Africa/Maputo`
- [x] `materialize_story_tasks` idempotente (verificado em runtime contra Supabase local; conteúdo rico vem do motor TS, fonte única — RPC não duplica a matriz)
- [x] Commit `feat(core): story matrix engine + task materialization`

### M1.2 🔴 Web Push (PWA) + dispatch via cron

**PROMPT:**
> Lê o `CLAUDE.md` (secções 6, 6.3, 16.6 + decisões 1.2.2/1.2.3). PWA: `manifest.json` + `public/sw.js` (`push`/`notificationclick`). `packages/notifications/src/web-push.ts` (lib `web-push` + VAPID) — único a enviar push. Migration `0005`: `push_subscriptions` (escopo de **tenant**, `user_id` null, `label` do aparelho — **equipa sem login**, 1.2.2) + `notifications` como **outbox** (`attempts`, `next_attempt_at`, `dedupe_key`). Rota `POST /api/push/subscribe`. **Dispatch em 2 passos (outbox, 1.2.3):** `POST /api/cron/dispatch-stories` (`CRON_SECRET`, pg_cron horário) só **enfileira** `notifications` (`queued`) para as `story_tasks` vencidas, com `dedupe_key=task_id` (idempotente); um processador (`POST /api/cron/flush-notifications`) envia os `queued` a todas as subscriptions do tenant com backoff, marca `sent`/`failed`, e apaga subscription em 404/410. `pnpm cron:local`. Testes: dispatch só enfileira vencidas; `dedupe_key` impede duplicado; falha de envio → retry, nunca trava; subscription morta removida.

**DoD:**
- [x] ⏳ Aceitar notificações no celular → subscription (escopo tenant) gravada; push de teste chega como notificação de sistema (PWA `sw.js`+`manifest.json`, opt-in no Dashboard, `POST /api/push/subscribe`; entrega no aparelho = verificação manual)
- [x] `dispatch-stories` enfileira só as vencidas (idempotente por `dedupe_key`, verificado em runtime contra Supabase); `flush` envia com retry (lógica testada via mock transport)
- [x] Falha de push → `attempts`++/`failed` (reentregável), nunca trava o cron; subscription 404/410 apagada (testado: backoff + gone-handling)
- [x] Commit `feat(notifications): web push + outbox dispatch (tenant-scoped, retry)`

### M1.3 🟡 Painel: Dashboard + Stories do dia + marcar "Feito"

**PROMPT:**
> Lê o `CLAUDE.md` (secções 5, 10). Tab **Stories**: matriz do dia (9 slots) com horário, título, instrução, estado; botão **"Feito"** → RPC `mark_story_done(p_task_id)` (valida tenant). Vista semana. **Dashboard**: "stories de hoje" (X/9 feitos), "campanha ativa" (placeholder até M2), "créditos" (placeholder até M4), atalho "ver stories de agora". TanStack Query.

**DoD:**
- [x] ⏳ Stories do dia com instrução; "Feito" marca `done` e atualiza dashboard (RPC `mark_story_done` testada em runtime; UI TanStack Query — verificação no browser manual)
- [x] ⏳ Vista semana mostra a rotação; estados corretos (próximos 7 dias agrupados por dia no fuso do restaurante)
- [x] Commit `feat(app): stories tab + done tracking + dashboard`

🎉 **CHECKPOINT 2: o produto entrega o valor central — alerta no celular + execução. Dá para mostrar/vender. Marcar conversas ANTES de continuar.**

---

## FASE M2 — Calendário sazonal + Email semanal

🎯 Objetivo: **toda segunda o dono recebe "Planeamento da semana" com a campanha e datas sazonais; o painel mostra o calendário do mês.**

### M2.1 🟡 Calendário sazonal + campanhas

**PROMPT:**
> Lê o `CLAUDE.md` (secção 7). Migration `0006`: `seasonal_dates` (GLOBAL; SELECT to authenticated, escrita só super-admin) + `campaigns` (RLS 16.1) + seed de datas MZ. `generateMonthCampaigns(tenant, month)` (core) deriva as `campaigns` da semana das datas sazonais + rotação de temas. RPC `ensure_campaigns(p_month)` idempotente. Tab **Calendário** (datas + campanhas) e **Campanhas** (campanha da semana editável). Testes: campanhas batem com seed; idempotência.

**DoD:**
- [ ] ⏳ Calendário mostra datas sazonais do mês + campanhas geradas
- [ ] ⏳ Campanha da semana editável; geração idempotente
- [ ] Commit `feat(app): seasonal calendar + weekly campaigns`

### M2.2 🟡 Email semanal automático

**PROMPT:**
> Lê o `CLAUDE.md` (secções 6.2, 6.3, 7). `packages/notifications/src/email.ts` (Resend, portado) + template "Planeamento da semana". Rota `POST /api/cron/weekly-email` (`CRON_SECRET`, pg_cron semanal): para cada tenant `active`/`trial`, segunda 08h (fuso do restaurante), **enfileira** o email no outbox `notifications` (`channel='email'`, `dedupe_key='weekly-<tenant>-<ano-semana>'`) — o mesmo `flush` da M1.2 envia com retry. Email de boas-vindas no signup (também via outbox). Testes: template rende; tenant `canceled` não recebe; `dedupe_key` garante 1 email por semana mesmo com reexecução.

**DoD:**
- [ ] ⏳ Segunda → email com a campanha da semana (enfileirado, enviado pelo flush/retry)
- [ ] Tenant `canceled` não recebe; boas-vindas no signup; idempotente por semana (`dedupe_key`)
- [ ] Commit `feat(notifications): weekly planning email (outbox)`

---

## FASE M3 — Pagamentos: dois gateways (ZumboPay recorrência + Paysuite) + conversão

🎯 Objetivo: **o dono assina o plano Base (5500 MZN) pelo gateway ativo (ZumboPay por padrão); a renovação é automática; o gating liga as features; e o evento `subscribe` dispara só na confirmação (browser + CAPI).**

### M3.1 🟡 Assinatura recorrente (ZumboPay) + Paysuite + webhooks + gating

**PROMPT:**
> Lê o `CLAUDE.md` (secções 1.1, 9, 16.2) e o `SKILL.md` (`/connect-zumbopay-recurring`). Migration `0007`: `subscriptions`, `payments` (com `provider`, `reference` unique, `idempotency_key`). `packages/core/src/plans.ts` (Base 5500 MZN, features, 4 créditos/mês; Pro/Premium definidos não vendidos) + `assertPlan`/`planFeatures`. Completa as implementações `zumbopay.ts` e `paysuite.ts` atrás de `PaymentProvider` (9.1). Rota `/api/payments` (cliente só envia `{ plan:"base" }`; servidor obtém tenant da sessão, recalcula, gera `BFLOW-<ts>-<rand>`, `payments.pending`, chama `getProvider('subscription')`). Webhooks `/api/webhooks/zumbopay` e `/api/webhooks/paysuite` (HMAC + idempotência 16.2) → confirmação **transação única** (9.3): `subscriptions.active`+`tenants.active`+`current_period_end=+1mês`+recarrega 4 créditos. `/api/payments/verify` (verificação ativa; ZumboPay via `validate_transaction`→`INS-0`). Cron `/api/cron/subscription-renew` (ZumboPay: cobra vencidas; sucesso `+30d`, falha → `past_due` + `grace_until=now()+3d`). **Ciclo de vida (9.4):** um único gate `assertActiveSubscription(tenant)` — `past_due` dentro da graça = acesso total; fora da graça = features pagas bloqueadas + CTA, login/dados mantidos; `canceled` = read-only 30d → arquiva (`deleted_at`). Erros/retry 429 (1s/2s/4s/8s). Testes (mock + zumbo mock): webhook duplicado → 200 sem efeito; assinatura inválida → 401; plano não ativa antes de `confirmed`; saldo não credita 2×; renovação falhada → `past_due`+graça; `assertActiveSubscription` bloqueia após a graça mas mantém login.

**DoD:**
- [ ] ⏳ Assinar (provider ativo) → webhook → `active` → 4 créditos → features liberadas
- [ ] Webhook duplicado/assinatura inválida tratados; plano nunca ativa sem `confirmed`; nunca credita 2×
- [ ] ⏳ Renovação automática (`+30d`/`past_due`+graça); verificação ativa ZumboPay (`INS-0`)
- [ ] `assertActiveSubscription` central: graça de 3d, bloqueio mantém login/dados, `canceled`→read-only; alternar gateway no painel troca o provider efetivo
- [ ] Commit `feat(payments): ZumboPay recurring + Paysuite + webhooks + lifecycle gating (skill /connect-zumbopay-recurring)`

### M3.2 🟡 Reconciliação + evento `subscribe` (browser + CAPI server-side)

**PROMPT:**
> Lê o `CLAUDE.md` (secções 9.3, 19.1, 19.5). Cron `/api/cron/reconcile-payments` (rede de segurança: pendências > N min → `validateTransaction`). Página `/assinatura/sucesso`: `trackSubscribe` dispara **APENAS** quando a subscrição está `confirmed` (lê estado real), com guard `useRef` + `localStorage['tracked_<reference>']`, `eventID='subscribe_<id>'`, `value` via money.ts, `transaction_id=reference`. Na **confirmação** (webhook/verify), disparar **fire-and-forget** Meta CAPI (mesmo `event_id`) + Google Enhanced (`transaction_id`) usando segredos de `platform_settings`→`.env`; falha → log, pedido segue. Testes: `subscribe` não dispara fora de `confirmed`; não re-dispara em reload; falha server-side não afeta a subscrição; reconciliação confirma pendência perdida.

**DoD:**
- [ ] `subscribe` só em subscrição `confirmed`; nunca no submit; sem re-disparo em reload
- [ ] CAPI/Enhanced disparam na confirmação com o mesmo `event_id`/`transaction_id`; falha não afeta a subscrição
- [ ] ⏳ Reconciliação recupera pagamento perdido pelo webhook
- [ ] Commit `feat(analytics): subscribe conversion + CAPI/Enhanced + payment reconciliation`

🎉 **CHECKPOINT 3: produto vendável fim-a-fim — assina (recorrente), recebe alertas, email e calendário; funil medido da landing à conversão.**

---

## FASE M4 — Estúdio de IA + Créditos (a parte forte)

🎯 Objetivo: **o dono sobe a marca, gera banner/story com IA gastando créditos, e compra mais por upsell (via `credits_provider`).**

### M4.1 🟡 Upload de marca + Storage

**PROMPT:**
> Lê o `CLAUDE.md` (secção 8.1). Migration `0008_storage.sql`: buckets privados `brand-assets` e `ai-assets` (policies por tenant). Em **Definições**: upload de logo + fotos + cores → `restaurants.{logo_url,photos,brand_colors}`. Acesso sempre por `createSignedUrl`. Testes: upload no bucket certo do tenant; bucket de outro tenant inacessível.

**DoD:**
- [ ] ⏳ Upload de logo/fotos/cores por tenant (bucket privado, signed URL)
- [ ] Tenant não acede a assets de outro tenant
- [ ] Commit `feat(app): brand asset upload (storage)`

### M4.2 🟡 Providers de IA (Z.ai + Higgsfield) + fila + worker

**PROMPT:**
> Lê o `CLAUDE.md` (secções 8.1, 8.2, 16.4). `packages/ai`: `prompt.ts` (marca+cores+tema), `zai.ts` (refina), `higgsfield.ts` (gera — usar skill `higgsfield-*`), e **provider mock** (`AI_PROVIDER=mock`). Migration `0009`: `ai_generations` (RLS). `services/worker`: poll `queued`→`processing` (FOR UPDATE SKIP LOCKED)→Z.ai+Higgsfield→bucket `ai-assets`→`done`/`failed`. `pnpm worker:dev` com mock. Testes (mock): `queued`→`done` com `image_url`; falha→`failed`+`error`; dois workers não pegam o mesmo job.

**DoD:**
- [ ] `pnpm worker:dev` (mock): job `queued` → `done` com imagem no bucket
- [ ] Falha → `failed`+`error` (sem travar); sem corrida entre workers
- [ ] Commit `feat(ai): Z.ai+Higgsfield providers + generation queue + worker`

### M4.3 🟡 Créditos: wallet/ledger + débito atómico + compra (upsell via credits_provider)

**PROMPT:**
> Lê o `CLAUDE.md` (secções 8.3, 9, 16.3 + decisão 1.2.4). Migration `0010`: `credit_ledger` (append-only) com **`source`** (`monthly`/`purchased`/`refund`/`adjust`/`expiry`) + **`expires_at`**. `packages/core/src/credits.ts`. RPCs `debit_credits`/`grant_credits` atómicos (16.3; saldo nunca negativo) — **o gasto consome `monthly` (não expirado) antes de `purchased`**; `balance` = soma das entradas não expiradas. Rota `/api/payments` `kind='credits'` usa `getProvider('credits')` (Paysuite por padrão) para pacotes (+10 = 500 MZN `source='purchased'`; campanha extra = 700 MZN); webhook credita o wallet (idempotente). Estorno (`source='refund'`) quando `ai_generations` vai a `failed`. **Renovação:** zera o `monthly` remanescente (entrada `source='expiry'`) e concede os novos 4 (`source='monthly'`, `expires_at`=fim do período). Página `/creditos/sucesso` dispara `trackPurchase` só em `confirmed`. Testes: débito sem saldo → rollback; gasto consome monthly primeiro; mensais expiram na renovação, comprados sobrevivem; estorno em falha; pacote credita 1× (idempotente).

**DoD:**
- [ ] Débito atómico; saldo nunca negativo; gasto consome `monthly` antes de `purchased`; ledger com `source`/`expires_at`
- [ ] Renovação expira mensais remanescentes e concede 4 novos; comprados não expiram
- [ ] Job falhado estorna; compra de pacote (via `credits_provider`) credita idempotente; `purchase` só em `confirmed`
- [ ] Commit `feat(credits): atomic wallet/ledger with expiry + credit packs (credits_provider)`

### M4.4 🟡 Estúdio IA (UI) + gating

**PROMPT:**
> Lê o `CLAUDE.md` (secções 8, 10). Tab **Estúdio IA**: tipo (`story`/`feed`/`banner`) + tema + foto base; `POST /api/ai/generate` valida `assertPlan` + `debit_credits` (atómico) e cria o job; UI mostra estado + imagem para download. Tab **Créditos**: saldo + histórico (`credit_ledger`) + comprar pacote. Sem saldo → 402 + CTA. Dashboard mostra saldo real. Testes: gerar sem saldo → bloqueado; com saldo → job + 1 crédito debitado.

**DoD:**
- [ ] ⏳ Gerar story/banner debita 1 crédito e entrega a imagem; sem saldo → CTA
- [ ] ⏳ Tab Créditos com saldo + histórico; comprar pacote credita
- [ ] Commit `feat(app): AI studio + credits UI`

🎉 **CHECKPOINT 4: MVP completo — assinatura recorrente + matriz + alertas + email + calendário + Estúdio IA com créditos/upsell + funil medido.**

---

## FASE M5 — Super-admin + funil KPIs + polish

### M5.1 🟢 Super-admin (Niraslab) + KPIs do funil

**PROMPT:**
> Lê o `CLAUDE.md` (secções 11, 19.6). Rota `(admin)` (role próprio, não-tenant). **Tenants**: plano, estado, MRR, adesão à matriz; forçar plano/estado; pagamentos. **Métricas**: ativos, churn, créditos consumidos, jobs falhados, e o **funil de aquisição** (view SQL sobre `marketing_events` + `payments`: view_landing→signup→checkout→assinatura, `utm_*`, ROAS aprox). Curadoria de `seasonal_dates` e da matriz padrão.

**DoD:**
- [ ] Super-admin vê todos os tenants + funil de aquisição; tenant comum não acede a `(admin)`
- [ ] Funil bate com seed conhecido; curadoria de datas/matriz
- [ ] Commit `feat(admin): super-admin console + acquisition funnel KPIs`

---

## Visão futura (NÃO implementar sem ADR — fora do MVP)

- **Tiers Pro / Premium ligados:** vídeos IA, automações, analytics — já em `plans.ts`, só "ligar" o gate.
- **Upsells extra:** vídeo IA (1000 MZN), WhatsApp automático (1500 MZN), anúncios Meta (3000 MZN).
- **FCM (push nativo)** como alternativa/complemento ao Web Push.
- **Pixel por-tenant:** cada restaurante medir o seu próprio marketing (hoje o tracking é do funil da plataforma).
- **Matriz por tenant (overrides):** personalizar slots/temas além da matriz padrão.
- **Redis** para a fila de IA quando o volume justificar.

---

## Disciplina de sessão (colar no início de cada sessão do Claude Code)

```
Estamos na fase <X.Y> do ROADMAP.md. Lê o CLAUDE.md e a fase no ROADMAP.
É multi-tenant: tenant_id em TODA tabela; isolamento por RLS; tenant_id/valores nunca vêm do client.
Pagamentos são agnósticos de gateway (packages/payments); chaves só no servidor.
Reaproveita do QR MESAS o que der (money, paysuite, skeleton, tracking A/B).
Lista os ficheiros que vais criar/alterar e o plano de testes ANTES de codar.
Não toques em nada fora do escopo da fase. No fim, corre pnpm lint && pnpm test
e mostra-me o resultado + checklist de DoD.
```
