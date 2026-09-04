# Warehouse Inventory & Location Tracking System — Deployment Guide

## 1. Deployment Overview

The Warehouse Inventory System can be deployed in three standard modes:
1. **Local Development:** Zero-config SQLite database (`file:./dev.db`)
2. **Production Multi-Container (Recommended):** Docker Compose running PostgreSQL 16, Node.js backend, and Vite frontend via Nginx
3. **Bare-Metal / Virtual Machine:** Dedicated PostgreSQL instance with PM2 managing Node.js and a static file host serving the React bundle

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the root and in `backend/.env`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

### Key Environment Variables

| Variable | Description | Example (Development) | Example (Production) |
|---|---|---|---|
| `PORT` | API Server listening port | `5000` | `5000` |
| `NODE_ENV` | Runtime environment | `development` | `production` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` | `postgresql://warehouse_user:warehouse_pass@postgres:5432/warehouse_inventory?schema=public` |
| `JWT_SECRET` | Signing key for authentication tokens | `dev-secret-key-change-in-production-abc123xyz` | `64_char_random_hex_string` |
| `JWT_EXPIRES_IN` | Token validity duration | `24h` | `12h` |
| `CORS_ORIGIN` | Allowed web frontend origin | `http://localhost:5173` | `https://warehouse.yourdomain.com` |
| `LOG_LEVEL` | Minimum log verbosity | `debug` or `info` | `info` or `warn` |
| `SEED` | PRNG seed for mock data generator | `12345` | `12345` |

---

## 3. Docker Deployment (Production)

The monorepo includes a complete `docker-compose.yml` defining all three services:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: wis-postgres
    environment:
      POSTGRES_USER: warehouse_user
      POSTGRES_PASSWORD: warehouse_pass
      POSTGRES_DB: warehouse_inventory
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U warehouse_user -d warehouse_inventory"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: wis-backend
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wis-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Launching Docker Compose:

```bash
docker-compose up -d --build
```

### Running Migrations & Seeding in Docker:

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

---

## 4. Bare-Metal / Node.js Production Deployment

### 4.1 Backend Setup
```bash
cd backend
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
```

Start using PM2 process manager:
```bash
pm2 start dist/server.js --name "warehouse-backend" --instances max -i max --env production
```

### 4.2 Frontend Setup
```bash
cd frontend
npm ci
npm run build
```
The resulting `frontend/dist` directory contains static assets ready to be served via Nginx, Caddy, or Cloudflare Pages.

Sample Nginx Configuration:
```nginx
server {
    listen 80;
    server_name warehouse.yourdomain.com;

    location / {
        root /var/www/warehouse-inventory/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-ID $request_id;
    }
}
```

---

## 5. Health Monitoring & Observability

The backend provides two built-in health probes:
- **Liveness Probe:** `GET /api/health`
  - Returns: `200 OK` with uptime and timestamp
- **Readiness Probe:** `GET /api/health/ready`
  - Executes a `SELECT 1` query against the database engine
  - Returns: `200 OK` if database is connected and responsive, `503 Service Unavailable` otherwise
