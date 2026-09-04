import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { beforeAll, afterAll } from 'vitest';

// Use a distinct database URL for tests (e.g. SQLite test.db)
process.env.DATABASE_URL = 'file:./test.db';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
