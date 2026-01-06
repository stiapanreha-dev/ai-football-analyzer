import type { FastifyPluginAsync } from 'fastify';

import type { ApiResponse, AdminDto, PaginatedResponse } from '@archetypes/shared';

import {
  createAdminSchema,
  getAdminParamsSchema,
  getAdminsQuerySchema,
} from './admin.schemas.js';
import { createAdminService } from './admin.service.js';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = createAdminService(fastify);

  // GET /admins - Список администраторов
  fastify.get<{
    Reply: ApiResponse<PaginatedResponse<AdminDto>>;
  }>(
    '/',
    {
      schema: {
        tags: ['admins'],
        summary: 'Список администраторов',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            pageSize: { type: 'number', default: 20 },
            isActive: { type: 'string' },
          },
        },
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const query = getAdminsQuerySchema.parse(request.query);
      const result = await adminService.findAll(query);
      return reply.send({ success: true, data: result });
    }
  );

  // GET /admins/:id - Получить администратора по ID
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<AdminDto>;
  }>(
    '/:id',
    {
      schema: {
        tags: ['admins'],
        summary: 'Получить администратора по ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const { id } = getAdminParamsSchema.parse(request.params);
      const admin = await adminService.findById(id);
      return reply.send({ success: true, data: admin });
    }
  );

  // POST /admins - Создать администратора
  fastify.post<{
    Reply: ApiResponse<AdminDto>;
  }>(
    '/',
    {
      schema: {
        tags: ['admins'],
        summary: 'Создать администратора',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['telegramId'],
          properties: {
            telegramId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user'] },
          },
        },
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const data = createAdminSchema.parse(request.body);
      const admin = await adminService.create(data);
      return reply.status(201).send({ success: true, data: admin });
    }
  );

  // DELETE /admins/:id - Удалить администратора
  fastify.delete<{
    Params: { id: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['admins'],
        summary: 'Удалить администратора',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
      preHandler: [fastify.requireAdmin],
    },
    async (request, reply) => {
      const { id } = getAdminParamsSchema.parse(request.params);
      await adminService.delete(id);
      return reply.status(204).send();
    }
  );
};

export default adminRoutes;
