export function getGraphqlHttpUrl(): string {
  const fromEnv = import.meta.env.VITE_GRAPHQL_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  if (import.meta.env.DEV) {
    return '/graphql';
  }
  throw new Error('Set VITE_GRAPHQL_URL for production builds.');
}
