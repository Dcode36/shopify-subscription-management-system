import { gql } from '@apollo/client';

export const CUSTOMER_OPTIONS = gql`
  query CustomerOptions {
    customerOptions {
      id
      displayName
    }
  }
`;

export const SUBSCRIPTION_LIST = gql`
  query SubscriptionList($customerId: ID) {
    subscriptionContracts(customerId: $customerId) {
      edges {
        cursor
        node {
          id
          status
          nextBillingDate
          billingFrequencyDescription
          lineItems {
            id
            title
            quantity
            currentPrice {
              amount
              currencyCode
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const SUBSCRIPTION_DETAIL = gql`
  query SubscriptionDetail($id: ID!) {
    subscriptionContract(id: $id) {
      __typename
      ... on SubscriptionContract {
        id
        customerId
        status
        createdAt
        nextBillingDate
        billingInterval
        billingIntervalCount
        billingFrequencyDescription
        pausedUntil
        cancellationReason
        lineItems {
          id
          title
          quantity
          variantTitle
          currentPrice {
            amount
            currencyCode
          }
        }
        shippingAddress {
          formatted
          firstName
          lastName
          address1
          city
          province
          country
          zip
        }
      }
      ... on NotFoundError {
        code
        message
      }
    }
  }
`;

export const PAUSE_SUBSCRIPTION = gql`
  mutation PauseSubscription($input: PauseSubscriptionInput!) {
    pauseSubscription(input: $input) {
      success
      userErrors {
        field
        message
        code
      }
      contract {
        id
        status
        pausedUntil
        nextBillingDate
      }
    }
  }
`;

export const RESUME_SUBSCRIPTION = gql`
  mutation ResumeSubscription($input: ResumeSubscriptionInput!) {
    resumeSubscription(input: $input) {
      success
      userErrors {
        field
        message
        code
      }
      contract {
        id
        status
        pausedUntil
      }
    }
  }
`;

export const SKIP_NEXT_DELIVERY = gql`
  mutation SkipNextDelivery($input: SkipNextDeliveryInput!) {
    skipNextDelivery(input: $input) {
      success
      userErrors {
        field
        message
        code
      }
      contract {
        id
        nextBillingDate
      }
    }
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($input: CancelSubscriptionInput!) {
    cancelSubscription(input: $input) {
      success
      userErrors {
        field
        message
        code
      }
      contract {
        id
        status
        cancellationReason
      }
    }
  }
`;
