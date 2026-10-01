import { TaggedError } from 'better-result';

export class MovieNotFoundError extends TaggedError('MovieNotFoundError')<{
  movieId: string;
  message: string;
}> {}

export function movieNotFound(movieId: string): MovieNotFoundError {
  return new MovieNotFoundError({
    movieId,
    message: `Movie ${movieId} was not found`,
  });
}
