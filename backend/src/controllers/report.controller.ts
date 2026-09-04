import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { streamCsvResponse } from '../utils/csv';

export class ReportController {
  static async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await ReportService.generateInventoryReport();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-report.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await ReportService.generateLowStockReport();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="low-stock-report.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await ReportService.generateMovementReport(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="movements-report.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await ReportService.generateOrderReport(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders-report.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async getBinUtilization(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await ReportService.generateBinUtilizationReport();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bin-utilization-report.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}
