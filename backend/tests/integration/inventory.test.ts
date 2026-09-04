import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../setup';

describe('Inventory Integration Tests', () => {
  let productId = 'int_prod_1';
  let binId = 'int_bin_1';
  let bin2Id = 'int_bin_2';

  beforeAll(async () => {
    await prisma.product.create({
      data: { id: productId, sku: 'INT-001', name: 'Int Test', category: 'Testing', unitPrice: 10, status: 'ACTIVE' }
    });
    const wh = await prisma.warehouse.create({ data: { id: 'wh_int', code: 'WH_INT', name: 'Test', address: 'Test', status: 'ACTIVE' }});
    const row = await prisma.warehouseRow.create({ data: { id: 'row_int', code: 'R1', name: 'Row 1', warehouseId: wh.id, status: 'ACTIVE' }});
    await prisma.bin.create({ data: { id: binId, code: 'B1', locationCode: 'L1', rowId: row.id, capacity: 100, status: 'ACTIVE' }});
    await prisma.bin.create({ data: { id: bin2Id, code: 'B2', locationCode: 'L2', rowId: row.id, capacity: 100, status: 'ACTIVE' }});
    await prisma.inventory.create({ data: { id: 'inv_int_1', productId, binId, onHandQuantity: 50, reservedQuantity: 10 }});
  });

  afterAll(async () => {
    await prisma.inventory.deleteMany({ where: { id: 'inv_int_1' }});
    await prisma.inventory.deleteMany({ where: { productId }});
    await prisma.bin.deleteMany({ where: { rowId: 'row_int' }});
    await prisma.warehouseRow.deleteMany({ where: { id: 'row_int' }});
    await prisma.warehouse.deleteMany({ where: { id: 'wh_int' }});
    await prisma.product.deleteMany({ where: { id: productId }});
  });

  it('Test inward stock increases on_hand', async () => {
    const inv = await prisma.inventory.update({
      where: { id: 'inv_int_1' },
      data: { onHandQuantity: { increment: 20 } }
    });
    expect(inv.onHandQuantity).toBe(70);
  });

  it('Test outward stock decreases on_hand', async () => {
    const inv = await prisma.inventory.update({
      where: { id: 'inv_int_1' },
      data: { onHandQuantity: { decrement: 10 } }
    });
    expect(inv.onHandQuantity).toBe(60);
  });

  it('Test reservation increases reserved_quantity', async () => {
    const inv = await prisma.inventory.update({
      where: { id: 'inv_int_1' },
      data: { reservedQuantity: { increment: 5 } }
    });
    expect(inv.reservedQuantity).toBe(15);
  });
});
