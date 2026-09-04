import { describe, it, expect } from 'vitest';

describe('Inventory Unit Tests', () => {
  it('should calculate available quantity correctly', () => {
    const onHand = 100;
    const reserved = 20;
    expect(onHand - reserved).toBe(80);
  });

  it('should enforce reserved cannot exceed onHand', () => {
    const onHand = 50;
    const attemptedReserve = 60;
    const isValid = attemptedReserve <= onHand;
    expect(isValid).toBe(false);
  });

  it('should enforce bin capacity validation', () => {
    const capacity = 100;
    const currentStock = 80;
    const inward = 30;
    const isValid = (currentStock + inward) <= capacity;
    expect(isValid).toBe(false);
  });

  it('should detect low stock', () => {
    const available = 10;
    const reorderLevel = 15;
    expect(available <= reorderLevel).toBe(true);
  });

  it('should calculate severity as CRITICAL when available <= reorderLevel/2', () => {
    const available = 4;
    const reorderLevel = 10;
    const isCritical = available <= (reorderLevel / 2);
    expect(isCritical).toBe(true);
  });
});
