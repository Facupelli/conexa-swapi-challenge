import { Injectable } from '@nestjs/common';
import { HttpClient, InjectHttpClient } from '@nestjs/http-client';
import { Result, type Result as ResultType } from 'better-result';
import * as v from 'valibot';
import type { MovieImport } from '../../types/movie-import.js';
import {
  SwapiContractError,
  type SwapiClientError,
  SwapiUnavailableError,
} from './swapi.errors.js';
import { mapSwapiMovies } from './swapi.mapper.js';
import { swapiFilmsResponseSchema } from './swapi.schema.js';

@Injectable()
export class SwapiClient {
  constructor(
    @InjectHttpClient('swapi')
    private readonly httpClient: HttpClient,
  ) {}

  async fetchMovies(): Promise<ResultType<MovieImport[], SwapiClientError>> {
    const responseResult = await Result.tryPromise({
      try: () => this.httpClient.get<unknown>('/films'),
      catch: (cause) =>
        new SwapiUnavailableError({
          cause,
          message: 'Failed to fetch movies from SWAPI',
        }),
    });

    if (Result.isError(responseResult)) {
      return responseResult;
    }

    const parsed = v.safeParse(
      swapiFilmsResponseSchema,
      responseResult.value.data,
    );

    if (!parsed.success) {
      return Result.err(
        new SwapiContractError({
          cause: parsed.issues,
          message: 'SWAPI returned an invalid movies response',
        }),
      );
    }

    return Result.ok(mapSwapiMovies(parsed.output));
  }
}
