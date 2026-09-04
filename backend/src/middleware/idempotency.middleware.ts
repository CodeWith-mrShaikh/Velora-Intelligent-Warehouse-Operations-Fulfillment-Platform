import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { IdempotencyError } from '../utils/errors';

const prisma = new PrismaClient();

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  
  if (!idempotencyKey) {
    return next();
  }

  try {
    const existingReq = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });

    if (existingReq) {
      if (existingReq.expiresAt < new Date()) {
        return next(new IdempotencyError('Idempotency key has expired'));
      }
      return res.status(200).json(existingReq.response ? JSON.parse(existingReq.response) : {});
    }

    // Intercept res.json to save the response
    const originalJson = res.json;
    res.json = function(body: any) {
      // Fire and forget
      prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          response: typeof body === 'string' ? body : JSON.stringify(body),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      }).catch(console.error);

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
