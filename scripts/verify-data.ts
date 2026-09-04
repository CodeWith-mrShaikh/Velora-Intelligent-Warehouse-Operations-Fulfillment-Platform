import prisma from '../backend/src/utils/db';

async function check(name: string, condition: boolean) {
  const status = condition ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`${status.padEnd(15)} | ${name}`);
  if (!condition) {
    throw new Error(`Check failed: ${name}`);
  }
}

async function main() {
  console.log('Verifying Database Integrity...\n');
  console.log(`STATUS | CHECK`);
  console.log(`-------|--------------------------------------------------`);

  try {
    const products = await prisma.product.count();
    await check('Product count >= 500', products >= 500);

    const orders = await prisma.order.count();
    await check('Order count >= 100', orders >= 100);

    const movements = await prisma.stockMovement.count();
    await check('Movement count >= 500', movements >= 500);

    const negOnHand = await prisma.inventory.count({ where: { onHandQuantity: { lt: 0 } } });
    await check('No negative on_hand_quantity', negOnHand === 0);

    const negReserved = await prisma.inventory.count({ where: { reservedQuantity: { lt: 0 } } });
    await check('No negative reserved_quantity', negReserved === 0);

    const allInventory = await prisma.inventory.findMany({
      select: { id: true, onHandQuantity: true, reservedQuantity: true }
    });
    const overReserved = allInventory.find(inv => inv.reservedQuantity > inv.onHandQuantity);
    await check('reserved_quantity <= on_hand_quantity for all inventory', !overReserved);

    // Group checks
    const duplicateSkus = await prisma.product.groupBy({
      by: ['sku'],
      having: { sku: { _count: { gt: 1 } } }
    });
    await check('No duplicate SKUs', duplicateSkus.length === 0);

    const duplicateLocations = await prisma.bin.groupBy({
      by: ['locationCode'],
      having: { locationCode: { _count: { gt: 1 } } }
    });
    await check('No duplicate location codes', duplicateLocations.length === 0);

    console.log('\nAll checks passed successfully!');
  } catch (error) {
    console.error('\nVerification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
