import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { parsePaginationParams } from '../utils/pagination';

export class InventoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const params = parsePaginationParams(req.query);
      const result = await InventoryService.getAll(params);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const result = await InventoryService.search(query || '');
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async inward(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.inward(req.body, req.user!.userId);
      res.json({ success: true, data: result, message: 'Stock inwarded successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async outward(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.outward(req.body, req.user!.userId);
      res.json({ success: true, data: result, message: 'Stock outwarded successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.transfer(req.body, req.user!.userId);
      res.json({ success: true, data: result, message: 'Stock transferred successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async adjust(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.adjust(req.body, req.user!.userId);
      res.json({ success: true, data: result, message: 'Stock adjusted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
