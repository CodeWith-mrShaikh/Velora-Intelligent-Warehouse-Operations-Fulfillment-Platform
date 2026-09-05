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
      include: {
        inventories: true,
        row: {
          select: { code: true, name: true }
        }
      },
      orderBy: { locationCode: 'asc' }
    });

    let totalCapacity = 0;
    let totalOccupiedUnits = 0;
    let emptyCount = 0;
    let lowCount = 0;
    let midCount = 0;
    let highCount = 0;

    const formattedBins = bins.map(bin => {
      const currentQuantity = bin.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      const utilization = bin.capacity > 0 ? Math.round((currentQuantity / bin.capacity) * 100) : 0;
      
      totalCapacity += bin.capacity;
      totalOccupiedUnits += currentQuantity;

      let status = 'AVAILABLE';
      if (currentQuantity === 0) {
        status = 'EMPTY';
        emptyCount++;
      } else if (utilization <= 30) {
        status = 'AVAILABLE';
        lowCount++;
      } else if (utilization <= 70) {
        status = 'MODERATE';
        midCount++;
      } else {
        status = 'FULL';
        highCount++;
      }

      return {
        id: bin.id,
        code: bin.code,
        locationCode: bin.locationCode,
        rowCode: bin.row?.code || 'A01',
        rowName: bin.row?.name || '',
        capacity: bin.capacity,
        currentQuantity,
        availableCapacity: Math.max(0, bin.capacity - currentQuantity),
        utilization,
        status
      };
    });

    const totalBins = bins.length;
    const occupiedBins = totalBins - emptyCount;
    const totalFreeUnits = Math.max(0, totalCapacity - totalOccupiedUnits);
    const overallUtilizationPercent = totalCapacity > 0 ? Math.round((totalOccupiedUnits / totalCapacity) * 100) : 0;

    const ranges = [
      { range: '0-30% (Available)', count: lowCount + emptyCount, color: '#10b981' },
      { range: '31-70% (Moderate)', count: midCount, color: '#f59e0b' },
      { range: '71-100% (Near Full/Full)', count: highCount, color: '#ef4444' }
    ];

    return {
      bins: formattedBins,
      stats: {
        totalBins,
        occupiedBins,
        availableBins: emptyCount,
        totalCapacity,
        totalOccupiedUnits,
        totalFreeUnits,
        overallUtilizationPercent
      },
      ranges
    };
  }
}
