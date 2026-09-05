import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mulberry32 deterministic PRNG
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const SEED = parseInt(process.env.SEED || '12345');
const random = mulberry32(SEED);

function randomInt(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const ms = now - randomInt(0, daysBack * 24 * 60 * 60 * 1000);
  return new Date(ms);
}

const PRODUCT_COUNT = parseInt(process.env.PRODUCT_COUNT || '750');
const ROW_COUNT = parseInt(process.env.ROW_COUNT || '4');
const BINS_PER_ROW = parseInt(process.env.BINS_PER_ROW || '25');
const ORDER_COUNT = parseInt(process.env.ORDER_COUNT || '150');

const categoriesData = {
  'Electronics': { abbr: 'EL', names: ['Wireless Mouse', 'USB Keyboard', 'Bluetooth Speaker', 'HDMI Cable', 'Webcam', 'USB Hub', 'Power Bank', 'LED Monitor Stand', 'Laptop Bag', 'Screen Protector', 'Phone Case', 'Earbuds', 'Charging Cable', 'Memory Card', 'Flash Drive'] },
  'Office Supplies': { abbr: 'OS', names: ['Ballpoint Pen', 'Notebook', 'Desk Organizer', 'Paper Clips', 'Stapler', 'Tape Dispenser', 'Whiteboard Marker', 'File Folder', 'Binder', 'Sticky Notes', 'Envelope', 'Rubber Band', 'Push Pin', 'Correction Tape', 'Highlighter'] },
  'Home & Kitchen': { abbr: 'HK', names: ['Coffee Mug', 'Water Bottle', 'Lunch Box', 'Kitchen Timer', 'Coaster Set', 'Storage Container', 'Cutting Board', 'Measuring Cup', 'Dish Towel', 'Ice Tray', 'Peeler', 'Can Opener', 'Spatula'] },
  'Sports & Outdoors': { abbr: 'SO', names: ['Yoga Mat', 'Jump Rope', 'Resistance Band', 'Sports Bottle', 'Sports Towel', 'Fitness Gloves', 'Tennis Ball', 'Wrist Band', 'Headband', 'Arm Sleeve', 'Knee Pad'] },
  'Tools & Hardware': { abbr: 'TH', names: ['Screwdriver Set', 'Duct Tape', 'Cable Ties', 'Flashlight', 'Tape Measure', 'Wrench Set', 'Pliers', 'Level Tool', 'Utility Knife', 'Glue Gun'] }
};

const adjectives = ['Premium', 'Compact', 'Professional', 'Ultra', 'Deluxe', 'Basic', 'Advanced', 'Mini', 'Pro', 'Essential', 'Classic', 'Slim', 'Heavy-Duty', 'Portable', 'Ergonomic'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Silver', 'Gray', 'Green', 'Navy', 'Orange', 'Pink'];

async function main() {
  console.log('🚀 Starting DB Seed...');
  console.log(`  Config: ${PRODUCT_COUNT} products, ${ROW_COUNT} rows, ${BINS_PER_ROW} bins/row, ${ORDER_COUNT} orders`);

  // 1. Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.idempotencyKey.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.bin.deleteMany({});
  await prisma.warehouseRow.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Users
  console.log('👤 Creating users...');
  const users = [
    { id: 'usr_admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync('admin123', 10), role: 'ADMIN' as const, name: 'Admin User', status: 'ACTIVE' as const },
    { id: 'usr_manager', email: 'manager@example.com', passwordHash: bcrypt.hashSync('manager123', 10), role: 'WAREHOUSE_MANAGER' as const, name: 'Warehouse Manager', status: 'ACTIVE' as const },
    { id: 'usr_staff', email: 'staff@example.com', passwordHash: bcrypt.hashSync('staff123', 10), role: 'STAFF' as const, name: 'Staff Member', status: 'ACTIVE' as const },
    { id: 'usr_picker', email: 'picker@example.com', passwordHash: bcrypt.hashSync('picker123', 10), role: 'PICKER' as const, name: 'Picker User', status: 'ACTIVE' as const }
  ];
  await prisma.user.createMany({ data: users });

  // 3. Warehouse
  console.log('🏭 Creating warehouse...');
  await prisma.warehouse.create({
    data: { id: 'wh_main', code: 'WH01', name: 'Main E-Commerce Warehouse', address: '123 Warehouse Blvd, Logistics Park', status: 'ACTIVE' }
  });

  // 4. Rows
  console.log('📦 Creating warehouse rows...');
  const rowNames = ['Electronics & Computing Row', 'Office & Accessories Row', 'Home & Lifestyle Row', 'Sports & Outdoor Row'];
  const rowCodes = ['A01', 'A02', 'A03', 'A04'];
  const rowData = rowCodes.slice(0, ROW_COUNT).map((code, i) => ({
    id: `row_${code.toLowerCase()}`,
    code,
    name: rowNames[i] || `Row ${code}`,
    warehouseId: 'wh_main',
    status: 'ACTIVE' as const
  }));
  await prisma.warehouseRow.createMany({ data: rowData });

  // 5. Bins
  console.log('📍 Creating bins...');
  const binsToCreate: any[] = [];
  const binMap = new Map<string, any>();
  for (const row of rowData) {
    for (let b = 1; b <= BINS_PER_ROW; b++) {
      const binCode = `B${b.toString().padStart(2, '0')}`;
      const locationCode = `WH01-${row.code}-${binCode}`;
      const binId = `bin_${row.code.toLowerCase()}_${binCode.toLowerCase()}`;
      const binObj = {
        id: binId,
        code: binCode,
        locationCode,
        rowId: row.id,
        capacity: randomInt(1000, 2500),
        status: 'ACTIVE' as const
      };
      binsToCreate.push(binObj);
      binMap.set(locationCode, binObj);
    }
  }
  await prisma.bin.createMany({ data: binsToCreate });

  // 6. Products
  console.log(`📋 Creating ${PRODUCT_COUNT} products...`);
  const productsToCreate: any[] = [];
  const categoryKeys = Object.keys(categoriesData);
  const usedBarcodes = new Set<string>();

  // Mandatory demo product: WM-001 Wireless Mouse
  productsToCreate.push({
    id: 'prod_wm_001',
    sku: 'WM-001',
    barcode: '1234567890123',
    name: 'Wireless Mouse',
    description: 'High-precision wireless mouse with ergonomic design',
    category: 'Electronics',
    unitPrice: 15.99,
    reorderLevel: 10,
    status: 'ACTIVE' as const
  });
  usedBarcodes.add('1234567890123');

  const skuCounters: Record<string, number> = {};
  for (const k of categoryKeys) {
    skuCounters[categoriesData[k as keyof typeof categoriesData].abbr] = 1;
  }

  for (let i = 1; i < PRODUCT_COUNT; i++) {
    const catName = randomItem(categoryKeys);
    const cat = categoriesData[catName as keyof typeof categoriesData];
    const abbr = cat.abbr;
    const count = skuCounters[abbr]++;
    const sku = `${abbr}-${count.toString().padStart(3, '0')}`;
    const baseName = randomItem(cat.names);
    const adj = randomItem(adjectives);
    const col = randomItem(colors);

    let barcode: string;
    do {
      barcode = `900${randomInt(100000000, 999999999).toString()}`;
    } while (usedBarcodes.has(barcode));
    usedBarcodes.add(barcode);

    productsToCreate.push({
      id: `prod_${i}`,
      sku,
      barcode,
      name: `${adj} ${baseName} - ${col}`,
      description: `${adj} ${baseName} in ${col} color`,
      category: catName,
      unitPrice: randomInt(299, 29999) / 100,
      reorderLevel: randomInt(5, 50),
      status: 'ACTIVE' as const
    });
  }

  // Batch insert products
  const prodBatch = 500;
  for (let i = 0; i < productsToCreate.length; i += prodBatch) {
    await prisma.product.createMany({ data: productsToCreate.slice(i, i + prodBatch) });
  }

  // 7. Inventory Records
  console.log('📊 Creating inventory records...');
  const inventoryToCreate: any[] = [];
  const binCurrentStock = new Map<string, number>();
  binsToCreate.forEach(b => binCurrentStock.set(b.id, 0));
  const productBinPairs = new Set<string>();

  // Demo inventory: WM-001 in WH01-A02-B03 with at least 50 on hand
  const demoBin = binMap.get('WH01-A02-B03');
  if (demoBin) {
    inventoryToCreate.push({
      id: 'inv_demo_1',
      productId: 'prod_wm_001',
      binId: demoBin.id,
      onHandQuantity: 50,
      reservedQuantity: 0
    });
    binCurrentStock.set(demoBin.id, 50);
    productBinPairs.add(`prod_wm_001:${demoBin.id}`);
  }

  let invIdCounter = 2;
  for (let i = 1; i < productsToCreate.length; i++) {
    const prod = productsToCreate[i];
    const numBins = randomInt(1, 3);

    // Determine target row based on category
    let targetRowCode = 'A04';
    if (prod.category === 'Electronics') targetRowCode = 'A01';
    else if (prod.category === 'Office Supplies') targetRowCode = 'A02';
    else if (prod.category === 'Home & Kitchen') targetRowCode = 'A03';
    else if (prod.category === 'Sports & Outdoors') targetRowCode = 'A04';
    else targetRowCode = randomItem(['A01', 'A02', 'A03', 'A04']);

    const candidateBins = binsToCreate.filter(b => b.rowId === `row_${targetRowCode.toLowerCase()}`);

    for (let j = 0; j < numBins; j++) {
      const bin = randomItem(candidateBins);
      const pairKey = `${prod.id}:${bin.id}`;
      if (productBinPairs.has(pairKey)) continue;

      const cap = bin.capacity;
      const current = binCurrentStock.get(bin.id) || 0;
      if (current >= cap) continue;

      const maxAdd = cap - current;
      const qty = Math.min(randomInt(10, 150), maxAdd);
      if (qty <= 0) continue;

      const reserved = randomInt(0, 100) > 80 ? randomInt(1, Math.min(10, qty)) : 0;

      inventoryToCreate.push({
        id: `inv_${invIdCounter++}`,
        productId: prod.id,
        binId: bin.id,
        onHandQuantity: qty,
        reservedQuantity: reserved
      });
      binCurrentStock.set(bin.id, current + qty);
      productBinPairs.add(pairKey);
    }
  }

  const invBatch = 500;
  for (let i = 0; i < inventoryToCreate.length; i += invBatch) {
    await prisma.inventory.createMany({ data: inventoryToCreate.slice(i, i + invBatch) });
  }
  console.log(`  Created ${inventoryToCreate.length} inventory records`);

  // 8. Orders & Order Items
  console.log(`🛒 Creating ${ORDER_COUNT} orders...`);
  const ordersToCreate: any[] = [];
  const orderItemsToCreate: any[] = [];

  // Demo order: ORD-2026-000001 with WM-001 × 5
  ordersToCreate.push({
    id: 'ord_demo_1',
    orderNumber: 'ORD-2026-000001',
    status: 'PENDING' as const,
    customerReference: 'CUST-DEMO',
    totalAmount: 79.95,
    createdBy: 'usr_staff'
  });
  orderItemsToCreate.push({
    id: 'item_demo_1',
    orderId: 'ord_demo_1',
    productId: 'prod_wm_001',
    requestedQuantity: 5,
    allocatedQuantity: 0,
    reservedQuantity: 0,
    pickedQuantity: 0,
    status: 'PENDING' as const
  });

  const statusWeights = [
    { s: 'COMPLETED' as const, w: 40 },
    { s: 'PENDING' as const, w: 20 },
    { s: 'RESERVED' as const, w: 15 },
    { s: 'ALLOCATED' as const, w: 10 },
    { s: 'PICKING' as const, w: 5 },
    { s: 'PICKED' as const, w: 5 },
    { s: 'CANCELLED' as const, w: 5 }
  ];

  function getRandomStatus(): string {
    const total = statusWeights.reduce((sum, item) => sum + item.w, 0);
    let rand = randomInt(1, total);
    for (const item of statusWeights) {
      if (rand <= item.w) return item.s;
      rand -= item.w;
    }
    return 'COMPLETED';
  }

  let itemCounter = 2;
  for (let i = 2; i <= ORDER_COUNT; i++) {
    const status = getRandomStatus();
    const orderId = `ord_${i}`;
    const numItems = randomInt(1, 5);
    let orderTotal = 0;

    const items: any[] = [];
    for (let j = 0; j < numItems; j++) {
      const prod = randomItem(productsToCreate);
      const reqQty = randomInt(1, 10);
      let alloc = 0, res = 0, picked = 0;
      let itemStatus = status === 'COMPLETED' ? 'PICKED' : status;

      if (status === 'COMPLETED') { alloc = reqQty; res = reqQty; picked = reqQty; itemStatus = 'PICKED'; }
      else if (status === 'RESERVED') { alloc = reqQty; res = reqQty; itemStatus = 'RESERVED'; }
      else if (status === 'ALLOCATED') { alloc = reqQty; itemStatus = 'ALLOCATED'; }
      else if (status === 'PICKED') { alloc = reqQty; res = reqQty; picked = reqQty; itemStatus = 'PICKED'; }
      else if (status === 'PICKING') { alloc = reqQty; res = reqQty; picked = randomInt(0, reqQty); itemStatus = picked >= reqQty ? 'PICKED' : 'PICKING'; }
      else if (status === 'CANCELLED') { itemStatus = 'CANCELLED'; }
      else { itemStatus = 'PENDING'; }

      // Find a valid bin for allocation
      const invs = inventoryToCreate.filter(inv => inv.productId === prod.id);
      let allocBinId: string | null = null;
      if (alloc > 0 && invs.length > 0) {
        allocBinId = invs[0].binId;
      }

      if (!allocBinId && alloc > 0) {
        alloc = 0; res = 0; picked = 0;
        itemStatus = 'PENDING';
      }

      orderTotal += Number(prod.unitPrice) * reqQty;

      items.push({
        id: `item_${itemCounter++}`,
        orderId,
        productId: prod.id,
        requestedQuantity: reqQty,
        allocatedQuantity: alloc,
        reservedQuantity: res,
        pickedQuantity: picked,
        allocatedBinId: allocBinId,
        status: itemStatus
      });
    }

    ordersToCreate.push({
      id: orderId,
      orderNumber: `ORD-2026-${i.toString().padStart(6, '0')}`,
      status,
      customerReference: `CUST-${randomInt(1000, 9999)}`,
      totalAmount: Math.round(orderTotal * 100) / 100,
      createdBy: randomItem(['usr_manager', 'usr_staff'])
    });
    orderItemsToCreate.push(...items);
  }

  const ordBatch = 500;
  for (let i = 0; i < ordersToCreate.length; i += ordBatch) {
    await prisma.order.createMany({ data: ordersToCreate.slice(i, i + ordBatch) });
  }
  for (let i = 0; i < orderItemsToCreate.length; i += ordBatch) {
    await prisma.orderItem.createMany({ data: orderItemsToCreate.slice(i, i + ordBatch) });
  }
  console.log(`  Created ${ordersToCreate.length} orders with ${orderItemsToCreate.length} items`);

  // 9. Stock Movements
  console.log('📦 Creating stock movements...');
  const movementsToCreate: any[] = [];
  let movCounter = 1;

  // INWARD movements for all inventory
  for (const inv of inventoryToCreate) {
    movementsToCreate.push({
      id: `mov_${movCounter}`,
      movementType: 'INWARD' as const,
      productId: inv.productId,
      quantity: inv.onHandQuantity,
      destinationBinId: inv.binId,
      referenceType: 'RECEIPT',
      referenceId: `RCPT-${randomInt(1000, 9999)}`,
      performedBy: randomItem(['usr_staff', 'usr_manager']),
      reason: 'Initial stock receipt',
      idempotencyKey: `idk_mov_${movCounter}`,
      createdAt: randomDate(30)
    });
    movCounter++;
  }

  // OUTWARD movements for completed orders
  for (const item of orderItemsToCreate) {
    if ((item.status === 'COMPLETED' || item.status === 'PICKED') && item.allocatedBinId && item.pickedQuantity > 0) {
      movementsToCreate.push({
        id: `mov_${movCounter}`,
        movementType: 'OUTWARD' as const,
        productId: item.productId,
        quantity: item.pickedQuantity,
        sourceBinId: item.allocatedBinId,
        referenceType: 'ORDER',
        referenceId: item.orderId,
        performedBy: 'usr_picker',
        reason: 'Order fulfillment',
        idempotencyKey: `idk_mov_${movCounter}`,
        createdAt: randomDate(30)
      });
      movCounter++;
    }
  }

  // RESERVATION movements for reserved orders
  for (const item of orderItemsToCreate) {
    if ((item.status === 'RESERVED' || item.status === 'PICKING') && item.allocatedBinId && item.reservedQuantity > 0) {
      movementsToCreate.push({
        id: `mov_${movCounter}`,
        movementType: 'RESERVATION' as const,
        productId: item.productId,
        quantity: item.reservedQuantity,
        sourceBinId: item.allocatedBinId,
        referenceType: 'ORDER',
        referenceId: item.orderId,
        performedBy: 'usr_staff',
        reason: 'Stock reservation for order',
        idempotencyKey: `idk_mov_${movCounter}`,
        createdAt: randomDate(15)
      });
      movCounter++;
    }
  }

  // Additional TRANSFER movements
  for (let i = 0; i < 180; i++) {
    const srcBin = randomItem(binsToCreate);
    let destBin = randomItem(binsToCreate);
    while (destBin.id === srcBin.id) destBin = randomItem(binsToCreate);
    const prod = randomItem(productsToCreate);
    movementsToCreate.push({
      id: `mov_${movCounter}`,
      movementType: 'TRANSFER' as const,
      productId: prod.id,
      quantity: randomInt(1, 20),
      sourceBinId: srcBin.id,
      destinationBinId: destBin.id,
      referenceType: 'TRANSFER',
      referenceId: `TRF-${randomInt(1000, 9999)}`,
      performedBy: randomItem(['usr_staff', 'usr_manager']),
      reason: 'Stock rebalancing',
      idempotencyKey: `idk_mov_${movCounter}`,
      createdAt: randomDate(20)
    });
    movCounter++;
  }

  // Additional ADJUSTMENT movements
  for (let i = 0; i < 120; i++) {
    const inv = randomItem(inventoryToCreate);
    const adjustQty = randomInt(1, 5);
    movementsToCreate.push({
      id: `mov_${movCounter}`,
      movementType: 'ADJUSTMENT' as const,
      productId: inv.productId,
      quantity: adjustQty,
      destinationBinId: inv.binId,
      referenceType: 'ADJUSTMENT',
      referenceId: `ADJ-${randomInt(1000, 9999)}`,
      performedBy: 'usr_manager',
      reason: randomItem(['Cycle count correction', 'Damaged goods write-off', 'Physical count adjustment']),
      idempotencyKey: `idk_mov_${movCounter}`,
      createdAt: randomDate(25)
    });
    movCounter++;
  }

  // Additional RETURN movements
  for (let i = 0; i < 60; i++) {
    const inv = randomItem(inventoryToCreate);
    movementsToCreate.push({
      id: `mov_${movCounter}`,
      movementType: 'RETURN' as const,
      productId: inv.productId,
      quantity: randomInt(1, 3),
      destinationBinId: inv.binId,
      referenceType: 'RETURN',
      referenceId: `RET-${randomInt(1000, 9999)}`,
      performedBy: 'usr_staff',
      reason: 'Customer return processed and restocked',
      idempotencyKey: `idk_mov_${movCounter}`,
      createdAt: randomDate(10)
    });
    movCounter++;
  }

  const movBatch = 500;
  for (let i = 0; i < movementsToCreate.length; i += movBatch) {
    await prisma.stockMovement.createMany({ data: movementsToCreate.slice(i, i + movBatch) });
  }
  console.log(`  Created ${movementsToCreate.length} stock movements`);

  // 10. Audit Logs
  console.log('📝 Creating audit logs...');
  const logsToCreate: any[] = [];
  const auditActions = ['LOGIN', 'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'INWARD', 'OUTWARD', 'TRANSFER', 'ADJUSTMENT', 'CREATE_ORDER', 'ALLOCATE', 'RESERVE', 'PICK', 'COMPLETE', 'CANCEL'];
  const auditEntities = ['USER', 'PRODUCT', 'INVENTORY', 'ORDER', 'STOCK_MOVEMENT'];

  for (let i = 1; i <= 500; i++) {
    logsToCreate.push({
      id: `log_${i}`,
      entityType: randomItem(auditEntities),
      entityId: `entity_${randomInt(1, 100)}`,
      action: randomItem(auditActions),
      userId: randomItem(['usr_admin', 'usr_manager', 'usr_staff', 'usr_picker']),
      afterData: JSON.stringify({ note: 'Seed generated audit entry', timestamp: randomDate(30).toISOString() }),
      createdAt: randomDate(30)
    });
  }
  const logBatch = 500;
  for (let i = 0; i < logsToCreate.length; i += logBatch) {
    await prisma.auditLog.createMany({ data: logsToCreate.slice(i, i + logBatch) });
  }

  // Summary
  console.log('\n✅ Seed completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`  Users:            ${users.length}`);
  console.log(`  Warehouses:       1`);
  console.log(`  Rows:             ${rowData.length}`);
  console.log(`  Bins:             ${binsToCreate.length}`);
  console.log(`  Products:         ${productsToCreate.length}`);
  console.log(`  Inventory:        ${inventoryToCreate.length}`);
  console.log(`  Orders:           ${ordersToCreate.length}`);
  console.log(`  Order Items:      ${orderItemsToCreate.length}`);
  console.log(`  Stock Movements:  ${movementsToCreate.length}`);
  console.log(`  Audit Logs:       ${logsToCreate.length}`);
  console.log('═══════════════════════════════════════');
  console.log('\n📌 Demo Credentials:');
  console.log('  admin@example.com / admin123');
  console.log('  manager@example.com / manager123');
  console.log('  staff@example.com / staff123');
  console.log('  picker@example.com / picker123');
  console.log('\n📌 Demo Order: ORD-2026-000001 (WM-001 × 5)');
  console.log('📌 Demo Product: WM-001 at WH01-A02-B03');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
