import * as v from 'valibot';

const movieSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.pipe(v.string(), v.minLength(1)),
  releaseDate: v.pipe(
    v.string(),
    v.isoDate(),
    v.transform((value) => new Date(`${value}T00:00:00.000Z`)),
  ),
});

export const createMovieSchema = movieSchema;

export const updateMovieSchema = v.partial(movieSchema);

export const movieIdSchema = v.pipe(v.string(), v.uuid());

export type CreateMovieDto = v.InferOutput<typeof createMovieSchema>;
export type UpdateMovieDto = v.InferOutput<typeof updateMovieSchema>;
