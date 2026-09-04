import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';
import { AuthService } from '../services/auth.service';
import { NotFoundError } from '../utils/errors';

export class UserController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
      });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id as string },
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
      });
      if (!user) throw new NotFoundError('User not found');
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, name, email, role, status } = req.body;
      const passwordHash = await AuthService.hashPassword(password || 'password123');
      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: role || 'STAFF', status: status || 'ACTIVE' }
      });
      res.status(201).json({ success: true, message: 'User created successfully', data: { id: user.id } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, ...rest } = req.body;
      const data: any = { ...rest };
      if (password) {
        data.passwordHash = await AuthService.hashPassword(password);
      }
      await prisma.user.update({
        where: { id: req.params.id as string },
        data
      });
      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
