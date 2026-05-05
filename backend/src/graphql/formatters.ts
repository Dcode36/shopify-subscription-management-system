import type { BillingInterval } from '../domain/subscription.js';

const INTERVAL_WORD: Record<BillingInterval, { one: string; many: string }> = {
  DAY: { one: 'day', many: 'days' },
  WEEK: { one: 'week', many: 'weeks' },
  MONTH: { one: 'month', many: 'months' },
  YEAR: { one: 'year', many: 'years' },
};

export function billingFrequencyDescription(
  interval: BillingInterval,
  count: number,
): string {
  const words = INTERVAL_WORD[interval];
  const noun = count === 1 ? words.one : words.many;
  return `Every ${String(count)} ${noun}`;
}
