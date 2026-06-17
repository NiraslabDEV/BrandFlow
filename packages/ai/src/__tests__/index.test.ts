import { describe, it, expect } from 'vitest';
import { healthCheck } from '../index';

describe('ai', () => {
  it('health check works', () => {
    expect(healthCheck()).toBe('ai ok');
  });
});