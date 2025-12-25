import type { FastifyPluginAsync } from 'fastify';

import type {
  ApiResponse,
  PaginatedResponse,
  TeamDto,
  TeamWithPlayersDto,
  TeamReportDto,
} from '@archetypes/shared';

import {
  createTeamBodySchema,
  updateTeamBodySchema,
  teamIdParamsSchema,
  addPlayersBodySchema,
  removePlayersBodySchema,
  getTeamsQuerySchema,
} from './team.schemas.js';
import { createTeamService } from './team.service.js';
import { createTacticalAnalysisService } from './tactical-analysis.service.js';

const teamsRoutes: FastifyPluginAsync = async (fastify) => {
  const teamService = createTeamService(fastify);
  const tacticalService = createTacticalAnalysisService(fastify);

  // GET /teams - Список команд
  fastify.get<{
    Reply: ApiResponse<PaginatedResponse<TeamDto>>;
  }>(
    '/',
    {
      schema: {
        tags: ['teams'],
        summary: 'Список команд',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = getTeamsQuerySchema.parse(request.query);
      const result = await teamService.findAll(query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /teams/:id - Детали команды с игроками
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<TeamWithPlayersDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['teams'],
        summary: 'Детали команды',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const team = await teamService.findById(id);

      return reply.send({
        success: true,
        data: team,
      });
    }
  );

  // POST /teams - Создать команду
  fastify.post<{
    Reply: ApiResponse<TeamDto>;
  }>(
    '/',
    {
      schema: {
        tags: ['teams'],
        summary: 'Создать команду',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const body = createTeamBodySchema.parse(request.body);
      const team = await teamService.create(body);

      return reply.status(201).send({
        success: true,
        data: team,
      });
    }
  );

  // PUT /teams/:id - Обновить команду
  fastify.put<{
    Params: { id: string };
    Reply: ApiResponse<TeamDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['teams'],
        summary: 'Обновить команду',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const body = updateTeamBodySchema.parse(request.body);
      const team = await teamService.update(id, body);

      return reply.send({
        success: true,
        data: team,
      });
    }
  );

  // DELETE /teams/:id - Удалить команду
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<null>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['teams'],
        summary: 'Удалить команду',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      await teamService.remove(id);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // POST /teams/:id/players - Добавить игроков в команду
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<TeamWithPlayersDto>;
  }>(
    '/:id/players',
    {
      schema: {
        tags: ['teams'],
        summary: 'Добавить игроков в команду',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const { playerIds } = addPlayersBodySchema.parse(request.body);
      const team = await teamService.addPlayers(id, playerIds);

      return reply.send({
        success: true,
        data: team,
      });
    }
  );

  // DELETE /teams/:id/players - Удалить игроков из команды
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<TeamWithPlayersDto>;
  }>(
    '/:id/players',
    {
      schema: {
        tags: ['teams'],
        summary: 'Удалить игроков из команды',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const { playerIds } = removePlayersBodySchema.parse(request.body);
      const team = await teamService.removePlayers(id, playerIds);

      return reply.send({
        success: true,
        data: team,
      });
    }
  );

  // POST /teams/:id/report - Сгенерировать тактический отчёт
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<TeamReportDto>;
  }>(
    '/:id/report',
    {
      schema: {
        tags: ['teams'],
        summary: 'Сгенерировать тактический отчёт команды',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const report = await tacticalService.generateReport(id);

      return reply.status(201).send({
        success: true,
        data: report,
      });
    }
  );

  // GET /teams/:id/reports - Список отчётов команды
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<TeamReportDto[]>;
  }>(
    '/:id/reports',
    {
      schema: {
        tags: ['teams'],
        summary: 'Список тактических отчётов команды',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = teamIdParamsSchema.parse(request.params);
      const reports = await tacticalService.getReports(id);

      return reply.send({
        success: true,
        data: reports,
      });
    }
  );

  // GET /teams/:id/reports/:reportId - Детали отчёта
  fastify.get<{
    Params: { id: string; reportId: string };
    Reply: ApiResponse<TeamReportDto>;
  }>(
    '/:id/reports/:reportId',
    {
      schema: {
        tags: ['teams'],
        summary: 'Детали тактического отчёта',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { reportId } = request.params as { id: string; reportId: string };
      const report = await tacticalService.getReport(Number(reportId));

      return reply.send({
        success: true,
        data: report,
      });
    }
  );
};

export default teamsRoutes;
