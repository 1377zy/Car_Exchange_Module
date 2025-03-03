/**
 * Local Deployment Script for Car Exchange Module
 * 
 * This script helps deploy the Car Exchange Module locally without Docker.
 * It checks dependencies, sets up environment variables, and starts the application.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Log with colors
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Execute command and return output
function execute(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    log(`Error executing command: ${command}`, 'red');
    log(error.message, 'red');
    return null;
  }
}

// Check if a command exists
function commandExists(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'green');
  }
}

// Copy file if it doesn't exist
function copyFileIfNotExists(source, destination) {
  if (!fs.existsSync(destination) && fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
    log(`Copied ${source} to ${destination}`, 'green');
  }
}

// Main deployment function
async function deploy() {
  log('========================================', 'blue');
  log('  Car Exchange Module Local Deployment  ', 'blue');
  log('========================================', 'blue');
  
  // Check Node.js
  log('\nChecking Node.js...', 'yellow');
  const nodeVersion = execute('node --version');
  if (!nodeVersion) {
    log('Node.js is not installed. Please install Node.js v18 or later.', 'red');
    process.exit(1);
  }
  log(`Node.js ${nodeVersion.trim()} is installed.`, 'green');
  
  // Check npm
  log('\nChecking npm...', 'yellow');
  const npmVersion = execute('npm --version');
  if (!npmVersion) {
    log('npm is not installed. Please install npm.', 'red');
    process.exit(1);
  }
  log(`npm ${npmVersion.trim()} is installed.`, 'green');
  
  // Check MongoDB
  log('\nChecking MongoDB...', 'yellow');
  if (!commandExists('mongod --version')) {
    log('MongoDB is not installed or not in PATH.', 'yellow');
    log('You will need to use a remote MongoDB instance or install MongoDB locally.', 'yellow');
  } else {
    const mongoVersion = execute('mongod --version');
    log(`MongoDB ${mongoVersion.split('\n')[0]} is installed.`, 'green');
  }
  
  // Check environment file
  log('\nChecking environment file...', 'yellow');
  const envExample = path.join(process.cwd(), '.env.example');
  const envFile = path.join(process.cwd(), '.env');
  
  if (!fileExists(envFile)) {
    if (fileExists(envExample)) {
      log('Creating .env file from .env.example...', 'yellow');
      copyFileIfNotExists(envExample, envFile);
      log('Please edit the .env file with your configuration before continuing.', 'yellow');
      
      const answer = await new Promise(resolve => {
        rl.question('Have you updated the .env file with your configuration? (y/n): ', resolve);
      });
      
      if (answer.toLowerCase() !== 'y') {
        log('Please update the .env file and run this script again.', 'red');
        rl.close();
        process.exit(1);
      }
    } else {
      log('.env.example file not found. Please create a .env file manually.', 'red');
      rl.close();
      process.exit(1);
    }
  } else {
    log('.env file already exists.', 'green');
  }
  
  // Create necessary directories
  log('\nCreating necessary directories...', 'yellow');
  ensureDirectoryExists(path.join(process.cwd(), 'logs'));
  ensureDirectoryExists(path.join(process.cwd(), 'uploads'));
  
  // Install server dependencies
  log('\nInstalling server dependencies...', 'yellow');
  execute('npm install');
  log('Server dependencies installed.', 'green');
  
  // Install client dependencies and build
  log('\nInstalling client dependencies and building...', 'yellow');
  if (fileExists(path.join(process.cwd(), 'client', 'package.json'))) {
    execute('cd client && npm install');
    execute('cd client && npm run build');
    log('Client built successfully.', 'green');
  } else {
    log('Client package.json not found. Skipping client build.', 'yellow');
  }
  
  // Start the application
  log('\n========================================', 'green');
  log('  Deployment completed successfully!    ', 'green');
  log('========================================', 'green');
  log('\nYou can now start the application with:', 'blue');
  log('npm start', 'yellow');
  
  rl.close();
}

// Run the deployment
deploy().catch(error => {
  log(`Deployment failed: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
