export type Role = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'MANAGER' | 'STAFF' | 'PICKER';

export type OrderStatus = 'PENDING' | 'ALLOCATED' | 'RESERVED' | 'PICKING' | 'PICKED' | 'COMPLETED' | 'CANCELLED';

export type MovementType = 'INWARD' | 'OUTWARD' | 'TRANSFER' | 'ADJUSTMENT' | 'PICKING' | 'RESERVATION' | 'RELEASE' | 'RETURN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  location?: string;
  capacity?: number;
  status?: string;
}

export interface WarehouseRow {
  id: string;
  warehouseId: string;
  code: string;
  name?: string;
  description?: string;
  warehouse?: Warehouse;
}

export interface Bin {
  id: string;
  rowId: string;
  code: string;
  locationCode: string;
  capacity: number;
  currentQuantity?: number;
  status?: string;
  row?: WarehouseRow & { warehouse?: Warehouse };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  unitPrice?: number;
  reorderLevel: number;
  barcode?: string;
  status: string;
  totalStock?: number;
}

export interface Inventory {
  id: string;
  productId: string;
  binId: string;
  quantity: number;
  reserved: number;
  available: number;
  product?: Product;
  bin?: Bin & { row?: WarehouseRow & { warehouse?: Warehouse } };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerRef: string;
  status: OrderStatus;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  requestedQty: number;
  allocatedQty: number;
  reservedQty: number;
  pickedQty: number;
  status: OrderStatus;
  product?: Product;
  allocations?: any[];
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  sourceBinId?: string;
  destinationBinId?: string;
  referenceId?: string;
  userId: string;
  reason?: string;
  createdAt: string;
  product?: Product;
  user?: User;
  sourceBin?: Bin;
  destinationBin?: Bin;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  user?: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  totalSkus: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  lowStockItemsCount: number;
  pendingOrdersCount: number;
}

export interface RowStock {
  rowId: string;
  rowCode: string;
  totalUnits: number;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  totalStock: number;
  reorderLevel: number;
}

export interface BinUtilization {
  range: string;
  count: number;
}
