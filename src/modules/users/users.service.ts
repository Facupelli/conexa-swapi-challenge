import { Injectable } from '@nestjs/common';
import { Result, type Result as ResultType } from 'better-result';

import {
  Role,
  type User,
} from '../../generated/prisma/client.js';
import { isPrismaUniqueConstraintError } from '../../prisma/prisma.errors.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizeEmail } from './normalize-email.js';
import {
  emailAlreadyExists,
  type EmailAlreadyExistsError,
} from './users.errors.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email: normalizeEmail(email),
      },
    });
  }

  async createRegularUser(
    email: string,
    passwordHash: string,
  ): Promise<ResultType<User, EmailAlreadyExistsError>> {
    const normalizedEmail = normalizeEmail(email);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.REGULAR,
        },
      });

      return Result.ok(user);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        return Result.err(
          emailAlreadyExists(normalizedEmail),
        );
      }

      throw error;
    }
  }
}
