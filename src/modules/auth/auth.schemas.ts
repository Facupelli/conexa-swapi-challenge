import * as v from 'valibot';

import { MIN_PASSWORD_LENGTH } from './password-policy.js';

const emailSchema = v.pipe(v.string(), v.email());

export const signupSchema = v.object({
  email: emailSchema,
  password: v.pipe(v.string(), v.minLength(MIN_PASSWORD_LENGTH)),
});

export const loginSchema = v.object({
  email: emailSchema,
  password: v.pipe(v.string(), v.minLength(1)),
});

export type SignupDto = v.InferOutput<typeof signupSchema>;
export type LoginDto = v.InferOutput<typeof loginSchema>;
