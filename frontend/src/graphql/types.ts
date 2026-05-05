/** Narrow shapes used by the UI (manual typing — swap for codegen later). */

export interface CustomerOption {
  id: string;
  displayName: string;
}

export interface CustomerOptionsData {
  customerOptions: CustomerOption[];
}

export type ContractStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'FAILED';

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface LineItemSummary {
  id: string;
  title: string;
  quantity: number;
  currentPrice: Money;
}

export interface SubscriptionListNode {
  id: string;
  status: ContractStatus;
  nextBillingDate: string | null;
  billingFrequencyDescription: string;
  lineItems: LineItemSummary[];
}

export interface SubscriptionListData {
  subscriptionContracts: {
    edges: { cursor: string; node: SubscriptionListNode }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

export interface LineItemDetail extends LineItemSummary {
  variantTitle: string | null;
}

export interface ShippingAddress {
  formatted: string[];
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
}

export interface SubscriptionContractDetail {
  __typename: 'SubscriptionContract';
  id: string;
  customerId: string;
  status: ContractStatus;
  createdAt: string;
  nextBillingDate: string | null;
  billingInterval: string;
  billingIntervalCount: number;
  billingFrequencyDescription: string;
  pausedUntil: string | null;
  cancellationReason: string | null;
  lineItems: LineItemDetail[];
  shippingAddress: ShippingAddress | null;
}

export interface NotFoundPayload {
  __typename: 'NotFoundError';
  code: string;
  message: string;
}

export type SubscriptionDetailResult = SubscriptionContractDetail | NotFoundPayload;

export interface SubscriptionDetailData {
  subscriptionContract: SubscriptionDetailResult;
}

export interface UserError {
  field: string[] | null;
  message: string;
  code: string | null;
}

export interface MutationPayload {
  success: boolean;
  userErrors: UserError[];
}

/** Skip mutation returns updated contract with nextBillingDate. */
export interface SkipNextDeliveryMutationPayload extends MutationPayload {
  contract: {
    id: string;
    nextBillingDate: string | null;
  } | null;
}
