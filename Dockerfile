# Multi-stage build for Car Exchange Module
# Stage 1: Build the React client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package.json and package-lock.json
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source code
COPY client/ ./

# Build the client
RUN npm run build

# Stage 2: Build the server
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy server package.json and package-lock.json
COPY server/package*.json ./

# Install server dependencies
RUN npm ci

# Copy server source code
COPY server/ ./

# Stage 3: Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Install production dependencies
RUN apk --no-cache add curl

# Create app directory structure
RUN mkdir -p /app/server /app/client/build /app/logs /app/uploads

# Copy server from server-builder
COPY --from=server-builder /app/server /app/server

# Copy client build from client-builder
COPY --from=client-builder /app/client/build /app/client/build

# Set working directory to server
WORKDIR /app/server

# Expose the port the app runs on
EXPOSE 5000

# Create a non-root user to run the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Command to run the application
CMD ["node", "server.js"]
