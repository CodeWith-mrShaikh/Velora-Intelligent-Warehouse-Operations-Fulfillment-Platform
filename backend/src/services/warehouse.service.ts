import prisma from '../utils/db';
import { NotFoundError } from '../utils/errors';

export class WarehouseService {
  static async getAll() {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        rows: {
          include: {
            bins: {
              select: { capacity: true }
            }
          }
        },
        _count: {
          select: { rows: true }
        }
      }
    });

    return warehouses.map(wh => {
      const capacity = wh.rows.reduce((sum, row) => 
        sum + row.bins.reduce((bSum, b) => bSum + b.capacity, 0), 0);
      return {
        ...wh,
        location: wh.address,
        capacity,
        rowsCount: wh._count.rows
      };
    });
  }

  static async getById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        rows: {
          include: {
            bins: {
              select: { capacity: true }
            }
          }
        }
      }
    });

    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    const capacity = warehouse.rows.reduce((sum, row) => 
      sum + row.bins.reduce((bSum, b) => bSum + b.capacity, 0), 0);

    return {
      ...warehouse,
      location: warehouse.address,
      capacity
    };
  }

  static async create(data: { code: string; name: string; address?: string; location?: string }) {
    return prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address || data.location
      }
    });
  }

  static async update(id: string, data: Partial<{ code: string; name: string; address: string; location: string }>) {
    await this.getById(id);
    return prisma.warehouse.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        address: data.address || data.location
      }
    });
  }

  static async getRowsByWarehouseId(warehouseId: string) {
    await this.getById(warehouseId);
    return prisma.warehouseRow.findMany({
      where: { warehouseId },
      include: {
        _count: {
          select: { bins: true }
        }
      }
    });
  }
}
