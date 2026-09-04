import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { parsePaginationParams } from '../utils/pagination';

export class OrderController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const params = parsePaginationParams(req.query);
      const status = req.query.status as string | undefined;
      const result = await OrderService.getAll({ ...params, status });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.getById(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.create(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result, message: 'Order created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async allocate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.allocate(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: result, message: 'Order allocated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async reserve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.reserve(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: result, message: 'Order stock reserved successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async release(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.release(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: result, message: 'Order reservation released successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async pick(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.pick(req.params.id as string, req.body.items, req.user!.userId);
      res.json({ success: true, data: result, message: 'Order picking recorded successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.complete(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: result, message: 'Order completed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.cancel(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: result, message: 'Order cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
}
