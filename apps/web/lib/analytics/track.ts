// Módulo canónico de tracking - ÚNICO lugar que toca dataLayer/fbq/gtag
// Componentes NUNCA chamam fbq/gtag diretamente

import { getOrCreateSessionId, getPersistedUtmParams } from './session';

// ===== Tipos =====

type TrackingConfig = {
  gtmContainerId?: string | null;
  metaPixelId?: string | null;
  ga4MeasurementId?: string | null;
  gadsConversionId?: string | null;
  gadsConversionLabel?: string | null;
};

type EventPayload = {
  value_cents?: number;
  plan?: string;
  reference?: string;
  currency?: string;
  [key: string]: unknown;
};

// ===== Estado =====

let gtmLoaded = false;

/**
 * Verifica se o consentimento foi concedido
 */
function hasConsent(): boolean {
  if (typeof document === 'undefined') return false;
  
  const consent = getCookie('dl_consent');
  return consent === 'true';
}

/**
 * Obtém valor de cookie
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

/**
 * Carrega scripts de tracking (GTM, Pixel, GA4, Ads)
 * SÓ chama após consentimento
 */
export async function loadGTM(config: TrackingConfig): Promise<void> {
  if (typeof window === 'undefined') return;
  
  if (!hasConsent()) {
    console.log('[Analytics] Consentimento não concedido - scripts não carregados');
    return;
  }

  if (gtmLoaded) {
    console.log('[Analytics] Scripts já carregados');
    return;
  }

  // 1. GTM — create dataLayer stub then load script
  if (config.gtmContainerId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dl = ((window as any).dataLayer = (window as any).dataLayer || []);
    dl.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${config.gtmContainerId}`;
    document.head.appendChild(gtmScript);
    console.log('[Analytics] GTM carregado:', config.gtmContainerId);
  }

  // 2. Meta Pixel — queue stub then load script
  if (config.metaPixelId) {
    if (!window.fbq) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fbqStub: any = function (...args: unknown[]) { fbqStub.queue.push(args); };
      fbqStub.push = fbqStub;
      fbqStub.loaded = true;
      fbqStub.version = '2.0';
      fbqStub.queue = [];
      window.fbq = fbqStub;
      const pixelScript = document.createElement('script');
      pixelScript.async = true;
      pixelScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(pixelScript);
    }
    window.fbq?.('init', config.metaPixelId);
    window.fbq?.('track', 'PageView');
    console.log('[Analytics] Meta Pixel carregado:', config.metaPixelId);
  }

  // 3. GA4 — gtag command queue stub then load script
  if (config.ga4MeasurementId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    if (!w.gtag) w.gtag = function (...args: unknown[]) { w.dataLayer.push(args); };
    const ga4Script = document.createElement('script');
    ga4Script.async = true;
    ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${config.ga4MeasurementId}`;
    document.head.appendChild(ga4Script);
    window.gtag?.('js', new Date());
    window.gtag?.('config', config.ga4MeasurementId);
    console.log('[Analytics] GA4 carregado:', config.ga4MeasurementId);
  }

  // 4. Google Ads (conversion_label opcional)
  if (config.gadsConversionId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gadsConversionId}`;
    document.head.appendChild(script);
    
    console.log('[Analytics] Google Ads carregado:', config.gadsConversionId);
  }

  gtmLoaded = true;
}

// ===== Eventos do topo do funil =====

/**
 * view_landing - Landing page mount
 */
export function trackViewLanding(): void {
  if (typeof window === 'undefined') return;

  pushToMarketingEvents('view_landing');

  if (hasConsent()) {
    window.gtag?.('event', 'page_view', {
      page_title: 'Landing',
      page_location: window.location.href,
    });
    window.dataLayer?.push({ event: 'view_landing' });
  }
}

/**
 * view_pricing - Página de preços mount
 */
export function trackViewPricing(): void {
  if (typeof window === 'undefined') return;

  pushToMarketingEvents('view_pricing');

  if (hasConsent()) {
    window.gtag?.('event', 'view_item', {
      items: [{ item_id: 'plan_base', item_name: 'Plano Base' }],
    });
    window.dataLayer?.push({ event: 'view_pricing' });
  }
}

/**
 * sign_up - Conta criada
 */
export function trackSignUp(userId?: string): void {
  if (typeof window === 'undefined') return;

  pushToMarketingEvents('sign_up', { user_id: userId });

  if (hasConsent()) {
    window.gtag?.('event', 'sign_up', { method: 'email' });
    window.fbq?.('track', 'CompleteRegistration');
    window.dataLayer?.push({ event: 'sign_up' });
  }
}

/**
 * begin_checkout - Usuário escolheu plano
 */
export function trackBeginCheckout(plan: string): void {
  if (typeof window === 'undefined') return;

  pushToMarketingEvents('begin_checkout', { plan });

  if (hasConsent()) {
    window.gtag?.('event', 'begin_checkout', {
      currency: 'MZN',
      value: 5500,
      items: [{ item_id: plan, item_name: `Plano ${plan.toUpperCase()}` }],
    });
    window.fbq?.('track', 'InitiateCheckout');
    window.dataLayer?.push({ event: 'begin_checkout', plan });
  }
}

/**
 * add_payment_info - Usuário iniciou checkout do gateway
 */
export function trackAddPaymentInfo(plan: string): void {
  if (typeof window === 'undefined') return;

  pushToMarketingEvents('add_payment_info', { plan });

  if (hasConsent()) {
    window.gtag?.('event', 'add_payment_info', { currency: 'MZN', value: 5500 });
    window.fbq?.('track', 'AddPaymentInfo');
    window.dataLayer?.push({ event: 'add_payment_info', plan });
  }
}

// ===== Eventos de conversão (usados na M3) =====

/**
 * subscribe - Subscrição confirmada (SÓ quando payments.status = 'confirmed')
 * @param reference - Referência do pagamento (BFLOW-...)
 * @param valueCents - Valor em centavos
 */
export function trackSubscribe(reference: string, valueCents: number): void {
  if (typeof window === 'undefined') return;

  const eventID = `subscribe_${reference}`;
  const value = valueCents / 100;

  pushToMarketingEvents('subscribe', { value_cents: valueCents, reference });

  if (hasConsent()) {
    window.dataLayer?.push({ ecommerce: null });
    window.gtag?.('event', 'purchase', {
      transaction_id: reference,
      value,
      currency: 'MZN',
      items: [{ item_id: 'subscription_base', item_name: 'Subscrição Plano Base' }],
    });
    window.fbq?.('track', 'Subscribe', { value, currency: 'MZN' }, { eventID });
    window.dataLayer?.push({ event: 'subscribe_conversion', transaction_id: reference, value, currency: 'MZN' });
    localStorage.setItem(`tracked_${reference}`, 'true');
  }
}

/**
 * purchase - Compra de créditos confirmada (SÓ quando payments.status = 'confirmed')
 * @param reference - Referência do pagamento
 * @param valueCents - Valor em centavos
 * @param credits - Número de créditos comprados
 */
export function trackPurchase(reference: string, valueCents: number, credits: number): void {
  if (typeof window === 'undefined') return;

  const eventID = `purchase_${reference}`;
  const value = valueCents / 100;

  pushToMarketingEvents('purchase', { value_cents: valueCents, reference, credits });

  if (hasConsent()) {
    window.dataLayer?.push({ ecommerce: null });
    window.gtag?.('event', 'purchase', {
      transaction_id: reference,
      value,
      currency: 'MZN',
      items: [{ item_id: `credits_${credits}`, item_name: `${credits} Créditos` }],
    });
    window.fbq?.('track', 'Purchase', { value, currency: 'MZN' }, { eventID });
    window.dataLayer?.push({ event: 'purchase_conversion', transaction_id: reference, value, currency: 'MZN' });
    localStorage.setItem(`tracked_${reference}`, 'true');
  }
}

// ===== Helper: envia para marketing_events (first-party) =====

/**
 * Envia evento para a tabela marketing_events via /api/track
 * Sobrevive a adblock/iOS
 */
async function pushToMarketingEvents(type: string, payload: EventPayload = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  const { value_cents, ...rest } = payload;
  const sessionId = getOrCreateSessionId();
  const utm = getPersistedUtmParams();

  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        type,
        utm: Object.fromEntries(Object.entries(utm).filter(([, v]) => v !== null)),
        payload: rest,
        value_cents,
      }),
      keepalive: true,
    });
  } catch (error) {
    console.warn('[Analytics] Falha ao enviar evento first-party:', error);
  }
}

/**
 * Verifica se evento já foi tracked (idempotência)
 */
export function isEventTracked(reference: string): boolean {
  if (typeof window === 'undefined') return false;
  
  return localStorage.getItem(`tracked_${reference}`) === 'true';
}