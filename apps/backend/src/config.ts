import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  // Server
  port: z.coerce.number().default(8000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  databaseUrl: z.string().url(),

  // Redis
  redisUrl: z.string().url(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('24h'),

  // Coach password
  coachPassword: z.string().min(8),

  // External APIs (OpenAI for both STT and LLM)
  openaiApiKey: z.string().min(1),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse({
    port: process.env.BACKEND_PORT ?? process.env.PORT,
    host: process.env.BACKEND_HOST ?? process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    coachPassword: process.env.COACH_PASSWORD,
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  if (!result.success) {
    console.error('Invalid configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();

export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

export function isTest(): boolean {
  return config.nodeEnv === 'test';
}
