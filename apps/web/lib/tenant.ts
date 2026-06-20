// DECISÃO: tenant_id vem SEMPRE da sessão, nunca do client (CLAUDE.md 1.2)
import { createServerSupabaseClient } from './supabase-server'

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  trial_ends_at: string
  grace_until: string | null
  deleted_at: string | null
}

export async function currentTenant(): Promise<Tenant | null> {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', membership.tenant_id)
    .maybeSingle()

  if (!tenant || tenant.deleted_at) return null

  return tenant as Tenant
}

export interface Restaurant {
  id: string
  tenant_id: string
  name: string
  slug: string
  open_hour: number
  close_hour: number
  timezone: string
}

// Restaurante do tenant da sessão (MVP: 1 restaurante por tenant). RLS isola.
export async function currentRestaurant(): Promise<Restaurant | null> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('restaurants')
    .select('id, tenant_id, name, slug, open_hour, close_hour, timezone')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (data as Restaurant) ?? null
}

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role === 'super_admin'
}
