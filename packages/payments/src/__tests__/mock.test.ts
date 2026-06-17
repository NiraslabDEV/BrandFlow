import { describe, it, expect, beforeEach } from 'vitest';
import { MockPaymentProvider } from '../mock';
import type { Cents } from '@brandflow/core';

describe('MockPaymentProvider', () => {
  let provider: MockPaymentProvider;
  const cents = (n: number): Cents => n as Cents;

  beforeEach(() => {
    provider = new MockPaymentProvider();
    MockPaymentProvider.reset();
  });

  describe('createCheckout', () => {
    it('creates checkout and returns providerRef and checkoutUrl', async () => {
      const result = await provider.createCheckout({
        kind: 'subscription',
        amountCents: cents(550000),
        reference: 'TEST-001',
        title: 'Plano Base',
        returnUrl: 'https://example.com/return',
        callbackUrl: 'https://example.com/callback',
      });

      expect(result.providerRef).toBe('MOCK-TEST-001');
      expect(result.checkoutUrl).toContain('TEST-001');
      expect(result.checkoutUrl).toContain('example.com');
    });
  });

  describe('verifyWebhook', () => {
    it('verifies valid webhook payload', async () => {
      await provider.createCheckout({
        kind: 'subscription',
        amountCents: cents(550000),
        reference: 'TEST-002',
        title: 'Plano Base',
        returnUrl: 'https://example.com/return',
        callbackUrl: 'https://example.com/callback',
      });

      const result = await provider.verifyWebhook(
        JSON.stringify({ reference: 'TEST-002', status: 'confirmed' }),
        new Headers()
      );

      expect(result.ok).toBe(true);
      expect(result.reference).toBe('TEST-002');
      expect(result.status).toBe('confirmed');
    });

    it('returns false for invalid payload', async () => {
      const result = await provider.verifyWebhook(
        JSON.stringify({ invalid: 'payload' }),
        new Headers()
      );

      expect(result.ok).toBe(false);
    });

    it('returns false for unknown reference', async () => {
      const result = await provider.verifyWebhook(
        JSON.stringify({ reference: 'UNKNOWN', status: 'confirmed' }),
        new Headers()
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('validateTransaction', () => {
    it('returns pending for new transaction', async () => {
      await provider.createCheckout({
        kind: 'subscription',
        amountCents: cents(550000),
        reference: 'TEST-003',
        title: 'Plano Base',
        returnUrl: 'https://example.com/return',
        callbackUrl: 'https://example.com/callback',
      });

      const status = await provider.validateTransaction('TEST-003');
      expect(status).toBe('pending');
    });

    it('returns confirmed after manual confirmation', async () => {
      await provider.createCheckout({
        kind: 'subscription',
        amountCents: cents(550000),
        reference: 'TEST-004',
        title: 'Plano Base',
        returnUrl: 'https://example.com/return',
        callbackUrl: 'https://example.com/callback',
      });

      MockPaymentProvider.confirm('TEST-004');
      const status = await provider.validateTransaction('TEST-004');
      expect(status).toBe('confirmed');
    });

    it('returns failed for unknown reference', async () => {
      const status = await provider.validateTransaction('UNKNOWN');
      expect(status).toBe('failed');
    });
  });

  describe('helpers', () => {
    it('reset clears all payments', async () => {
      await provider.createCheckout({
        kind: 'subscription',
        amountCents: cents(550000),
        reference: 'TEST-005',
        title: 'Plano Base',
        returnUrl: 'https://example.com/return',
        callbackUrl: 'https://example.com/callback',
      });

      MockPaymentProvider.reset();
      const status = await provider.validateTransaction('TEST-005');
      expect(status).toBe('failed');
    });
  });
});