import { Result } from 'better-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Movie, Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { SwapiClient } from './integrations/swapi/swapi.client.js';
import { SwapiUnavailableError } from './integrations/swapi/swapi.errors.js';
import { MovieNotFoundError } from './movies.errors.js';
import { MoviesService } from './movies.service.js';

const movie: Movie = {
  id: '2bc04d70-cfbf-43a0-a3ea-bf73c945df16',
  externalId: null,
  title: 'Interstellar',
  description: 'A space movie',
  releaseDate: new Date('2014-11-07T00:00:00.000Z'),
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
};

const transaction = {
  movie: {
    upsert: vi.fn(),
  },
};

const prisma = {
  movie: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(
    async (callback: (tx: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  ),
};

const swapiClient = {
  fetchMovies: vi.fn(),
};

function prismaRecordNotFoundError() {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '7.0.0',
  });
}

describe('MoviesService', () => {
  let service: MoviesService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new MoviesService(
      prisma as unknown as PrismaService,
      swapiClient as unknown as SwapiClient,
    );
  });

  describe('findById', () => {
    it('returns the movie when it exists', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce(movie);

      const result = await service.findById(movie.id);

      expect(Result.isOk(result)).toBe(true);

      if (Result.isError(result)) {
        throw result.error;
      }

      expect(result.value).toEqual(movie);
    });

    it('returns MovieNotFoundError when the movie does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce(null);

      const result = await service.findById(movie.id);

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected movie lookup to fail');
      }

      expect(MovieNotFoundError.is(result.error)).toBe(true);
      expect(result.error.movieId).toBe(movie.id);
    });
  });

  describe('create', () => {
    it('creates a movie with the provided input', async () => {
      const input = {
        title: movie.title,
        description: movie.description,
        releaseDate: movie.releaseDate,
      };

      prisma.movie.create.mockResolvedValueOnce(movie);

      const result = await service.create(input);

      expect(prisma.movie.create).toHaveBeenCalledWith({
        data: input,
      });
      expect(result).toEqual(movie);
    });
  });

  describe('update', () => {
    it('returns MovieNotFoundError when Prisma reports a missing record', async () => {
      prisma.movie.update.mockRejectedValueOnce(prismaRecordNotFoundError());

      const result = await service.update(movie.id, {
        title: 'Updated title',
      });

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected movie update to fail');
      }

      expect(MovieNotFoundError.is(result.error)).toBe(true);
      expect(result.error.movieId).toBe(movie.id);
    });

    it('rethrows unexpected Prisma errors', async () => {
      const error = new Error('Database unavailable');

      prisma.movie.update.mockRejectedValueOnce(error);

      await expect(
        service.update(movie.id, {
          title: 'Updated title',
        }),
      ).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('returns MovieNotFoundError when Prisma reports a missing record', async () => {
      prisma.movie.delete.mockRejectedValueOnce(prismaRecordNotFoundError());

      const result = await service.delete(movie.id);

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected movie deletion to fail');
      }

      expect(MovieNotFoundError.is(result.error)).toBe(true);
      expect(result.error.movieId).toBe(movie.id);
    });
  });

  describe('syncMovies', () => {
    it('synchronizes imported movies in a transaction', async () => {
      const importedMovies = [
        {
          externalId: '1',
          title: 'A New Hope',
          description: 'It is a period of civil war.',
          releaseDate: new Date('1977-05-25T00:00:00.000Z'),
        },
        {
          externalId: '2',
          title: 'The Empire Strikes Back',
          description: 'The adventure continues.',
          releaseDate: new Date('1980-05-17T00:00:00.000Z'),
        },
      ];

      swapiClient.fetchMovies.mockResolvedValueOnce(Result.ok(importedMovies));

      const result = await service.syncMovies();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(transaction.movie.upsert).toHaveBeenNthCalledWith(1, {
        where: {
          externalId: '1',
        },
        create: {
          externalId: '1',
          title: 'A New Hope',
          description: 'It is a period of civil war.',
          releaseDate: importedMovies[0].releaseDate,
        },
        update: {
          title: 'A New Hope',
          description: 'It is a period of civil war.',
          releaseDate: importedMovies[0].releaseDate,
        },
      });

      expect(transaction.movie.upsert).toHaveBeenNthCalledWith(2, {
        where: {
          externalId: '2',
        },
        create: {
          externalId: '2',
          title: 'The Empire Strikes Back',
          description: 'The adventure continues.',
          releaseDate: importedMovies[1].releaseDate,
        },
        update: {
          title: 'The Empire Strikes Back',
          description: 'The adventure continues.',
          releaseDate: importedMovies[1].releaseDate,
        },
      });

      expect(Result.isOk(result)).toBe(true);

      if (Result.isError(result)) {
        throw result.error;
      }

      expect(result.value).toEqual({
        synchronized: 2,
      });
    });

    it('does not write to the database when fetching SWAPI movies fails', async () => {
      const error = new SwapiUnavailableError({
        cause: new Error('Network failure'),
        message: 'Failed to fetch movies from SWAPI',
      });

      swapiClient.fetchMovies.mockResolvedValueOnce(Result.err(error));

      const result = await service.syncMovies();

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(transaction.movie.upsert).not.toHaveBeenCalled();

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected movie synchronization to fail');
      }

      expect(result.error).toBe(error);
    });
  });
});
