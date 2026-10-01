import {
  Body,
  ConflictException,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import {
  loginSchema,
  type LoginDto,
  signupSchema,
  type SignupDto,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import type {
  LoginResult,
  RegisteredUser,
} from './auth.types.js';
import { Public } from './decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body({ schema: signupSchema }) body: SignupDto,
  ): Promise<RegisteredUser> {
    const result = await this.authService.signup(
      body.email,
      body.password,
    );

    return result.match({
      ok: (user) => user,
      err: (error) => {
        throw new ConflictException(error.message);
      },
    });
  }

  @Public()
  @Post('login')
  async login(
    @Body({ schema: loginSchema }) body: LoginDto,
  ): Promise<LoginResult> {
    const result = await this.authService.login(
      body.email,
      body.password,
    );

    return result.match({
      ok: (loginResult) => loginResult,
      err: (error) => {
        throw new UnauthorizedException(error.message);
      },
    });
  }
}
