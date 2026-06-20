// Cliente: regista o service worker, pede permissão e subscreve Web Push.
// O endpoint/keys são enviados a /api/push/subscribe (tenant vem da sessão).

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export type PushOptInResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'no-vapid' | 'error'; message?: string }

export async function enablePush(label?: string): Promise<PushOptInResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' }
  }
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) return { ok: false, reason: 'no-vapid' }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: 'denied' }

    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      }))

    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        label: label ?? navigator.userAgent.slice(0, 80),
      }),
    })
    if (!res.ok) return { ok: false, reason: 'error', message: `HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'error', message: (err as Error)?.message }
  }
}
