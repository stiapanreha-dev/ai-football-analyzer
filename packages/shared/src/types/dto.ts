import type { Language } from '../constants/languages.js';
import type { ArchetypeCode } from '../constants/archetypes.js';

// =============================================================================
// Player DTOs
// =============================================================================

export interface CreatePlayerDto {
  telegramId: bigint | number;
  name?: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';
  jerseyNumber?: number;
}

export interface UpdatePlayerDto {
  name?: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';
  jerseyNumber?: number;
}

export interface PlayerDto {
  id: number;
  telegramId: string;
  name: string | null;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff' | null;
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
  playerPosition?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';
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
  playerPosition: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff' | null;
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
    position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';
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
  remainingArchetypes: ArchetypeCode[]; // Оставшиеся непроявленные архетипы после фильтрации
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

export interface RecommendedPosition {
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';
  suitability: number; // Процент подходящести 0-100
  reasoning: string; // Почему подходит эта позиция
}

export interface CoachReportDto {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bestSituations: string[];
  riskSituations: string[];
  compatibility: Record<ArchetypeCode, number>; // Процент совместимости 0-100 для каждого архетипа
  recommendedPositions: RecommendedPosition[]; // Рекомендуемые позиции с обоснованием
  recommendations: string[];
  psychologicalPlan: string[]; // План работы для психологической службы
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
// Team DTOs
// =============================================================================

export interface CreateTeamDto {
  name: string;
  description?: string;
  playerIds?: number[];
}

export interface UpdateTeamDto {
  name?: string;
  description?: string | null;
}

export interface TeamPlayerDto {
  id: number;
  name: string | null;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff' | null;
  jerseyNumber: number | null;
  hasReport: boolean;              // Есть ли готовый отчёт
  dominantArchetype?: ArchetypeCode;
}

export interface TeamDto {
  id: number;
  name: string;
  description: string | null;
  playersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamWithPlayersDto extends TeamDto {
  players: TeamPlayerDto[];
}

// =============================================================================
// Tactical Analysis DTOs
// =============================================================================

export type TacticalStyle =
  | 'high_press'      // Агрессивно-прессинговый
  | 'reactive'        // Агрессивно-оборонительный
  | 'positional'      // Позиционный
  | 'direct'          // Вертикальный
  | 'adaptive';       // Гибридный

export const TACTICAL_STYLE_NAMES: Record<TacticalStyle, string> = {
  high_press: 'Агрессивно-прессинговый',
  reactive: 'Агрессивно-оборонительный',
  positional: 'Позиционный',
  direct: 'Вертикальный',
  adaptive: 'Гибридный / Адаптивный',
};

export interface TacticalStyleRecommendation {
  style: TacticalStyle;
  styleName: string;              // Название на русском
  suitability: number;            // Процент совместимости 0-100
  reasoning: string;              // Почему подходит
  pros: string[];                 // Плюсы для этой команды
  cons: string[];                 // Минусы/риски
  keyPlayers: string[];           // Ключевые игроки для этого стиля
}

export interface TeamArchetypeProfile {
  archetypeCode: ArchetypeCode;
  archetypeName: string;
  averageScore: number;           // Средний балл по команде
  playerCount: number;            // Кол-во игроков с этим архетипом как доминирующим
}

export interface TeamReportDto {
  id: number;
  teamId: number;
  teamName: string;
  teamProfile: TeamArchetypeProfile[];
  recommendations: TacticalStyleRecommendation[];
  dominantArchetypes: ArchetypeCode[];
  weakArchetypes: ArchetypeCode[];
  overallAssessment: string;
  analyzedPlayersCount: number;
  createdAt: string;
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
  'prompt_alternative_response',
  'prompt_player_report',
  'prompt_coach_report',
  'prompt_tactical_analysis',
] as const;

export type PromptKey = (typeof PROMPT_KEYS)[number];

export const PROMPT_LABELS: Record<PromptKey, string> = {
  prompt_situation: 'Генерация ситуаций',
  prompt_analysis: 'Анализ ответов',
  prompt_clarification: 'Уточняющие вопросы',
  prompt_alternative_response: 'Альтернативные ответы',
  prompt_player_report: 'Отчёт игроку',
  prompt_coach_report: 'Отчёт тренеру',
  prompt_tactical_analysis: 'Тактический анализ команды',
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
  prompt_alternative_response: [
    '{{ARCHETYPE_NAME}}',
    '{{ARCHETYPE_DESCRIPTION}}',
    '{{ARCHETYPE_BEHAVIOR}}',
    '{{SITUATION}}',
    '{{PLAYER_POSITION}}',
    '{{LANGUAGE_INSTRUCTION}}',
  ],
  prompt_player_report: ['{{PLAYER_INFO}}', '{{SCORES}}', '{{ARCHETYPE_DETAILS}}', '{{LANGUAGE_INSTRUCTION}}'],
  prompt_coach_report: ['{{PLAYER_INFO}}', '{{POSITION_INFO}}', '{{SCORES}}', '{{ARCHETYPE_DETAILS}}'],
  prompt_tactical_analysis: [
    '{{TEAM_NAME}}',
    '{{PLAYERS_PROFILES}}',
    '{{TEAM_AVERAGE_SCORES}}',
    '{{ARCHETYPE_DETAILS}}',
  ],
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
