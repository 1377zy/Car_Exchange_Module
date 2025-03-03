/**
 * Script to update .env file for local development
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

// Read the current .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Create updated content with development settings
const updatedContent = envContent
  // Set environment to development
  .replace(/NODE_ENV=production/g, 'NODE_ENV=development')
  // Update MongoDB connection for local development
  .replace(/MONGODB_URI=.*/g, 'MONGODB_URI=mongodb://localhost:27017/car_exchange')
  // Disable Redis for local development
  .replace(/REDIS_ENABLED=true/g, 'REDIS_ENABLED=false')
  // Set a simple JWT secret for development
  .replace(/JWT_SECRET=.*/g, 'JWT_SECRET=dev_secret_key_for_local_development_only')
  // Update CORS for local development
  .replace(/CORS_ORIGINS=.*/g, 'CORS_ORIGINS=http://localhost:3000')
  // Disable features that require external services
  .replace(/SENTRY_ENABLED=.*/g, 'SENTRY_ENABLED=false')
  .replace(/PROMETHEUS_ENABLED=.*/g, 'PROMETHEUS_ENABLED=false');

// Write the updated content back to the .env file
fs.writeFileSync(envPath, updatedContent);

console.log('Updated .env file for local development');
