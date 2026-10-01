import { getHttpClientToken } from '@nestjs/http-client';
import { Test } from '@nestjs/testing';
import { Result } from 'better-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SwapiClient } from './swapi.client.js';
import {
  SwapiContractError,
  SwapiUnavailableError,
} from './swapi.errors.js';

type HttpGet = (url: string) => Promise<{ data: unknown }>;

const validSwapiResponse = {
  message: 'ok',
  result: [
    {
      uid: '1',
      properties: {
        title: 'A New Hope',
        opening_crawl: 'It is a period of civil war.',
        release_date: '1977-05-25',
      },
    },
  ],
};

describe('SwapiClient', () => {
  const get = vi.fn<HttpGet>();

  let swapiClient: SwapiClient;

  beforeEach(async () => {
    get.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SwapiClient,
        {
          provide: getHttpClientToken('swapi'),
          useValue: { get },
        },
      ],
    }).compile();

    swapiClient = moduleRef.get(SwapiClient);
  });

  it('fetches and maps SWAPI movies', async () => {
    get.mockResolvedValueOnce({
      data: validSwapiResponse,
    });

    const result = await swapiClient.fetchMovies();

    expect(get).toHaveBeenCalledWith('/films');
    expect(Result.isOk(result)).toBe(true);

    if (Result.isError(result)) {
      throw result.error;
    }

    expect(result.value).toEqual([
      {
        externalId: '1',
        title: 'A New Hope',
        description: 'It is a period of civil war.',
        releaseDate: new Date('1977-05-25T00:00:00.000Z'),
      },
    ]);
  });

  it('ignores unrelated fields from the SWAPI response', async () => {
    get.mockResolvedValueOnce({
      data: {
        unexpected_root_field: 'ignored',
        ...validSwapiResponse,
        result: [
          {
            ...validSwapiResponse.result[0],
            unexpected_movie_field: 'ignored',
            properties: {
              ...validSwapiResponse.result[0].properties,
              director: 'George Lucas',
              characters: ['https://www.swapi.tech/api/people/1'],
            },
          },
        ],
      },
    });

    const result = await swapiClient.fetchMovies();

    expect(Result.isOk(result)).toBe(true);

    if (Result.isError(result)) {
      throw result.error;
    }

    expect(result.value).toEqual([
      {
        externalId: '1',
        title: 'A New Hope',
        description: 'It is a period of civil war.',
        releaseDate: new Date('1977-05-25T00:00:00.000Z'),
      },
    ]);
  });

  it('returns a contract error when required SWAPI data is invalid', async () => {
    get.mockResolvedValueOnce({
      data: {
        ...validSwapiResponse,
        result: [
          {
            uid: '1',
            properties: {
              title: 'A New Hope',
              opening_crawl: 'It is a period of civil war.',
              release_date: 'not-a-date',
            },
          },
        ],
      },
    });

    const result = await swapiClient.fetchMovies();

    expect(Result.isError(result)).toBe(true);

    if (Result.isOk(result)) {
      throw new Error('Expected SWAPI contract validation to fail');
    }

    expect(SwapiContractError.is(result.error)).toBe(true);
  });

  it('returns an unavailable error when the HTTP request fails', async () => {
    const cause = new Error('Network failure');

    get.mockRejectedValueOnce(cause);

    const result = await swapiClient.fetchMovies();

    expect(Result.isError(result)).toBe(true);

    if (Result.isOk(result)) {
      throw new Error('Expected SWAPI request to fail');
    }

    expect(SwapiUnavailableError.is(result.error)).toBe(true);
    expect(result.error.cause).toBe(cause);
  });
});
