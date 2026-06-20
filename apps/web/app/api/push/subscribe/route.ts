// POST /api/push/subscribe — regista uma Web Push subscription (escopo de TENANT).
// DECISÃO: equipa sem login (1.2.2) → user_id null; tenant vem da sessão, nunca do client.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { currentTenant } from '@/lib/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  label: z.string().max(120).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const tenant = await currentTenant()
    if (!tenant) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { endpoint, keys, label } = subscribeSchema.parse(await request.json())

    const supabase = createServerSupabaseClient()
    // upsert por endpoint: re-subscrição do mesmo aparelho não duplica.
    // tenant_id é forçado pelo servidor; RLS (with check) garante o isolamento.
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { tenant_id: tenant.id, user_id: null, endpoint, keys, label: label ?? null },
        { onConflict: 'endpoint' },
      )

    if (error) {
      console.error('[/api/push/subscribe]', error.message)
      return NextResponse.json({ error: 'Falha ao registar' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
