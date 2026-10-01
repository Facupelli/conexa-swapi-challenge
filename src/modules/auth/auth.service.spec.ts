import { hash, verify } from 'argon2';
import { Result } from 'better-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role, type User } from '../../generated/prisma/client.js';
import {
  EmailAlreadyExistsError,
  emailAlreadyExists,
} from '../users/users.errors.js';
import type { UsersService } from '../users/users.service.js';
import { InvalidCredentialsError } from './auth.errors.js';
import { AuthService } from './auth.service.js';

vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

const user: User = {
  id: '68310c83-4e49-4bf3-92e7-b046765b767b',
  email: 'facu@example.com',
  passwordHash: 'hashed-password',
  role: Role.REGULAR,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
};

const usersService = {
  findByEmail: vi.fn(),
  createRegularUser: vi.fn(),
};

const jwtService = {
  signAsync: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as never,
    );
  });

  describe('signup', () => {
    it('hashes the password and creates a regular user', async () => {
      vi.mocked(hash).mockResolvedValueOnce('hashed-password');

      usersService.createRegularUser.mockResolvedValueOnce(
        Result.ok(user),
      );

      const result = await service.signup(
        'facu@example.com',
        'password123',
      );

      expect(hash).toHaveBeenCalledWith('password123');

      expect(usersService.createRegularUser).toHaveBeenCalledWith(
        'facu@example.com',
        'hashed-password',
      );

      expect(Result.isOk(result)).toBe(true);

      if (Result.isError(result)) {
        throw result.error;
      }

      expect(result.value).toEqual({
        id: user.id,
        email: user.email,
        role: Role.REGULAR,
      });

      expect(result.value).not.toHaveProperty('passwordHash');
    });

    it('propagates EmailAlreadyExistsError', async () => {
      vi.mocked(hash).mockResolvedValueOnce('hashed-password');

      const error = emailAlreadyExists('facu@example.com');

      usersService.createRegularUser.mockResolvedValueOnce(
        Result.err(error),
      );

      const result = await service.signup(
        'facu@example.com',
        'password123',
      );

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected signup to fail');
      }

      expect(EmailAlreadyExistsError.is(result.error)).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('login', () => {
    it('verifies credentials and returns an access token', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      vi.mocked(verify).mockResolvedValueOnce(true);
      jwtService.signAsync.mockResolvedValueOnce('access-token');

      const result = await service.login(
        'facu@example.com',
        'password123',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'facu@example.com',
      );

      expect(verify).toHaveBeenCalledWith(
        user.passwordHash,
        'password123',
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
      });

      expect(result).toEqual(
        Result.ok({
          accessToken: 'access-token',
        }),
      );
    });

    it('returns InvalidCredentialsError when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      const result = await service.login(
        'missing@example.com',
        'password123',
      );

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected login to fail');
      }

      expect(InvalidCredentialsError.is(result.error)).toBe(true);

      expect(verify).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('returns InvalidCredentialsError when the password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      vi.mocked(verify).mockResolvedValueOnce(false);

      const result = await service.login(
        'facu@example.com',
        'wrong-password',
      );

      expect(Result.isError(result)).toBe(true);

      if (Result.isOk(result)) {
        throw new Error('Expected login to fail');
      }

      expect(InvalidCredentialsError.is(result.error)).toBe(true);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
