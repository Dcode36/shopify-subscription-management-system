/** Internal domain model — not a 1:1 mirror of Shopify Admin API types. */

export type ContractStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'FAILED';

export type BillingInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface SubscriptionLineItemModel {
  id: string;
  title: string;
  quantity: number;
  variantTitle?: string;
  currentPrice: Money;
}

export interface MailingAddressModel {
  formatted: string[];
  firstName?: string;
  lastName?: string;
  address1?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
}

export interface SubscriptionContractModel {
  id: string;
  customerId: string;
  status: ContractStatus;
  createdAt: string;
  nextBillingDate: string | null;
  billingInterval: BillingInterval;
  billingIntervalCount: number;
  lineItems: SubscriptionLineItemModel[];
  shippingAddress: MailingAddressModel | null;
  /** When status is PAUSED, optional ISO date when delivery should resume. */
  pausedUntil: string | null;
  /** Last cancellation reason from merchant/customer (mock persistence). */
  cancellationReason: string | null;
}
