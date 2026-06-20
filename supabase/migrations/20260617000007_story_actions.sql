-- Migration 0007: Ações sobre story_tasks (M1.3)
-- DECISÃO: marcar "Feito" valida o tenant via auth_tenant_ids() (RLS-safe).
--          status 'done' alimenta o dashboard (X/9 feitos) e as métricas de adesão.

create or replace function public.mark_story_done(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update story_tasks
  set status = 'done', done_at = now()
  where id = p_task_id
    and tenant_id in (select auth_tenant_ids());

  if not found then
    raise exception 'task_not_found_or_access_denied';
  end if;
end;
$$;

grant execute on function public.mark_story_done(uuid) to authenticated;
