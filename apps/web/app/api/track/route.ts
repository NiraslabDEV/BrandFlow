import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Service-role client para bypass RLS no INSERT (marketing_events é append-only)
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const trackSchema = z.object({
  session_id: z.string().min(1),
  type: z.enum(['view_landing', 'view_pricing', 'sign_up', 'begin_checkout', 'add_payment_info', 'subscribe', 'purchase']),
  utm: z.record(z.string().optional()).optional().default({}),
  payload: z.record(z.unknown()).optional().default({}),
  value_cents: z.number().int().nonnegative().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, type, utm, payload, value_cents } = trackSchema.parse(body)

    // tenant_id vem da sessão (se autenticado), nunca do client
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

    let tenantId: string | null = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // tenant_id via memberships, nunca do client (CLAUDE.md 1.2)
      const { data: membership } = await supabase
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle()
      tenantId = membership?.tenant_id ?? null
    }

    // INSERT via service role — anon nunca insere direto (CLAUDE.md 19.4)
    const { error } = await serviceClient
      .from('marketing_events')
      .insert({
        session_id,
        tenant_id: tenantId,
        type,
        value_cents: value_cents ?? null,
        utm,
        payload,
      })

    if (error) {
      console.error('[/api/track]', error.message)
      // Não falha o request — evento perdido é aceitável (fire-and-forget)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
