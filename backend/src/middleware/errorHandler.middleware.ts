import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { config } from '../config';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  } else if (err.code === 'P2002') {
    // Prisma unique constraint
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  } else if (err.code === 'P2025') {
    // Prisma not found
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found in database';
  }

  logger.error(err.message, {
    requestId: (req as any).requestId,
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const response: any = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (config.nodeEnv !== 'production' && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
