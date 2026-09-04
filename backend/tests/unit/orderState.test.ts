import { describe, it, expect } from 'vitest';

describe('Order State Machine Tests', () => {
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['ALLOCATED', 'CANCELLED'],
    'ALLOCATED': ['RESERVED', 'CANCELLED'],
    'RESERVED': ['PICKING', 'CANCELLED'],
    'PICKING': ['PICKED'],
    'PICKED': ['COMPLETED'],
    'COMPLETED': [],
    'CANCELLED': []
  };

  function canTransition(from: string, to: string) {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it('PENDING -> ALLOCATED: valid', () => expect(canTransition('PENDING', 'ALLOCATED')).toBe(true));
  it('PENDING -> CANCELLED: valid', () => expect(canTransition('PENDING', 'CANCELLED')).toBe(true));
  it('ALLOCATED -> RESERVED: valid', () => expect(canTransition('ALLOCATED', 'RESERVED')).toBe(true));
  it('ALLOCATED -> CANCELLED: valid', () => expect(canTransition('ALLOCATED', 'CANCELLED')).toBe(true));
  it('RESERVED -> PICKING: valid', () => expect(canTransition('RESERVED', 'PICKING')).toBe(true));
  it('PICKING -> PICKED: valid', () => expect(canTransition('PICKING', 'PICKED')).toBe(true));
  it('PICKED -> COMPLETED: valid', () => expect(canTransition('PICKED', 'COMPLETED')).toBe(true));
  
  it('PENDING -> COMPLETED: invalid', () => expect(canTransition('PENDING', 'COMPLETED')).toBe(false));
  it('COMPLETED -> PENDING: invalid', () => expect(canTransition('COMPLETED', 'PENDING')).toBe(false));
  it('CANCELLED -> anything: invalid', () => expect(canTransition('CANCELLED', 'PENDING')).toBe(false));
  it('COMPLETED -> CANCELLED: invalid', () => expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false));
});
