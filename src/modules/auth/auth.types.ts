import type { Role } from '../../generated/prisma/client.js';

export interface RegisteredUser {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResult {
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
}
