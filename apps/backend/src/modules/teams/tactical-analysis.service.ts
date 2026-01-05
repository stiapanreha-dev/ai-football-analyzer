import type { FastifyInstance } from 'fastify';

import type {
  TeamReportDto,
  TeamArchetypeProfile,
  TacticalStyleRecommendation,
  ExtendedTeamAnalysis,
  ArchetypeCode,
} from '@archetypes/shared';
import { ARCHETYPES } from '@archetypes/shared';

import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { complete } from '../../services/llm/openai.provider.js';

interface LLMTacticalResponse {
  overallAssessment: string;
  dominantArchetypes: ArchetypeCode[];
  weakArchetypes: ArchetypeCode[];
  recommendations: TacticalStyleRecommendation[];
  extendedAnalysis?: ExtendedTeamAnalysis;
}

export function createTacticalAnalysisService(fastify: FastifyInstance) {
  const { prisma } = fastify;

  async function getPlayersWithProfiles(teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            player: {
              include: {
                sessions: {
                  where: { status: 'completed' },
                  include: {
                    results: {
                      include: { archetype: true },
                    },
                  },
                  orderBy: { completedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Команда не найдена');
    }

    // Filter players who have completed sessions with results
    const playersWithProfiles = team.players
      .filter((tp) => tp.player.sessions.length > 0 && tp.player.sessions[0]!.results.length > 0)
      .map((tp) => ({
        id: tp.player.id,
        name: tp.player.name ?? `Игрок #${tp.player.id}`,
        position: tp.player.position,
        results: tp.player.sessions[0]!.results,
      }));

    return { team, playersWithProfiles };
  }

  function calculateTeamProfile(
    playersWithProfiles: Array<{
      id: number;
      name: string;
      position: string | null;
      results: Array<{
        finalScore: number;
        archetype: { code: string; name: string };
      }>;
    }>
  ): TeamArchetypeProfile[] {
    const archetypeCodes = Object.keys(ARCHETYPES) as ArchetypeCode[];
    const profiles: TeamArchetypeProfile[] = [];

    for (const code of archetypeCodes) {
      const scores: number[] = [];
      let dominantCount = 0;

      for (const player of playersWithProfiles) {
        const result = player.results.find((r) => r.archetype.code === code);
        if (result) {
          scores.push(result.finalScore);
          // Check if this archetype is dominant for this player
          const maxScore = Math.max(...player.results.map((r) => r.finalScore));
          if (result.finalScore === maxScore) {
            dominantCount++;
          }
        }
      }

      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      profiles.push({
        archetypeCode: code,
        archetypeName: ARCHETYPES[code].name,
        averageScore: Math.round(averageScore * 10) / 10,
        playerCount: dominantCount,
      });
    }

    return profiles.sort((a, b) => b.averageScore - a.averageScore);
  }

  function buildPlayersProfilesText(
    playersWithProfiles: Array<{
      id: number;
      name: string;
      position: string | null;
      results: Array<{
        finalScore: number;
        archetype: { code: string; name: string };
      }>;
    }>
  ): string {
    return playersWithProfiles
      .map((player) => {
        const sortedResults = [...player.results].sort((a, b) => b.finalScore - a.finalScore);
        const dominant = sortedResults[0];
        const scoresText = sortedResults.map((r) => `${r.archetype.name}: ${r.finalScore.toFixed(1)}`).join(', ');
        return `- ${player.name} (${player.position ?? 'позиция не указана'}): доминирующий архетип "${dominant?.archetype.name}", баллы: ${scoresText}`;
      })
      .join('\n');
  }

  function buildTeamAverageScoresText(teamProfile: TeamArchetypeProfile[]): string {
    return teamProfile.map((p) => `- ${p.archetypeName}: ${p.averageScore.toFixed(1)} (${p.playerCount} доминант.)`).join('\n');
  }

  function buildArchetypeDetailsText(): string {
    return (Object.keys(ARCHETYPES) as ArchetypeCode[])
      .map((code) => {
        const arch = ARCHETYPES[code];
        return `- ${arch.name} (${code}): ${arch.description}`;
      })
      .join('\n');
  }

  async function generateReport(teamId: number): Promise<TeamReportDto> {
    const { team, playersWithProfiles } = await getPlayersWithProfiles(teamId);

    if (playersWithProfiles.length < 2) {
      throw new ValidationError('Для тактического анализа нужно минимум 2 игрока с пройденным тестированием');
    }

    const teamProfile = calculateTeamProfile(playersWithProfiles);

    // Get prompt template
    const promptSetting = await prisma.settings.findUnique({
      where: { key: 'prompt_tactical_analysis' },
    });

    if (!promptSetting) {
      throw new Error('Prompt template for tactical analysis not found');
    }

    // Build prompt
    const prompt = promptSetting.value
      .replace('{{TEAM_NAME}}', team.name)
      .replace('{{PLAYERS_PROFILES}}', buildPlayersProfilesText(playersWithProfiles))
      .replace('{{TEAM_AVERAGE_SCORES}}', buildTeamAverageScoresText(teamProfile))
      .replace('{{ARCHETYPE_DETAILS}}', buildArchetypeDetailsText());

    // Call LLM with higher token limit for large JSON response (9 sections)
    const response = await complete(prompt, { maxTokens: 8192, temperature: 0.5 });

    // Parse response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse tactical analysis response: no JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]) as LLMTacticalResponse;

    // Save report to database
    const report = await prisma.teamReport.create({
      data: {
        teamId,
        teamProfile: teamProfile as unknown as object,
        recommendations: parsed.recommendations as unknown as object,
        overallAssessment: parsed.overallAssessment,
        analyzedPlayersCount: playersWithProfiles.length,
        extendedAnalysis: parsed.extendedAnalysis as unknown as object ?? null,
      },
      include: { team: true },
    });

    return {
      id: report.id,
      teamId: report.teamId,
      teamName: report.team.name,
      teamProfile,
      recommendations: parsed.recommendations,
      dominantArchetypes: parsed.dominantArchetypes,
      weakArchetypes: parsed.weakArchetypes,
      overallAssessment: parsed.overallAssessment,
      analyzedPlayersCount: report.analyzedPlayersCount,
      createdAt: report.createdAt.toISOString(),
      extendedAnalysis: parsed.extendedAnalysis,
    };
  }

  async function getReports(teamId: number): Promise<TeamReportDto[]> {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundError('Команда не найдена');
    }

    const reports = await prisma.teamReport.findMany({
      where: { teamId },
      include: { team: true },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) => {
      const recommendations = report.recommendations as unknown as TacticalStyleRecommendation[];
      const teamProfile = report.teamProfile as unknown as TeamArchetypeProfile[];
      const extendedAnalysis = report.extendedAnalysis as unknown as ExtendedTeamAnalysis | null;

      // Extract dominant/weak from recommendations or calculate
      const sortedProfile = [...teamProfile].sort((a, b) => b.averageScore - a.averageScore);
      const dominantArchetypes = sortedProfile.slice(0, 2).map((p) => p.archetypeCode);
      const weakArchetypes = sortedProfile.slice(-2).map((p) => p.archetypeCode);

      return {
        id: report.id,
        teamId: report.teamId,
        teamName: report.team.name,
        teamProfile,
        recommendations,
        dominantArchetypes,
        weakArchetypes,
        overallAssessment: report.overallAssessment,
        analyzedPlayersCount: report.analyzedPlayersCount,
        createdAt: report.createdAt.toISOString(),
        extendedAnalysis: extendedAnalysis ?? undefined,
      };
    });
  }

  async function getReport(reportId: number): Promise<TeamReportDto> {
    const report = await prisma.teamReport.findUnique({
      where: { id: reportId },
      include: { team: true },
    });

    if (!report) {
      throw new NotFoundError('Отчёт не найден');
    }

    const recommendations = report.recommendations as unknown as TacticalStyleRecommendation[];
    const teamProfile = report.teamProfile as unknown as TeamArchetypeProfile[];
    const extendedAnalysis = report.extendedAnalysis as unknown as ExtendedTeamAnalysis | null;

    const sortedProfile = [...teamProfile].sort((a, b) => b.averageScore - a.averageScore);
    const dominantArchetypes = sortedProfile.slice(0, 2).map((p) => p.archetypeCode);
    const weakArchetypes = sortedProfile.slice(-2).map((p) => p.archetypeCode);

    return {
      id: report.id,
      teamId: report.teamId,
      teamName: report.team.name,
      teamProfile,
      recommendations,
      dominantArchetypes,
      weakArchetypes,
      overallAssessment: report.overallAssessment,
      analyzedPlayersCount: report.analyzedPlayersCount,
      createdAt: report.createdAt.toISOString(),
      extendedAnalysis: extendedAnalysis ?? undefined,
    };
  }

  return {
    generateReport,
    getReports,
    getReport,
  };
}

export type TacticalAnalysisService = ReturnType<typeof createTacticalAnalysisService>;
