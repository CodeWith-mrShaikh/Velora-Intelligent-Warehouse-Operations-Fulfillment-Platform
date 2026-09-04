import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../setup';

describe('Order Integration Tests', () => {
  let orderId = 'int_ord_1';
  let userId = 'int_user_1';
  
  beforeAll(async () => {
    await prisma.user.create({ data: { id: userId, email: 'int@test.com', passwordHash: 'hash', role: 'ADMIN', name: 'Test', status: 'ACTIVE' }});
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { orderId }});
    await prisma.order.deleteMany({ where: { id: orderId }});
    await prisma.user.deleteMany({ where: { id: userId }});
  });

  it('Test create order', async () => {
    const order = await prisma.order.create({
      data: { id: orderId, orderNumber: 'ORD-INT-1', status: 'PENDING', customerReference: 'CUST', createdBy: userId }
    });
    expect(order.status).toBe('PENDING');
  });

  it('Test allocate order', async () => {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ALLOCATED' }
    });
    expect(order.status).toBe('ALLOCATED');
  });

  it('Test reserve order', async () => {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'RESERVED' }
    });
    expect(order.status).toBe('RESERVED');
  });

  it('Test pick order', async () => {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PICKING' }
    });
    expect(order.status).toBe('PICKING');
  });

  it('Test complete order', async () => {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' }
    });
    expect(order.status).toBe('COMPLETED');
  });
});
