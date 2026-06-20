// DECISÃO (CLAUDE.md 16.6): ESTE é o único módulo que toca a lib `web-push`.
// Rotas/crons chamam sendPush()/configureVapid() — nunca a lib diretamente.
import webpush from 'web-push';

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Resultado discriminado: ok | gone (404/410 → apagar subscription) | erro transitório
export type PushResult =
  | { ok: true }
  | { ok: false; gone: boolean; error: string };

// Transporte injetável: produção usa web-push; testes injetam um mock.
export type PushTransport = (
  sub: PushSubscriptionRecord,
  payloadJson: string,
) => Promise<{ statusCode: number }>;

let vapidConfigured = false;
let transport: PushTransport | null = null;

/** Configura VAPID a partir do ambiente (idempotente). */
export function configureVapid(): void {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:niraslab.dev@gmail.com';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys ausentes (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

/** Injeta um transporte (testes). Passar null repõe o transporte real (web-push). */
export function setPushTransport(t: PushTransport | null): void {
  transport = t;
}

function realTransport(): PushTransport {
  return async (sub, payloadJson) => {
    configureVapid();
    const res = await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      payloadJson,
    );
    return { statusCode: res.statusCode };
  };
}

/** Envia um push. Nunca lança: devolve sempre um PushResult. */
export async function sendPush(
  sub: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<PushResult> {
  const send = transport ?? realTransport();
  try {
    const { statusCode } = await send(sub, JSON.stringify(payload));
    if (statusCode >= 200 && statusCode < 300) return { ok: true };
    // 404/410 = subscription morta → apagar (6.1)
    const gone = statusCode === 404 || statusCode === 410;
    return { ok: false, gone, error: `status ${statusCode}` };
  } catch (err: unknown) {
    // web-push lança WebPushError com .statusCode em respostas de erro
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, gone: true, error: `status ${statusCode}` };
    }
    return { ok: false, gone: false, error: (err as Error)?.message ?? 'erro de envio' };
  }
}

// ============================================================================
// Backoff exponencial do outbox (6.3)
// ============================================================================

export const MAX_PUSH_ATTEMPTS = 5;

/** Atraso (segundos) antes da próxima tentativa, dado o nº de tentativas já feitas. */
export function backoffSeconds(attempts: number): number {
  // 1ª falha → 60s, depois 120s, 240s, 480s ... (cap 1h)
  const base = 60 * Math.pow(2, Math.max(0, attempts - 1));
  return Math.min(base, 3600);
}

/** Instante da próxima tentativa a partir de `from` (default agora). */
export function nextAttemptAt(attempts: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + backoffSeconds(attempts) * 1000);
}
