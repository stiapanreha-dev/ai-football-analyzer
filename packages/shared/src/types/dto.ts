import type { Language } from '../constants/languages.js';
import type { ArchetypeCode } from '../constants/archetypes.js';

// =============================================================================
// Player DTOs
// =============================================================================

export interface CreatePlayerDto {
  telegramId: bigint | number;
  name?: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  jerseyNumber?: number;
}

export interface UpdatePlayerDto {
  name?: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  jerseyNumber?: number;
}

export interface PlayerDto {
  id: number;
  telegramId: string;
  name: string | null;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | null;
  jerseyNumber: number | null;
  createdAt: string;
}

export interface PlayerWithStatsDto extends PlayerDto {
  sessionsCount: number;
  completedSessionsCount: number;
  lastSessionAt: string | null;
}

// =============================================================================
// PIN DTOs
// =============================================================================

export type PinType = 'single' | 'multi' | 'session' | 'personal';

export interface CreatePinDto {
  type: PinType;
  maxUses?: number;
  expiresInHours?: number;
  // Поля для именного PIN (type = personal)
  playerName?: string;
  playerPosition?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  playerJerseyNumber?: number;
}

export interface PinDto {
  id: number;
  code: string;
  type: PinType;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  // Поля для именного PIN
  playerName: string | null;
  playerPosition: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | null;
  playerJerseyNumber: number | null;
}

export interface ValidatePinDto {
  code: string;
  telegramId: bigint | number;
}

export interface ValidatePinResultDto {
  valid: boolean;
  playerId?: number;
  isNewPlayer?: boolean;
  error?: string;
  // Данные для автозаполнения из именного PIN
  playerData?: {
    name: string;
    position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
    jerseyNumber?: number;
  };
}

export interface PinUsageDto {
  id: number;
  playerId: number;
  playerName: string | null;
  sessionId: string | null;
  usedAt: string;
}

// =============================================================================
// Session DTOs
// =============================================================================

export interface StartSessionDto {
  playerId: number;
  language: Language;
}

export interface SessionDto {
  id: string;
  playerId: number;
  language: Language;
  status: 'created' | 'in_progress' | 'clarifying' | 'completed' | 'abandoned';
  phase:
    | 'intro'
    | 'situation'
    | 'waiting_answer'
    | 'analyzing'
    | 'clarification'
    | 'generating_report'
    | null;
  situationIndex: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SessionWithDetailsDto extends SessionDto {
  player: PlayerDto;
  situationsCount: number;
  answersCount: number;
}

export interface SituationDto {
  id: number;
  sessionId: string;
  orderNum: number;
  content: string;
  contextType: 'pressure' | 'conflict' | 'leadership' | 'tactical' | 'emotional' | 'failure';
  createdAt: string;
}

export interface SubmitAnswerDto {
  text: string;
}

export interface SubmitAnswerResultDto {
  answerId: number;
  scores: Record<ArchetypeCode, number>;
  unpresentArchetypes: ArchetypeCode[];
  isSessionComplete: boolean;
  isIrrelevant?: boolean;
  irrelevantReason?: string;
}

export interface AlternativeResponseDto {
  alternativeResponse: string;
  archetypeCode: ArchetypeCode;
  archetypeName: string;
}

export interface SubmitClarificationDto {
  archetypeCode: ArchetypeCode;
  text: string;
}

export interface SubmitClarificationResultDto {
  answerId: number;
  scores: Record<ArchetypeCode, number>;
}

// =============================================================================
// Report DTOs
// =============================================================================

export interface ArchetypeScoreDto {
  archetypeCode: ArchetypeCode;
  archetypeName: string;
  finalScore: number;
  strength: 'dominant' | 'moderate' | 'weak' | 'absent';
}

export interface SessionResultDto {
  sessionId: string;
  playerId: number;
  playerName: string | null;
  completedAt: string;
  scores: ArchetypeScoreDto[];
  playerSummary: string;
}

export interface CoachReportDto {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bestSituations: string[];
  riskSituations: string[];
  compatibility: {
    worksWith: string[];
    conflictsWith: string[];
  };
  recommendations: string[];
}

export interface ReportDto {
  id: number;
  sessionId: string;
  playerSummary: string;
  coachReport: CoachReportDto;
  createdAt: string;
}

export interface ReportWithPlayerDto extends ReportDto {
  player: PlayerDto;
  scores: ArchetypeScoreDto[];
}

// =============================================================================
// Dashboard DTOs
// =============================================================================

export interface DashboardStatsDto {
  totalPlayers: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  todaySessions: number;
  activePins: number;
}

export interface RecentActivityDto {
  type: 'session_completed' | 'session_started' | 'player_registered' | 'pin_created';
  description: string;
  timestamp: string;
  entityId: string | number;
}

// =============================================================================
// Prompt DTOs
// =============================================================================

export const PROMPT_KEYS = [
  'prompt_situation',
  'prompt_analysis',
  'prompt_clarification',
  'prompt_player_report',
  'prompt_coach_report',
] as const;

export type PromptKey = (typeof PROMPT_KEYS)[number];

export const PROMPT_LABELS: Record<PromptKey, string> = {
  prompt_situation: 'Генерация ситуаций',
  prompt_analysis: 'Анализ ответов',
  prompt_clarification: 'Уточняющие вопросы',
  prompt_player_report: 'Отчёт игроку',
  prompt_coach_report: 'Отчёт тренеру',
};

export const PROMPT_PLACEHOLDERS: Record<PromptKey, string[]> = {
  prompt_situation: [
    '{{ARCHETYPE_DESCRIPTIONS}}',
    '{{CONTEXT_TYPE}}',
    '{{PLAYER_POSITION}}',
    '{{PREVIOUS_SITUATIONS}}',
    '{{PENDING_ARCHETYPES}}',
    '{{LANGUAGE_INSTRUCTION}}',
  ],
  prompt_analysis: ['{{ARCHETYPE_DETAILS}}', '{{SITUATION}}', '{{ANSWER}}'],
  prompt_clarification: [
    '{{ARCHETYPE_NAME}}',
    '{{ARCHETYPE_DESCRIPTION}}',
    '{{ARCHETYPE_BEHAVIOR}}',
    '{{SITUATION}}',
    '{{ANSWER}}',
    '{{LANGUAGE_INSTRUCTION}}',
  ],
  prompt_player_report: ['{{PLAYER_INFO}}', '{{SCORES}}', '{{ARCHETYPE_DETAILS}}', '{{LANGUAGE_INSTRUCTION}}'],
  prompt_coach_report: ['{{PLAYER_INFO}}', '{{POSITION_INFO}}', '{{SCORES}}', '{{ARCHETYPE_DETAILS}}'],
};

export interface PromptDto {
  key: PromptKey;
  value: string;
  updatedAt: string;
}

export interface UpdatePromptDto {
  value: string;
}

export interface TestPromptResultDto {
  result: string;
  tokensUsed?: number;
}
