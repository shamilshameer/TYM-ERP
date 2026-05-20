import { describe, it, expect } from 'vitest';
import { calculateBackoff } from '../utils/backoffCalculator';

describe('SyncERP - Outbox Backoff Retry Engine', () => {

  it('should return 0 delay if retry count is 0 or negative', () => {
    expect(calculateBackoff(0)).toBe(0);
    expect(calculateBackoff(-3)).toBe(0);
  });

  it('should calculate correct exponential delays for initial retries', () => {
    // Retry 1: 2000 * 2^1 = 4000
    expect(calculateBackoff(1, 2000, 60000)).toBe(4000);
    
    // Retry 2: 2000 * 2^2 = 8000
    expect(calculateBackoff(2, 2000, 60000)).toBe(8000);
    
    // Retry 3: 2000 * 2^3 = 16000
    expect(calculateBackoff(3, 2000, 60000)).toBe(16000);
  });

  it('should cap exponential backoff delays at maximum delay limit', () => {
    // Retry 5: 2000 * 2^5 = 64000 -> capped at 60000
    expect(calculateBackoff(5, 2000, 60000)).toBe(60000);
    
    // Retry 10: 2000 * 2^10 = 2048000 -> capped at 60000
    expect(calculateBackoff(10, 2000, 60000)).toBe(60000);
  });

  it('should respect custom initial and maximum parameters', () => {
    const customInitial = 1000;
    const customMax = 15000;
    
    // Retry 1: 1000 * 2^1 = 2000
    expect(calculateBackoff(1, customInitial, customMax)).toBe(2000);
    
    // Retry 4: 1000 * 2^4 = 16000 -> capped at 15000
    expect(calculateBackoff(4, customInitial, customMax)).toBe(15000);
  });
});
