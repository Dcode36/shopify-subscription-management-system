import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { getGraphqlHttpUrl } from '../config.js';

const httpLink = new HttpLink({
  uri: getGraphqlHttpUrl(),
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    possibleTypes: {
      SubscriptionContractResult: ['SubscriptionContract', 'NotFoundError'],
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
