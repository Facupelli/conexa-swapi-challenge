import { TaggedError } from 'better-result';

export class SwapiUnavailableError extends TaggedError(
  'SwapiUnavailableError',
)<{
  cause: unknown;
  message: string;
}> {}

export class SwapiContractError extends TaggedError('SwapiContractError')<{
  cause: unknown;
  message: string;
}> {}

export type SwapiClientError =
  | SwapiUnavailableError
  | SwapiContractError;
