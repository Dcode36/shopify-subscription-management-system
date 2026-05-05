import { GraphQLScalarType, Kind } from 'graphql';

function assertIsoString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError('DateTime must be a string');
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new TypeError('Invalid DateTime');
  }
  return d.toISOString();
}

export const dateTimeScalar = new GraphQLScalarType<string, string>({
  name: 'DateTime',
  description: 'ISO-8601 instant',
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return assertIsoString(value);
  },
  parseValue(value: unknown) {
    return assertIsoString(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError('DateTime must be a string literal');
    }
    return assertIsoString(ast.value);
  },
});
