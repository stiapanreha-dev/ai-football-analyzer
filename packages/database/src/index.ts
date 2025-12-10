// Prisma client singleton
export { prisma } from './client';
export type { PrismaClient } from './client';

// Re-export all Prisma types
export * from '@prisma/client';

// Re-export generated Zod schemas under namespace to avoid collisions
export * as ZodSchemas from './generated/zod';
