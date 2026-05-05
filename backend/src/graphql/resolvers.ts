import type { SubscriptionContractModel } from '../domain/subscription.js';
import { mockCustomerOptions } from '../data/mock-customers.js';
import type { GraphQLContext } from './context.js';
import { billingFrequencyDescription } from './formatters.js';
import { dateTimeScalar } from './scalars.js';
import {
  cancelSubscriptionInputSchema,
  pauseSubscriptionInputSchema,
  resumeSubscriptionInputSchema,
  skipNextDeliveryInputSchema,
  validationUserErrors,
} from '../validation/mutation-inputs.js';

type SubscriptionContractParent = SubscriptionContractModel;

type NotFoundParent = {
  __typename: 'NotFoundError';
  message: string;
  code: string;
};

type SubscriptionContractResultParent =
  | SubscriptionContractParent
  | NotFoundParent;

export const resolvers = {
  DateTime: dateTimeScalar,

  SubscriptionContractResult: {
    __resolveType(obj: SubscriptionContractResultParent) {
      if ('customerId' in obj) {
        return 'SubscriptionContract';
      }
      return 'NotFoundError';
    },
  },

  SubscriptionContract: {
    billingFrequencyDescription(parent: SubscriptionContractParent) {
      return billingFrequencyDescription(parent.billingInterval, parent.billingIntervalCount);
    },
  },

  Query: {
    customerOptions() {
      return [...mockCustomerOptions];
    },

    subscriptionContracts(
      _parent: unknown,
      args: { customerId?: string | null },
      ctx: GraphQLContext,
    ) {
      const customerId = args.customerId ?? ctx.mockCustomerId;
      const contracts = ctx.store.listByCustomer(customerId);
      const edges = contracts.map((c) => ({
        cursor: c.id,
        node: c,
      }));
      const endCursor = edges.length > 0 ? edges[edges.length - 1]?.cursor : undefined;
      return {
        edges,
        pageInfo: {
          hasNextPage: false,
          endCursor: endCursor ?? null,
        },
      };
    },

    subscriptionContract(
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ): SubscriptionContractResultParent {
      const found = ctx.store.getById(args.id);
      if (!found) {
        return {
          __typename: 'NotFoundError',
          message: 'Subscription contract not found.',
          code: 'NOT_FOUND',
        };
      }
      return found;
    },
  },

  Mutation: {
    pauseSubscription(
      _parent: unknown,
      args: { input: unknown },
      ctx: GraphQLContext,
    ) {
      const parsed = pauseSubscriptionInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          contract: null,
          userErrors: validationUserErrors(parsed.error),
        };
      }
      const result = ctx.store.pause(parsed.data.contractId, parsed.data.resumeDate);
      if (!result.success) {
        return {
          success: false,
          contract: null,
          userErrors: result.userErrors.map((e) => ({
            field: e.field,
            message: e.message,
            code: e.code,
          })),
        };
      }
      return {
        success: true,
        contract: result.contract,
        userErrors: [],
      };
    },

    resumeSubscription(
      _parent: unknown,
      args: { input: unknown },
      ctx: GraphQLContext,
    ) {
      const parsed = resumeSubscriptionInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          contract: null,
          userErrors: validationUserErrors(parsed.error),
        };
      }
      const result = ctx.store.resume(parsed.data.contractId);
      if (!result.success) {
        return {
          success: false,
          contract: null,
          userErrors: result.userErrors.map((e) => ({
            field: e.field,
            message: e.message,
            code: e.code,
          })),
        };
      }
      return {
        success: true,
        contract: result.contract,
        userErrors: [],
      };
    },

    skipNextDelivery(
      _parent: unknown,
      args: { input: unknown },
      ctx: GraphQLContext,
    ) {
      const parsed = skipNextDeliveryInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          contract: null,
          userErrors: validationUserErrors(parsed.error),
        };
      }
      const result = ctx.store.skipNextDelivery(parsed.data.contractId);
      if (!result.success) {
        return {
          success: false,
          contract: null,
          userErrors: result.userErrors.map((e) => ({
            field: e.field,
            message: e.message,
            code: e.code,
          })),
        };
      }
      return {
        success: true,
        contract: result.contract,
        userErrors: [],
      };
    },

    cancelSubscription(
      _parent: unknown,
      args: { input: unknown },
      ctx: GraphQLContext,
    ) {
      const parsed = cancelSubscriptionInputSchema.safeParse(args.input);
      if (!parsed.success) {
        return {
          success: false,
          contract: null,
          userErrors: validationUserErrors(parsed.error),
        };
      }
      const result = ctx.store.cancel(parsed.data.contractId, parsed.data.reason);
      if (!result.success) {
        return {
          success: false,
          contract: null,
          userErrors: result.userErrors.map((e) => ({
            field: e.field,
            message: e.message,
            code: e.code,
          })),
        };
      }
      return {
        success: true,
        contract: result.contract,
        userErrors: [],
      };
    },
  },
};
