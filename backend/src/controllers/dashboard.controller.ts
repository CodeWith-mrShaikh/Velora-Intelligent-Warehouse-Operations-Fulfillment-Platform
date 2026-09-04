import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DashboardService.getSummary();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getRowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DashboardService.getRowStock();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DashboardService.getLowStock();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getBinUtilization(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DashboardService.getBinUtilization();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
