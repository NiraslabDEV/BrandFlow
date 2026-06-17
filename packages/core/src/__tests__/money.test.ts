import { describe, it, expect } from 'vitest';
import { cents, formatMT, centsToDecimalString, decimalStringToCents, orderTotal } from '../money';

describe('money', () => {
  describe('cents', () => {
    it('creates valid cents', () => {
      expect(cents(100)).toBe(100);
      expect(cents(0)).toBe(0);
    });

    it('throws on invalid cents', () => {
      expect(() => cents(-1)).toThrow('invalid cents');
      expect(() => cents(1.5)).toThrow('invalid cents');
      expect(() => cents(Infinity)).toThrow('invalid cents');
    });
  });

  describe('formatMT', () => {
    it('formats cents to MT', () => {
      expect(formatMT(cents(100))).toBe('1,00 MT');
      expect(formatMT(cents(550000))).toBe('5500,00 MT');
    });
  });

  describe('centsToDecimalString', () => {
    it('converts cents to decimal string', () => {
      expect(centsToDecimalString(cents(100))).toBe('1.00');
      expect(centsToDecimalString(cents(550000))).toBe('5500.00');
    });
  });

  describe('decimalStringToCents', () => {
    it('converts decimal string to cents', () => {
      expect(decimalStringToCents('1.00')).toBe(100);
      expect(decimalStringToCents('5500.00')).toBe(550000);
    });
  });

  describe('orderTotal', () => {
    it('calculates total of items', () => {
      const items = [
        { qty: 2, unitPriceCents: cents(5000) },
        { qty: 3, unitPriceCents: cents(1000) },
      ];
      expect(orderTotal(items)).toBe(13000); // 2*5000 + 3*1000 = 13000
    });
  });
});