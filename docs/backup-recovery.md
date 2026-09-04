# Warehouse Inventory & Location Tracking System — Backup & Disaster Recovery Guide

## 1. Overview

In multi-warehouse operations, database failure or data loss can halt order picking and misplace physical inventory. This document outlines scheduled backups, point-in-time recovery, migration recovery, and consistency validation.

---

## 2. PostgreSQL Backup Procedures (Production)

### 2.1 Automated Nightly Dump (Logical Backup)
Use `pg_dump` with custom directory format (`-Fd`) or compressed tar:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/warehouse_db"
mkdir -p "$BACKUP_DIR"

# Compressed custom dump
pg_dump -h localhost -p 5432 -U warehouse_user -d warehouse_inventory \
        -Fc -Z 9 -f "$BACKUP_DIR/warehouse_inventory_${TIMESTAMP}.dump"

# Retain last 30 daily backups
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +30 -delete
```

### 2.2 Point-In-Time Recovery (Continuous Archiving / WAL)
For high-volume distribution centers, enable Write-Ahead Log (WAL) archiving in `postgresql.conf`:
```ini
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /mnt/wal_archive/%f && cp %p /mnt/wal_archive/%f'
```

---

## 3. Database Restoration Procedures

### 3.1 Restoring from pg_dump Archive
```bash
# Drop existing database connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'warehouse_inventory';"

# Recreate clean database
dropdb -U postgres warehouse_inventory
createdb -U postgres warehouse_inventory

# Restore using pg_restore
pg_restore -U warehouse_user -d warehouse_inventory -v "/var/backups/warehouse_db/warehouse_inventory_YYYYMMDD_HHMMSS.dump"
```

### 3.2 Running Integrity Verification Post-Restore
Immediately after any restoration, run the database integrity checker:
```bash
npm run verify-db
```
The script confirms:
- Zero negative `on_hand_quantity`
- Zero negative `reserved_quantity`
- Invariant satisfied: `reserved_quantity <= on_hand_quantity`
- Zero duplicate location codes or SKUs
- Complete referential integrity across warehouses, rows, bins, and products

---

## 4. SQLite Development Backup & Recovery

### Backup:
To create a live atomic backup without locking the database file:
```bash
# Using sqlite3 command line
sqlite3 backend/dev.db ".backup backend/dev_backup.db"
```
Or simply copy the SQLite file when the backend server is idle:
```powershell
Copy-Item "backend/dev.db" "backend/dev_backup.db"
```

### Restore:
```powershell
Copy-Item "backend/dev_backup.db" "backend/dev.db" -Force
```

---

## 5. Migration Failure Recovery

If a migration fails during deployment:
1. Identify the last clean migration state:
   ```bash
   npx prisma migrate status
   ```
2. If schema changes need to be rolled back, use the down migration script or resolve using:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
3. For local development, recreate database from scratch cleanly:
   ```bash
   npm run reset-db
   ```

---

## 6. Disaster Recovery Checklist

- [ ] Stop incoming API traffic (redirect frontend to maintenance mode)
- [ ] Terminate active database connections
- [ ] Restore latest verified database snapshot
- [ ] Run `npm run verify-db` to validate consistency invariants
- [ ] Verify Demo Order `ORD-2026-000001` and Demo SKU `WM-001` locations
- [ ] Start backend and confirm `GET /api/health/ready` returns `200 OK`
- [ ] Re-enable public API routing and resume picking operations
