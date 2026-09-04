# Warehouse Inventory & Location Tracking System — Database Reference

## 1. Relational Schema & Data Modeling

The database schema is managed via Prisma ORM. It is strictly normalized to guarantee that inventory locations can never diverge from the physical warehouse layout.

### Entity Relationship Model

```text
User ──────────────────────────┬─── (Created By) ─── Order
                               ├─── (Performed By) ── StockMovement
                               └─── (User) ───────── AuditLog

Warehouse (1) ──< WarehouseRow (N) ──< Bin (N) ──< Inventory (N) >── Product (1)
                                         │
                                         ├──< StockMovement (Source Bin)
                                         ├──< StockMovement (Destination Bin)
                                         └──< OrderItem (Allocated Bin)

Order (1) ──< OrderItem (N) >── Product (1)
```

---

## 2. Model Definitions & Data Dictionaries

### 2.1 `users`
Warehouse operators and administrators.
- `id`: UUID Primary Key
- `name`: Text (Display name)
- `email`: Text, UNIQUE
- `password_hash`: Text (bcrypt salted hash)
- `role`: Enum (`ADMIN`, `WAREHOUSE_MANAGER`, `STAFF`, `PICKER`)
- `status`: Enum (`ACTIVE`, `INACTIVE`)
- `created_at`, `updated_at`: Timestamps (UTC)

### 2.2 `warehouses`
Physical fulfillment centers.
- `id`: UUID Primary Key
- `code`: Text, UNIQUE (e.g. `WH01`)
- `name`: Text
- `address`: Text (Optional)
- `status`: Enum (`ACTIVE`, `INACTIVE`, `ARCHIVED`)
- `created_at`, `updated_at`: Timestamps (UTC)

### 2.3 `warehouse_rows`
Aisle/row structures inside a warehouse.
- `id`: UUID Primary Key
- `warehouse_id`: UUID Foreign Key → `warehouses.id`
- `code`: Text (e.g. `A01`, `A02`, `A03`, `A04`)
- `name`: Text (e.g. `Electronics & Computing Row`)
- `description`: Text (Optional)
- `status`: Enum (`ACTIVE`, `INACTIVE`, `ARCHIVED`)
- `created_at`, `updated_at`: Timestamps (UTC)
- **Constraint:** `UNIQUE(warehouse_id, code)`
- **Index:** `(warehouse_id)`

### 2.4 `bins`
Individual physical storage cells on warehouse shelves.
- `id`: UUID Primary Key
- `row_id`: UUID Foreign Key → `warehouse_rows.id`
- `code`: Text (e.g. `B01`, `B02` ... `B25`)
- `location_code`: Text, UNIQUE (e.g. `WH01-A02-B03`)
- `capacity`: Integer (Maximum physical unit capacity, default: 100)
- `status`: Enum (`ACTIVE`, `INACTIVE`, `MAINTENANCE`)
- `created_at`, `updated_at`: Timestamps (UTC)
- **Constraint:** `UNIQUE(row_id, code)`
- **Indexes:** `(row_id)`, `(location_code)`

### 2.5 `products`
Master catalog of SKUs.
- `id`: UUID Primary Key
- `sku`: Text, UNIQUE (e.g. `WM-001`, `EL-002`)
- `barcode`: Text, UNIQUE Optional (EAN-13 format)
- `name`: Text (e.g. `Wireless Mouse`)
- `description`: Text (Optional)
- `category`: Text (e.g. `Electronics`, `Office Supplies`)
- `unit_price`: Decimal (Monetary price)
- `reorder_level`: Integer (Low stock threshold, default: 10)
- `status`: Enum (`ACTIVE`, `INACTIVE`, `ARCHIVED`)
- `created_at`, `updated_at`: Timestamps (UTC)
- **Indexes:** `(sku)`, `(barcode)`, `(name)`, `(category)`

### 2.6 `inventory`
Authoritative live stock linking a Product to a Bin.
- `id`: UUID Primary Key
- `product_id`: UUID Foreign Key → `products.id`
- `bin_id`: UUID Foreign Key → `bins.id`
- `on_hand_quantity`: Integer (Total physical units in bin $\ge 0$)
- `reserved_quantity`: Integer (Units soft-locked for allocated orders $\ge 0$)
- `version`: Integer (Optimistic locking version counter)
- `created_at`, `updated_at`: Timestamps (UTC)
- **Constraint:** `UNIQUE(product_id, bin_id)`
- **Indexes:** `(product_id)`, `(bin_id)`

### 2.7 `orders`
Customer fulfillment requests.
- `id`: UUID Primary Key
- `order_number`: Text, UNIQUE (e.g. `ORD-2026-000001`)
- `customer_reference`: Text (Optional customer PO/ref)
- `status`: Enum (`PENDING`, `ALLOCATED`, `RESERVED`, `PICKING`, `PICKED`, `COMPLETED`, `CANCELLED`)
- `total_amount`: Decimal
- `created_by`: UUID Foreign Key → `users.id`
- `created_at`, `updated_at`: Timestamps (UTC)
- **Indexes:** `(order_number)`, `(status)`, `(created_at)`

### 2.8 `order_items`
Line items for an order.
- `id`: UUID Primary Key
- `order_id`: UUID Foreign Key → `orders.id`
- `product_id`: UUID Foreign Key → `products.id`
- `requested_quantity`: Integer
- `allocated_quantity`: Integer (Default: 0)
- `reserved_quantity`: Integer (Default: 0)
- `picked_quantity`: Integer (Default: 0)
- `allocated_bin_id`: UUID Foreign Key → `bins.id` (Physical source bin)
- `status`: Enum (`PENDING`, `ALLOCATED`, `RESERVED`, `PICKING`, `PICKED`, `CANCELLED`)
- `created_at`, `updated_at`: Timestamps (UTC)
- **Indexes:** `(order_id)`, `(product_id)`

### 2.9 `stock_movements` (Immutable Ledger)
Append-only historical ledger of all stock changes.
- `id`: UUID Primary Key
- `movement_type`: Enum (`INWARD`, `OUTWARD`, `TRANSFER`, `ADJUSTMENT`, `RESERVATION`, `RELEASE`, `RETURN`)
- `product_id`: UUID Foreign Key → `products.id`
- `source_bin_id`: UUID Foreign Key → `bins.id` (Optional)
- `destination_bin_id`: UUID Foreign Key → `bins.id` (Optional)
- `quantity`: Integer (Units moved)
- `reference_type`: Text (e.g. `ORDER`, `RECEIPT`, `TRANSFER`, `ADJUSTMENT`)
- `reference_id`: Text (Identifier of associated entity)
- `performed_by`: UUID Foreign Key → `users.id`
- `reason`: Text (Audit context)
- `idempotency_key`: Text, UNIQUE (Optional key preventing duplicate operations)
- `created_at`: Timestamp (UTC)
- **Indexes:** `(product_id)`, `(movement_type)`, `(created_at)`, `(reference_type, reference_id)`

### 2.10 `audit_logs`
System-wide audit trail.
- `id`: UUID Primary Key
- `user_id`: UUID Foreign Key → `users.id` (Optional)
- `action`: Text (e.g. `LOGIN`, `INWARD`, `TRANSFER`, `PICK`, `CANCEL`)
- `entity_type`: Text (e.g. `INVENTORY`, `ORDER`, `PRODUCT`)
- `entity_id`: Text (Optional)
- `before_data`: Text (JSON string)
- `after_data`: Text (JSON string)
- `ip_address`: Text (Optional)
- `created_at`: Timestamp (UTC)
- **Indexes:** `(entity_type, entity_id)`, `(user_id)`, `(created_at)`

---

## 3. Database Consistency Rules & Invariants

1. **No Negative Stock:** `on_hand_quantity >= 0` and `reserved_quantity >= 0`.
2. **Reservation Invariant:** `reserved_quantity <= on_hand_quantity`.
3. **Bin Capacity Constraint:** $\sum \text{onHandQuantity}_{\text{bin}} \le \text{Bin.capacity}$.
4. **Normalized Location Integrity:** Physical coordinates are always derived through `Inventory → Bin → Row → Warehouse`, eliminating conflicting location records.
5. **Ledger Immutability:** Rows in `stock_movements` and `audit_logs` are strictly append-only. Corrections create offsetting `ADJUSTMENT` entries.
