import prisma from '../utils/db';
import { generateCsv } from '../utils/csv';
import { DashboardService } from './dashboard.service';

export class ReportService {
  static async generateInventoryReport() {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
        bin: true
      },
      orderBy: { product: { name: 'asc' } }
    });

    const data = inventory.map(inv => ({
      SKU: inv.product.sku,
      Product: inv.product.name,
      Bin: inv.bin.locationCode,
      OnHand: inv.onHandQuantity,
      Reserved: inv.reservedQuantity,
      Available: inv.onHandQuantity - inv.reservedQuantity,
      LastUpdated: inv.updatedAt.toISOString()
    }));

    const columns = [
      { key: 'SKU', label: 'SKU' },
      { key: 'Product', label: 'Product Name' },
      { key: 'Bin', label: 'Location' },
      { key: 'OnHand', label: 'On Hand' },
      { key: 'Reserved', label: 'Reserved' },
      { key: 'Available', label: 'Available' },
      { key: 'LastUpdated', label: 'Last Updated' }
    ];

    return generateCsv(data, columns);
  }

  static async generateLowStockReport() {
    const lowStock = await DashboardService.getLowStock();
    const columns = [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product Name' },
      { key: 'available', label: 'Available Qty' },
      { key: 'reorderLevel', label: 'Reorder Level' },
      { key: 'severity', label: 'Severity' }
    ];
    return generateCsv(lowStock, columns);
  }

  static async generateMovementReport(filters: any) {
    let where: any = {};
    if (filters.movementType) where.movementType = filters.movementType;
    if (filters.productId) where.productId = filters.productId;
    if (filters.performedBy) where.performedBy = filters.performedBy;
    if (filters.binId) {
      where.OR = [
        { sourceBinId: filters.binId },
        { destinationBinId: filters.binId }
      ];
    }
    
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        sourceBin: true,
        destinationBin: true,
        performer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = movements.map(m => ({
      Date: m.createdAt.toISOString(),
      Type: m.movementType,
      Product: m.product.name,
      SKU: m.product.sku,
      Quantity: m.quantity,
      Source: m.sourceBin?.locationCode || '',
      Destination: m.destinationBin?.locationCode || '',
      User: m.performer?.email || 'System',
      Reason: m.reason || ''
    }));

    const columns = [
      { key: 'Date', label: 'Date' },
      { key: 'Type', label: 'Movement Type' },
      { key: 'Product', label: 'Product' },
      { key: 'SKU', label: 'SKU' },
      { key: 'Quantity', label: 'Quantity' },
      { key: 'Source', label: 'Source Bin' },
      { key: 'Destination', label: 'Dest Bin' },
      { key: 'User', label: 'User' },
      { key: 'Reason', label: 'Reason' }
    ];

    return generateCsv(data, columns);
  }

  static async generateOrderReport(filters: any) {
    const orders = await prisma.order.findMany({
      where: filters,
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = orders.map(o => ({
      OrderNumber: o.orderNumber,
      CustomerRef: o.customerReference || '',
      Status: o.status,
      TotalAmount: o.totalAmount,
      ItemCount: o._count.items,
      Date: o.createdAt.toISOString()
    }));

    const columns = [
      { key: 'OrderNumber', label: 'Order Number' },
      { key: 'CustomerRef', label: 'Customer Ref' },
      { key: 'Status', label: 'Status' },
      { key: 'TotalAmount', label: 'Total Amount' },
      { key: 'ItemCount', label: 'Items' },
      { key: 'Date', label: 'Date' }
    ];

    return generateCsv(data, columns);
  }

  static async generateBinUtilizationReport() {
    const bins = await DashboardService.getBinUtilization();
    const columns = [
      { key: 'locationCode', label: 'Location' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'currentQuantity', label: 'Current Qty' },
      { key: 'utilization', label: 'Utilization %' },
      { key: 'status', label: 'Status' }
    ];
    return generateCsv(bins, columns);
  }
}
