import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';

import {
  PrismaClient,
  Role,
} from '../src/generated/prisma/client.js';
import { normalizeEmail } from '../src/modules/users/normalize-email.js';
import { MIN_PASSWORD_LENGTH } from '../src/modules/auth/password-policy.js';

const databaseUrl = process.env['DATABASE_URL'];
const adminEmail = process.env['SEED_ADMIN_EMAIL'];
const adminPassword = process.env['SEED_ADMIN_PASSWORD'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database');
}

if (!adminEmail) {
  throw new Error('SEED_ADMIN_EMAIL is required to seed the database');
}

if (!adminPassword) {
  throw new Error('SEED_ADMIN_PASSWORD is required to seed the database');
}

if (adminPassword.length < MIN_PASSWORD_LENGTH) {
  throw new Error(
    `SEED_ADMIN_PASSWORD must contain at least ${MIN_PASSWORD_LENGTH} characters`,
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const email = normalizeEmail(adminEmail as string);
  const passwordHash = await hash(adminPassword as string);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user seeded: ${admin.email}`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
