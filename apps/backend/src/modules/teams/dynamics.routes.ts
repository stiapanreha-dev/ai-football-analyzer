import type { FastifyPluginAsync } from 'fastify';

import type {
  ApiResponse,
  TeamDynamicsDto,
} from '@archetypes/shared';

import { teamIdParamsSchema } from './wave.schemas.js';
import { createDynamicsService } from './dynamics.service.js';

const dynamicsRoutes: FastifyPluginAsync = async (fastify) => {
  const dynamicsService = createDynamicsService(fastify);

  // GET /teams/:id/dynamics - Динамика команды (сравнение 2 последних волн)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<TeamDynamicsDto>;
  }>(
    '/:id/dynamics',
    {
      schema: {
        tags: ['dynamics'],
        summary: 'Динамика изменений команды',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const dynamics = await dynamicsService.getTeamDynamics(id);

      return reply.send({
        success: true,
        data: dynamics,
      });
    }
  );
};

export default dynamicsRoutes;
