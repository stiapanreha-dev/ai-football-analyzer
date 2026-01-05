-- CreateEnum
CREATE TYPE "TestWaveStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "test_waves" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "name" TEXT,
    "status" "TestWaveStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "team_report_id" INTEGER,

    CONSTRAINT "test_waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_wave_participations" (
    "id" SERIAL NOT NULL,
    "wave_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "session_id" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_wave_participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_waves_team_report_id_key" ON "test_waves"("team_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_wave_participations_session_id_key" ON "test_wave_participations"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_wave_participations_wave_id_player_id_key" ON "test_wave_participations"("wave_id", "player_id");

-- AddForeignKey
ALTER TABLE "test_waves" ADD CONSTRAINT "test_waves_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_waves" ADD CONSTRAINT "test_waves_team_report_id_fkey" FOREIGN KEY ("team_report_id") REFERENCES "team_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_wave_participations" ADD CONSTRAINT "test_wave_participations_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "test_waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_wave_participations" ADD CONSTRAINT "test_wave_participations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_wave_participations" ADD CONSTRAINT "test_wave_participations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
