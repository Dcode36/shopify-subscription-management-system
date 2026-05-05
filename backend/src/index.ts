import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';
import http from 'http';
import { config } from './config.js';
import type { GraphQLContext } from './graphql/context.js';
import { createApolloServer } from './server/apollo.js';
import { SubscriptionStore } from './services/subscription-store.js';

const store = new SubscriptionStore();

async function main(): Promise<void> {
  const app = express();
  const httpServer = http.createServer(app);

  const server = createApolloServer({
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  const graphqlMiddleware: RequestHandler = expressMiddleware(server, {
    context: (): Promise<GraphQLContext> =>
      Promise.resolve({ store, mockCustomerId: config.mockCustomerId }),
  }) as unknown as RequestHandler;

  app.use(
    '/graphql',
    cors({ origin: true }),
    express.json(),
    graphqlMiddleware,
  );

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${String(config.port)} is already in use. Stop the other process (e.g. an older "npm run dev") or set PORT in backend/.env.`,
          ),
        );
        return;
      }
      reject(err);
    });
    httpServer.listen(config.port, () => {
      resolve();
    });
  });

  console.log(`GraphQL API at http://localhost:${String(config.port)}/graphql`);
  console.log(`Health check at http://localhost:${String(config.port)}/health`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
