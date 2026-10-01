import { Result } from 'better-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma, Role, type User } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { EmailAlreadyExistsError } from './users.errors.js';
import { UsersService } from './users.service.js';

const user: User = {
  id: '68310c83-4e49-4bf3-92e7-b046765b767b',
  email: 'facu@example.com',
  passwordHash: 'hashed-password',
  role: Role.REGULAR,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
};

const prisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

function prismaUniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.0.0',
  });
}

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('createRegularUser', () => {
    it('normalizes the email and creates a regular user', async () => {
      prisma.user.create.mockResolvedValueOnce(user);

      const result = await service.createRegularUser(
        '  Facu@Example.COM  ',
        'hashed-password',
      );

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'facu@example.com',
          passwordHash: 'hashed-password',
          role: Role.REGULAR,
        },
      });

      expect(Result.isOk(result)).toBe(true);

      if (Result.isError(result)) {
        throw result.error;
      }

      expect(result.value).toEqual(user);
    });

    it('returns EmailAlreadyExistsError when the email unique constraint is violated', async () => {
      prisma.user.create.mockRejectedValueOnce(prismaUniqueConstraintError());

      const result = await service.createRegularUser(
        '  Facu@Example.COM  ',
        'hashed-password',
      );

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected user creation to fail');
      }

      expect(EmailAlreadyExistsError.is(result.error)).toBe(true);
      expect(result.error.email).toBe('facu@example.com');
    });
  });
});
