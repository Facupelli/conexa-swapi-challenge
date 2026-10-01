import { Reflector } from '@nestjs/core';

import type { Role } from '../../../generated/prisma/client.js';

export const Roles = Reflector.createDecorator<Role[]>();
