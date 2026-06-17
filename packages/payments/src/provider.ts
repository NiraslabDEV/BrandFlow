import type { Cents } from '@brandflow/core';

export type PaymentKind = 'subscription' | 'credits';

export interface PaymentProvider {
  /**
   * Cria um checkout no gateway
   * @param input Dados do pagamento
   * @returns providerRef (ID no gateway) e checkoutUrl (URL para redirecionar)
   */
  createCheckout(input: {
    kind: PaymentKind;
    amountCents: Cents;
    reference: string;
    title: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<{ providerRef: string; checkoutUrl: string }>;

  /**
   * Verifica um webhook do gateway
   * @param rawBody Corpo bruto da requisição
   * @param headers Headers da requisição
   * @returns ok=false se assinatura inválida, ok=true com reference e status se válida
   */
  verifyWebhook(rawBody: string, headers: Headers): Promise<{
    ok: boolean;
    reference?: string;
    status?: 'confirmed' | 'failed';
  }>;

  /**
   * Valida ativamente uma transação (verificação server-side)
   * @param reference Referência única do pagamento
   * @returns Status da transação
   */
  validateTransaction(reference: string): Promise<'confirmed' | 'pending' | 'failed'>;
}