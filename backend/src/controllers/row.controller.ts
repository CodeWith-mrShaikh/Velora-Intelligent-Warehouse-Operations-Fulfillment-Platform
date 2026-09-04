import { Request, Response, NextFunction } from 'express';
import { RowService } from '../services/row.service';

export class RowController {
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RowService.getById(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RowService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Row created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RowService.update(req.params.id as string, req.body);
      res.json({ success: true, data: result, message: 'Row updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getBins(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RowService.getBinsByRowId(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
