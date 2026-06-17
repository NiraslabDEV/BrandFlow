import { createClient } from '@supabase/supabase-js';
import { PaymentProvider, PaymentKind } from './provider';
import { ZumboPayProvider } from './zumbopay';
import { PaysuiteProvider } from './paysuite';
import { MockPaymentProvider } from './mock';

export type { PaymentKind };

/**
 * Fábrica de providers de pagamento
 * Lê platform_settings → cai no .env quando vazio (CLAUDE.md 18.2)
 */
export async function getProvider(kind: PaymentKind): Promise<PaymentProvider> {
  // DECISÃO: Prioridade: platform_settings (painel) → .env (fallback)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  // Lê platform_settings (singleton, id=1)
  const { data: settings, error } = await supabase
    .from('platform_settings')
    .select('subscription_provider, credits_provider')
    .eq('id', 1)
    .single();

  if (error || !settings) {
    // Fallback para .env se não conseguir ler platform_settings
    console.warn(`[getProvider] Could not read platform_settings, falling back to .env:`, error);
    return getProviderFromEnv(kind);
  }

  const providerName = kind === 'subscription' 
    ? settings.subscription_provider 
    : settings.credits_provider;

  return getProviderInstance(providerName);
}

/**
 * Retorna provider baseado em .env (fallback)
 */
function getProviderFromEnv(kind: PaymentKind): PaymentProvider {
  // Defaults do MVP: subscription=zumbopay, credits=paysuite
  const defaultProvider = kind === 'subscription' ? 'zumbopay' : 'paysuite';
  
  // Se AI_PROVIDER=mock, usa mock para tudo (teste/dev)
  if (process.env.AI_PROVIDER === 'mock') {
      return new MockPaymentProvider();
  }

  return getProviderInstance(defaultProvider);
}

/**
 * Instancia o provider específico
 */
function getProviderInstance(providerName: string): PaymentProvider {
  switch (providerName) {
    case 'zumbopay':
      return new ZumboPayProvider();
    case 'paysuite':
      return new PaysuiteProvider();
    case 'mock':
      return new MockPaymentProvider();
    default:
      throw new Error(`Unknown payment provider: ${providerName}`);
  }
}