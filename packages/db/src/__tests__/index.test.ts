import { describe, it, expect } from 'vitest';
import { healthCheck } from '../index';

describe('db', () => {
  it('health check works', () => {
    expect(healthCheck()).toBe('db ok');
  });
});