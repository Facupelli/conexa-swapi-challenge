import * as v from 'valibot';

export const environmentSchema = v.object({
  NODE_ENV: v.optional(
    v.picklist(['development', 'test', 'production']),
    'development',
  ),

  PORT: v.pipe(
    v.optional(v.string(), '3000'),
    v.transform(Number),
    v.number(),
    v.integer(),
  ),

  DATABASE_URL: v.pipe(v.string(), v.minLength(1)),

  JWT_SECRET: v.pipe(v.string(), v.minLength(32)),
  JWT_EXPIRES_IN_SECONDS: v.pipe(v.optional(v.string(), '3600'), v.transform(Number)),
    

  SWAPI_BASE_URL: v.pipe(
    v.optional(v.string(), 'https://www.swapi.tech/api'),
    v.url(),
  ),

  SWAPI_TIMEOUT_MS: v.pipe(
    v.optional(v.string(), '5000'),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
  ),
});

export type Environment = v.InferOutput<typeof environmentSchema>;
