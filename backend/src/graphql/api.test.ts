import { gql } from 'graphql-tag';
import { describe, expect, it } from 'vitest';
import { createApolloServer } from '../server/apollo.js';
import { SubscriptionStore } from '../services/subscription-store.js';

const CONTRACT_QUERY = gql`
  query Contract($id: ID!) {
    subscriptionContract(id: $id) {
      __typename
      ... on NotFoundError {
        code
        message
      }
    }
  }
`;

const PAUSE_MUTATION = gql`
  mutation Pause($input: PauseSubscriptionInput!) {
    pauseSubscription(input: $input) {
      success
      userErrors {
        message
        code
      }
    }
  }
`;

describe('GraphQL API', () => {
  it('resolves unknown subscription contract to NotFoundError', async () => {
    const store = new SubscriptionStore();
    const server = createApolloServer();
    const response = await server.executeOperation(
      {
        query: CONTRACT_QUERY,
        variables: { id: 'does-not-exist' },
      },
      { contextValue: { store, mockCustomerId: 'cust_01' } },
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind !== 'single') throw new Error('expected single result');
    expect(response.body.singleResult.errors).toBeUndefined();

    const payload = response.body.singleResult.data?.subscriptionContract;
    expect(payload).toEqual({
      __typename: 'NotFoundError',
      code: 'NOT_FOUND',
      message: 'Subscription contract not found.',
    });
  });

  it('returns validation userErrors for invalid pause input', async () => {
    const store = new SubscriptionStore();
    const server = createApolloServer();
    const response = await server.executeOperation(
      {
        query: PAUSE_MUTATION,
        variables: { input: { contractId: '' } },
      },
      { contextValue: { store, mockCustomerId: 'cust_01' } },
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind !== 'single') throw new Error('expected single result');
    expect(response.body.singleResult.errors).toBeUndefined();

    const payload = response.body.singleResult.data?.pauseSubscription as
      | {
          success: boolean;
          userErrors: readonly { message: string }[];
        }
      | undefined;
    expect(payload?.success).toBe(false);
    expect((payload?.userErrors ?? []).length).toBeGreaterThan(0);
  });
});
