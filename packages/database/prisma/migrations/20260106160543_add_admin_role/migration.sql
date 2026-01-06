-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'user');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'user';
