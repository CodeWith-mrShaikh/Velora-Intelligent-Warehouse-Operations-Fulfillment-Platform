import { Request, Response, NextFunction } from 'express';
import { MovementService } from '../services/movement.service';
import { parsePaginationParams } from '../utils/pagination';

export class MovementController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const params = parsePaginationParams(req.query);
      const filters = {
        movementType: req.query.type as string, // map query 'type' to 'movementType'
        productId: req.query.productId as string,
        performedBy: req.query.userId as string, // map query 'userId' to 'performedBy'
        binId: req.query.binId as string
      };
      const result = await MovementService.getAll({ ...params, ...filters });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
