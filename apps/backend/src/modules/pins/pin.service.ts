import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import type { AccessPin, PinType } from '@archetypes/database';

import { PIN_CODE_LENGTH, DEFAULT_SESSION_PIN_HOURS } from '@archetypes/shared';
import type { PinDto, ValidatePinResultDto, PinUsageDto, PaginatedResponse } from '@archetypes/shared';

import {
  NotFoundError,
  PinInvalidError,
  PinExpiredError,
  PinExhaustedError,
  PinInactiveError,
} from '../../utils/errors.js';

import type { CreatePinInput, GetPinsQuery } from './pin.schemas.js';

export class PinService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Генерация уникального PIN-кода
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists: boolean;

    do {
      // Генерируем случайное число нужной длины
      const max = Math.pow(10, PIN_CODE_LENGTH);
      const randomNum = crypto.randomInt(0, max);
      code = randomNum.toString().padStart(PIN_CODE_LENGTH, '0');

      // Проверяем уникальность
      const existing = await this.app.prisma.accessPin.findUnique({
        where: { code },
      });
      exists = !!existing;
    } while (exists);

    return code;
  }

  /**
   * Создание нового PIN-кода
   */
  async create(data: CreatePinInput): Promise<PinDto> {
    const code = await this.generateUniqueCode();

    let expiresAt: Date | null = null;
    let maxUses = 1;

    switch (data.type) {
      case 'single':
        maxUses = 1;
        break;
      case 'multi':
        maxUses = data.maxUses ?? 5;
        break;
      case 'session':
        const hours = data.expiresInHours ?? DEFAULT_SESSION_PIN_HOURS;
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        maxUses = 999999; // Практически неограниченно
        break;
      case 'personal':
        maxUses = 1; // Именной PIN одноразовый
        break;
    }

    const pin = await this.app.prisma.accessPin.create({
      data: {
        code,
        type: data.type,
        maxUses,
        expiresAt,
        // Для именного PIN сохраняем данные игрока
        playerName: data.type === 'personal' ? data.playerName : null,
        playerPosition: data.type === 'personal' ? data.playerPosition : null,
        playerJerseyNumber: data.type === 'personal' ? data.playerJerseyNumber : null,
      },
    });

    return this.toDto(pin);
  }

  /**
   * Получение списка PIN-кодов
   */
  async findAll(query: GetPinsQuery): Promise<PaginatedResponse<PinDto>> {
    const { page, pageSize, type, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: { type?: PinType; isActive?: boolean } = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [pins, total] = await Promise.all([
      this.app.prisma.accessPin.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.app.prisma.accessPin.count({ where }),
    ]);

    return {
      items: pins.map((p) => this.toDto(p)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Получение PIN-кода по ID
   */
  async findById(id: number): Promise<PinDto> {
    const pin = await this.app.prisma.accessPin.findUnique({
      where: { id },
    });

    if (!pin) {
      throw new NotFoundError('PIN', id);
    }

    return this.toDto(pin);
  }

  /**
   * Валидация и использование PIN-кода
   */
  async validate(code: string, telegramId: bigint | number): Promise<ValidatePinResultDto> {
    const tgId = typeof telegramId === 'number' ? BigInt(telegramId) : telegramId;

    // Ищем PIN
    const pin = await this.app.prisma.accessPin.findUnique({
      where: { code },
    });

    if (!pin) {
      throw new PinInvalidError();
    }

    if (!pin.isActive) {
      throw new PinInactiveError();
    }

    // Проверяем истечение срока
    if (pin.expiresAt && pin.expiresAt < new Date()) {
      throw new PinExpiredError();
    }

    // Проверяем лимит использований
    if (pin.currentUses >= pin.maxUses) {
      throw new PinExhaustedError();
    }

    // Ищем или создаём игрока
    let player = await this.app.prisma.player.findUnique({
      where: { telegramId: tgId },
    });

    const isNewPlayer = !player;

    if (!player) {
      // Для именного PIN сразу заполняем данные игрока
      if (pin.type === 'personal' && pin.playerName && pin.playerPosition) {
        player = await this.app.prisma.player.create({
          data: {
            telegramId: tgId,
            name: pin.playerName,
            position: pin.playerPosition,
            jerseyNumber: pin.playerJerseyNumber,
          },
        });
      } else {
        player = await this.app.prisma.player.create({
          data: { telegramId: tgId },
        });
      }
    } else if (pin.type === 'personal' && pin.playerName && pin.playerPosition) {
      // Если игрок существует но это именной PIN - обновляем его данные
      player = await this.app.prisma.player.update({
        where: { id: player.id },
        data: {
          name: pin.playerName,
          position: pin.playerPosition,
          jerseyNumber: pin.playerJerseyNumber,
        },
      });
    }

    // Записываем использование PIN-кода
    await this.app.prisma.$transaction([
      this.app.prisma.pinUsage.create({
        data: {
          pinId: pin.id,
          playerId: player.id,
        },
      }),
      this.app.prisma.accessPin.update({
        where: { id: pin.id },
        data: { currentUses: { increment: 1 } },
      }),
    ]);

    // Формируем результат
    const result: ValidatePinResultDto = {
      valid: true,
      playerId: player.id,
      isNewPlayer,
    };

    // Для именного PIN возвращаем данные игрока для автозаполнения в боте
    if (pin.type === 'personal' && pin.playerName && pin.playerPosition) {
      result.playerData = {
        name: pin.playerName,
        position: pin.playerPosition,
        jerseyNumber: pin.playerJerseyNumber ?? undefined,
      };
    }

    return result;
  }

  /**
   * Деактивация PIN-кода
   */
  async revoke(id: number): Promise<void> {
    const pin = await this.app.prisma.accessPin.findUnique({
      where: { id },
    });

    if (!pin) {
      throw new NotFoundError('PIN', id);
    }

    await this.app.prisma.accessPin.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * История использования PIN-кода
   */
  async getUsages(pinId: number): Promise<PinUsageDto[]> {
    const pin = await this.app.prisma.accessPin.findUnique({
      where: { id: pinId },
    });

    if (!pin) {
      throw new NotFoundError('PIN', pinId);
    }

    const usages = await this.app.prisma.pinUsage.findMany({
      where: { pinId },
      include: { player: true },
      orderBy: { usedAt: 'desc' },
    });

    return usages.map((u) => ({
      id: u.id,
      playerId: u.playerId,
      playerName: u.player.name,
      sessionId: u.sessionId,
      usedAt: u.usedAt.toISOString(),
    }));
  }

  private toDto(pin: AccessPin): PinDto {
    return {
      id: pin.id,
      code: pin.code,
      type: pin.type,
      maxUses: pin.maxUses,
      currentUses: pin.currentUses,
      expiresAt: pin.expiresAt?.toISOString() ?? null,
      isActive: pin.isActive,
      createdAt: pin.createdAt.toISOString(),
      playerName: pin.playerName,
      playerPosition: pin.playerPosition,
      playerJerseyNumber: pin.playerJerseyNumber,
    };
  }
}

export function createPinService(app: FastifyInstance): PinService {
  return new PinService(app);
}
