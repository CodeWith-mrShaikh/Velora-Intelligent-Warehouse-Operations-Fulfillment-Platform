import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('User does not have required permissions'));
    }

    next();
  };
};

export const requireRole = authorize;
