import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentSchema } from './config/env.schema.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { MoviesModule } from './modules/movies/movies.module.js';

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        validationSchema: environmentSchema,
    }),
    AuthModule,
    UsersModule,
    MoviesModule,
  ],
})
export class AppModule {}
