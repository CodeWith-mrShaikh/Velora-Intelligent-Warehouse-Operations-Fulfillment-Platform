export enum Role {
  ADMIN = 'ADMIN',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  STAFF = 'STAFF',
  PICKER = 'PICKER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ALLOCATED = 'ALLOCATED',
  RESERVED = 'RESERVED',
  PICKING = 'PICKING',
  PICKED = 'PICKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  ALLOCATED = 'ALLOCATED',
  RESERVED = 'RESERVED',
  PICKING = 'PICKING',
  PICKED = 'PICKED',
  CANCELLED = 'CANCELLED'
}

export enum MovementType {
  INWARD = 'INWARD',
  OUTWARD = 'OUTWARD',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
  RETURN = 'RETURN'
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum BinStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export const ValidOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ALLOCATED, OrderStatus.CANCELLED],
  [OrderStatus.ALLOCATED]: [OrderStatus.RESERVED, OrderStatus.CANCELLED],
  [OrderStatus.RESERVED]: [OrderStatus.PICKING, OrderStatus.CANCELLED], // RELEASED goes to PENDING, but we model it differently
  [OrderStatus.PICKING]: [OrderStatus.PICKED],
  [OrderStatus.PICKED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: []
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}
