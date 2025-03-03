#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -o errexit

# Install dependencies
npm install

# Build client if it exists
if [ -d "./client" ]; then
  cd client
  npm install
  npm run build
  cd ..
fi

# Copy .env.render to .env if it exists
if [ -f "./.env.render" ]; then
  cp .env.render .env
fi

echo "Build completed successfully!"
