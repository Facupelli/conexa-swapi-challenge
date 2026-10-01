import { Prisma } from '../generated/prisma/client.js';

const RECORD_NOT_FOUND_ERROR_CODE = 'P2025';
const UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';

export function isPrismaRecordNotFoundError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND_ERROR_CODE
  );
}

export function isPrismaUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_ERROR_CODE
  );
}
