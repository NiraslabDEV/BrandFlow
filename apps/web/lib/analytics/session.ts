// Helper para gerenciar session_id 1st-party
// Sessão persistente por 2 anos para tracking do funil

const SESSION_COOKIE = 'bf_session';
const SESSION_EXPIRY_DAYS = 730; // 2 anos

/**
 * Gera ou recupera o session_id atual
 * @returns UUID v4 da sessão
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  let sessionId = getCookie(SESSION_COOKIE);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    setCookie(SESSION_COOKIE, sessionId, SESSION_EXPIRY_DAYS);
  }

  return sessionId;
}

/**
 * Obtém o session_id atual (sem criar novo se não existir)
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return getCookie(SESSION_COOKIE) || null;
}

/**
 * Remove o session_id (logout)
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  deleteCookie(SESSION_COOKIE);
}

// ===== Helpers de cookie (simples, sem dependências) =====

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Captura parâmetros UTM da URL para tracking
 */
export function getUtmParams(): Record<string, string | null> {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
}

/**
 * Salva UTM params em sessionStorage para usar em eventos futuros
 */
export function persistUtmParams(): void {
  const utm = getUtmParams();
  const hasUtm = Object.values(utm).some((v) => v !== null);
  
  if (hasUtm && typeof window !== 'undefined') {
    sessionStorage.setItem('bf_utm', JSON.stringify(utm));
  }
}

/**
 * Recupera UTM params persistidos
 */
export function getPersistedUtmParams(): Record<string, string | null> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = sessionStorage.getItem('bf_utm');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}