import prisma from '../utils/db';

export class DashboardService {
  static async getSummary() {
    const [
      totalProducts,
      inventoryAggr,
      activeProducts,
      totalBins,
      occupiedBins,
      orders
    ] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.inventory.aggregate({
        _sum: { onHandQuantity: true, reservedQuantity: true }
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          reorderLevel: true,
          inventories: {
            select: { onHandQuantity: true, reservedQuantity: true }
          }
        }
      }),
      prisma.bin.count({ where: { status: 'ACTIVE' } }),
      prisma.inventory.groupBy({
        by: ['binId'],
        where: { onHandQuantity: { gt: 0 } },
        _count: true
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    const lowStockCount = activeProducts.filter(p => {
      const available = p.inventories.reduce((sum, inv) => sum + (inv.onHandQuantity - inv.reservedQuantity), 0);
      return available <= p.reorderLevel;
    }).length;

    const orderStats = orders.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const totalUnits = inventoryAggr._sum.onHandQuantity || 0;
    const reservedUnits = inventoryAggr._sum.reservedQuantity || 0;
    const availableUnits = totalUnits - reservedUnits;

    return {
      totalSkus: totalProducts,
      totalProducts,
      totalUnits,
      reservedUnits,
      availableUnits,
      lowStockItemsCount: lowStockCount,
      lowStockCount,
      totalBins,
      occupiedBins: occupiedBins.length,
      binUtilizationPercent: totalBins > 0 ? (occupiedBins.length / totalBins) * 100 : 0,
      binUtilizationRate: totalBins > 0 ? (occupiedBins.length / totalBins) * 100 : 0,
      pendingOrdersCount: orderStats['PENDING'] || 0,
      pickingOrdersCount: orderStats['PICKING'] || 0,
      completedOrdersCount: orderStats['COMPLETED'] || 0,
      orders: {
        pending: orderStats['PENDING'] || 0,
        picking: orderStats['PICKING'] || 0,
        completed: orderStats['COMPLETED'] || 0
      }
    };
  }

  static async getRowStock() {
    const rows = await prisma.warehouseRow.findMany({
      include: {
        bins: {
          include: {
            inventories: true
          }
        }
      }
    });

    return rows.map(row => {
      let totalUnits = 0;
      const products = new Set();
      
      row.bins.forEach(bin => {
        bin.inventories.forEach(inv => {
          totalUnits += inv.onHandQuantity;
          if (inv.onHandQuantity > 0) products.add(inv.productId);
        });
      });

      return {
        row: row.code,
        warehouseId: row.warehouseId,
        totalUnits,
        productCount: products.size
      };
    });
  }

  static async getLowStock() {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { inventories: true }
    });

    const lowStock = [];
    for (const p of products) {
      const available = p.inventories.reduce((sum, inv) => sum + (inv.onHandQuantity - inv.reservedQuantity), 0);
      const reorderLevel = p.reorderLevel || 0;
      
      if (available <= reorderLevel) {
        lowStock.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          available,
          reorderLevel,
          severity: available <= (reorderLevel / 2) ? 'CRITICAL' : 'LOW'
        });
      }
    }
    return lowStock.sort((a, b) => a.available - b.available);
  }

  static async getBinUtilization() {
    const bins = await prisma.bin.findMany({
      where: { status: 'ACTIVE' },
      include: { inventories: true }
    });

    return bins.map(bin => {
      const currentQuantity = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      const utilization = bin.capacity > 0 ? (currentQuantity / bin.capacity) * 100 : 0;
      
      let status = 'AVAILABLE';
      if (utilization === 0) status = 'EMPTY';
      else if (utilization >= 100) status = 'FULL';
      else if (utilization >= 80) status = 'NEAR_CAPACITY';

      return {
        id: bin.id,
        locationCode: bin.locationCode,
        capacity: bin.capacity,
        currentQuantity,
        utilization,
        status
      };
    });
  }
}
