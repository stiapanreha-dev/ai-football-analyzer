-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_players" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_reports" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "team_profile" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "overall_assessment" TEXT NOT NULL,
    "analyzed_players_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_players_team_id_player_id_key" ON "team_players"("team_id", "player_id");

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_reports" ADD CONSTRAINT "team_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
