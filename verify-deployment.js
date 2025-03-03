/**
 * Deployment Verification Script
 * 
 * This script verifies that the Car Exchange Module is deployed correctly
 * by checking various components and connections.
 */

const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to log success
function success(message) {
  log(`✓ ${message}`, 'green');
}

// Helper function to log error
function error(message) {
  log(`✗ ${message}`, 'red');
}

// Helper function to log warning
function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Helper function to log info
function info(message) {
  log(`ℹ ${message}`, 'blue');
}

// Check if a file exists
async function fileExists(filePath) {
  try {
    await promisify(fs.access)(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

// Check MongoDB connection
async function checkMongoDB() {
  info('Checking MongoDB connection...');
  
  if (!process.env.MONGODB_URI) {
    warning('MONGODB_URI environment variable not set. Skipping MongoDB check.');
    return false;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    success('MongoDB connection successful');
    
    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    info(`Available collections: ${collections.map(c => c.name).join(', ')}`);
    
    await mongoose.disconnect();
    return true;
  } catch (err) {
    error(`MongoDB connection failed: ${err.message}`);
    return false;
  }
}

// Check API health endpoint
async function checkAPIHealth() {
  info('Checking API health endpoint...');
  
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  
  try {
    const response = await axios.get(`${baseUrl}/api/health`);
    
    if (response.status === 200) {
      success('API health check successful');
      info(`API Status: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      warning(`API health check returned status ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`API health check failed: ${err.message}`);
    return false;
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  info('Checking environment variables...');
  
  const requiredVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'MONGODB_URI',
    'CORS_ORIGINS',
    'FRONTEND_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    success('All required environment variables are set');
    return true;
  } else {
    warning(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
}

// Check required files
async function checkRequiredFiles() {
  info('Checking required files...');
  
  const requiredFiles = [
    'server.js',
    'package.json',
    '.env'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!(await fileExists(path.join(__dirname, file)))) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length === 0) {
    success('All required files are present');
    return true;
  } else {
    warning(`Missing files: ${missingFiles.join(', ')}`);
    return false;
  }
}

// Main function
async function main() {
  log('='.repeat(50), 'cyan');
  log('Car Exchange Module Deployment Verification', 'cyan');
  log('='.repeat(50), 'cyan');
  log('');
  
  // Check environment variables
  const envVarsOk = checkEnvironmentVariables();
  
  // Check required files
  const filesOk = await checkRequiredFiles();
  
  // Check MongoDB connection
  const mongoDbOk = await checkMongoDB();
  
  // Check API health
  const apiHealthOk = await checkAPIHealth();
  
  // Print summary
  log('');
  log('='.repeat(50), 'cyan');
  log('Verification Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  log('');
  
  log(`Environment Variables: ${envVarsOk ? '✓' : '✗'}`, envVarsOk ? 'green' : 'red');
  log(`Required Files: ${filesOk ? '✓' : '✗'}`, filesOk ? 'green' : 'red');
  log(`MongoDB Connection: ${mongoDbOk ? '✓' : '✗'}`, mongoDbOk ? 'green' : 'red');
  log(`API Health: ${apiHealthOk ? '✓' : '✗'}`, apiHealthOk ? 'green' : 'red');
  
  log('');
  
  const allOk = envVarsOk && filesOk && mongoDbOk && apiHealthOk;
  
  if (allOk) {
    success('All checks passed! The deployment appears to be working correctly.');
  } else {
    warning('Some checks failed. Please review the issues above.');
  }
}

// Run the main function
main().catch(err => {
  error(`An error occurred: ${err.message}`);
  process.exit(1);
});
