import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { prisma } from '@archetypes/database';
import type { PrismaClient } from '@archetypes/database';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    fastify.log.info('Prisma disconnected');
  });

  fastify.log.info('Prisma plugin registered');
};

export default fp(prismaPlugin, {
  name: 'prisma',
});
