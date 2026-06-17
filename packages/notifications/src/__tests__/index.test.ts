import { describe, it, expect } from 'vitest';
import { healthCheck } from '../index';

describe('notifications', () => {
  it('health check works', () => {
    expect(healthCheck()).toBe('notifications ok');
  });
});