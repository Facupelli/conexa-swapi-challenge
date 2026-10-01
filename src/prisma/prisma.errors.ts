import { Prisma } from "../generated/prisma/client.js";

const RECORD_NOT_FOUND_CODE = 'P2025';

export function isPrismaRecordNotFoundError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND_CODE
  );
}
