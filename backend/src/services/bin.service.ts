import prisma from '../utils/db';
import { NotFoundError } from '../utils/errors';

export class BinService {
  static async getAll() {
    const bins = await prisma.bin.findMany({
      where: { status: 'ACTIVE' },
      include: {
        inventories: true,
        row: {
          include: {
            warehouse: true
          }
        }
      },
      orderBy: { locationCode: 'asc' }
    });

    return bins.map(bin => {
      const currentQuantity = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      return {
        ...bin,
        currentQuantity,
        availableCapacity: Math.max(0, bin.capacity - currentQuantity)
      };
    });
  }

  static async getById(id: string) {
    const bin = await prisma.bin.findUnique({
      where: { id },
      include: {
        row: {
          include: {
            warehouse: true
          }
        },
        inventories: {
          include: {
            product: true
          }
        }
      }
    });

    if (!bin) {
      throw new NotFoundError('Bin not found');
    }

    const currentQuantity = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);

    return {
      ...bin,
      currentQuantity
    };
  }

  static async create(data: { rowId: string; code: string; capacity: number }) {
    const row = await prisma.warehouseRow.findUnique({
      where: { id: data.rowId },
      include: { warehouse: true }
    });

    if (!row) {
      throw new NotFoundError('Row not found');
    }

    const whCode = row.warehouse.code;
    const locationCode = `${whCode}-${row.code}-${data.code}`;

    return prisma.bin.create({
      data: {
        rowId: data.rowId,
        code: data.code,
        capacity: data.capacity,
        locationCode
      }
    });
  }

  static async update(id: string, data: Partial<{ code: string; capacity: number; status: any }>) {
    await this.getById(id);
    return prisma.bin.update({
      where: { id },
      data
    });
  }

  static async getUtilization() {
    const bins = await prisma.bin.findMany({
      include: {
        inventories: true
      }
    });

    return bins.map(bin => {
      const currentQuantity = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      const utilizationPercent = (currentQuantity / bin.capacity) * 100;
      return {
        ...bin,
        currentQuantity,
        utilizationPercent: Math.min(utilizationPercent, 100)
      };
    });
  }
}
