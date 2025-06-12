# Docker Strategy: Build in CI, Copy in Docker

## Philosophy

Following best practices, we **build in GitHub Actions** and **copy in Docker**. This approach offers:

✅ **Fast Docker builds** - No compilation in Docker
✅ **Easy debugging** - Build errors happen in CI with full logs  
✅ **Better caching** - GitHub Actions caches dependencies
✅ **Consistent builds** - Same environment for build and test

## Build Flow

```
GitHub Actions:
1. Install dependencies (pnpm install)
2. Build frontend (pnpm --filter dublindash-frontend build)
3. Build backend (pnpm --filter dublindash-backend build)
4. Docker: Copy dist/ → Image
5. Push to ECR
```

## Frontend Dockerfile

```dockerfile
# Simple nginx server serving pre-built frontend
FROM nginx:stable-alpine
RUN apk add jq

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html
EXPOSE 3000

# Runtime environment injection
CMD export && \
    echo "window.env = $(jq -n env | grep -E '^(BACKEND_|APP_)')" > /usr/share/nginx/html/env.js && \
    nginx -g 'daemon off;'
```

**What it does:**
- Copies pre-built `dist/` folder from GitHub Actions
- Serves static files with nginx
- Injects environment variables at runtime into `env.js`

## Backend Dockerfile

```dockerfile
# Simple Node.js server with pre-built backend
FROM node:18-alpine
WORKDIR /app

# Install pnpm for package installation
RUN npm install -g pnpm@10

# Copy built application and package.json
COPY dist/ ./dist/
COPY package.json ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose port
EXPOSE 3010

# Start the server
CMD ["node", "dist/index.js"]
```

**What it does:**
- Copies pre-built `dist/` folder from GitHub Actions
- Copies `package.json` for dependency information
- Installs only production dependencies
- Runs the compiled JavaScript

## Benefits vs Multi-Stage Builds

| Multi-Stage (Old) | Copy Dist (New) |
|---|---|
| 🐌 Slow builds | ⚡ Fast builds |
| 🔧 Complex debugging | 🎯 Simple debugging |
| 💾 Large intermediate layers | 📦 Minimal layers |
| 🔄 Rebuild on Docker changes | ♻️ Reuse GitHub cache |

## File Structure After Build

```
apps/frontend/
├── dist/           # Built by: pnpm build
├── nginx.conf      # Nginx configuration
└── Dockerfile      # Copies dist/ to nginx

apps/backend/
├── dist/           # Built by: tsc
├── package.json    # Dependencies list
└── Dockerfile      # Copies dist/ + installs deps
```

## GitHub Actions Integration

The workflow builds everything in GitHub Actions:

1. **pnpm install** - Install all dependencies
2. **pnpm build** - Build both frontend and backend
3. **docker build** - Copy `dist/` into images (fast!)
4. **docker push** - Push to ECR

No compilation happens in Docker - just file copying and dependency installation.

## Debugging

- **Build errors**: Check GitHub Actions logs
- **Runtime errors**: Check Kubernetes pod logs
- **Environment issues**: Check `window.env` object in browser console
- **Backend issues**: `kubectl logs -l app=dublindash-backend-main`

This approach keeps Docker simple and CI powerful! 🚀