import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import type { Environment } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Environment, true>);

  app.enableShutdownHooks();
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  await app.listen(configService.get('PORT', { infer: true }));
}
await bootstrap();
