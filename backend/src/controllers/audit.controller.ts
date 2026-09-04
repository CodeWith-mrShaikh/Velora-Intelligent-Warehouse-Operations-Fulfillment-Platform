import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { parsePaginationParams } from '../utils/pagination';

export class AuditController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const params = parsePaginationParams(req.query);
      const filters = {
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        userId: req.query.userId as string
      };
      const result = await AuditService.getAll({ ...params, ...filters });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
