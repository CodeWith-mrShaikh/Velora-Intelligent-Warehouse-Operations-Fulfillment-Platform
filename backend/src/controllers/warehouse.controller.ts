import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from '../services/warehouse.service';

export class WarehouseController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WarehouseService.getAll();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WarehouseService.getById(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WarehouseService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Warehouse created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WarehouseService.update(req.params.id as string, req.body);
      res.json({ success: true, data: result, message: 'Warehouse updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getRows(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WarehouseService.getRowsByWarehouseId(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
