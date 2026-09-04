import prisma from '../utils/db';
import { PaginationParams, buildPaginatedResponse, getPrismaSkip } from '../utils/pagination';

export class MovementService {
  static async getAll(params: PaginationParams & { movementType?: string; productId?: string; performedBy?: string; binId?: string }) {
    const skip = getPrismaSkip(params.page, params.limit);
    
    let where: any = {};
    if (params.movementType) where.movementType = params.movementType;
    if (params.productId) where.productId = params.productId;
    if (params.performedBy) where.performedBy = params.performedBy;
    if (params.binId) {
      where.OR = [
        { sourceBinId: params.binId },
        { destinationBinId: params.binId }
      ];
    }

    const [total, rawMovements] = await prisma.$transaction([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: params.sort ? { [params.sort]: params.order } : { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          sourceBin: { select: { id: true, locationCode: true } },
          destinationBin: { select: { id: true, locationCode: true } },
          performer: { select: { id: true, email: true, name: true } }
        }
      })
    ]);

    const movements = rawMovements.map((m: any) => ({
      ...m,
      user: m.performer,
      type: m.movementType,
      source: m.sourceBin?.locationCode,
      destination: m.destinationBin?.locationCode,
    }));

    return buildPaginatedResponse(movements, total, params);
  }

  static async getByProductId(productId: string) {
    const raw = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceBin: true,
        destinationBin: true,
        performer: true
      }
    });

    return raw.map((m: any) => ({
      ...m,
      user: m.performer,
      type: m.movementType
    }));
  }

  static async getByOrderId(orderId: string) {
    const raw = await prisma.stockMovement.findMany({
      where: { referenceType: 'ORDER', referenceId: orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        performer: true,
        sourceBin: true,
        destinationBin: true
      }
    });

    return raw.map((m: any) => ({
      ...m,
      user: m.performer,
      type: m.movementType
    }));
  }
}
