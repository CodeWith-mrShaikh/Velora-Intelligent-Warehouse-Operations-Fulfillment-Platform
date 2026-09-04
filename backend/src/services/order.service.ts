import prisma from '../utils/db';
import { PaginationParams, buildPaginatedResponse, getPrismaSkip } from '../utils/pagination';
import { OrderStatus, MovementType, ValidOrderTransitions } from '../types';
import { NotFoundError, InsufficientStockError, InvalidStateTransitionError } from '../utils/errors';

export class OrderService {
  static async create(data: { customerReference?: string; customerRef?: string; items: { sku?: string; productId?: string; quantity: number }[] }, userId: string) {
    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems = [];

      for (const item of data.items) {
        const idOrSku = item.sku || item.productId;
        if (!idOrSku) throw new NotFoundError('Product SKU or ID is required');

        const product = await tx.product.findFirst({
          where: {
            OR: [
              { id: idOrSku },
              { sku: idOrSku }
            ]
          }
        });
        if (!product) throw new NotFoundError(`Product with SKU/ID ${idOrSku} not found`);

        totalAmount += Number(product.unitPrice) * item.quantity;
        orderItems.push({
          productId: product.id,
          requestedQuantity: item.quantity
        });
      }

      const count = await tx.order.count();
      const latestOrders = await tx.order.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true }
      });
      let maxNum = count;
      for (const ord of latestOrders) {
        const match = ord.orderNumber?.match(/ORD-\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(maxNum + 1).padStart(6, '0')}`;
      const customerReference = data.customerReference || data.customerRef;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerReference,
          status: OrderStatus.PENDING,
          totalAmount,
          createdBy: userId,
          items: {
            create: orderItems
          }
        },
        include: { items: true }
      });

      await tx.auditLog.create({
        data: { action: 'CREATE', entityType: 'ORDER', entityId: order.id, userId, afterData: JSON.stringify({ orderNumber }) }
      });

      return {
        ...order,
        customerRef: order.customerReference,
        itemsCount: order.items.length
      };
    });
  }

  static async getAll(params: PaginationParams & { status?: string }) {
    const skip = getPrismaSkip(params.page, params.limit);
    let where: any = {};
    if (params.status) {
      if (params.status.includes(',')) {
        where.status = { in: params.status.split(',').map((s: string) => s.trim() as OrderStatus) };
      } else {
        where.status = params.status as OrderStatus;
      }
    }
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search } },
        { customerReference: { contains: params.search } }
      ];
    }
    const [total, rawOrders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: params.sort ? { [params.sort]: params.order } : { createdAt: 'desc' },
        include: { _count: { select: { items: true } } }
      })
    ]);
    const orders = rawOrders.map((o: any) => ({
      ...o,
      itemsCount: o._count?.items || 0,
      customerRef: o.customerReference
    }));
    return buildPaginatedResponse(orders, total, params);
  }

  static async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            bin: { include: { row: { include: { warehouse: true } } } }
          }
        }
      }
    });
    if (!order) throw new NotFoundError('Order not found');
    return {
      ...order,
      customerRef: order.customerReference,
      items: order.items.map((it: any) => ({
        ...it,
        requestedQty: it.requestedQuantity,
        allocatedQty: it.allocatedQuantity,
        reservedQty: it.reservedQuantity,
        pickedQty: it.pickedQuantity,
        allocations: it.bin ? [{
          id: it.id,
          bin: it.bin,
          quantity: it.allocatedQuantity || it.requestedQuantity
        }] : []
      }))
    };
  }

  static async allocate(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new NotFoundError('Order not found');
      
      if (!ValidOrderTransitions[order.status as OrderStatus].includes(OrderStatus.ALLOCATED)) {
        throw new InvalidStateTransitionError(`Cannot allocate from state ${order.status}`);
      }

      for (const item of order.items) {
        if (item.status !== 'PENDING') continue;

        const inventory = await tx.inventory.findMany({
          where: { productId: item.productId },
          orderBy: { onHandQuantity: 'desc' }
        });

        let remaining = item.requestedQuantity;
        let bestBinId: string | null = null;

        for (const inv of inventory) {
          const available = inv.onHandQuantity - inv.reservedQuantity;
          if (available >= remaining) {
            bestBinId = inv.binId;
            break; // found single bin
          }
        }

        if (!bestBinId) {
          throw new InsufficientStockError(item.productId, item.requestedQuantity, 0, 'Cannot fulfill from single bin (split not supported yet)');
        }

        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'ALLOCATED', allocatedQuantity: item.requestedQuantity, allocatedBinId: bestBinId }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ALLOCATED }
      });

      await tx.auditLog.create({
        data: { action: 'ALLOCATE', entityType: 'ORDER', entityId: orderId, userId, afterData: JSON.stringify({ status: 'ALLOCATED' }) }
      });

      return updatedOrder;
    });
  }

  static async reserve(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new NotFoundError('Order not found');
      
      if (!ValidOrderTransitions[order.status as OrderStatus].includes(OrderStatus.RESERVED)) {
        throw new InvalidStateTransitionError(`Cannot reserve from state ${order.status}`);
      }

      for (const item of order.items) {
        if (item.status !== 'ALLOCATED' || !item.allocatedBinId) continue;

        const inventory = await tx.inventory.findUnique({
          where: { productId_binId: { productId: item.productId, binId: item.allocatedBinId } }
        });

        if (!inventory) throw new NotFoundError('Inventory not found during reservation');

        const available = inventory.onHandQuantity - inventory.reservedQuantity;
        if (available < item.allocatedQuantity) {
          throw new InsufficientStockError(item.productId, item.allocatedQuantity, available);
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reservedQuantity: { increment: item.allocatedQuantity }, version: { increment: 1 } }
        });

        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'RESERVED', reservedQuantity: item.allocatedQuantity }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            sourceBinId: item.allocatedBinId,
            movementType: MovementType.RESERVATION,
            quantity: item.allocatedQuantity,
            performedBy: userId,
            referenceType: 'ORDER',
            referenceId: order.id
          }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RESERVED }
      });

      await tx.auditLog.create({
        data: { action: 'RESERVE', entityType: 'ORDER', entityId: orderId, userId, afterData: JSON.stringify({ status: 'RESERVED' }) }
      });

      return updatedOrder;
    });
  }

  static async release(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new NotFoundError('Order not found');
      
      if (order.status !== OrderStatus.RESERVED && order.status !== OrderStatus.PICKING) {
        throw new InvalidStateTransitionError('Can only release RESERVED or PICKING orders');
      }

      for (const item of order.items) {
        if (item.status !== 'RESERVED' || !item.allocatedBinId) continue;

        await tx.inventory.update({
          where: { productId_binId: { productId: item.productId, binId: item.allocatedBinId } },
          data: { reservedQuantity: { decrement: item.reservedQuantity }, version: { increment: 1 } }
        });

        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'PENDING', reservedQuantity: 0, allocatedQuantity: 0, allocatedBinId: null }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            destinationBinId: item.allocatedBinId, // return reservation back to bin
            movementType: MovementType.RELEASE,
            quantity: item.reservedQuantity,
            performedBy: userId,
            referenceType: 'ORDER',
            referenceId: order.id
          }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING }
      });

      await tx.auditLog.create({
        data: { action: 'RELEASE', entityType: 'ORDER', entityId: orderId, userId, afterData: JSON.stringify({ status: 'PENDING' }) }
      });

      return updatedOrder;
    });
  }

  static async pick(orderId: string, itemsData: { orderItemId: string, quantity: number }[] | undefined, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new NotFoundError('Order not found');

      if (order.status === OrderStatus.RESERVED) {
        await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PICKING } });
      } else if (order.status !== OrderStatus.PICKING) {
        throw new InvalidStateTransitionError('Order must be RESERVED or PICKING to pick');
      }

      let toPick = itemsData;
      if (!toPick || toPick.length === 0) {
        toPick = order.items
          .filter(i => (i.reservedQuantity - i.pickedQuantity) > 0)
          .map(i => ({ orderItemId: i.id, quantity: i.reservedQuantity - i.pickedQuantity }));
      }

      for (const pickReq of toPick) {
        const item = order.items.find(i => i.id === pickReq.orderItemId);
        if (!item || !item.allocatedBinId) throw new NotFoundError('Order item not found or not allocated');
        
        if (pickReq.quantity > item.reservedQuantity - item.pickedQuantity) {
          throw new InvalidStateTransitionError('Pick quantity exceeds remaining reserved quantity');
        }

        await tx.inventory.update({
          where: { productId_binId: { productId: item.productId, binId: item.allocatedBinId } },
          data: { 
            onHandQuantity: { decrement: pickReq.quantity },
            reservedQuantity: { decrement: pickReq.quantity },
            version: { increment: 1 } 
          }
        });

        const newPickedQty = item.pickedQuantity + pickReq.quantity;
        const newItemStatus = newPickedQty === item.requestedQuantity ? 'PICKED' : 'PICKING';

        await tx.orderItem.update({
          where: { id: item.id },
          data: { pickedQuantity: newPickedQty, status: newItemStatus }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            sourceBinId: item.allocatedBinId,
            movementType: MovementType.OUTWARD,
            quantity: pickReq.quantity,
            performedBy: userId,
            referenceType: 'ORDER',
            referenceId: order.id
          }
        });
      }

      const updatedOrder = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      const allPicked = updatedOrder!.items.every(i => i.status === 'PICKED');

      if (allPicked) {
        await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PICKED } });
      }

      await tx.auditLog.create({
        data: { action: 'PICK', entityType: 'ORDER', entityId: orderId, userId, afterData: JSON.stringify({ items: itemsData, allPicked }) }
      });

      return updatedOrder;
    });
  }

  static async complete(orderId: string, userId: string) {
    const order = await this.getById(orderId);
    if (order.status !== OrderStatus.PICKED) {
      throw new InvalidStateTransitionError('Only PICKED orders can be completed');
    }
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED }
    });
    await prisma.auditLog.create({
      data: { action: 'COMPLETE', entityType: 'ORDER', entityId: orderId, userId, afterData: JSON.stringify({ status: 'COMPLETED' }) }
    });
    return updated;
  }

  static async cancel(orderId: string, userId: string) {
    const order = await this.getById(orderId);
    
    if (order.status === OrderStatus.RESERVED || order.status === OrderStatus.PICKING) {
      // Must release first
      await this.release(orderId, userId);
    } else if (!ValidOrderTransitions[order.status as OrderStatus].includes(OrderStatus.CANCELLED)) {
      throw new InvalidStateTransitionError(`Cannot cancel from state ${order.status}`);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED }
    });
    
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { status: 'CANCELLED' }
    });

    await prisma.auditLog.create({
      data: { action: 'CANCEL', entityType: 'ORDER', entityId: orderId, userId, afterData: JSON.stringify({ status: 'CANCELLED' }) }
    });

    return updated;
  }
}
