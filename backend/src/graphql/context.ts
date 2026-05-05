import type { SubscriptionStore } from '../services/subscription-store.js';

export interface GraphQLContext {
  store: SubscriptionStore;
  /** Default customer for `subscriptionContracts` when `customerId` is omitted. */
  mockCustomerId: string;
}
