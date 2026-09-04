export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class InsufficientStockError extends AppError {
  public productId: string;
  public requested: number;
  public available: number;

  constructor(productId: string, requested: number, available: number, message: string = 'Insufficient stock') {
    super(message, 409, 'INSUFFICIENT_STOCK');
    this.productId = productId;
    this.requested = requested;
    this.available = available;
  }
}

export class InsufficientCapacityError extends AppError {
  constructor(message: string = 'Insufficient bin capacity') {
    super(message, 409, 'INSUFFICIENT_CAPACITY');
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message: string = 'Invalid state transition') {
    super(message, 400, 'INVALID_STATE_TRANSITION');
  }
}

export class DuplicateError extends AppError {
  constructor(message: string = 'Duplicate resource') {
    super(message, 409, 'DUPLICATE_RESOURCE');
  }
}

export class ConcurrencyError extends AppError {
  constructor(message: string = 'Concurrency conflict detected') {
    super(message, 409, 'CONCURRENCY_ERROR');
  }
}

export class IdempotencyError extends AppError {
  constructor(message: string = 'Idempotency conflict') {
    super(message, 409, 'IDEMPOTENCY_ERROR');
  }
}
