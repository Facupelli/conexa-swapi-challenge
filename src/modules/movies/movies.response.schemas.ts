import * as v from 'valibot';

const dateTimeResponseSchema = v.pipe(
  v.date(),
  v.transform((date) => date.toISOString()),
  v.string(),
  v.isoTimestamp(),
);

export const movieResponseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  externalId: v.nullable(v.string()),
  title: v.string(),
  description: v.string(),
  releaseDate: dateTimeResponseSchema,
  createdAt: dateTimeResponseSchema,
  updatedAt: dateTimeResponseSchema,
});

export const movieListResponseSchema = v.array(movieResponseSchema);

export const syncMoviesResponseSchema = v.object({
  synchronized: v.pipe(v.number(), v.integer(), v.minValue(0)),
});
