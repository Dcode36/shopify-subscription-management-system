import { describe, expect, it } from 'vitest';
import { SubscriptionStore } from './subscription-store.js';

describe('SubscriptionStore', () => {
  it('pauses an active contract and records resume date', () => {
    const store = new SubscriptionStore();
    const resumeAt = '2026-12-01T00:00:00.000Z';
    const result = store.pause('sub_01', resumeAt);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('expected pause to succeed');
    expect(result.contract.status).toBe('PAUSED');
    expect(result.contract.pausedUntil).toBe(resumeAt);
  });

  it('advances next billing date when skipping delivery', () => {
    const store = new SubscriptionStore();
    const before = store.getById('sub_01');
    expect(before?.nextBillingDate).toBeDefined();
    const result = store.skipNextDelivery('sub_01');
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('expected skip to succeed');
    expect(result.contract.nextBillingDate).not.toBe(before?.nextBillingDate);
  });
});
