import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { parsePaginationParams } from '../utils/pagination';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const params = parsePaginationParams(req.query);
      const result = await ProductService.getAll(params);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getById(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Product created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.update(req.params.id as string, req.body);
      res.json({ success: true, data: result, message: 'Product updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.delete(req.params.id as string);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
