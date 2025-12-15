import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse, PaginatedResponse, PlayerDto, PlayerWithStatsDto, SessionDto } from '@archetypes/shared';

import {
  getPlayerParamsSchema,
  getPlayersQuerySchema,
  getPlayerByTelegramIdParamsSchema,
  updatePlayerSchema,
} from './player.schemas.js';
import { createPlayerService } from './player.service.js';

const playersRoutes: FastifyPluginAsync = async (fastify) => {
  const playerService = createPlayerService(fastify);

  // GET /players - Список игроков (защищённый)
  fastify.get<{
    Reply: ApiResponse<PaginatedResponse<PlayerWithStatsDto>>;
  }>(
    '/',
    {
      schema: {
        tags: ['players'],
        summary: 'Список игроков',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const query = getPlayersQuerySchema.parse(request.query);
      const result = await playerService.findAll(query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /players/:id - Профиль игрока (защищённый)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<PlayerWithStatsDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['players'],
        summary: 'Профиль игрока',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getPlayerParamsSchema.parse(request.params);
      const player = await playerService.findById(id);

      return reply.send({
        success: true,
        data: player,
      });
    }
  );

  // PATCH /players/:id - Обновление игрока (защищённый)
  fastify.patch<{
    Params: { id: string };
    Reply: ApiResponse<PlayerDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['players'],
        summary: 'Обновить данные игрока',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getPlayerParamsSchema.parse(request.params);
      const data = updatePlayerSchema.parse(request.body);
      const player = await playerService.update(id, data);

      return reply.send({
        success: true,
        data: player,
      });
    }
  );

  // GET /players/:id/sessions - История сессий игрока (защищённый)
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<SessionDto[]>;
  }>(
    '/:id/sessions',
    {
      schema: {
        tags: ['players'],
        summary: 'История сессий игрока',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = getPlayerParamsSchema.parse(request.params);
      const sessions = await playerService.getPlayerSessions(id);

      return reply.send({
        success: true,
        data: sessions,
      });
    }
  );

  // GET /players/telegram/:telegramId - Поиск по Telegram ID (для бота)
  fastify.get<{
    Params: { telegramId: string };
    Reply: ApiResponse<PlayerWithStatsDto | null>;
  }>(
    '/telegram/:telegramId',
    {
      schema: {
        tags: ['players'],
        summary: 'Поиск игрока по Telegram ID (для бота)',
      },
    },
    async (request, reply) => {
      const { telegramId } = getPlayerByTelegramIdParamsSchema.parse(request.params);
      const player = await playerService.findByTelegramId(telegramId);

      return reply.send({
        success: true,
        data: player,
      });
    }
  );

  // PATCH /players/telegram/:telegramId - Обновление игрока по Telegram ID (для бота)
  fastify.patch<{
    Params: { telegramId: string };
    Reply: ApiResponse<PlayerDto>;
  }>(
    '/telegram/:telegramId',
    {
      schema: {
        tags: ['players'],
        summary: 'Обновить данные игрока по Telegram ID (для бота)',
      },
    },
    async (request, reply) => {
      const { telegramId } = getPlayerByTelegramIdParamsSchema.parse(request.params);
      const data = updatePlayerSchema.parse(request.body);
      const player = await playerService.updateByTelegramId(telegramId, data);

      return reply.send({
        success: true,
        data: player,
      });
    }
  );
};

export default playersRoutes;
