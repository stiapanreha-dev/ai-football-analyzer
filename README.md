# Football Archetypes

Система психологического профилирования футболистов через анализ поведенческих реакций на игровые ситуации.

## Особенности

- **Telegram-бот** для прохождения тестирования игроками
- **Голосовые ответы** - естественный способ коммуникации
- **AI-анализ** - Claude для генерации ситуаций и анализа ответов
- **7 архетипов** - Лидер, Воин, Стратег, Дипломат, Исполнитель, Индивидуалист, Избегающий
- **Мультиязычность** - 8 языков для опроса (ru, en, es, fr, pt, el, sr, no)
- **Админ-панель** для тренера

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Язык | TypeScript 5.x |
| Backend | Fastify 4.x |
| Bot | grammY 1.x |
| Admin | React 18.x + Bootstrap 5 |
| ORM | Prisma 5.x |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Monorepo | pnpm + Turborepo |

## Структура проекта

```
├── apps/
│   ├── backend/     # Fastify API
│   ├── bot/         # grammY Telegram Bot
│   └── admin/       # React Admin Panel
├── packages/
│   ├── database/    # Prisma schema + client
│   ├── shared/      # Shared types, DTOs, constants
│   └── config/      # ESLint, TypeScript configs
├── docker/
└── scripts/
```

## Начало работы

### Требования

- Node.js 20+
- pnpm 8+
- PostgreSQL 16
- Redis 7

### Установка

```bash
# Установка зависимостей
pnpm install

# Копирование переменных окружения
cp .env.example .env

# Генерация Prisma клиента
pnpm db:generate

# Применение миграций
pnpm db:migrate

# Заполнение начальными данными
pnpm db:seed

# Запуск в режиме разработки
pnpm dev
```

### Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Только БД для разработки
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

## Лицензия

All rights reserved.
