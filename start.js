/**
 * Car Exchange Module Startup Script
 * 
 * This script determines the appropriate server file to run based on the environment.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

// Determine which server file to use
let serverFile = 'server.js';
const env = process.env.NODE_ENV || 'development';

// Check if we should use the development server with mock database
if (env === 'development' && !process.env.USE_REAL_DB) {
  // Check if server-dev.js exists
  if (fs.existsSync(path.join(__dirname, 'server-dev.js'))) {
    serverFile = 'server-dev.js';
    console.log('Using development server with mock database...');
  } else {
    console.log('Development server file not found, using standard server...');
  }
} else if (env === 'demo') {
  // Check if demo-app.js exists
  if (fs.existsSync(path.join(__dirname, 'demo-app.js'))) {
    serverFile = 'demo-app.js';
    console.log('Using demo application...');
  } else {
    console.log('Demo application file not found, using standard server...');
  }
} else {
  console.log(`Using standard server in ${env} mode...`);
}

// Start the server
const server = spawn('node', [serverFile], { stdio: 'inherit' });

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  server.kill('SIGTERM');
});
