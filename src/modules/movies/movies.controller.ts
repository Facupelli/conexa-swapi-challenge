import {
  BadGatewayException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role, type Movie } from '../../generated/prisma/client.js';
import {
  createMovieSchema,
  movieIdSchema,
  type CreateMovieDto,
  updateMovieSchema,
  type UpdateMovieDto,
} from './movies.schemas.js';
import { MoviesService } from './movies.service.js';
import { SyncMoviesResult } from './types/movie-sync.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Get()
  findAll(): Promise<Movie[]> {
    return this.moviesService.findAll();
  }

  @Get(':id')
  @Roles([Role.REGULAR])
  async findById(
    @Param('id', { schema: movieIdSchema }) id: string,
  ): Promise<Movie> {
    const result = await this.moviesService.findById(id);

    return result.match({
      ok: (movie) => movie,
      err: (error) => {
        throw new NotFoundException(error.message);
      },
    });
  }

  @Post()
  @Roles([Role.ADMIN])
  create(
    @Body({ schema: createMovieSchema }) body: CreateMovieDto,
  ): Promise<Movie> {
    return this.moviesService.create(body);
  }

  @Patch(':id')
  @Roles([Role.ADMIN])
  async update(
    @Param('id', { schema: movieIdSchema }) id: string,
    @Body({ schema: updateMovieSchema }) body: UpdateMovieDto,
  ): Promise<Movie> {
    const result = await this.moviesService.update(id, body);

    return result.match({
      ok: (movie) => movie,
      err: (error) => {
        throw new NotFoundException(error.message);
      },
    });
  }

  @Delete(':id')
  @Roles([Role.ADMIN])
  @HttpCode(204)
  async delete(
    @Param('id', { schema: movieIdSchema }) id: string,
  ): Promise<void> {
    const result = await this.moviesService.delete(id);

    return result.match({
      ok: () => undefined,
      err: (error) => {
        throw new NotFoundException(error.message);
      },
    });
  }

  @Post('sync')
  @Roles([Role.ADMIN])
  async sync(): Promise<SyncMoviesResult> {
    const result = await this.moviesService.syncMovies();

    return result.match({
      ok: (syncResult) => syncResult,
      err: (error) => {
        throw new BadGatewayException(error.message);
      },
    });
  }
}
