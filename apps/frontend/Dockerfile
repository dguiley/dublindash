# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm run build

# Production stage
FROM nginx:stable-alpine
RUN apk add jq

COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 3000

# This will inject environment variables into env.js at runtime
CMD export && \
    echo "window.env = $(jq -n env | grep -E '^(BACKEND_|APP_)')" > /usr/share/nginx/html/env.js && \
    nginx -g 'daemon off;'