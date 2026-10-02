import * as v from 'valibot';

const positiveIntegerFromString = (defaultValue: string) =>
  v.pipe(
    v.optional(v.string(), defaultValue),
    v.transform(Number),
    v.number(),
    v.safeInteger(),
    v.minValue(1),
  );

export const environmentSchema = v.object({
  NODE_ENV: v.optional(
    v.picklist(['development', 'test', 'production']),
    'development',
  ),

  PORT: v.pipe(positiveIntegerFromString('3000'), v.maxValue(65535)),

  DATABASE_URL: v.pipe(v.string(), v.minLength(1)),

  JWT_SECRET: v.pipe(v.string(), v.minLength(32)),
  JWT_EXPIRES_IN_SECONDS: positiveIntegerFromString('3600'),

  SWAPI_BASE_URL: v.pipe(
    v.optional(v.string(), 'https://www.swapi.tech/api'),
    v.url(),
  ),

  SWAPI_TIMEOUT_MS: positiveIntegerFromString('5000'),
});

export type Environment = v.InferOutput<typeof environmentSchema>;
