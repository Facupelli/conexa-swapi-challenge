import { Injectable } from '@nestjs/common';
import { Result, type Result as ResultType } from 'better-result';
import type { Movie } from '../../generated/prisma/client.js';
import { isPrismaRecordNotFoundError } from '../../prisma/prisma.errors.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  movieNotFound,
  type MovieNotFoundError,
} from './movies.errors.js';
import type {
  CreateMovieInput,
  UpdateMovieInput,
} from './types/movie-input.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Movie[]> {
    return this.prisma.movie.findMany();
  }

  async findById(
    id: string,
  ): Promise<ResultType<Movie, MovieNotFoundError>> {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return Result.err(movieNotFound(id));
    }

    return Result.ok(movie);
  }

  create(input: CreateMovieInput): Promise<Movie> {
    return this.prisma.movie.create({
      data: input,
    });
  }

  async update(
    id: string,
    input: UpdateMovieInput,
  ): Promise<ResultType<Movie, MovieNotFoundError>> {
    try {
      const movie = await this.prisma.movie.update({
        where: { id },
        data: input,
      });

      return Result.ok(movie);
    } catch (error) {
      if (isPrismaRecordNotFoundError(error)) {
        return Result.err(movieNotFound(id));
      }

      throw error;
    }
  }

  async delete(
    id: string,
  ): Promise<ResultType<void, MovieNotFoundError>> {
    try {
      await this.prisma.movie.delete({
        where: { id },
      });

      return Result.ok(undefined);
    } catch (error) {
      if (isPrismaRecordNotFoundError(error)) {
        return Result.err(movieNotFound(id));
      }

      throw error;
    }
  }
}
