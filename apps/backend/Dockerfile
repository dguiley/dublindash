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