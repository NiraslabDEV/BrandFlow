import type { PaymentProvider } from './provider';
import type { Cents } from '@brandflow/core';

// DECISÃO: Mock provider para testes e desenvolvimento
// Armazena pagamentos em memória
const mockPayments = new Map<
  string,
  { reference: string; status: 'confirmed' | 'pending' | 'failed' }
>();

export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(input: {
    kind: 'subscription' | 'credits';
    amountCents: Cents;
    reference: string;
    title: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<{ providerRef: string; checkoutUrl: string }> {
    const providerRef = `MOCK-${input.reference}`;
    mockPayments.set(input.reference, { reference: input.reference, status: 'pending' });
    return {
      providerRef,
      checkoutUrl: `${input.returnUrl}?reference=${input.reference}`,
    };
  }

  async verifyWebhook(rawBody: string, _headers: Headers): Promise<{
    ok: boolean;
    reference?: string;
    status?: 'confirmed' | 'failed';
  }> {
    try {
      const data = JSON.parse(rawBody);
      if (data.reference && (data.status === 'confirmed' || data.status === 'failed')) {
        const payment = mockPayments.get(data.reference);
        if (payment) {
          payment.status = data.status;
          return { ok: true, reference: data.reference, status: data.status };
        }
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  async validateTransaction(reference: string): Promise<'confirmed' | 'pending' | 'failed'> {
    const payment = mockPayments.get(reference);
    return payment?.status || 'failed';
  }

  // Helper para testes
  static confirm(reference: string): void {
    const payment = mockPayments.get(reference);
    if (payment) payment.status = 'confirmed';
  }

  static fail(reference: string): void {
    const payment = mockPayments.get(reference);
    if (payment) payment.status = 'failed';
  }

  static reset(): void {
    mockPayments.clear();
  }
}