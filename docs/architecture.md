# Warehouse Inventory & Location Tracking System — Architecture

## 1. High-Level Architecture Overview

The system implements an industry-grade, layered monorepo architecture separating the presentation, application, domain, and data persistence layers.

```text
               ┌────────────────────────────────────────────────────────┐
               │              React 18 + Vite Frontend                  │
               │   (TanStack Query, Tailwind CSS, Recharts, Lucide)     │
               └───────────────────────────┬────────────────────────────┘
                                           │  REST API (JSON / Bearer JWT)
                                           │  Base URL: /api
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │             Express.js Application Layer               │
               │   Helmet, CORS, Request-ID, Winston Structured Logging │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │             Middleware & Routing Pipeline              │
               │   JWT Authenticator, Role-Based Access Control (RBAC), │
               │   Zod Schema Validation, Idempotency Interceptor       │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                    Controllers                         │
               │   Extract DTOs, invoke services, wrap unified responses│
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │               Business Services Layer                  │
               │   Order State Machine, Optimal Single-Bin Allocation,  │
               │   Transaction-Safe Inward/Transfer/Adjust, Audit Logs  │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 Prisma ORM Layer                       │
               │   Interactive Transactions, Row Locking, Type Safety   │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │              Database Engine Layer                     │
               │   Primary: PostgreSQL (Production)                     │
               │   Development: SQLite (Self-contained zero-config)    │
               └────────────────────────────────────────────────────────┘
```

---

## 2. Warehouse Hierarchy & Inventory Relationship

To prevent location anomalies, location data is strictly normalized. Inventory records **never duplicate** `warehouseId` or `rowId` — physical coordinates are resolved cleanly via relational traversal:

```text
WAREHOUSE (WH01)
   │
   └── ROW (A01, A02, A03, A04)
        │
        └── BIN (B01...B25, locationCode: WH01-A02-B03, capacity: 100)
             │
             └── INVENTORY (onHandQuantity: 50, reservedQuantity: 5)
                    │
                    └── PRODUCT (SKU: WM-001, Barcode, Name, UnitPrice)
```

### Exact Location Calculation:
$$\text{Available Quantity} = \text{On Hand Quantity} - \text{Reserved Quantity}$$
Where:
- $\text{On Hand Quantity} \ge 0$
- $\text{Reserved Quantity} \ge 0$
- $\text{Reserved Quantity} \le \text{On Hand Quantity}$

---

## 3. Order State Machine & Allocation Flow

```text
            ┌──────────────────┐
            │     PENDING      │
            └────────┬─────────┘
                     │ allocate() [Calculates optimal bins, prefers single-bin]
                     ▼
            ┌──────────────────┐
            │    ALLOCATED     │───────────────┐
            └────────┬─────────┘               │
                     │ reserve()               │
                     │ [Increments reserved,   │ cancel()
                     │  locks available stock] │ [Releases stock back to bin]
                     ▼                         │
            ┌──────────────────┐               │
            │     RESERVED     │───────────────┤
            └────────┬─────────┘               │
                     │ pick()                  │
                     ▼                         ▼
            ┌──────────────────┐      ┌──────────────────┐
            │     PICKING      │      │    CANCELLED     │
            └────────┬─────────┘      └──────────────────┘
                     │ [All items picked]
                     ▼
            ┌──────────────────┐
            │      PICKED      │
            └────────┬─────────┘
                     │ complete() [Deducts stock & writes OUTWARD movement]
                     ▼
            ┌──────────────────┐
            │    COMPLETED     │
            └──────────────────┘
```

---

## 4. Picking & Stock Movement Ledger

All changes to inventory are append-only in the **Stock Movement Ledger**. Historical movements are never updated or deleted:

```text
Order Item Picked
       │
       ▼
┌───────────────────────────┐
│ Database Transaction      │
│ 1. Validate reserved qty  │
│ 2. Deduct onHandQuantity  │
│ 3. Deduct reservedQuantity│
│ 4. Insert OUTWARD movement│
│ 5. Insert AuditLog record │
│ 6. Commit or Rollback     │
└──────────────┬────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│ StockMovement Ledger (Immutable)                               │
│ - id: mov_382                                                  │
│ - movementType: OUTWARD                                        │
│ - productId: prod_wm_001                                       │
│ - sourceBinId: bin_a02_b03 (Location: WH01-A02-B03)           │
│ - destinationBinId: null                                       │
│ - quantity: 5                                                  │
│ - referenceType: ORDER                                         │
│ - referenceId: ord_demo_1                                      │
│ - performedBy: usr_picker                                      │
│ - createdAt: 2026-09-04T22:30:00Z                              │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Concurrency Protection & Idempotency

### Concurrency Protection:
1. **Interactive Database Transactions:** All multi-step inventory mutations (receiving, outward, transfer, reserving, picking) run inside `prisma.$transaction`.
2. **Atomic In-Memory Operations:** Arithmetic increments/decrements are executed at the database engine level (`{ increment: qty }`, `{ decrement: qty }`) preventing race condition overwrites.
3. **Optimistic Versioning:** Every `Inventory` row has a `version: Int` counter incremented with every mutation.

### Idempotency:
1. APIs accepting `X-Idempotency-Key` check the `IdempotencyKey` table.
2. If the key was processed within the TTL (24 hours), the cached response is immediately returned without re-executing stock movements.
3. If new, the transaction commits the result alongside the idempotency record.

---

## 6. Frontend Architecture & Usability Principles

1. **Server State Management:** Powered by `@tanstack/react-query` with automatic cache invalidation upon any inventory mutation.
2. **Prominent Location Presentation:** Staff interfaces prominently display `WH01-A02-B03` in large high-contrast badges for rapid picking in high-bay warehouse environments.
3. **Instant Search:** Debounced multi-field search against SKU, Barcode, Product Name, and physical location coordinates.
4. **Responsive Layouts:** Dedicated tablet/mobile views for warehouse floor workers alongside full widescreen dashboards for inventory supervisors.
