import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  StandardSchemaSerializerInterceptor,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { AppModule } from './app.module.js';
import {
  DocumentBuilder,
  SwaggerModule,
  type SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { toJsonSchema } from '@valibot/to-json-schema';
import type { Environment } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Environment, true>);

  app.enableShutdownHooks();
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalInterceptors(
    new StandardSchemaSerializerInterceptor(app.get(Reflector)),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Conexa SWAPI Challenge')
    .setDescription(
      'Backend for movie management and synchronization with SWAPI.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocumentOptions: SwaggerDocumentOptions = {
    standardSchemaConverter: (schema, { schemaType }) => ({
      schema: toJsonSchema(schema as never, {
        target: 'openapi-3.0',
        typeMode: schemaType,
      }),
    }),
  };

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig, swaggerDocumentOptions);

  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(configService.get('PORT', { infer: true }));
}
await bootstrap();
