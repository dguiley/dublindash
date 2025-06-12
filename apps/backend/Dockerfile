# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build backend
WORKDIR /app/apps/backend
RUN pnpm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install pnpm for production dependencies
RUN npm install -g pnpm@10

# Copy built files and package files
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/packages/shared /app/packages/shared

# Install production dependencies only
RUN pnpm install --prod

# Expose port
EXPOSE 3010

# Start the server
CMD ["node", "dist/index.js"]