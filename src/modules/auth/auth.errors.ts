import { TaggedError } from 'better-result';

export class InvalidCredentialsError extends TaggedError(
  'InvalidCredentialsError',
)<{
  message: string;
}> {}

export function invalidCredentials(): InvalidCredentialsError {
  return new InvalidCredentialsError({
    message: 'Invalid email or password',
  });
}
