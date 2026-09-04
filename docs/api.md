# Warehouse Inventory & Location Tracking System — API Documentation

## Base URL & General Conventions

- **Base URL:** `/api`
- **Default Port:** `5000`
- **Authentication:** Standard HTTP Bearer token in the `Authorization` header: `Bearer <token>`
- **Content-Type:** `application/json` (except file export endpoints which stream `text/csv`)
- **Tracing Header:** `X-Request-ID` is assigned or propagated on every request
- **Idempotency Header:** `X-Idempotency-Key` supported for inventory mutations (`/inward`, `/outward`, `/transfer`)

### Standard Response Envelope

#### Success:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message"
}
```

#### Paginated List:
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": {
      "total": 750,
      "page": 1,
      "limit": 25,
      "totalPages": 30
    }
  }
}
```

#### Error:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient available inventory in selected bin"
  }
}
```

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticate warehouse staff or administrator.

- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_admin",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  },
  "message": "Login successful"
}
```
- **Error (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

---

## 2. Product Management

### `GET /api/products`
List all products with pagination, search, and sorting.

- **Auth Required:** Yes
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 25, max: 100)
  - `search` (searches SKU, Barcode, Name)
  - `sort` (e.g. `name`, `sku`, `unitPrice`, `createdAt`)
  - `order` (`asc` | `desc`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "prod_wm_001",
        "sku": "WM-001",
        "barcode": "1234567890123",
        "name": "Wireless Mouse",
        "category": "Electronics",
        "unitPrice": 15.99,
        "reorderLevel": 10,
        "status": "ACTIVE",
        "totalQuantity": 50
      }
    ],
    "meta": { "total": 750, "page": 1, "limit": 25, "totalPages": 30 }
  }
}
```

### `GET /api/products/:id`
Get a product by ID along with all its physical inventory locations (Warehouse, Row, Bin, On Hand, Reserved, Available).

- **Auth Required:** Yes
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "prod_wm_001",
    "sku": "WM-001",
    "barcode": "1234567890123",
    "name": "Wireless Mouse",
    "category": "Electronics",
    "unitPrice": 15.99,
    "reorderLevel": 10,
    "status": "ACTIVE",
    "inventories": [
      {
        "id": "inv_demo_1",
        "onHandQuantity": 50,
        "reservedQuantity": 0,
        "bin": {
          "id": "bin_a02_b03",
          "code": "B03",
          "locationCode": "WH01-A02-B03",
          "capacity": 100,
          "row": {
            "id": "row_a02",
            "code": "A02",
            "name": "Office & Accessories Row",
            "warehouse": {
              "id": "wh_main",
              "code": "WH01",
              "name": "Main E-Commerce Warehouse"
            }
          }
        }
      }
    ]
  }
}
```

### `POST /api/products`
Create a new product.

- **Auth Required:** Yes (`ADMIN` or `WAREHOUSE_MANAGER`)
- **Request Body:**
```json
{
  "sku": "KB-001",
  "barcode": "900123456789",
  "name": "Mechanical Gaming Keyboard",
  "category": "Electronics",
  "unitPrice": 59.99,
  "reorderLevel": 15
}
```

---

## 3. Warehouse Hierarchy (Warehouse → Row → Bin)

### `GET /api/warehouses`
List all warehouses.

### `GET /api/warehouses/:id`
Get warehouse detail with rows.

### `GET /api/warehouses/:id/rows`
List all rows for a warehouse.

### `GET /api/rows/:id`
Get row detail with bins, capacity, and current utilization.

### `GET /api/rows/:id/bins`
List all bins in a row with live occupancy.

### `GET /api/bins/:id`
Get bin detail including all stored products and available capacity.

---

## 4. Live Inventory & Location Tracking

### `GET /api/inventory`
Get paginated live inventory across all locations.

- **Query Parameters:** `page`, `limit`, `search`, `sort`, `order`
- **Response Items:**
  - `product` (SKU, Name, Category)
  - `bin` (Location Code: e.g. `WH01-A02-B03`)
  - `onHandQuantity`
  - `reservedQuantity`
  - `availableQuantity` (`onHandQuantity - reservedQuantity`)

### `GET /api/inventory/search?q=:query`
Fast global location search.
- **Search terms:** Product Name, SKU, Barcode, or Location Code (e.g. `WM-001`, `WH01-A02-B03`)
- Returns immediate physical coordinates and stock quantities.

### `POST /api/inventory/inward`
Receive incoming inventory into a designated bin.

- **Auth Required:** Yes
- **Headers:** `X-Idempotency-Key` (optional)
- **Request Body:**
```json
{
  "productId": "prod_wm_001",
  "binId": "bin_a02_b03",
  "quantity": 25,
  "reason": "PO-98231 Purchase Inward"
}
```
- **Guarantees:**
  - Validates bin capacity before insertion.
  - Updates `onHandQuantity` atomically.
  - Generates immutable `INWARD` stock movement ledger entry.
  - Creates append-only audit trail.

### `POST /api/inventory/transfer`
Transfer stock from one physical bin to another.

- **Auth Required:** Yes
- **Request Body:**
```json
{
  "productId": "prod_wm_001",
  "sourceBinId": "bin_a02_b03",
  "destinationBinId": "bin_a01_b05",
  "quantity": 10,
  "reason": "Space optimization"
}
```
- **Guarantees:**
  - Validates source available quantity (`onHand - reserved >= quantity`).
  - Validates destination bin capacity.
  - Atomic transfer in a database transaction (`prisma.$transaction`).
  - Generates immutable `TRANSFER` stock movement ledger record.

### `POST /api/inventory/adjust`
Cycle-count or discrepancy stock adjustment.

- **Auth Required:** Yes (`ADMIN` or `WAREHOUSE_MANAGER`)
- **Request Body:**
```json
{
  "productId": "prod_wm_001",
  "binId": "bin_a02_b03",
  "quantity": -2,
  "reason": "Damaged unit write-off during audit"
}
```

---

## 5. Order Fulfillment & Picking Lifecycle

### `GET /api/orders`
List orders with status filters and item counts.

- **Query Parameters:** `status`, `page`, `limit`, `search`

### `POST /api/orders`
Intake a new customer order.

- **Request Body:**
```json
{
  "customerReference": "CUST-98214",
  "items": [
    { "sku": "WM-001", "quantity": 5 }
  ]
}
```
- **Initial Status:** `PENDING`

### `POST /api/orders/:id/allocate`
Allocate stock for the order from optimal physical bin locations.
- **Strategy:** Prioritizes single-bin fulfillment / fewest bins.
- **State Transition:** `PENDING` → `ALLOCATED`

### `POST /api/orders/:id/reserve`
Reserve allocated stock in live inventory.
- **Guarantees:**
  - Atomic increment of `reservedQuantity` on inventory record.
  - Available stock (`onHand - reserved`) immediately decreases for other shoppers.
  - Generates `RESERVATION` movement record.
- **State Transition:** `ALLOCATED` → `RESERVED`

### `POST /api/orders/:id/release`
Release reservation back to general stock pool.
- **State Transition:** `RESERVED` → `PENDING`

### `POST /api/orders/:id/pick`
Confirm physical picking by warehouse staff.
- **Request Body:**
```json
{
  "items": [
    { "orderItemId": "item_demo_1", "quantity": 5 }
  ]
}
```
- **Guarantees:**
  - Deducts `onHandQuantity` and `reservedQuantity` simultaneously.
  - Generates `OUTWARD` stock movement ledger entry.
  - Records picking operator in audit trail.
- **State Transition:** `RESERVED` → `PICKING` → `PICKED`

### `POST /api/orders/:id/complete`
Mark order fulfillment complete.
- **State Transition:** `PICKED` → `COMPLETED`

### `POST /api/orders/:id/cancel`
Cancel order and automatically release reserved stock if reserved.
- **State Transition:** Any active state → `CANCELLED`

---

## 6. Stock Movement Ledger & Audit Logs

### `GET /api/movements`
Query immutable stock ledger.
- **Query Parameters:** `page`, `limit`, `type`, `productId`, `startDate`, `endDate`
- Types: `INWARD`, `OUTWARD`, `TRANSFER`, `ADJUSTMENT`, `RESERVATION`, `RELEASE`, `RETURN`

### `GET /api/audit-logs`
Query immutable system audit log.
- **Auth Required:** `ADMIN`
- Returns user actions, before/after JSON snapshots, and IP addresses.

---

## 7. Dashboard & Analytics

### `GET /api/dashboard/summary`
Core operational KPIs:
- `totalProducts`, `totalUnits`, `availableUnits`, `reservedUnits`
- `lowStockCount`, `totalBins`, `occupiedBins`, `binUtilizationRate`
- `pendingOrders`, `pickingOrders`, `completedOrders`

### `GET /api/dashboard/row-stock`
Stock quantity aggregated by warehouse row (A01, A02, A03, A04).

### `GET /api/dashboard/low-stock`
Low-stock alerts with severity ratings (`CRITICAL` vs `LOW`).

### `GET /api/dashboard/bin-utilization`
Distribution of bin utilization percentages (`EMPTY`, `AVAILABLE`, `NEAR_CAPACITY`, `FULL`).

---

## 8. CSV Reporting Endpoints

- `GET /api/reports/inventory` — Full stock inventory export as CSV
- `GET /api/reports/low-stock` — Low-stock alerts export
- `GET /api/reports/movements` — Complete ledger export
- `GET /api/reports/orders` — Order fulfillment report
- `GET /api/reports/bin-utilization` — Bin occupancy report

---

## 9. Health & Readiness

- `GET /api/health` — Status: `ok`, uptime, current server timestamp
- `GET /api/health/ready` — Verifies database connection readiness
