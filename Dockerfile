# Simplified Dockerfile for Car Exchange Module
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy client package.json
COPY client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Return to app directory
WORKDIR /app

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port the app runs on
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:10000/api/health || exit 1

# Command to run the application
CMD ["npm", "start"]
