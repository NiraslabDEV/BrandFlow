-- Migration 0005: Story Tasks (Matriz de Stories — M1.1)
-- DECISÃO: Multi-tenant com RLS (padrão 16.1)
-- DECISÃO: scheduled_for em UTC; hora local derivada do restaurants.timezone (1.2.6)
-- DECISÃO: status canónico = 'pending'|'sent'|'done'|'skipped' (CLAUDE.md §4) —
--          'sent' usado pelo dispatch (M1.2), 'done' por mark_story_done (M1.3)
-- DECISÃO: A MATRIZ é fonte única em packages/core/src/story-matrix.ts (§5).
--          A RPC NÃO duplica temas/conteúdo: recebe as tasks já enriquecidas
--          pelo motor TS (generateStoryTasks) em jsonb e só faz INSERT idempotente.

-- ============================================================================
-- STORY_TASKS
-- ============================================================================

create table story_tasks (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,

  scheduled_for timestamptz not null,  -- instante UTC do slot

  week_of_month int not null check (week_of_month between 1 and 4),
  weekday int not null check (weekday between 0 and 6),  -- 0=Domingo
  hour int not null check (hour between 0 and 23),

  theme text not null,
  title text not null,
  instructions text not null,

  status text not null check (status in ('pending','sent','done','skipped')) default 'pending',
  sent_at timestamptz,
  done_at timestamptz,

  created_at timestamptz not null default now(),

  unique(restaurant_id, scheduled_for)  -- âncora de idempotência (1 task por slot/dia)
);

-- ============================================================================
-- RLS — padrão 16.1
-- ============================================================================

alter table story_tasks enable row level security;
create policy "tenant_isolation" on story_tasks for all to authenticated
  using (tenant_id in (select auth_tenant_ids()))
  with check (tenant_id in (select auth_tenant_ids()));

-- ============================================================================
-- RPC: materialize_story_tasks(p_restaurant_id, p_tasks)
-- DECISÃO: idempotente (ON CONFLICT DO NOTHING sobre unique(restaurant_id, scheduled_for)).
-- DECISÃO: tenant_id derivado do restaurante (server-truth); NUNCA do payload.
-- DECISÃO: conteúdo (theme/title/instructions) vem do motor TS — fonte única.
--          Suporta chamada por utilizador autenticado (gate por membership) e por
--          service-role/cron (auth.uid() null → confiável, p/ pg_cron → route handler).
-- ============================================================================

create or replace function public.materialize_story_tasks(p_restaurant_id uuid, p_tasks jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
  v_inserted int := 0;
begin
  -- Deriva o tenant do restaurante (nunca confiar no tenant_id do payload)
  select tenant_id into v_tenant_id
  from restaurants
  where id = p_restaurant_id and deleted_at is null;

  if not found then
    raise exception 'restaurant_not_found';
  end if;

  -- Defesa em profundidade: se chamado por utilizador autenticado, exigir membership.
  -- service-role/cron tem auth.uid() null e é confiável (chamado por código de servidor).
  if auth.uid() is not null and v_tenant_id not in (select auth_tenant_ids()) then
    raise exception 'access_denied';
  end if;

  -- Insert idempotente das tasks enriquecidas pelo story-matrix.ts
  insert into story_tasks (
    tenant_id, restaurant_id, scheduled_for,
    week_of_month, weekday, hour,
    theme, title, instructions
  )
  select
    v_tenant_id,
    p_restaurant_id,
    (t->>'scheduled_for')::timestamptz,
    (t->>'week_of_month')::int,
    (t->>'weekday')::int,
    (t->>'hour')::int,
    t->>'theme',
    t->>'title',
    t->>'instructions'
  from jsonb_array_elements(p_tasks) as t
  on conflict (restaurant_id, scheduled_for) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

grant execute on function public.materialize_story_tasks(uuid, jsonb) to authenticated, service_role;

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_story_tasks_tenant_id on story_tasks(tenant_id);
create index idx_story_tasks_restaurant_id on story_tasks(restaurant_id);
create index idx_story_tasks_scheduled_for on story_tasks(scheduled_for);
-- dispatch (M1.2) varre pending vencidas: índice parcial cobre o caminho quente
create index idx_story_tasks_pending_due on story_tasks(scheduled_for) where status = 'pending';
