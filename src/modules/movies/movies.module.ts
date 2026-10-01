import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientModule } from '@nestjs/http-client';

import type { Environment } from '../../config/env.schema.js';
import { SwapiClient } from './integrations/swapi/swapi.client.js';

@Module({
  imports: [
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
  providers: [SwapiClient],
  exports: [SwapiClient],
})
export class MoviesModule {}
