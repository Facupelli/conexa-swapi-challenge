import * as v from 'valibot';

const credentialsSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

export const signupSchema = credentialsSchema;
export const loginSchema = credentialsSchema;

export type SignupDto = v.InferOutput<typeof signupSchema>;
export type LoginDto = v.InferOutput<typeof loginSchema>;
