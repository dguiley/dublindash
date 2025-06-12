# Simple Node.js server with pre-built backend
FROM node:18-alpine
WORKDIR /app

# Copy built application and dependencies
COPY dist/ ./dist/
COPY node_modules/ ./node_modules/
COPY package.json ./

# Expose port
EXPOSE 3010

# Start the server
CMD ["node", "dist/index.js"]