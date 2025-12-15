// Prisma client singleton
export { prisma } from './client.js';
export type { PrismaClient } from './client.js';

// Re-export all Prisma types
export * from '@prisma/client';

// Re-export generated Zod schemas under namespace to avoid collisions
export * as ZodSchemas from './generated/zod/index.js';
