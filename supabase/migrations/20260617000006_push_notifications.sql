-- Migration 0006: Web Push subscriptions + Outbox de notificações (M1.2)
-- DECISÃO: push é por TENANT — equipa sem login (1.2.2): user_id null, label = aparelho.
-- DECISÃO: notifications é OUTBOX durável com retry/idempotência (1.2.3 / 6.3),
--          nunca envio inline. dedupe_key garante 1 notificação por origem.
-- DECISÃO: dispatch em 2 passos — enqueue (esta migration: RPC) + flush (route).
--          A RPC só ENFILEIRA e marca a story_task 'sent'; o envio real é no flush.

-- ============================================================================
-- PUSH_SUBSCRIPTIONS (escopo de tenant)
-- ============================================================================

create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid,                       -- null no MVP (equipa sem login, 1.2.2)
  label text,                         -- nome do aparelho
  endpoint text not null unique,
  keys jsonb not null,                -- { p256dh, auth }
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "tenant_isolation" on push_subscriptions for all to authenticated
  using (tenant_id in (select auth_tenant_ids()))
  with check (tenant_id in (select auth_tenant_ids()));

-- ============================================================================
-- NOTIFICATIONS (outbox: queued -> sent/failed, com retry)
-- ============================================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  channel text not null check (channel in ('push','email')),
  title text not null,
  body text not null,
  payload jsonb not null default '{}',

  status text not null check (status in ('queued','sent','failed')) default 'queued',
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  dedupe_key text unique,             -- idempotência (ex.: 'story:<task_id>')
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "tenant_isolation" on notifications for all to authenticated
  using (tenant_id in (select auth_tenant_ids()))
  with check (tenant_id in (select auth_tenant_ids()));

-- ============================================================================
-- RPC: enqueue_due_story_notifications
-- Passo 1 do dispatch (1.2.3): só ENFILEIRA push para story_tasks vencidas e
-- marca-as 'sent'. Idempotente: dedupe_key='story:<id>' (ON CONFLICT DO NOTHING)
-- + status passa a 'sent' (não reaparece). FOR UPDATE SKIP LOCKED evita corrida.
-- ============================================================================

create or replace function public.enqueue_due_story_notifications(p_now timestamptz default now())
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
begin
  with due as (
    select st.id, st.tenant_id, st.title, st.instructions, st.hour, st.theme
    from story_tasks st
    join tenants t on t.id = st.tenant_id and t.deleted_at is null
    where st.status = 'pending'
      and st.scheduled_for <= p_now
    for update of st skip locked
  ),
  ins as (
    insert into notifications (tenant_id, channel, title, body, payload, status, next_attempt_at, dedupe_key)
    select
      d.tenant_id, 'push', d.title, d.instructions,
      jsonb_build_object('url', '/stories', 'story_task_id', d.id, 'hour', d.hour, 'theme', d.theme),
      'queued', p_now, 'story:' || d.id::text
    from due d
    on conflict (dedupe_key) do nothing
    returning 1
  )
  update story_tasks
  set status = 'sent', sent_at = p_now
  where id in (select id from due);

  get diagnostics v_count = row_count;  -- nº de story_tasks transicionadas
  return v_count;
end;
$$;

grant execute on function public.enqueue_due_story_notifications(timestamptz) to service_role;

-- ============================================================================
-- RPC: claim_due_notifications
-- Passo 2 (flush): reclama atomicamente um lote de 'queued' vencidas, incrementa
-- attempts e devolve as linhas. SKIP LOCKED impede dois flushes pegarem a mesma.
-- O envio + marcação final (sent/failed/backoff) é feito no route (TS).
-- ============================================================================

create or replace function public.claim_due_notifications(p_limit int default 50, p_now timestamptz default now())
returns setof notifications language plpgsql security definer set search_path = public as $$
begin
  return query
  update notifications n
  set attempts = n.attempts + 1
  where n.id in (
    select id from notifications
    where status = 'queued' and next_attempt_at <= p_now
    order by next_attempt_at
    for update skip locked
    limit p_limit
  )
  returning n.*;
end;
$$;

grant execute on function public.claim_due_notifications(int, timestamptz) to service_role;

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_push_subscriptions_tenant_id on push_subscriptions(tenant_id);
create index idx_notifications_tenant_id on notifications(tenant_id);
-- flush varre 'queued' vencidas: índice parcial cobre o caminho quente
create index idx_notifications_queued_due on notifications(next_attempt_at) where status = 'queued';
