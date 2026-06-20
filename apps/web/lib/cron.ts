// DECISÃO: /api/cron/* e webhooks internos protegidos por CRON_SECRET (env §13).
import { NextRequest } from 'next/server'

/** true se o pedido traz o CRON_SECRET correto (header Authorization: Bearer ... ou x-cron-secret). */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const header = request.headers.get('x-cron-secret')
  return bearer === secret || header === secret
}
