#!/bin/bash
set -e

echo "Initializing database..."

# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Seed data
pnpm run db:seed

echo "Database initialized successfully!"
