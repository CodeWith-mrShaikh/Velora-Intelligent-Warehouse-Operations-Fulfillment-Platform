# Multi-stage production build for frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
RUN npm ci

COPY src ./src/
RUN npm run build

# Production Nginx image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV PORT=80

EXPOSE 80

CMD ["sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
