# E-Commerce Multi-Warehouse Inventory & Location Tracking System

An industry-level, full-stack application for managing warehouse physical storage, real-time live stock visibility, order allocation, stock reservation, picking workflows, transaction-safe inventory movements, and operational dashboard analytics.

---

## 🚀 Problem Statement

In modern e-commerce fulfillment centers, orders arrive continuously at high velocity. Warehouse picking staff face critical operational friction when systems lack precise physical location tracking:
- **Location Ambiguity:** Staff do not know which warehouse, row, or bin physically holds an ordered product.
- **Wrong-Pick & Overselling Errors:** Stock promised to one customer is accidentally picked for another due to lack of strict stock reservation.
- **Inefficient Pick Paths:** Pickers traverse long aisles looking for dispersed products instead of receiving single-bin or fewest-bin fulfillment paths.
- **Inconsistent Ledgers:** Moving stock during receiving or transfers without atomic transactions causes inventory drift, stock discrepancies, and difficult audits.

This application provides an authoritative, centralized system solving these problems end-to-end.

---

## 🏛️ System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │              React 18 + Vite Frontend                  │
               │   (TanStack Query, Tailwind CSS, Recharts, Lucide)     │
               └───────────────────────────┬────────────────────────────┘
                                           │  REST API (JSON / Bearer JWT)
                                           │  Proxy: /api -> :5000/api
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
               │   Development: SQLite (Zero-config local engine)       │
               └────────────────────────────────────────────────────────┘
```

---

## 📦 Physical Hierarchy & Location System

Location codes follow a globally unique format:
```text
WH01-A02-B03
 │    │   │
 │    │   └── Bin Code (e.g. B03)
 │    └────── Row Code (e.g. A02 - Office & Accessories Row)
 └─────────── Warehouse Code (e.g. WH01 - Main E-Commerce Warehouse)
```

### Relational Hierarchy:
```text
Warehouse (WH01)
   └── Row (A01, A02, A03, A04)
        └── Bin (B01...B25, locationCode: WH01-A02-B03, capacity: 100)
             └── Inventory (onHandQuantity: 50, reservedQuantity: 5)
                  └── Product (SKU: WM-001, Wireless Mouse)
```

$$\text{Available Quantity} = \text{On Hand Quantity} - \text{Reserved Quantity}$$

---

## 🔄 End-to-End Core Workflow

```text
Product Master
   ↓
Warehouse Hierarchy (Warehouse → Row → Bin)
   ↓
Product-to-Bin Mapping
   ↓
Live Inventory (On Hand, Reserved, Available)
   ↓
Customer Order (Intake: SKU × Qty)
   ↓
Optimal Inventory Allocation (Single-bin / Fewest-bin selection)
   ↓
Stock Reservation (Available quantity decrements; reserved increments)
   ↓
Picking Workflow (Picker sees large high-contrast WH01-A02-B03 badge)
   ↓
Stock Deduction (On Hand and Reserved decrease simultaneously)
   ↓
Stock Movement Ledger (Immutable OUTWARD entry recorded)
   ↓
Audit Trail (Operator action recorded with before/after state)
   ↓
Admin Dashboard & Reports (Real-time KPIs, Row stock chart, Utilization)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query v5, React Router v7, Recharts, Lucide React, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Zod, JWT, bcryptjs, Winston, Helmet, CORS |
| **Database** | SQLite (zero-config development) / PostgreSQL 16 (production) |
| **Testing** | Vitest (Unit & Integration tests) |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfiles |

---

## 📋 PS-3 Mandatory Requirements Compliance Matrix

| Requirement | Description | Status |
|---|---|---|
| **Req 1** | Warehouse hierarchy: `Warehouse → Row → Bin` | ✅ Complete |
| **Req 2** | Initial config: 1 warehouse, 4 rows, multiple bins | ✅ Complete (WH01, A01-A04, 100 bins) |
| **Req 3** | Unique location codes (`WH01-A01-B01`) | ✅ Complete (Strict UNIQUE constraint) |
| **Req 4** | Products mapped to physical bins | ✅ Complete (`Inventory` junction model) |
| **Req 5** | Live quantity maintained per location | ✅ Complete (`onHandQuantity`, `reservedQuantity`) |
| **Req 6** | Order intake system | ✅ Complete (`POST /api/orders`) |
| **Req 7** | Order item location lookup (Product, SKU, Bin, Available, Reserved) | ✅ Complete (`GET /api/orders/:id`) |
| **Req 8** | Stock movement history (Inward, Outward, Transfer, Adjust, Reserve, Release, Return) | ✅ Complete (Immutable `StockMovement` ledger) |
| **Req 9** | Instant product search showing all locations & quantities | ✅ Complete (`GET /api/inventory/search`) |
| **Req 10** | Admin dashboard with KPIs, row stock, low stock, utilization | ✅ Complete (`/api/dashboard/*`) |
| **Req 11** | Internal deterministic mock data generation (500–1000 SKUs, zero external datasets) | ✅ Complete (750 SKUs, 649 movements, 150 orders via PRNG) |
| **Req 12** | Consistent IDs across all relational tables | ✅ Complete (Referential integrity verified) |

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@example.com` | `admin123` | Full system access, User management, Audit logs |
| **Warehouse Manager** | `manager@example.com` | `manager123` | Inventory ops, Catalog, Orders, Reports |
| **Staff Member** | `staff@example.com` | `staff123` | Inward receipt, Stock transfer, Search |
| **Picker** | `picker@example.com` | `picker123` | Order picking, Location lookup, Outward fulfillment |

---

## 🎯 Demonstration Walkthrough Scenario

The deterministic seeder prepares the exact test scenario specified in the prompt:

1. **Pre-stocked Demo Product:**
   - **SKU:** `WM-001`
   - **Name:** `Wireless Mouse`
   - **Location:** `WH01-A02-B03`
   - **On Hand:** `50 units`
   - **Reserved:** `0 units`
   - **Available:** `50 units` (exceeds the required 28 units)

2. **Pre-created Demo Order:**
   - **Order Number:** `ORD-2026-000001`
   - **Requested Item:** `WM-001` × `5 units`
   - **Current Status:** `PENDING`

3. **Step-by-Step Execution:**
   - **Step 1 (Search):** Search `WM-001` on `/inventory/search`. System immediately displays `WH01-A02-B03` with 50 units available.
   - **Step 2 (Allocate):** Open `ORD-2026-000001` on `/orders/ord_demo_1`. Click **Allocate**. System selects `WH01-A02-B03`. Status becomes `ALLOCATED`.
   - **Step 3 (Reserve):** Click **Reserve**. System increments reserved quantity by 5. Available stock decreases from 50 to 45. Status becomes `RESERVED`.
   - **Step 4 (Pick):** Open `/picking`. Picker sees large, prominent badge `LOCATION: WH01-A02-B03`, `PICK: 5 UNITS`. Click **Confirm Pick**.
   - **Step 5 (Commit & Complete):** Stock decreases by 5 units (`onHand: 45`, `reserved: 0`). An immutable `OUTWARD` stock movement is added to the ledger, audit log is written, and order status transitions to `COMPLETED`.
   - **Step 6 (Verify Dashboard):** Dashboard KPIs, row stock charts, and recent movements reflect the pick in real time.

---

## 💻 Installation & Quick Start

### 1. Prerequisites
- Node.js >= 18.0.0 (Installed: v24.19.0)
- npm >= 9.0.0

### 2. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup & Seeding
```bash
cd backend

# Initialize SQLite database schema
npx prisma db push

# Run deterministic mock data generator
npm run seed

# Verify database integrity invariants
npm run verify-db
```

### 4. Running Automated Tests
```bash
cd backend
npm test
```
Runs 24 automated unit and integration tests verifying stock calculations, state machine transitions, order fulfillment, and database integrity.

### 5. Start Application

#### Start Backend (Port 5000):
```bash
cd backend
npm run dev
```

#### Start Frontend (Port 5173):
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser and log in with `admin@example.com` / `admin123`.

---

## 📁 Monorepo Project Structure

```text
warehouse-inventory-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 11 models with relationships and indexes
│   │   └── seed.ts             # Deterministic PRNG seeder (750 SKUs, 649 movements)
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── controllers/        # Thin HTTP controllers (Auth, Inventory, Orders, etc.)
│   │   ├── middleware/         # Auth, RBAC, Request-ID, Error Handler, Idempotency
│   │   ├── routes/             # Express route declarations
│   │   ├── services/           # Authoritative business logic & transactions
│   │   ├── types/              # Enums and TypeScript interfaces
│   │   ├── utils/              # Winston logger, Errors, DB singleton, Pagination, CSV
│   │   ├── validators/         # Zod schema validation
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap and graceful shutdown
│   ├── tests/
│   │   ├── integration/        # Order and Inventory integration tests
│   │   ├── unit/               # Inventory arithmetic and state machine unit tests
│   │   └── setup.ts            # Test environment configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API client modules
│   │   ├── components/         # LocationCard, DataTable, KPICard, StatusBadge, Modals
│   │   ├── hooks/              # useAuth, useDebounce
│   │   ├── layouts/            # DashboardLayout (Sidebar, TopNav) and AuthLayout
│   │   ├── pages/              # Dashboard, Products, Inventory, Orders, Picking, etc.
│   │   ├── router/             # React Router with protected role-based routes
│   │   ├── types/              # Frontend TypeScript interfaces
│   │   ├── App.tsx             # Root application component
│   │   ├── main.tsx            # Entry point with React Query provider
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── scripts/
│   ├── generate-data.ts        # CLI data generator with customizable flags
│   ├── reset-db.ts             # Clean schema push and re-seed
│   └── verify-data.ts          # Database invariant verification suite
│
├── docs/
│   ├── architecture.md         # Detailed architectural diagrams and design decisions
│   ├── database.md             # Data dictionaries, constraints, and ER model
│   ├── api.md                  # Comprehensive API reference for 40+ endpoints
│   ├── deployment.md           # Docker Compose, Nginx, and production hosting
│   └── backup-recovery.md      # Disaster recovery and backup procedures
│
├── docker-compose.yml          # Multi-service production deployment
├── .env.example                # Environment template
└── README.md                   # Master project documentation
```

---

## 🔒 Security & Concurrency Design

- **Row-Level & Interactive Transactions:** Inventory mutations run in `prisma.$transaction`.
- **Zero Overselling Guarantee:** Stock reservation strictly verifies `onHand - reserved >= requestedQty`.
- **Idempotency Protection:** Prevents network retries from double-deducting stock via `X-Idempotency-Key`.
- **Password Security:** Salted password hashing via `bcryptjs` (work factor 10).
- **HTTP Hardening:** Secured via `helmet`, CORS restriction, and rate limiting.
- **Append-Only Auditing:** Every state change records `AuditLog` and `StockMovement` records without altering historical rows.
