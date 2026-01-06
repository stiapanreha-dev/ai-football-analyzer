import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import type { AdminDto, AdminRole, TelegramLoginResultDto } from '@archetypes/shared';

import { config } from '../../config.js';
import { UnauthorizedError } from '../../utils/errors.js';

import type { TelegramAuthBody } from './auth.schemas.js';

interface JWTPayload {
  role: AdminRole;
  adminId: number;
  telegramId: string;
}

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(password: string): Promise<string> {
    if (!config.coachPassword) {
      throw new UnauthorizedError('Password authentication is disabled');
    }

    if (password !== config.coachPassword) {
      throw new UnauthorizedError('Invalid password');
    }

    const token = this.app.jwt.sign({ role: 'coach' as const });
    return token;
  }

  async loginWithTelegram(data: TelegramAuthBody): Promise<TelegramLoginResultDto> {
    if (!this.verifyTelegramAuth(data)) {
      throw new UnauthorizedError('Invalid Telegram authentication');
    }

    const authDate = new Date(data.auth_date * 1000);
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (now.getTime() - authDate.getTime() > maxAge) {
      throw new UnauthorizedError('Telegram authentication expired');
    }

    const telegramId = BigInt(data.id);

    const admin = await this.app.prisma.admin.findUnique({
      where: { telegramId },
    });

    if (!admin) {
      throw new UnauthorizedError('You are not authorized as admin');
    }

    if (!admin.isActive) {
      throw new UnauthorizedError('Your admin account is disabled');
    }

    const updatedAdmin = await this.app.prisma.admin.update({
      where: { telegramId },
      data: {
        lastLogin: new Date(),
        firstName: data.first_name ?? admin.firstName,
        lastName: data.last_name ?? admin.lastName,
        username: data.username ?? admin.username,
        photoUrl: data.photo_url ?? admin.photoUrl,
      },
    });

    const payload: JWTPayload = {
      role: updatedAdmin.role,
      adminId: admin.id,
      telegramId: telegramId.toString(),
    };

    const token = this.app.jwt.sign(payload);

    const adminDto: AdminDto = {
      id: updatedAdmin.id,
      telegramId: updatedAdmin.telegramId.toString(),
      firstName: updatedAdmin.firstName,
      lastName: updatedAdmin.lastName,
      username: updatedAdmin.username,
      photoUrl: updatedAdmin.photoUrl,
      role: updatedAdmin.role,
      isActive: updatedAdmin.isActive,
      createdAt: updatedAdmin.createdAt.toISOString(),
      lastLogin: updatedAdmin.lastLogin?.toISOString() ?? null,
    };

    return { token, admin: adminDto };
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = this.app.jwt.verify<JWTPayload>(token);
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }

  async getCurrentAdmin(telegramId: string): Promise<AdminDto | null> {
    const admin = await this.app.prisma.admin.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      telegramId: admin.telegramId.toString(),
      firstName: admin.firstName,
      lastName: admin.lastName,
      username: admin.username,
      photoUrl: admin.photoUrl,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
      lastLogin: admin.lastLogin?.toISOString() ?? null,
    };
  }

  private verifyTelegramAuth(data: TelegramAuthBody): boolean {
    const { hash, ...checkData } = data;

    const dataCheckArr: string[] = [];
    for (const [key, value] of Object.entries(checkData)) {
      if (value !== undefined) {
        dataCheckArr.push(`${key}=${value}`);
      }
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto
      .createHash('sha256')
      .update(config.telegramBotToken)
      .digest();

    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hmac === hash;
  }
}

export function createAuthService(app: FastifyInstance): AuthService {
  return new AuthService(app);
}
