import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse, DashboardStatsDto, RecentActivityDto } from '@archetypes/shared';

import { createDashboardService } from './dashboard.service.js';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  const dashboardService = createDashboardService(fastify);

  // GET /dashboard/stats - Статистика (защищённый)
  fastify.get<{
    Reply: ApiResponse<DashboardStatsDto>;
  }>(
    '/stats',
    {
      schema: {
        tags: ['dashboard'],
        summary: 'Статистика дашборда',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const stats = await dashboardService.getStats();

      return reply.send({
        success: true,
        data: stats,
      });
    }
  );

  // GET /dashboard/recent - Последние события (защищённый)
  fastify.get<{
    Querystring: { limit?: number };
    Reply: ApiResponse<RecentActivityDto[]>;
  }>(
    '/recent',
    {
      schema: {
        tags: ['dashboard'],
        summary: 'Последние события',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const limit = request.query.limit ? Number(request.query.limit) : 10;
      const activities = await dashboardService.getRecentActivity(limit);

      return reply.send({
        success: true,
        data: activities,
      });
    }
  );
};

export default dashboardRoutes;
