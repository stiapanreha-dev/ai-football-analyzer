import type { FastifyInstance } from 'fastify';
import type { Admin } from '@archetypes/database';

import type { AdminDto, PaginatedResponse } from '@archetypes/shared';

import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { config } from '../../config.js';

import type { CreateAdminInput, UpdateAdminInput, GetAdminsQuery } from './admin.schemas.js';

export class AdminService {
  constructor(private readonly app: FastifyInstance) {}

  async create(data: CreateAdminInput): Promise<AdminDto> {
    const existing = await this.app.prisma.admin.findUnique({
      where: { telegramId: data.telegramId },
    });

    if (existing) {
      throw new ConflictError(`Admin with Telegram ID ${data.telegramId} already exists`);
    }

    const admin = await this.app.prisma.admin.create({
      data: {
        telegramId: data.telegramId,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      },
    });

    return this.toDto(admin);
  }

  async findAll(query: GetAdminsQuery): Promise<PaginatedResponse<AdminDto>> {
    const { page, pageSize, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: { isActive?: boolean } = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [admins, total] = await Promise.all([
      this.app.prisma.admin.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.app.prisma.admin.count({ where }),
    ]);

    return {
      items: admins.map((a) => this.toDto(a)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: number): Promise<AdminDto> {
    const admin = await this.app.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundError('Admin', id);
    }

    return this.toDto(admin);
  }

  async findByTelegramId(telegramId: bigint): Promise<AdminDto | null> {
    const admin = await this.app.prisma.admin.findUnique({
      where: { telegramId },
    });

    return admin ? this.toDto(admin) : null;
  }

  async update(id: number, data: UpdateAdminInput): Promise<AdminDto> {
    const admin = await this.app.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundError('Admin', id);
    }

    const updated = await this.app.prisma.admin.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        isActive: data.isActive,
      },
    });

    return this.toDto(updated);
  }

  async delete(id: number): Promise<void> {
    const admin = await this.app.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundError('Admin', id);
    }

    await this.app.prisma.admin.delete({
      where: { id },
    });
  }

  async updateLastLogin(telegramId: bigint, data?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }): Promise<AdminDto> {
    const admin = await this.app.prisma.admin.update({
      where: { telegramId },
      data: {
        lastLogin: new Date(),
        ...(data?.firstName && { firstName: data.firstName }),
        ...(data?.lastName && { lastName: data.lastName }),
        ...(data?.username && { username: data.username }),
        ...(data?.photoUrl && { photoUrl: data.photoUrl }),
      },
    });

    return this.toDto(admin);
  }

  async ensureInitialAdmin(): Promise<void> {
    if (!config.initialAdminTelegramId) {
      return;
    }

    const adminCount = await this.app.prisma.admin.count();
    if (adminCount > 0) {
      return;
    }

    await this.app.prisma.admin.create({
      data: {
        telegramId: config.initialAdminTelegramId,
      },
    });

    this.app.log.info(`Initial admin created with Telegram ID: ${config.initialAdminTelegramId}`);
  }

  async count(): Promise<number> {
    return this.app.prisma.admin.count();
  }

  private toDto(admin: Admin): AdminDto {
    return {
      id: admin.id,
      telegramId: admin.telegramId.toString(),
      firstName: admin.firstName,
      lastName: admin.lastName,
      username: admin.username,
      photoUrl: admin.photoUrl,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
      lastLogin: admin.lastLogin?.toISOString() ?? null,
    };
  }
}

export function createAdminService(app: FastifyInstance): AdminService {
  return new AdminService(app);
}
