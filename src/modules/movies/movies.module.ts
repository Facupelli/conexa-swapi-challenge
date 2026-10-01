import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientModule } from '@nestjs/http-client';
import type { Environment } from '../../config/env.schema.js';
import { SwapiClient } from './integrations/swapi/swapi.client.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MoviesService } from './movies.service.js';

@Module({
  imports: [
    PrismaModule,
    HttpClientModule.registerAsync({
      name: 'swapi',
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Environment, true>,
      ) => ({
        baseUrl: configService.get('SWAPI_BASE_URL', {
          infer: true,
        }),
        timeout: configService.get('SWAPI_TIMEOUT_MS', {
          infer: true,
        }),
        retry: 2,
      }),
    }),
  ],
  providers: [MoviesService, SwapiClient],
})
export class MoviesModule {}
