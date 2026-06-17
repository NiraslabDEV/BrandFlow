import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'

// Campos públicos (A) — seguros para devolver ao client
const PUBLIC_FIELDS = [
  'subscription_provider', 'credits_provider',
  'gtm_container_id', 'meta_pixel_id', 'ga4_measurement_id',
  'gads_conversion_id', 'gads_conversion_label',
] as const

// Campos secretos (B) — NUNCA devolver o valor; devolver só se está preenchido
const SECRET_FIELDS = [
  'zumbopay_api_key', 'zumbopay_webhook_secret', 'zumbopay_wallet_id', 'zumbopay_merchant_id',
  'paysuite_api_key', 'paysuite_webhook_secret',
  'resend_api_key', 'meta_capi_token', 'gads_developer_token',
] as const

async function assertSuperAdmin(_request: NextRequest): Promise<boolean> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role === 'super_admin'
}

export async function GET(request: NextRequest) {
  if (!await assertSuperAdmin(request)) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
  }

  const { data, error } = await supabaseServer
    .from('platform_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao carregar configurações' }, { status: 500 })
  }

  // Campos públicos: valor direto
  const publicValues: Record<string, string> = {}
  for (const f of PUBLIC_FIELDS) publicValues[f] = (data as Record<string, string>)[f] ?? ''

  // Campos secretos: só informa se está preenchido (nunca o valor)
  const secretMeta: Record<string, { set: boolean; masked: string }> = {}
  for (const f of SECRET_FIELDS) {
    const val = (data as Record<string, string | null>)[f]
    secretMeta[f] = {
      set: !!val,
      masked: val ? `••••${val.slice(-4)}` : '',
    }
  }

  return NextResponse.json({ public: publicValues, secrets: secretMeta })
}

export async function PUT(request: NextRequest) {
  if (!await assertSuperAdmin(request)) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
  }

  const body = await request.json()

  // Constrói o payload de update — só campos conhecidos, nunca id/tenant_id do client
  const update: Record<string, string | null> = {}
  for (const f of PUBLIC_FIELDS) {
    if (f in body) update[f] = String(body[f] ?? '').trim() || null
  }
  // Campos secretos: só atualiza se o client enviou um valor não-masked
  for (const f of SECRET_FIELDS) {
    if (f in body && body[f] && !String(body[f]).startsWith('••••')) {
      update[f] = String(body[f]).trim() || null
    }
  }
  // Permite remover um segredo enviando string vazia explícita com flag
  for (const f of SECRET_FIELDS) {
    if (body[`${f}_clear`] === true) update[f] = null
  }

  const { error } = await supabaseServer
    .from('platform_settings')
    .update(update)
    .eq('id', 1)

  if (error) return NextResponse.json({ error: 'Erro ao guardar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
