import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../generated/prisma/client.js';
import type { AuthenticatedUser } from './auth.types.js';
import { RolesGuard } from './guards/roles.guard.js';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  };

  let guard: RolesGuard;

  beforeEach(() => {
    vi.clearAllMocks();

    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function createContext(user: AuthenticatedUser): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);

    const context = createContext({
      id: 'user-id',
      role: Role.REGULAR,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a regular user when REGULAR is required', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([Role.REGULAR]);

    const context = createContext({
      id: 'user-id',
      role: Role.REGULAR,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a regular user when ADMIN is required', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([Role.ADMIN]);

    const context = createContext({
      id: 'user-id',
      role: Role.REGULAR,
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('rejects an admin when REGULAR is required', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([Role.REGULAR]);

    const context = createContext({
      id: 'admin-id',
      role: Role.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
