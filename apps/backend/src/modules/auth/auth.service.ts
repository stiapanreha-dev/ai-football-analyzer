import type { FastifyInstance } from 'fastify';

import { config } from '../../config.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(password: string): Promise<string> {
    // Проверка пароля тренера
    if (password !== config.coachPassword) {
      throw new UnauthorizedError('Invalid password');
    }

    // Генерация JWT токена
    const token = this.app.jwt.sign({ role: 'coach' as const });
    return token;
  }

  async verifyToken(token: string): Promise<{ role: 'coach' }> {
    try {
      const decoded = this.app.jwt.verify<{ role: 'coach' }>(token);
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

export function createAuthService(app: FastifyInstance): AuthService {
  return new AuthService(app);
}
