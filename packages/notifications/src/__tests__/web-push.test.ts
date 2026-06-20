import { afterEach, describe, expect, it } from 'vitest';
import {
  sendPush,
  setPushTransport,
  backoffSeconds,
  nextAttemptAt,
  MAX_PUSH_ATTEMPTS,
  type PushSubscriptionRecord,
} from '../web-push';

const sub: PushSubscriptionRecord = {
  id: 'sub-1',
  endpoint: 'https://push.example/abc',
  keys: { p256dh: 'p', auth: 'a' },
};
const payload = { title: 'Faz story AGORA', body: 'mostra a equipa', url: '/stories' };

afterEach(() => setPushTransport(null));

describe('sendPush', () => {
  it('ok quando 2xx', async () => {
    setPushTransport(async () => ({ statusCode: 201 }));
    expect(await sendPush(sub, payload)).toEqual({ ok: true });
  });

  it('gone=true em 404/410 (subscription morta)', async () => {
    setPushTransport(async () => ({ statusCode: 410 }));
    const r = await sendPush(sub, payload);
    expect(r).toMatchObject({ ok: false, gone: true });

    setPushTransport(async () => ({ statusCode: 404 }));
    expect(await sendPush(sub, payload)).toMatchObject({ ok: false, gone: true });
  });

  it('erro transitório (não gone) em 5xx', async () => {
    setPushTransport(async () => ({ statusCode: 500 }));
    const r = await sendPush(sub, payload);
    expect(r).toMatchObject({ ok: false, gone: false });
  });

  it('nunca lança: exceção do transporte vira PushResult', async () => {
    setPushTransport(async () => {
      throw Object.assign(new Error('boom'), { statusCode: 410 });
    });
    expect(await sendPush(sub, payload)).toMatchObject({ ok: false, gone: true });

    setPushTransport(async () => {
      throw new Error('network');
    });
    expect(await sendPush(sub, payload)).toMatchObject({ ok: false, gone: false, error: 'network' });
  });

  it('serializa o payload em JSON para o transporte', async () => {
    let captured = '';
    setPushTransport(async (_s, json) => {
      captured = json;
      return { statusCode: 201 };
    });
    await sendPush(sub, payload);
    expect(JSON.parse(captured)).toMatchObject({ title: 'Faz story AGORA', url: '/stories' });
  });
});

describe('backoff', () => {
  it('cresce exponencialmente e satura em 1h', () => {
    expect(backoffSeconds(1)).toBe(60);
    expect(backoffSeconds(2)).toBe(120);
    expect(backoffSeconds(3)).toBe(240);
    expect(backoffSeconds(99)).toBe(3600); // cap
  });

  it('nextAttemptAt soma o backoff ao instante base', () => {
    const from = new Date('2026-06-20T12:00:00Z');
    expect(nextAttemptAt(1, from).toISOString()).toBe('2026-06-20T12:01:00.000Z');
    expect(nextAttemptAt(2, from).toISOString()).toBe('2026-06-20T12:02:00.000Z');
  });

  it('MAX_PUSH_ATTEMPTS definido', () => {
    expect(MAX_PUSH_ATTEMPTS).toBe(5);
  });
});
