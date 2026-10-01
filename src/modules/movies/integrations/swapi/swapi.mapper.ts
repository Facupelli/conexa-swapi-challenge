import type { MovieImport } from '../../types/movie-import.js';
import type { SwapiFilmsResponse } from './swapi.schema.js';

export function mapSwapiMovies(
  response: SwapiFilmsResponse,
): MovieImport[] {
  return response.result.map(({ uid, properties }) => ({
    externalId: uid,
    title: properties.title,
    description: properties.opening_crawl,
    releaseDate: new Date(`${properties.release_date}T00:00:00.000Z`),
  }));
}
