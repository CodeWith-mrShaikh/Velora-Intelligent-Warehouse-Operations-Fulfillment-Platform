# Multi-stage production build for backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY src ./src/
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

RUN npm ci

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "scripts/start.js"]
