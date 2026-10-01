import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  SerializeOptions,
  UnauthorizedException,
} from '@nestjs/common';

import {
  loginSchema,
  type LoginDto,
  signupSchema,
  type SignupDto,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import type { LoginResult, RegisteredUser } from './auth.types.js';
import { Public } from './decorators/public.decorator.js';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  loginResponseSchema,
  registeredUserResponseSchema,
} from './auth.response.schema.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @SerializeOptions({
    schema: registeredUserResponseSchema,
  })
  @ApiOperation({ summary: 'Register a regular user' })
  @ApiCreatedResponse({
    standardSchema: registeredUserResponseSchema,
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists',
  })
  async signup(
    @Body({ schema: signupSchema }) body: SignupDto,
  ): Promise<RegisteredUser> {
    const result = await this.authService.signup(body.email, body.password);

    if (result.isErr()) {
      throw new ConflictException(result.error.message);
    }

    return result.value;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    schema: loginResponseSchema,
  })
  @ApiOperation({ summary: 'Login and obtain an access token' })
  @ApiOkResponse({
    standardSchema: loginResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  async login(
    @Body({ schema: loginSchema }) body: LoginDto,
  ): Promise<LoginResult> {
    const result = await this.authService.login(body.email, body.password);

    if (result.isErr()) {
      throw new UnauthorizedException(result.error.message);
    }

    return result.value;
  }
}
