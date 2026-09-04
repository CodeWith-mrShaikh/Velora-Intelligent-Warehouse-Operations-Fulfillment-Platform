import { Request, Response, NextFunction } from 'express';
import { BinService } from '../services/bin.service';

export class BinController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BinService.getAll();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BinService.getById(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BinService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Bin created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BinService.update(req.params.id as string, req.body);
      res.json({ success: true, data: result, message: 'Bin updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
