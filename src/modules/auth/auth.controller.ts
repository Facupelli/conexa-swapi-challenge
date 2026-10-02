import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
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
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  loginResponseSchema,
  registeredUserResponseSchema,
} from './auth.response.schema.js';
import { minutes, Throttle, ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(15),
    },
  })
  @SerializeOptions({
    schema: registeredUserResponseSchema,
  })
  @ApiOperation({ summary: 'Register a regular user' })
  @ApiCreatedResponse({
    standardSchema: registeredUserResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Invalid registration data',
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many authentication attempts',
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

  @Post('login')
  @Public()
  @Throttle({
    default: {
      limit: 10,
      ttl: minutes(15),
    },
  })
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    schema: loginResponseSchema,
  })
  @ApiOperation({ summary: 'Login and obtain an access token' })
  @ApiOkResponse({
    standardSchema: loginResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Invalid login data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many authentication attempts',
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
