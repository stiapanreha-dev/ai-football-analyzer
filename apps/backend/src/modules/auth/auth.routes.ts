import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse } from '@archetypes/shared';

import { loginBodySchema } from './auth.schemas.js';
import { createAuthService } from './auth.service.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = createAuthService(fastify);

  // POST /auth/login - Вход тренера
  fastify.post<{
    Body: { password: string };
    Reply: ApiResponse<{ token: string }>;
  }>(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Вход тренера',
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
      // JWT токены stateless, клиент должен удалить токен
      return reply.send({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    }
  );

  // GET /auth/me - Текущий пользователь
  fastify.get<{
    Reply: ApiResponse<{ role: string }>;
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
      return reply.send({
        success: true,
        data: { role: request.user.role },
      });
    }
  );
};

export default authRoutes;
