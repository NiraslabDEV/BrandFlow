// POST /api/cron/flush-notifications — passo 2 do outbox (1.2.3 / 6.3).
// Reclama 'queued' vencidas, envia push a TODAS as subscriptions do tenant, e
// marca sent/failed com backoff. Subscription 404/410 → apagada (6.1).
// Falha de envio nunca trava o cron: reagenda ou marca failed + event_log.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { isAuthorizedCron } from '@/lib/cron'
import {
  sendPush,
  nextAttemptAt,
  MAX_PUSH_ATTEMPTS,
  type PushSubscriptionRecord,
} from '@brandflow/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface NotificationRow {
  id: string
  tenant_id: string
  title: string
  body: string
  payload: { url?: string } & Record<string, unknown>
  attempts: number
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: claimed, error } = await supabaseServer.rpc('claim_due_notifications', {
    p_limit: 100,
  })
  if (error) {
    await supabaseServer.from('event_log').insert({
      type: 'flush_notifications_error',
      payload: { error: error.message },
    })
    return NextResponse.json({ ok: false, error: error.message })
  }

  let sent = 0
  let failed = 0
  let rescheduled = 0

  for (const n of (claimed ?? []) as NotificationRow[]) {
    const { data: subs } = await supabaseServer
      .from('push_subscriptions')
      .select('id, endpoint, keys')
      .eq('tenant_id', n.tenant_id)

    let anyTransient = false
    let lastError = ''
    for (const sub of (subs ?? []) as PushSubscriptionRecord[]) {
      const res = await sendPush(sub, {
        title: n.title,
        body: n.body,
        url: n.payload?.url ?? '/stories',
        data: n.payload,
      })
      if (res.ok) continue
      if (res.gone) {
        // subscription morta → remover (6.1)
        await supabaseServer.from('push_subscriptions').delete().eq('id', sub.id)
        continue
      }
      anyTransient = true
      lastError = res.error
    }

    if (!anyTransient) {
      await supabaseServer
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
        .eq('id', n.id)
      sent++
    } else if (n.attempts >= MAX_PUSH_ATTEMPTS) {
      await supabaseServer
        .from('notifications')
        .update({ status: 'failed', error: lastError })
        .eq('id', n.id)
      await supabaseServer.from('event_log').insert({
        tenant_id: n.tenant_id,
        type: 'notification_failed',
        payload: { notification_id: n.id, error: lastError },
      })
      failed++
    } else {
      // retry: continua 'queued', adia próxima tentativa (backoff)
      await supabaseServer
        .from('notifications')
        .update({ next_attempt_at: nextAttemptAt(n.attempts).toISOString(), error: lastError })
        .eq('id', n.id)
      rescheduled++
    }
  }

  return NextResponse.json({ ok: true, claimed: (claimed ?? []).length, sent, failed, rescheduled })
}
