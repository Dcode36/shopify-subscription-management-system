import type { ApolloServerPlugin } from '@apollo/server';
import { ApolloServer } from '@apollo/server';
import type { GraphQLContext } from '../graphql/context.js';
import { resolvers } from '../graphql/resolvers.js';
import { typeDefs } from '../graphql/typeDefs.js';

export function createApolloServer(options?: {
  plugins?: ApolloServerPlugin<GraphQLContext>[];
}): ApolloServer<GraphQLContext> {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: options?.plugins ?? [],
  });
}
