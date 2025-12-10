-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('created', 'in_progress', 'clarifying', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "SessionPhase" AS ENUM ('intro', 'situation', 'waiting_answer', 'analyzing', 'clarification', 'generating_report');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('main', 'clarification');

-- CreateEnum
CREATE TYPE "PinType" AS ENUM ('single', 'multi', 'session');

-- CreateEnum
CREATE TYPE "StrengthLevel" AS ENUM ('dominant', 'moderate', 'weak', 'absent');

-- CreateEnum
CREATE TYPE "SituationContext" AS ENUM ('pressure', 'conflict', 'leadership', 'tactical', 'emotional', 'failure');

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "name" TEXT,
    "position" "PlayerPosition",
    "jersey_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archetypes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "behavior_example" TEXT NOT NULL,
    "order_num" INTEGER NOT NULL,

    CONSTRAINT "archetypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_pins" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PinType" NOT NULL DEFAULT 'single',
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pin_usages" (
    "id" SERIAL NOT NULL,
    "pin_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "session_id" TEXT,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pin_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "status" "SessionStatus" NOT NULL DEFAULT 'created',
    "phase" "SessionPhase",
    "situation_index" INTEGER NOT NULL DEFAULT 0,
    "pending_archetypes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situations" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "order_num" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "context_type" "SituationContext" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "situations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" SERIAL NOT NULL,
    "situation_id" INTEGER NOT NULL,
    "type" "AnswerType" NOT NULL DEFAULT 'main',
    "target_archetype_id" INTEGER,
    "text" TEXT NOT NULL,
    "analysis_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_scores" (
    "id" SERIAL NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "archetype_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "answer_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_results" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "archetype_id" INTEGER NOT NULL,
    "final_score" DOUBLE PRECISION NOT NULL,
    "strength" "StrengthLevel" NOT NULL,

    CONSTRAINT "session_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "player_summary" TEXT NOT NULL,
    "coach_report" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_telegram_id_key" ON "players"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "archetypes_code_key" ON "archetypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "access_pins_code_key" ON "access_pins"("code");

-- CreateIndex
CREATE UNIQUE INDEX "situations_session_id_order_num_key" ON "situations"("session_id", "order_num");

-- CreateIndex
CREATE UNIQUE INDEX "answer_scores_answer_id_archetype_id_key" ON "answer_scores"("answer_id", "archetype_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_results_session_id_archetype_id_key" ON "session_results"("session_id", "archetype_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_session_id_key" ON "reports"("session_id");

-- AddForeignKey
ALTER TABLE "pin_usages" ADD CONSTRAINT "pin_usages_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "access_pins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_usages" ADD CONSTRAINT "pin_usages_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_usages" ADD CONSTRAINT "pin_usages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situations" ADD CONSTRAINT "situations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_situation_id_fkey" FOREIGN KEY ("situation_id") REFERENCES "situations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_target_archetype_id_fkey" FOREIGN KEY ("target_archetype_id") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_scores" ADD CONSTRAINT "answer_scores_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_scores" ADD CONSTRAINT "answer_scores_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "archetypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_results" ADD CONSTRAINT "session_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_results" ADD CONSTRAINT "session_results_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "archetypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
