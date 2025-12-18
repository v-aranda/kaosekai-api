import { PrismaClient } from '@prisma/client';

// Singleton Prisma client to avoid exhausting database connections
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
