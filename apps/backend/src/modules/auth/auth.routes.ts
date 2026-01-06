import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse, AdminDto, TelegramLoginResultDto } from '@archetypes/shared';

import { loginBodySchema, telegramAuthSchema } from './auth.schemas.js';
import { createAuthService } from './auth.service.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = createAuthService(fastify);

  // POST /auth/telegram - Вход через Telegram
  fastify.post<{
    Reply: ApiResponse<TelegramLoginResultDto>;
  }>(
    '/telegram',
    {
      schema: {
        tags: ['auth'],
        summary: 'Вход через Telegram',
        body: {
          type: 'object',
          required: ['id', 'auth_date', 'hash'],
          properties: {
            id: { type: 'number' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            username: { type: 'string' },
            photo_url: { type: 'string' },
            auth_date: { type: 'number' },
            hash: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  admin: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      telegramId: { type: 'string' },
                      firstName: { type: 'string', nullable: true },
                      lastName: { type: 'string', nullable: true },
                      username: { type: 'string', nullable: true },
                      photoUrl: { type: 'string', nullable: true },
                      role: { type: 'string' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string' },
                      lastLogin: { type: 'string', nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const data = telegramAuthSchema.parse(request.body);
      const result = await authService.loginWithTelegram(data);
      return reply.send({ success: true, data: result });
    }
  );

  // POST /auth/login - Вход по паролю (legacy)
  fastify.post<{
    Body: { password: string };
    Reply: ApiResponse<{ token: string }>;
  }>(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Вход тренера (legacy)',
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { password } = loginBodySchema.parse(request.body);
      const token = await authService.login(password);

      return reply.send({
        success: true,
        data: { token },
      });
    }
  );

  // POST /auth/logout - Выход (invalidate token on client)
  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Выход',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      return reply.send({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    }
  );

  // GET /auth/me - Текущий пользователь
  fastify.get<{
    Reply: ApiResponse<{ role: string; admin?: AdminDto }>;
  }>(
    '/me',
    {
      schema: {
        tags: ['auth'],
        summary: 'Текущий пользователь',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { role: string; telegramId?: string };

      if (user.telegramId) {
        const admin = await authService.getCurrentAdmin(user.telegramId);
        return reply.send({
          success: true,
          data: { role: user.role, admin: admin ?? undefined },
        });
      }

      return reply.send({
        success: true,
        data: { role: user.role },
      });
    }
  );
};

export default authRoutes;
