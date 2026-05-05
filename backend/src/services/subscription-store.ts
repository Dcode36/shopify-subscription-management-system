import type { SubscriptionContractModel } from '../domain/subscription.js';
import { subscriptionFixtures } from '../data/fixtures.js';

export interface UserErrorModel {
  field: string[] | null;
  message: string;
  code: string | null;
}

export interface MutationOk<T> {
  success: true;
  contract: T;
  userErrors: [];
}

export interface MutationFail {
  success: false;
  contract: null;
  userErrors: UserErrorModel[];
}

export type MutationResult<T> = MutationOk<T> | MutationFail;

function cloneContract(c: SubscriptionContractModel): SubscriptionContractModel {
  return structuredClone(c);
}

function addMs(iso: string, ms: number): string {
  const d = new Date(iso);
  return new Date(d.getTime() + ms).toISOString();
}

function nextBillingAfterSkip(contract: SubscriptionContractModel): string | null {
  const base = contract.nextBillingDate ?? new Date().toISOString();
  const { billingInterval, billingIntervalCount } = contract;
  const mult = billingIntervalCount;
  switch (billingInterval) {
    case 'DAY':
      return addMs(base, mult * 86400000);
    case 'WEEK':
      return addMs(base, mult * 7 * 86400000);
    case 'MONTH': {
      const date = new Date(base);
      date.setUTCMonth(date.getUTCMonth() + mult);
      return date.toISOString();
    }
    case 'YEAR': {
      const date = new Date(base);
      date.setUTCFullYear(date.getUTCFullYear() + mult);
      return date.toISOString();
    }
    default: {
      const _exhaustive: never = billingInterval;
      return _exhaustive;
    }
  }
}

export class SubscriptionStore {
  private readonly contracts = new Map<string, SubscriptionContractModel>();

  constructor(seed: readonly SubscriptionContractModel[] = subscriptionFixtures) {
    for (const c of seed) {
      this.contracts.set(c.id, cloneContract(c));
    }
  }

  listByCustomer(customerId: string): SubscriptionContractModel[] {
    return [...this.contracts.values()]
      .filter((c) => c.customerId === customerId)
      .map(cloneContract)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getById(id: string): SubscriptionContractModel | undefined {
    const c = this.contracts.get(id);
    return c ? cloneContract(c) : undefined;
  }

  pause(
    contractId: string,
    resumeDate: string | undefined,
  ): MutationResult<SubscriptionContractModel> {
    const current = this.contracts.get(contractId);
    if (!current) {
      return fail('NOT_FOUND', 'Contract not found.', ['input', 'contractId']);
    }
    if (current.status !== 'ACTIVE') {
      return fail('INVALID_STATE', 'Only active subscriptions can be paused.', [
        'input',
        'contractId',
      ]);
    }
    const updated: SubscriptionContractModel = {
      ...current,
      status: 'PAUSED',
      pausedUntil: resumeDate ?? null,
    };
    this.contracts.set(contractId, updated);
    return ok(updated);
  }

  resume(contractId: string): MutationResult<SubscriptionContractModel> {
    const current = this.contracts.get(contractId);
    if (!current) {
      return fail('NOT_FOUND', 'Contract not found.', ['input', 'contractId']);
    }
    if (current.status !== 'PAUSED') {
      return fail('INVALID_STATE', 'Only paused subscriptions can be resumed.', [
        'input',
        'contractId',
      ]);
    }
    const updated: SubscriptionContractModel = {
      ...current,
      status: 'ACTIVE',
      pausedUntil: null,
    };
    this.contracts.set(contractId, updated);
    return ok(updated);
  }

  skipNextDelivery(contractId: string): MutationResult<SubscriptionContractModel> {
    const current = this.contracts.get(contractId);
    if (!current) {
      return fail('NOT_FOUND', 'Contract not found.', ['input', 'contractId']);
    }
    if (current.status === 'CANCELLED') {
      return fail('INVALID_STATE', 'Cannot skip delivery on a cancelled subscription.', [
        'input',
        'contractId',
      ]);
    }
    const next = nextBillingAfterSkip(current);
    const updated: SubscriptionContractModel = {
      ...current,
      nextBillingDate: next,
    };
    this.contracts.set(contractId, updated);
    return ok(updated);
  }

  cancel(contractId: string, reason?: string): MutationResult<SubscriptionContractModel> {
    const current = this.contracts.get(contractId);
    if (!current) {
      return fail('NOT_FOUND', 'Contract not found.', ['input', 'contractId']);
    }
    if (current.status === 'CANCELLED') {
      return fail('INVALID_STATE', 'Subscription is already cancelled.', ['input', 'contractId']);
    }
    const updated: SubscriptionContractModel = {
      ...current,
      status: 'CANCELLED',
      nextBillingDate: null,
      pausedUntil: null,
      cancellationReason: reason ?? current.cancellationReason,
    };
    this.contracts.set(contractId, updated);
    return ok(updated);
  }
}

function ok(contract: SubscriptionContractModel): MutationOk<SubscriptionContractModel> {
  return { success: true, contract: cloneContract(contract), userErrors: [] };
}

function fail(code: string, message: string, field: string[]): MutationFail {
  return {
    success: false,
    contract: null,
    userErrors: [{ field, message, code }],
  };
}
