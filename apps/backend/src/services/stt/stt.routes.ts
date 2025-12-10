import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';

import type { ApiResponse } from '@archetypes/shared';

import { ValidationError } from '../../utils/errors.js';
import { createSttService } from './stt.service.js';
import type { TranscriptionResult } from './whisper.provider.js';

const sttRoutes: FastifyPluginAsync = async (fastify) => {
  // Регистрируем multipart для загрузки файлов
  await fastify.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
    },
  });

  const sttService = createSttService();

  // POST /stt/transcribe - Транскрибация аудио (для бота)
  fastify.post<{
    Reply: ApiResponse<TranscriptionResult>;
  }>(
    '/transcribe',
    {
      schema: {
        tags: ['stt'],
        summary: 'Транскрибация аудио (для бота)',
        consumes: ['multipart/form-data'],
      },
    },
    async (request, reply) => {
      const data = await request.file();

      if (!data) {
        throw new ValidationError('No audio file provided');
      }

      const mimeType = data.mimetype;
      const language = (data.fields.language as { value: string } | undefined)?.value;

      // Читаем файл в буфер
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      if (audioBuffer.length === 0) {
        throw new ValidationError('Empty audio file');
      }

      const result = await sttService.transcribe(audioBuffer, mimeType, language);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
};

export default sttRoutes;
