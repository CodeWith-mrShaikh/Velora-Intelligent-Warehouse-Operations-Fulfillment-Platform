import prisma from '../utils/db';
import { NotFoundError } from '../utils/errors';

export class RowService {
  static async getById(id: string) {
    const row = await prisma.warehouseRow.findUnique({
      where: { id },
      include: {
        warehouse: true,
        bins: true
      }
    });

    if (!row) {
      throw new NotFoundError('Row not found');
    }

    return row;
  }

  static async create(data: { warehouseId: string; code: string; name?: string; description?: string }) {
    return prisma.warehouseRow.create({
      data: {
        warehouseId: data.warehouseId,
        code: data.code,
        name: data.name || `Row ${data.code}`,
        description: data.description
      }
    });
  }

  static async update(id: string, data: Partial<{ code: string; name: string; description: string }>) {
    await this.getById(id);
    return prisma.warehouseRow.update({
      where: { id },
      data
    });
  }

  static async getBinsByRowId(rowId: string) {
    await this.getById(rowId);
    const bins = await prisma.bin.findMany({
      where: { rowId },
      include: {
        inventories: true
      }
    });

    return bins.map(bin => {
      const currentQuantity = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      return {
        ...bin,
        currentQuantity
      };
    });
  }
}
