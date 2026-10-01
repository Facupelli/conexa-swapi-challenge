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
  SerializeOptions,
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
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  movieResponseSchema,
  syncMoviesResponseSchema,
} from './movies.response.schemas.js';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Get()
  @SerializeOptions({
    schema: movieResponseSchema,
  })
  @ApiOperation({ summary: 'List movies' })
  findAll(): Promise<Movie[]> {
    return this.moviesService.findAll();
  }

  @Get(':id')
  @Roles([Role.REGULAR])
  @SerializeOptions({
    schema: movieResponseSchema,
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get movie details',
  })
  @ApiOkResponse({
    standardSchema: movieResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Requires the REGULAR role',
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
  })
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
  @SerializeOptions({
    schema: movieResponseSchema,
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a movie',
  })
  @ApiCreatedResponse({
    standardSchema: movieResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
  create(
    @Body({ schema: createMovieSchema }) body: CreateMovieDto,
  ): Promise<Movie> {
    return this.moviesService.create(body);
  }

  @Patch(':id')
  @Roles([Role.ADMIN])
  @SerializeOptions({
    schema: movieResponseSchema,
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a movie',
  })
  @ApiOkResponse({
    standardSchema: movieResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
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
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a movie',
  })
  @ApiNoContentResponse({
    description: 'Movie deleted successfully',
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
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
  @SerializeOptions({
    schema: syncMoviesResponseSchema,
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Synchronize movies from SWAPI',
  })
  @ApiOkResponse({
    standardSchema: syncMoviesResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
  @ApiBadGatewayResponse({
    description: 'SWAPI is unavailable or returned an invalid response',
  })
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
