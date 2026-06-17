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

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role === 'super_admin'
}
