/**
 * RLS (Row Level Security) Tests for Multi-Tenant Isolation
 *
 * Requires Supabase local running: supabase start
 * Run: pnpm test rls
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// freshAnon() fresco criado por chamada para evitar contaminação de sessão
const freshAnon = () => createClient(SUPABASE_URL, ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function signUpUser(email: string, password: string): Promise<SupabaseClient> {
  // Usa cliente descartável para signup (evita persistir sessão no freshAnon() global)
  const signupClient = freshAnon();
  const { data, error } = await signupClient.auth.signUp({ email, password });
  if (error || !data.user) throw new Error(`signUp failed: ${error?.message}`);
  const userClient = freshAnon();
  await userClient.auth.signInWithPassword({ email, password });
  return userClient;
}

async function cleanupUser(email: string) {
  const { data } = await serviceClient.auth.admin.listUsers();
  const user = data.users.find(u => u.email === email);
  if (user) await serviceClient.auth.admin.deleteUser(user.id);
}

describe('RLS Multi-Tenant Isolation', () => {
  const ts = Date.now();
  const emailA = `tenant-a-${ts}@test.brandflow.test`;
  const emailB = `tenant-b-${ts}@test.brandflow.test`;
  const password = 'Test1234!';
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let tenantIdA: string;
  let tenantIdB: string;

  beforeAll(async () => {
    clientA = await signUpUser(emailA, password);
    clientB = await signUpUser(emailB, password);

    const { data: { user: userA } } = await clientA.auth.getUser();
    const { data: { user: userB } } = await clientB.auth.getUser();

    const { data: tA, error: eA } = await serviceClient.rpc('create_tenant', {
      p_name: 'Restaurante A',
      p_user_id: userA!.id,
    });
    if (eA) throw new Error(`create_tenant A: ${eA.message}`);
    tenantIdA = tA as string;

    const { data: tB, error: eB } = await serviceClient.rpc('create_tenant', {
      p_name: 'Restaurante B',
      p_user_id: userB!.id,
    });
    if (eB) throw new Error(`create_tenant B: ${eB.message}`);
    tenantIdB = tB as string;
  }, 30000);

  afterAll(async () => {
    await serviceClient.from('tenants').delete().eq('id', tenantIdA);
    await serviceClient.from('tenants').delete().eq('id', tenantIdB);
    await cleanupUser(emailA);
    await cleanupUser(emailB);
  }, 30000);

  describe('(a) Anon cannot read any data', () => {
    it('anon reads tenants → empty', async () => {
      const { data, error } = await freshAnon().from('tenants').select('*');
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('anon reads restaurants → empty', async () => {
      const { data } = await freshAnon().from('restaurants').select('*');
      expect(data).toEqual([]);
    });

    it('anon reads credit_wallets → empty', async () => {
      const { data } = await freshAnon().from('credit_wallets').select('*');
      expect(data).toEqual([]);
    });

    it('anon reads platform_settings → empty (sem policy)', async () => {
      const { data } = await freshAnon().from('platform_settings').select('*');
      expect(data).toEqual([]);
    });
  });

  describe('(b) Tenant A não vê dados do Tenant B', () => {
    it('clientA lê tenants → só o seu', async () => {
      const { data } = await clientA.from('tenants').select('id');
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      expect(ids).toContain(tenantIdA);
      expect(ids).not.toContain(tenantIdB);
    });

    it('clientA lê restaurants → só do tenant A', async () => {
      const { data } = await clientA.from('restaurants').select('tenant_id');
      (data ?? []).forEach((r: { tenant_id: string }) => {
        expect(r.tenant_id).toBe(tenantIdA);
      });
    });

    it('clientA lê credit_wallets → só do tenant A', async () => {
      const { data } = await clientA.from('credit_wallets').select('tenant_id');
      (data ?? []).forEach((r: { tenant_id: string }) => {
        expect(r.tenant_id).toBe(tenantIdA);
      });
    });

    it('clientB lê memberships → só do tenant B', async () => {
      const { data } = await clientB.from('memberships').select('tenant_id');
      (data ?? []).forEach((r: { tenant_id: string }) => {
        expect(r.tenant_id).toBe(tenantIdB);
      });
    });
  });

  describe('(c) create_tenant cria as 4 linhas atomicamente', () => {
    it('tenant criado existe em tenants (status trial, plan base)', async () => {
      const { data } = await serviceClient
        .from('tenants').select('id, status, plan').eq('id', tenantIdA);
      expect(data).toHaveLength(1);
      expect(data![0].status).toBe('trial');
      expect(data![0].plan).toBe('base');
    });

    it('membership owner criada', async () => {
      const { data } = await serviceClient
        .from('memberships').select('role').eq('tenant_id', tenantIdA);
      expect(data).toHaveLength(1);
      expect(data![0].role).toBe('owner');
    });

    it('restaurant criado', async () => {
      const { data } = await serviceClient
        .from('restaurants').select('id').eq('tenant_id', tenantIdA);
      expect(data).toHaveLength(1);
    });

    it('credit_wallet criado com saldo 0', async () => {
      const { data } = await serviceClient
        .from('credit_wallets').select('balance').eq('tenant_id', tenantIdA);
      expect(data).toHaveLength(1);
      expect(data![0].balance).toBe(0);
    });
  });

  describe('(d) Tenant comum não lê platform_settings', () => {
    it('clientA (owner) lê platform_settings → empty', async () => {
      const { data } = await clientA.from('platform_settings').select('*');
      expect(data).toEqual([]);
    });

    it('clientB (owner) lê platform_settings → empty', async () => {
      const { data } = await clientB.from('platform_settings').select('*');
      expect(data).toEqual([]);
    });

    it('service role lê platform_settings → 1 linha (singleton)', async () => {
      const { data } = await serviceClient.from('platform_settings').select('id');
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(1);
    });
  });
});
