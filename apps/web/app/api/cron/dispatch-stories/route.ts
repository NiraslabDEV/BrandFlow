// POST /api/cron/dispatch-stories — passo 1 do outbox (1.2.3).
// Só ENFILEIRA notificações push para as story_tasks vencidas (idempotente por
// dedupe_key na RPC). NUNCA envia inline; o envio é no flush. pg_cron horário.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { isAuthorizedCron } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const { data, error } = await supabaseServer.rpc('enqueue_due_story_notifications')
    if (error) throw error
    return NextResponse.json({ ok: true, enqueued: data ?? 0 })
  } catch (err) {
    // Falha nunca trava o cron (6.3): loga e devolve 200 para o agendador não repetir em loop.
    const message = (err as Error)?.message ?? 'erro'
    await supabaseServer.from('event_log').insert({
      type: 'dispatch_stories_error',
      payload: { error: message },
    })
    return NextResponse.json({ ok: false, error: message })
  }
}
