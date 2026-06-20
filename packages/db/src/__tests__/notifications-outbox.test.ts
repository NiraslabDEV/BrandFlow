/**
 * Outbox de notificações (M1.2) — enqueue + claim.
 *
 * Requires Supabase local running: supabase start
 * Run: pnpm test notifications-outbox
 *
 * Verifica:
 *  - enqueue_due_story_notifications enfileira SÓ story_tasks vencidas e marca-as 'sent';
 *  - idempotência: correr 2x não duplica notificação nem reenfileira (dedupe_key + status);
 *  - claim_due_notifications reclama só as vencidas (next_attempt_at <= now) e incrementa attempts.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const freshAnon = () => createClient(SUPABASE_URL, ANON_KEY);
const service = createClient(SUPABASE_URL, SERVICE_KEY);

async function signUpUser(email: string, password: string): Promise<SupabaseClient> {
  const signupClient = freshAnon();
  const { data, error } = await signupClient.auth.signUp({ email, password });
  if (error || !data.user) throw new Error(`signUp failed: ${error?.message}`);
  return signupClient;
}

async function cleanupUser(email: string) {
  const { data } = await service.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (user) await service.auth.admin.deleteUser(user.id);
}

describe('notifications outbox', () => {
  const ts = Date.now();
  const email = `outbox-${ts}@test.brandflow.test`;
  let userId: string;
  let tenantId: string;
  let restaurantId: string;
  let dueTaskId: string;
  let futureTaskId: string;

  beforeAll(async () => {
    const client = await signUpUser(email, 'Test1234!');
    const { data: { user } } = await client.auth.getUser();
    userId = user!.id;

    const { data: t, error } = await service.rpc('create_tenant', {
      p_name: 'Restaurante Outbox',
      p_user_id: userId,
    });
    if (error) throw new Error(`create_tenant: ${error.message}`);
    tenantId = t as string;

    const { data: r } = await service
      .from('restaurants').select('id').eq('tenant_id', tenantId).single();
    restaurantId = (r as { id: string }).id;

    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data: due } = await service.from('story_tasks').insert({
      tenant_id: tenantId, restaurant_id: restaurantId, scheduled_for: past,
      week_of_month: 1, weekday: 1, hour: 15, theme: 'Bastidores',
      title: 'Câmara cheia: veja o que entra!',
      instructions: 'Faz story AGORA: mostra a câmara. Grava 5s, close no conteúdo.',
    }).select('id').single();
    dueTaskId = (due as { id: string }).id;

    const { data: fut } = await service.from('story_tasks').insert({
      tenant_id: tenantId, restaurant_id: restaurantId, scheduled_for: future,
      week_of_month: 1, weekday: 1, hour: 16, theme: 'Bastidores',
      title: 'Onde tudo começa', instructions: 'Faz story AGORA: organização. Grava 5s.',
    }).select('id').single();
    futureTaskId = (fut as { id: string }).id;
  }, 30000);

  afterAll(async () => {
    await service.from('tenants').delete().eq('id', tenantId);
    await cleanupUser(email);
  }, 30000);

  it('enqueue enfileira só a vencida e marca-a sent; futura fica pending', async () => {
    const { data: count, error } = await service.rpc('enqueue_due_story_notifications');
    expect(error).toBeNull();
    expect(count).toBe(1);

    const { data: notes } = await service
      .from('notifications').select('dedupe_key, channel, status, title')
      .eq('tenant_id', tenantId);
    expect(notes).toHaveLength(1);
    expect(notes![0].dedupe_key).toBe(`story:${dueTaskId}`);
    expect(notes![0].channel).toBe('push');
    expect(notes![0].title).toBe('Câmara cheia: veja o que entra!');

    const { data: tasks } = await service
      .from('story_tasks').select('id, status').eq('tenant_id', tenantId);
    const byId = Object.fromEntries((tasks ?? []).map((t: { id: string; status: string }) => [t.id, t.status]));
    expect(byId[dueTaskId]).toBe('sent');
    expect(byId[futureTaskId]).toBe('pending');
  });

  it('é idempotente: 2ª corrida não duplica nem reenfileira', async () => {
    const { data: count2 } = await service.rpc('enqueue_due_story_notifications');
    expect(count2).toBe(0);

    const { count } = await service
      .from('notifications').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    expect(count).toBe(1);
  });

  it('claim reclama só as vencidas e incrementa attempts; futura não é reclamada', async () => {
    // injeta uma notificação agendada para o futuro (não deve ser reclamada)
    await service.from('notifications').insert({
      tenant_id: tenantId, channel: 'push', title: 'futura', body: 'x',
      status: 'queued', next_attempt_at: new Date(Date.now() + 3600_000).toISOString(),
      dedupe_key: `future-note-${ts}`,
    });

    const { data: claimed, error } = await service.rpc('claim_due_notifications', { p_limit: 50 });
    expect(error).toBeNull();

    const mine = (claimed ?? []).filter((n: { tenant_id: string }) => n.tenant_id === tenantId);
    expect(mine).toHaveLength(1); // só a vencida (story:dueTask)
    expect(mine[0].dedupe_key).toBe(`story:${dueTaskId}`);
    expect(mine[0].attempts).toBe(1); // incrementado pela reclamação

    // a futura continua queued e por reclamar
    const { data: future } = await service
      .from('notifications').select('attempts, status').eq('dedupe_key', `future-note-${ts}`).single();
    expect(future!.status).toBe('queued');
    expect(future!.attempts).toBe(0);
  });
});
