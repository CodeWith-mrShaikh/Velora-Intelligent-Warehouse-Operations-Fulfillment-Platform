import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

export class HealthController {
  static async check(req: Request, res: Response, next: NextFunction) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  static async ready(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(503).json({ status: 'error', database: 'disconnected' });
    }
  }
}
