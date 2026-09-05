import prisma from '../utils/db';
import { PaginationParams, buildPaginatedResponse, getPrismaSkip } from '../utils/pagination';
import { InsufficientStockError, InsufficientCapacityError, NotFoundError, InvalidStateTransitionError } from '../utils/errors';
import { MovementType } from '../types';
import { AuditService } from './audit.service';

export class InventoryService {
  static async getAll(params: PaginationParams) {
    const skip = getPrismaSkip(params.page, params.limit);
    
    let where = {} as any;
    if (params.search) {
      where = {
        OR: [
          { product: { name: { contains: params.search } } },
          { product: { sku: { contains: params.search } } },
          { bin: { locationCode: { contains: params.search } } }
        ]
      };
    }

    const [total, rawInventory] = await prisma.$transaction([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: params.sort ? { [params.sort]: params.order } : { updatedAt: 'desc' },
        include: {
          product: true,
          bin: {
            include: {
              row: {
                include: {
                  warehouse: true
                }
              }
            }
          }
        }
      })
    ]);

    const inventory = rawInventory.map((item: any) => ({
      ...item,
      quantity: item.onHandQuantity,
      reserved: item.reservedQuantity,
      available: item.onHandQuantity - item.reservedQuantity,
      availableQuantity: item.onHandQuantity - item.reservedQuantity
    }));

    return buildPaginatedResponse(inventory, total, params);
  }

  static async search(query: string) {
    const raw = await prisma.inventory.findMany({
      where: {
        OR: [
          { product: { name: { contains: query } } },
          { product: { sku: { contains: query } } },
          { bin: { locationCode: { contains: query } } }
        ]
      },
      include: {
        product: true,
        bin: {
          include: {
            row: {
              include: {
                warehouse: true
              }
            }
          }
        }
      }
    });

    return raw.map((item: any) => ({
      ...item,
      quantity: item.onHandQuantity,
      reserved: item.reservedQuantity,
      available: item.onHandQuantity - item.reservedQuantity,
      availableQuantity: item.onHandQuantity - item.reservedQuantity
    }));
  }

  static async getByProductId(productId: string) {
    return prisma.inventory.findMany({
      where: { productId },
      include: {
        bin: {
          include: {
            row: {
              include: { warehouse: true }
            }
          }
        }
      }
    });
  }

  static async inward(data: { productId: string; binId: string; quantity: number; reason?: string }, userId: string) {
    return prisma.$transaction(async (tx) => {
      const bin = await tx.bin.findUnique({ where: { id: data.binId }, include: { inventories: true } });
      if (!bin || bin.status !== 'ACTIVE') throw new NotFoundError('Bin not found or inactive');

      const product = await tx.product.findUnique({ where: { id: data.productId } });
      if (!product) throw new NotFoundError('Product not found');

      const currentBinQty = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      const availableSpace = Math.max(0, bin.capacity - currentBinQty);
      if (currentBinQty + data.quantity > bin.capacity) {
        throw new InsufficientCapacityError(
          `Bin capacity exceeded. Available space: ${availableSpace} units, requested: ${data.quantity} units (Bin capacity: ${bin.capacity})`
        );
      }

      const inventory = await tx.inventory.upsert({
        where: { productId_binId: { productId: data.productId, binId: data.binId } },
        create: {
          productId: data.productId,
          binId: data.binId,
          onHandQuantity: data.quantity
        },
        update: {
          onHandQuantity: { increment: data.quantity },
          version: { increment: 1 }
        }
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          destinationBinId: data.binId,
          movementType: MovementType.INWARD,
          quantity: data.quantity,
          performedBy: userId,
          reason: data.reason
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'INWARD',
          entityType: 'INVENTORY',
          entityId: inventory.id,
          userId,
          afterData: JSON.stringify({ quantityAdded: data.quantity, newOnHand: inventory.onHandQuantity })
        }
      });

      return inventory;
    });
  }

  static async outward(data: { productId: string; binId: string; quantity: number; reason?: string }, userId: string) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { productId_binId: { productId: data.productId, binId: data.binId } }
      });

      if (!inventory) throw new NotFoundError('Inventory record not found');
      
      const available = inventory.onHandQuantity - inventory.reservedQuantity;
      if (available < data.quantity) {
        throw new InsufficientStockError(data.productId, data.quantity, available);
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          onHandQuantity: { decrement: data.quantity },
          version: { increment: 1 }
        }
      });

      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          sourceBinId: data.binId,
          movementType: MovementType.OUTWARD,
          quantity: data.quantity,
          performedBy: userId,
          reason: data.reason
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'OUTWARD',
          entityType: 'INVENTORY',
          entityId: inventory.id,
          userId,
          beforeData: JSON.stringify({ oldOnHand: inventory.onHandQuantity }),
          afterData: JSON.stringify({ quantityRemoved: data.quantity, newOnHand: updatedInventory.onHandQuantity })
        }
      });

      return updatedInventory;
    });
  }

  static async transfer(data: { productId: string; sourceBinId: string; destinationBinId: string; quantity: number; reason?: string }, userId: string) {
    return prisma.$transaction(async (tx) => {
      const sourceInv = await tx.inventory.findUnique({
        where: { productId_binId: { productId: data.productId, binId: data.sourceBinId } }
      });

      if (!sourceInv) throw new NotFoundError('Source inventory not found');
      
      const available = sourceInv.onHandQuantity - sourceInv.reservedQuantity;
      if (available < data.quantity) {
        throw new InsufficientStockError(data.productId, data.quantity, available);
      }

      const destBin = await tx.bin.findUnique({ where: { id: data.destinationBinId }, include: { inventories: true } });
      if (!destBin || destBin.status !== 'ACTIVE') throw new NotFoundError('Destination bin not found or inactive');

      const currentDestQty = destBin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      const availableSpace = Math.max(0, destBin.capacity - currentDestQty);
      if (currentDestQty + data.quantity > destBin.capacity) {
        throw new InsufficientCapacityError(
          `Destination bin capacity exceeded. Available space: ${availableSpace} units, requested: ${data.quantity} units (Bin capacity: ${destBin.capacity})`
        );
      }

      await tx.inventory.update({
        where: { id: sourceInv.id },
        data: { onHandQuantity: { decrement: data.quantity }, version: { increment: 1 } }
      });

      const destInv = await tx.inventory.upsert({
        where: { productId_binId: { productId: data.productId, binId: data.destinationBinId } },
        create: {
          productId: data.productId,
          binId: data.destinationBinId,
          onHandQuantity: data.quantity
        },
        update: {
          onHandQuantity: { increment: data.quantity },
          version: { increment: 1 }
        }
      });

      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          sourceBinId: data.sourceBinId,
          destinationBinId: data.destinationBinId,
          movementType: MovementType.TRANSFER,
          quantity: data.quantity,
          performedBy: userId,
          reason: data.reason
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'TRANSFER',
          entityType: 'INVENTORY',
          entityId: sourceInv.id, // using source as entity ref
          userId,
          afterData: JSON.stringify({ quantity: data.quantity, source: data.sourceBinId, dest: data.destinationBinId })
        }
      });

      return destInv;
    });
  }

  static async adjust(data: { productId: string; binId: string; quantity: number; reason: string }, userId: string) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { productId_binId: { productId: data.productId, binId: data.binId } }
      });

      if (!inventory) throw new NotFoundError('Inventory not found');

      if (data.quantity < 0) {
        const available = inventory.onHandQuantity - inventory.reservedQuantity;
        if (available < Math.abs(data.quantity)) {
          throw new InsufficientStockError(data.productId, Math.abs(data.quantity), available);
        }
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          onHandQuantity: { increment: data.quantity },
          version: { increment: 1 }
        }
      });

      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          sourceBinId: data.quantity < 0 ? data.binId : null,
          destinationBinId: data.quantity > 0 ? data.binId : null,
          movementType: MovementType.ADJUSTMENT,
          quantity: Math.abs(data.quantity),
          performedBy: userId,
          reason: data.reason
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'ADJUSTMENT',
          entityType: 'INVENTORY',
          entityId: inventory.id,
          userId,
          beforeData: JSON.stringify({ oldOnHand: inventory.onHandQuantity }),
          afterData: JSON.stringify({ newOnHand: updatedInventory.onHandQuantity, diff: data.quantity })
        }
      });

      return updatedInventory;
    });
  }
}
