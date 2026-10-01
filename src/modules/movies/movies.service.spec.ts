import { Prisma } from '../../generated/prisma/client.js';
import type { Movie } from '../../generated/prisma/client.js';
import { Result } from 'better-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
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

function prismaRecordNotFoundError() {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '7.0.0',
  });
}

describe('MoviesService', () => {
  const prisma = {
    movie: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let service: MoviesService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new MoviesService(
      prisma as unknown as PrismaService,
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
      prisma.movie.update.mockRejectedValueOnce(
        prismaRecordNotFoundError(),
      );

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
        service.update(movie.id, { title: 'Updated title' }),
      ).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('returns MovieNotFoundError when Prisma reports a missing record', async () => {
      prisma.movie.delete.mockRejectedValueOnce(
        prismaRecordNotFoundError(),
      );

      const result = await service.delete(movie.id);

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected movie deletion to fail');
      }

      expect(MovieNotFoundError.is(result.error)).toBe(true);
      expect(result.error.movieId).toBe(movie.id);
    });
  });
});
