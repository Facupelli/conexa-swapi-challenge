import { TaggedError } from 'better-result';

export class EmailAlreadyExistsError extends TaggedError(
  'EmailAlreadyExistsError',
)<{
  email: string;
  message: string;
}> {}

export function emailAlreadyExists(
  email: string,
): EmailAlreadyExistsError {
  return new EmailAlreadyExistsError({
    email,
    message: 'A user with this email already exists',
  });
}
