/**
 * Local Development Deployment Script
 * This script sets up the Car Exchange Module for local development
 * without requiring a real MongoDB instance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to log with colors
const log = {
  info: (message) => console.log(`${colors.cyan}${message}${colors.reset}`),
  success: (message) => console.log(`${colors.green}${message}${colors.reset}`),
  warning: (message) => console.log(`${colors.yellow}${message}${colors.reset}`),
  error: (message) => console.log(`${colors.red}${message}${colors.reset}`),
  title: (message) => console.log(`\n${colors.bright}${colors.magenta}${message}${colors.reset}\n`)
};

// Check if a command exists
const commandExists = (command) => {
  try {
    execSync(`where ${command}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

// Run a command and return its output
const runCommand = (command) => {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log.error(`Command failed: ${command}`);
    log.error(error.message);
    return null;
  }
};

// Check if Node.js is installed
const checkNodeJs = () => {
  log.info('Checking for Node.js installation...');
  
  if (!commandExists('node')) {
    log.error('Node.js is not installed or not in PATH.');
    log.info('Please install Node.js from https://nodejs.org/');
    return false;
  }
  
  const nodeVersion = runCommand('node -v').trim();
  log.success(`Node.js is installed (${nodeVersion})`);
  return true;
};

// Check if npm is installed
const checkNpm = () => {
  log.info('Checking for npm installation...');
  
  if (!commandExists('npm')) {
    log.error('npm is not installed or not in PATH.');
    log.info('npm should be installed with Node.js. Please reinstall Node.js from https://nodejs.org/');
    return false;
  }
  
  const npmVersion = runCommand('npm -v').trim();
  log.success(`npm is installed (${npmVersion})`);
  return true;
};

// Create or update .env file
const setupEnvFile = () => {
  log.info('Setting up environment variables...');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envPath = path.join(process.cwd(), '.env');
  
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    log.error('.env.example file not found. Cannot create .env file.');
    return false;
  }
  
  // Create .env file from .env.example if it doesn't exist
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log.success('.env file created from .env.example');
  } else {
    log.info('.env file already exists');
  }
  
  // Update .env file for local development
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update environment variables for local development
  const envUpdates = {
    'NODE_ENV': 'development',
    'PORT': '5000',
    'MONGODB_URI': 'mock://localhost/car_exchange',
    'REDIS_ENABLED': 'false',
    'JWT_SECRET': 'local-development-secret-key',
    'CORS_ORIGINS': 'http://localhost:3000,http://localhost:5000',
    'FRONTEND_URL': 'http://localhost:3000'
  };
  
  // Apply updates to .env file
  Object.entries(envUpdates).forEach(([key, value]) => {
    const regex = new RegExp(`${key}=.*`, 'g');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });
  
  // Write updated content back to .env file
  fs.writeFileSync(envPath, envContent);
  log.success('.env file updated for local development');
  
  return true;
};

// Install dependencies
const installDependencies = () => {
  log.info('Installing dependencies...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    log.success('Dependencies installed successfully');
    return true;
  } catch (error) {
    log.error('Failed to install dependencies:');
    log.error(error.message);
    return false;
  }
};

// Seed mock database
const seedMockDatabase = () => {
  log.info('Seeding mock database...');
  
  try {
    execSync('node seed-mock-data.js', { stdio: 'inherit' });
    log.success('Mock database seeded successfully');
    return true;
  } catch (error) {
    log.error('Failed to seed mock database:');
    log.error(error.message);
    return false;
  }
};

// Start the development server
const startDevServer = () => {
  log.info('Starting development server...');
  
  try {
    execSync('node server-dev.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    log.error('Failed to start development server:');
    log.error(error.message);
    return false;
  }
};

// Main deployment function
const deploy = async () => {
  log.title('CAR EXCHANGE MODULE - LOCAL DEVELOPMENT DEPLOYMENT');
  
  log.info('This script will set up the Car Exchange Module for local development without requiring a real MongoDB instance.');
  
  // Check prerequisites
  const nodeInstalled = checkNodeJs();
  const npmInstalled = checkNpm();
  
  if (!nodeInstalled || !npmInstalled) {
    log.error('Prerequisites not met. Please install the required software and try again.');
    process.exit(1);
  }
  
  // Setup environment
  const envSetup = setupEnvFile();
  if (!envSetup) {
    log.error('Failed to set up environment variables. Deployment aborted.');
    process.exit(1);
  }
  
  // Install dependencies
  const dependenciesInstalled = installDependencies();
  if (!dependenciesInstalled) {
    log.error('Failed to install dependencies. Deployment aborted.');
    process.exit(1);
  }
  
  // Seed mock database
  const databaseSeeded = seedMockDatabase();
  if (!databaseSeeded) {
    log.error('Failed to seed mock database. Deployment aborted.');
    process.exit(1);
  }
  
  log.success('Local development environment is ready!');
  log.info('To start the server, run: node server-dev.js');
  
  rl.question('Would you like to start the development server now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      startDevServer();
    } else {
      log.info('You can start the server later by running: node server-dev.js');
      rl.close();
    }
  });
};

// Run the deployment
deploy();
