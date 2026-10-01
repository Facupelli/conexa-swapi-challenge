import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { Result, type Result as ResultType } from 'better-result';
import type { EmailAlreadyExistsError } from '../users/users.errors.js';
import { UsersService } from '../users/users.service.js';
import {
  invalidCredentials,
  type InvalidCredentialsError,
} from './auth.errors.js';
import type { JwtPayload, LoginResult, RegisteredUser } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<ResultType<RegisteredUser, EmailAlreadyExistsError>> {
    const passwordHash = await hash(password);

    const result = await this.usersService.createRegularUser(
      email,
      passwordHash,
    );

    return result.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
    }));
  }

  async login(
    email: string,
    password: string,
  ): Promise<ResultType<LoginResult, InvalidCredentialsError>> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return Result.err(invalidCredentials());
    }

    const passwordMatches = await verify(user.passwordHash, password);

    if (!passwordMatches) {
      return Result.err(invalidCredentials());
    }

    const payload: JwtPayload = {
      sub: user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return Result.ok({ accessToken });
  }
}
