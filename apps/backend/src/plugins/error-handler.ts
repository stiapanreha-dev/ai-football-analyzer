import type { FastifyPluginAsync, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

import type { ApiErrorResponse } from '@archetypes/shared';

import { AppError } from '../utils/errors.js';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError | Error, request, reply) => {
    request.log.error(error);

    // AppError - наши кастомные ошибки
    if (error instanceof AppError) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
      return reply.status(error.statusCode).send(response);
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      };
      return reply.status(400).send(response);
    }

    // Fastify validation errors
    if ('validation' in error && error.validation) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.validation,
        },
      };
      return reply.status(400).send(response);
    }

    // Unknown errors
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    };
    return reply.status(500).send(response);
  });

  fastify.log.info('Error handler plugin registered');
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
});
