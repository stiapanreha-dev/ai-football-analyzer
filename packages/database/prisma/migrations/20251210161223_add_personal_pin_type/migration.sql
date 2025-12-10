-- AlterEnum
ALTER TYPE "PinType" ADD VALUE 'personal';

-- AlterTable
ALTER TABLE "access_pins" ADD COLUMN     "player_jersey_number" INTEGER,
ADD COLUMN     "player_name" TEXT,
ADD COLUMN     "player_position" "PlayerPosition";
