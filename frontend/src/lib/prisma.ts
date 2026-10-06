import { PrismaClient } from '@prisma/client';
import path from 'path';

// DATABASE_URL points at the persistent volume in Kubernetes; fall back to the bundled dev database locally.
const databaseUrl = process.env.DATABASE_URL?.startsWith('file:/')
  ? process.env.DATABASE_URL
  : `file:${path.resolve(process.cwd(), 'prisma/dev.db')}`;

function createClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Password hashes are never returned unless a query opts in with omit: { passwordHash: false }
    omit: {
      user: { passwordHash: true },
      candidateAccount: { passwordHash: true },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
