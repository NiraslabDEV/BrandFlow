-- Migration 0003: marketing_events (append-only)
-- Primeira fonte de verdade para o funil de aquisição
-- Sobrevive a adblock/iOS; INSERT só via /api/track (service role)

create table if not exists public.marketing_events (
  id bigserial primary key,
  session_id text not null,           -- 1st-party cookie (gerado client-side)
  tenant_id uuid,                     -- null se anon, uuid se autenticado
  type text not null,                 -- view_landing, view_pricing, sign_up, begin_checkout, add_payment_info, subscribe, purchase
  value_cents int,                    -- valor em MT (centavos) para subscribe/purchase
  utm jsonb,                          -- utm_source, utm_medium, utm_campaign, utm_term, utm_content
  payload jsonb,                      -- dados adicionais (reference, plan, etc)
  created_at timestamptz not null default now()
);

-- Índice para queries do funil
create index if not exists idx_marketing_events_session_id on public.marketing_events(session_id);
create index if not exists idx_marketing_events_tenant_id on public.marketing_events(tenant_id);
create index if not exists idx_marketing_events_type_created on public.marketing_events(type, created_at);
create index if not exists idx_marketing_events_created_at on public.marketing_events(created_at desc);

-- RLS: anon pode inserir via /api/track (service role), mas nunca ler
-- O INSERT é feito pelo servidor com service role, bypassando RLS
-- Aqui definimos que NINGUÉM lê direto (só via aggregate functions/queries admin)
alter table public.marketing_events enable row level security;

-- Política de inserção: só via service role (fora de RLS)
-- Mas deixamos explicitamente sem policy para garantir anon NUNCA insere direto
-- Isso é enforce pela rota /api/track que usa service role

-- Comment para documentação
comment on table public.marketing_events is 'Tabela append-only para tracking do funil de aquisição. INSERT só via /api/track (service role). NENHUMA policy de leitura - só via admin/aggregate.';
comment on column public.marketing_events.session_id is '1st-party cookie gerado client-side (UUID v4), persistente 2 anos';
comment on column public.marketing_events.tenant_id is 'null se anon; uuid se autenticado (vem da sessão)';
comment on column public.marketing_events.type is 'view_landing, view_pricing, sign_up, begin_checkout, add_payment_info, subscribe, purchase';
comment on column public.marketing_events.value_cents is 'valor em MT (centavos) para subscribe/purchase; null para view events';
comment on column public.marketing_events.utm is 'utm_source, utm_medium, utm_campaign, utm_term, utm_content capturados da URL';
comment on column public.marketing_events.payload is 'dados adicionais (reference, plan, etc)';