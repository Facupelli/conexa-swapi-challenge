import * as v from 'valibot';

const swapiFilmSchema = v.object({
  uid: v.string(),
  properties: v.object({
    title: v.string(),
    opening_crawl: v.string(),
    release_date: v.pipe(v.string(), v.isoDate()),
  }),
});

export const swapiFilmsResponseSchema = v.object({
  result: v.array(swapiFilmSchema),
});

export type SwapiFilmsResponse = v.InferOutput<typeof swapiFilmsResponseSchema>;
