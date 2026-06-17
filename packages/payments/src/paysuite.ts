import type { PaymentProvider } from './provider';
import type { Cents } from '@brandflow/core';

// DECISÃO: Stub Paysuite - implementação completa em fase futura
export class PaysuiteProvider implements PaymentProvider {
  async createCheckout(_input: {
    kind: 'subscription' | 'credits';
    amountCents: Cents;
    reference: string;
    title: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<{ providerRef: string; checkoutUrl: string }> {
    throw new Error('PaysuiteProvider not implemented yet');
  }

  async verifyWebhook(_rawBody: string, _headers: Headers): Promise<{
    ok: boolean;
    reference?: string;
    status?: 'confirmed' | 'failed';
  }> {
    throw new Error('PaysuiteProvider not implemented yet');
  }

  async validateTransaction(_reference: string): Promise<'confirmed' | 'pending' | 'failed'> {
    throw new Error('PaysuiteProvider not implemented yet');
  }
}