import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime

  enum SubscriptionContractStatus {
    ACTIVE
    PAUSED
    CANCELLED
    FAILED
  }

  enum BillingInterval {
    DAY
    WEEK
    MONTH
    YEAR
  }

  type Money {
    amount: String!
    currencyCode: String!
  }

  type SubscriptionLineItem {
    id: ID!
    title: String!
    quantity: Int!
    variantTitle: String
    currentPrice: Money!
  }

  type MailingAddress {
    formatted: [String!]!
    firstName: String
    lastName: String
    address1: String
    city: String
    province: String
    country: String
    zip: String
  }

  type SubscriptionContract {
    id: ID!
    customerId: ID!
    status: SubscriptionContractStatus!
    createdAt: DateTime!
    nextBillingDate: DateTime
    billingInterval: BillingInterval!
    billingIntervalCount: Int!
    billingFrequencyDescription: String!
    lineItems: [SubscriptionLineItem!]!
    shippingAddress: MailingAddress
    pausedUntil: DateTime
    cancellationReason: String
  }

  type SubscriptionContractEdge {
    node: SubscriptionContract!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type SubscriptionContractConnection {
    edges: [SubscriptionContractEdge!]!
    pageInfo: PageInfo!
  }

  type NotFoundError {
    message: String!
    code: String!
  }

  union SubscriptionContractResult = SubscriptionContract | NotFoundError

  type UserError {
    field: [String!]
    message: String!
    code: String
  }

  type PauseSubscriptionPayload {
    success: Boolean!
    contract: SubscriptionContract
    userErrors: [UserError!]!
  }

  type ResumeSubscriptionPayload {
    success: Boolean!
    contract: SubscriptionContract
    userErrors: [UserError!]!
  }

  type SkipNextDeliveryPayload {
    success: Boolean!
    contract: SubscriptionContract
    userErrors: [UserError!]!
  }

  type CancelSubscriptionPayload {
    success: Boolean!
    contract: SubscriptionContract
    userErrors: [UserError!]!
  }

  input PauseSubscriptionInput {
    contractId: ID!
    resumeDate: DateTime
  }

  input ResumeSubscriptionInput {
    contractId: ID!
  }

  input SkipNextDeliveryInput {
    contractId: ID!
  }

  input CancelSubscriptionInput {
    contractId: ID!
    reason: String
  }

  type CustomerOption {
    id: ID!
    displayName: String!
  }

  type Query {
    """Mock directory of customers you can pick on the login screen."""
    customerOptions: [CustomerOption!]!
    """
    When omitted, uses MOCK_CUSTOMER_ID from the server environment (see .env.example).
    """
    subscriptionContracts(customerId: ID): SubscriptionContractConnection!
    subscriptionContract(id: ID!): SubscriptionContractResult!
  }

  type Mutation {
    pauseSubscription(input: PauseSubscriptionInput!): PauseSubscriptionPayload!
    resumeSubscription(input: ResumeSubscriptionInput!): ResumeSubscriptionPayload!
    skipNextDelivery(input: SkipNextDeliveryInput!): SkipNextDeliveryPayload!
    cancelSubscription(input: CancelSubscriptionInput!): CancelSubscriptionPayload!
  }
`;
