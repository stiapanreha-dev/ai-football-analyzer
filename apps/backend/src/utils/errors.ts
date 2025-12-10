import type { ApiErrorCode } from '@archetypes/shared';

/**
 * Базовый класс ошибки приложения
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ApiErrorCode, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 400 Bad Request - Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * PIN specific errors
 */
export class PinInvalidError extends AppError {
  constructor() {
    super('Invalid PIN code', 400, 'PIN_INVALID');
  }
}

export class PinExpiredError extends AppError {
  constructor() {
    super('PIN code has expired', 400, 'PIN_EXPIRED');
  }
}

export class PinExhaustedError extends AppError {
  constructor() {
    super('PIN code usage limit reached', 400, 'PIN_EXHAUSTED');
  }
}

export class PinInactiveError extends AppError {
  constructor() {
    super('PIN code is inactive', 400, 'PIN_INACTIVE');
  }
}

/**
 * Session specific errors
 */
export class SessionNotFoundError extends AppError {
  constructor(id: string) {
    super(`Session ${id} not found`, 404, 'SESSION_NOT_FOUND');
  }
}

export class SessionAlreadyCompletedError extends AppError {
  constructor(id: string) {
    super(`Session ${id} is already completed`, 400, 'SESSION_ALREADY_COMPLETED');
  }
}

export class SessionInvalidStateError extends AppError {
  constructor(id: string, expectedState: string, actualState: string) {
    super(
      `Session ${id} is in invalid state. Expected: ${expectedState}, Actual: ${actualState}`,
      400,
      'SESSION_INVALID_STATE'
    );
  }
}

/**
 * External service errors
 */
export class STTError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, 'STT_ERROR', details);
  }
}

export class LLMError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, 'LLM_ERROR', details);
  }
}
