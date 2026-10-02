import {
  BadGatewayException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  movieListResponseSchema,
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
  @ApiOkResponse({
    standardSchema: movieListResponseSchema,
  })
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
  @ApiBadRequestResponse({
    description: 'Invalid movie ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
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

    if (result.isErr()) {
      throw new NotFoundException(result.error.message);
    }

    return result.value;
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
  @ApiBadRequestResponse({
    description: 'Invalid movie data',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
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
  @ApiBadRequestResponse({
    description: 'Invalid movie ID or update data',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
  })
  async update(
    @Param('id', { schema: movieIdSchema }) id: string,
    @Body({ schema: updateMovieSchema }) body: UpdateMovieDto,
  ): Promise<Movie> {
    const result = await this.moviesService.update(id, body);

    if (result.isErr()) {
      throw new NotFoundException(result.error.message);
    }

    return result.value;
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
  @ApiBadRequestResponse({
    description: 'Invalid movie ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
  })
  @HttpCode(204)
  async delete(
    @Param('id', { schema: movieIdSchema }) id: string,
  ): Promise<void> {
    const result = await this.moviesService.delete(id);

    if (result.isErr()) {
      throw new NotFoundException(result.error.message);
    }

    return result.value;
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
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
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing or invalid',
  })
  @ApiForbiddenResponse({
    description: 'Requires the ADMIN role',
  })
  @ApiBadGatewayResponse({
    description: 'SWAPI is unavailable or returned an invalid response',
  })
  async sync(): Promise<SyncMoviesResult> {
    const result = await this.moviesService.syncMovies();

    if (result.isErr()) {
      throw new BadGatewayException(result.error.message);
    }

    return result.value;
  }
}
