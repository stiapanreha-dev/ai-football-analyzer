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

// =============================================================================
// Extended Team Analysis Sections (from TZ)
// =============================================================================

/** 1. Дефициты архетипов */
export interface ArchetypeDeficit {
  archetypeCode: ArchetypeCode;
  archetypeName: string;
  averageScore: number;
  gameRisks: string[];           // Игровые риски
  psychologicalRisks: string[];  // Психологические риски
  tacticalRisks: string[];       // Тактические риски
  criticalPhases: string[];      // Фазы игры, где дефицит критичен
  isCritical: boolean;           // Критичный дефицит или допустимый
}

export interface ArchetypeDeficitsSection {
  deficits: ArchetypeDeficit[];
  missingPlayerTypes: string[];  // Каких типов игроков не хватает
  transferHypotheses: string[];  // Трансферные гипотезы
}

/** 2. Потенциал развития архетипов */
export interface ArchetypeDevelopmentPotential {
  archetypeCode: ArchetypeCode;
  archetypeName: string;
  isDevelopable: boolean;        // Развиваемый или врождённый
  developmentMethods: string[];  // Как развивать
  limitations: string[];         // Ограничения и риски
}

export interface DevelopmentPotentialSection {
  archetypes: ArchetypeDevelopmentPotential[];
  developRecommendations: string[];   // Какие развивать
  compensateRecommendations: string[]; // Какие компенсировать трансферами
}

/** 3. Тактические уязвимости */
export interface TacticalVulnerability {
  imbalance: string;              // Описание перекоса
  dangerousOpponents: string[];   // Против каких соперников опасно
  riskScenarios: string[];        // Игровые сценарии риска
  compensation: string[];         // Как компенсировать тактически
}

export interface TacticalVulnerabilitiesSection {
  vulnerabilities: TacticalVulnerability[];
  dangerousMatchups: string[];    // Опасные матч-апы
}

/** 4. Распределение по ролям и линиям */
export interface LineArchetypeDistribution {
  line: 'defense' | 'midfield' | 'attack';
  lineName: string;
  dominantArchetypes: string[];   // Доминирующие архетипы в линии
  gaps: string[];                 // Архетипические вакуумы
  overloads: string[];            // Перегрузки
}

export interface ArchetypeCombination {
  archetypes: string[];
  effect: 'synergy' | 'conflict';
  description: string;
}

export interface RoleDistributionSection {
  lineDistribution: LineArchetypeDistribution[];
  combinations: ArchetypeCombination[];
  roleRecommendations: string[];  // Рекомендации по перераспределению ролей
}

/** 5. Стратегия замен */
export interface SubstitutionScenario {
  scenario: 'hold_lead' | 'increase_pressure' | 'break_low_block' | 'stabilize_after_goal';
  scenarioName: string;
  neededArchetypes: string[];     // Какие архетипы нужны
  optimalTiming: string;          // Оптимальное время для замены
  playerRecommendations: string[]; // Какие игроки подходят
}

export interface SubstitutionStrategySection {
  scenarios: SubstitutionScenario[];
  generalRecommendations: string[];
}

/** 6. Тренировочный процесс */
export interface ArchetypeTrainingProfile {
  archetypeCode: ArchetypeCode;
  archetypeName: string;
  effectiveExercises: string[];   // Какие упражнения усиливают
  frustratingFormats: string[];   // Какие форматы фрустрируют
}

export interface TrainingProcessSection {
  archetypeProfiles: ArchetypeTrainingProfile[];
  balanceRecommendations: string[]; // Баланс структуры и свободы
  underdevelopedArchetypeExercises: string[]; // Упражнения для недопредставленных
}

/** 7. Дополнительные данные */
export interface AdditionalDataSection {
  behavioralMetrics: string[];    // Поведенческие параметры
  contextualMetrics: string[];    // Контекстуальные параметры
  psychologicalMetrics: string[]; // Психологические параметры
  dynamicTrackingMetrics: string[]; // Для отслеживания динамики
  keyGameEvents: string[];        // Показательные игровые события
  minimalMetricsSet: string[];    // Минимальный набор
  extendedMetricsSet: string[];   // Расширенный набор
}

/** 8. Трансферная стратегия */
export interface TransferTarget {
  position: string;
  neededArchetypes: string[];
  idealCombination: string;
  risks: string[];                // Риски конфликтующих профилей
}

export interface TransferStrategySection {
  priorityArchetypes: string[];   // Какие архетипы усилить
  transferTargets: TransferTarget[];
  foreignPlayerRequirements: string[]; // Требования к легионерам
}

/** 9. Совместимость с тренером */
export interface CoachTypeCompatibility {
  coachType: string;
  compatibility: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface CoachCompatibilitySection {
  idealCoachType: string;
  conflictingCoachTypes: string[];
  coachChangeRisks: string[];
  coachTypes: CoachTypeCompatibility[];
}

/** Extended Team Analysis - all 9 sections combined */
export interface ExtendedTeamAnalysis {
  deficits: ArchetypeDeficitsSection;
  developmentPotential: DevelopmentPotentialSection;
  tacticalVulnerabilities: TacticalVulnerabilitiesSection;
  roleDistribution: RoleDistributionSection;
  substitutionStrategy: SubstitutionStrategySection;
  trainingProcess: TrainingProcessSection;
  additionalData: AdditionalDataSection;
  transferStrategy: TransferStrategySection;
  coachCompatibility: CoachCompatibilitySection;
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
  // Extended analysis sections (from TZ)
  extendedAnalysis?: ExtendedTeamAnalysis;
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

// =============================================================================
// Test Wave DTOs
// =============================================================================

export type TestWaveStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface CreateTestWaveDto {
  name?: string;
}

export interface TestWaveDto {
  id: number;
  teamId: number;
  name: string | null;
  status: TestWaveStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  participantsCount: number;
  completedCount: number;
  teamReportId: number | null;
}

export interface WaveParticipationDto {
  playerId: number;
  playerName: string | null;
  notified: boolean;
  notifiedAt: string | null;
  completed: boolean;
  completedAt: string | null;
  sessionId: string | null;
}

export interface TestWaveDetailDto extends TestWaveDto {
  participations: WaveParticipationDto[];
}

// =============================================================================
// Dynamics DTOs
// =============================================================================

export interface ArchetypeChangeDto {
  archetypeCode: ArchetypeCode;
  archetypeName: string;
  previousScore: number | null;
  currentScore: number;
  delta: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
}

export interface PlayerDynamicsDto {
  playerId: number;
  playerName: string | null;
  currentSession: {
    id: string;
    date: string;
  };
  previousSession: {
    id: string;
    date: string;
  } | null;
  changes: ArchetypeChangeDto[];
}

export interface TeamDynamicsDto {
  teamId: number;
  teamName: string;
  currentWave: {
    id: number;
    date: string;
  };
  previousWave: {
    id: number;
    date: string;
  } | null;
  profileChanges: ArchetypeChangeDto[];
  playerChanges: PlayerDynamicsDto[];
}

// =============================================================================
// Push Notification DTOs (for Redis Pub/Sub)
// =============================================================================

export interface WaveNotificationPayload {
  type: 'wave_start';
  waveId: number;
  teamId: number;
  teamName: string;
  participants: Array<{
    playerId: number;
    telegramId: string;
    language: Language;
  }>;
}

// =============================================================================
// Admin DTOs
// =============================================================================

export interface AdminDto {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface CreateAdminDto {
  telegramId: bigint | number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface UpdateAdminDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive?: boolean;
}

export interface TelegramAuthDto {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramLoginResultDto {
  token: string;
  admin: AdminDto;
}
