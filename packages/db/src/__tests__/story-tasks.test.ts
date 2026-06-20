/**
 * Story Tasks — materialize_story_tasks idempotency (M1.1)
 *
 * Requires Supabase local running: supabase start
 * Run: pnpm test story-tasks
 *
 * Verifica que a RPC:
 *  - insere as tasks ricas vindas do motor TS (generateStoryTasks);
 *  - é idempotente (materializar 2× não duplica slot/dia);
 *  - deriva tenant_id do restaurante e isola entre tenants.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateStoryTasks, type Restaurant } from '../../../core/src/story-matrix';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const freshAnon = () => createClient(SUPABASE_URL, ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function signUpUser(email: string, password: string): Promise<SupabaseClient> {
  const signupClient = freshAnon();
  const { data, error } = await signupClient.auth.signUp({ email, password });
  if (error || !data.user) throw new Error(`signUp failed: ${error?.message}`);
  const userClient = freshAnon();
  await userClient.auth.signInWithPassword({ email, password });
  return userClient;
}

async function cleanupUser(email: string) {
  const { data } = await serviceClient.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (user) await serviceClient.auth.admin.deleteUser(user.id);
}

describe('materialize_story_tasks', () => {
  const ts = Date.now();
  const email = `stories-${ts}@test.brandflow.test`;
  const password = 'Test1234!';
  let client: SupabaseClient;
  let tenantId: string;
  let restaurant: Restaurant;

  beforeAll(async () => {
    client = await signUpUser(email, password);
    const { data: { user } } = await client.auth.getUser();

    const { data: t, error } = await serviceClient.rpc('create_tenant', {
      p_name: 'Restaurante Stories',
      p_user_id: user!.id,
    });
    if (error) throw new Error(`create_tenant: ${error.message}`);
    tenantId = t as string;

    const { data: r } = await serviceClient
      .from('restaurants')
      .select('id, tenant_id, name, slug, open_hour, close_hour, timezone')
      .eq('tenant_id', tenantId)
      .single();
    restaurant = r as Restaurant;
  }, 30000);

  afterAll(async () => {
    await serviceClient.from('tenants').delete().eq('id', tenantId);
    await cleanupUser(email);
  }, 30000);

  it('materializa as 9 tasks/dia com conteúdo rico do motor TS', async () => {
    const tasks = generateStoryTasks(restaurant, new Date('2024-03-04T00:00:00Z'), 1);
    expect(tasks).toHaveLength(9);

    const { data: inserted, error } = await client.rpc('materialize_story_tasks', {
      p_restaurant_id: restaurant.id,
      p_tasks: tasks,
    });
    expect(error).toBeNull();
    expect(inserted).toBe(9);

    const { data: rows } = await client
      .from('story_tasks')
      .select('hour, theme, title, instructions, status')
      .eq('restaurant_id', restaurant.id)
      .order('hour');
    expect(rows).toHaveLength(9);
    expect(rows!.map((r: { hour: number }) => r.hour)).toEqual([15, 16, 17, 18, 19, 20, 21, 22, 23]);
    // Conteúdo rico (não o stub proibido)
    rows!.forEach((r: { title: string; instructions: string; status: string }) => {
      expect(r.title.length).toBeGreaterThan(3);
      expect(r.instructions).not.toBe('Faz story AGORA: grava 5s, close no produto.');
      expect(r.status).toBe('pending');
    });
  });

  it('é idempotente: materializar 2× não duplica slot/dia', async () => {
    const tasks = generateStoryTasks(restaurant, new Date('2024-03-04T00:00:00Z'), 1);

    const { data: secondRun, error } = await client.rpc('materialize_story_tasks', {
      p_restaurant_id: restaurant.id,
      p_tasks: tasks,
    });
    expect(error).toBeNull();
    expect(secondRun).toBe(0); // nada novo inserido

    const { count } = await client
      .from('story_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id);
    expect(count).toBe(9); // continua 9, sem duplicados
  });

  it('rejeita materializar para restaurante de outro tenant (access_denied)', async () => {
    const otherEmail = `stories-other-${ts}@test.brandflow.test`;
    const otherClient = await signUpUser(otherEmail, 'Test1234!');
    const { data: { user: otherUser } } = await otherClient.auth.getUser();
    const { data: otherTenant } = await serviceClient.rpc('create_tenant', {
      p_name: 'Outro Tenant',
      p_user_id: otherUser!.id,
    });

    // otherClient tenta materializar no restaurante do tenant A
    const tasks = generateStoryTasks(restaurant, new Date('2024-03-05T00:00:00Z'), 1);
    const { error } = await otherClient.rpc('materialize_story_tasks', {
      p_restaurant_id: restaurant.id,
      p_tasks: tasks,
    });
    expect(error).not.toBeNull();

    await serviceClient.from('tenants').delete().eq('id', otherTenant as string);
    await cleanupUser(otherEmail);
  }, 30000);

  it('mark_story_done marca done + done_at (próprio tenant)', async () => {
    const { data: task } = await client
      .from('story_tasks').select('id').eq('restaurant_id', restaurant.id).limit(1).single();
    const taskId = (task as { id: string }).id;

    const { error } = await client.rpc('mark_story_done', { p_task_id: taskId });
    expect(error).toBeNull();

    const { data: after } = await client
      .from('story_tasks').select('status, done_at').eq('id', taskId).single();
    expect(after!.status).toBe('done');
    expect(after!.done_at).not.toBeNull();
  });

  it('mark_story_done de outro tenant é negado', async () => {
    const { data: task } = await serviceClient
      .from('story_tasks').select('id').eq('restaurant_id', restaurant.id).limit(1).single();

    const otherEmail = `done-other-${ts}@test.brandflow.test`;
    const otherClient = await signUpUser(otherEmail, 'Test1234!');
    const { data: { user: otherUser } } = await otherClient.auth.getUser();
    const { data: otherTenant } = await serviceClient.rpc('create_tenant', {
      p_name: 'Outro Done', p_user_id: otherUser!.id,
    });

    const { error } = await otherClient.rpc('mark_story_done', {
      p_task_id: (task as { id: string }).id,
    });
    expect(error).not.toBeNull();

    await serviceClient.from('tenants').delete().eq('id', otherTenant as string);
    await cleanupUser(otherEmail);
  }, 30000);
});
