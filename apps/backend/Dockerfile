# Simple Node.js server with pre-built backend
FROM node:18-alpine
WORKDIR /app

# Copy built application and package files
COPY dist/ ./dist/
COPY package.json ./

# Install production dependencies only
RUN npm install --production

# Debug: List files to verify structure
RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Files in /app/dist ===" && ls -la dist/
RUN echo "=== Looking for index.js ===" && find . -name "index.js" -type f

# Expose port
EXPOSE 3010

# Start the server
CMD ["node", "dist/index.js"]