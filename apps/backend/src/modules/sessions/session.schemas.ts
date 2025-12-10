import {
  startSessionSchema,
  getSessionParamsSchema,
  getSessionsQuerySchema,
  submitAnswerSchema,
  submitClarificationSchema,
} from '@archetypes/shared';

export {
  startSessionSchema,
  getSessionParamsSchema,
  getSessionsQuerySchema,
  submitAnswerSchema,
  submitClarificationSchema,
};

export type StartSessionInput = typeof startSessionSchema._type;
export type GetSessionParams = typeof getSessionParamsSchema._type;
export type GetSessionsQuery = typeof getSessionsQuerySchema._type;
export type SubmitAnswerInput = typeof submitAnswerSchema._type;
export type SubmitClarificationInput = typeof submitClarificationSchema._type;
