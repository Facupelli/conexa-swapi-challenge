import * as v from 'valibot';

import { Role } from '../../generated/prisma/client.js';

export const registeredUserResponseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist([Role.REGULAR, Role.ADMIN]),
});

export const loginResponseSchema = v.object({
  accessToken: v.string(),
});
