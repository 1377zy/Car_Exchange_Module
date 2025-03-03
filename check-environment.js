/**
 * Environment Check Script
 * 
 * This script checks the environment for required dependencies and configurations
 * for deploying the Car Exchange Module.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Check if a command exists
function commandExists(command) {
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${command}`, { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

// Check if a file exists
function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const minVersion = 'v14.0.0';
  
  info(`Node.js version: ${nodeVersion}`);
  
  if (nodeVersion.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) >= 0) {
    success('Node.js version is sufficient');
    return true;
  } else {
    error(`Node.js version is too old. Minimum required version is ${minVersion}`);
    return false;
  }
}

// Check npm version
function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const minVersion = '6.0.0';
    
    info(`npm version: ${npmVersion}`);
    
    if (npmVersion.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) >= 0) {
      success('npm version is sufficient');
      return true;
    } else {
      error(`npm version is too old. Minimum required version is ${minVersion}`);
      return false;
    }
  } catch (err) {
    error('Failed to check npm version');
    return false;
  }
}

// Check Git version
function checkGitVersion() {
  if (commandExists('git')) {
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      info(`Git version: ${gitVersion}`);
      success('Git is installed');
      return true;
    } catch (err) {
      error('Failed to check Git version');
      return false;
    }
  } else {
    error('Git is not installed');
    return false;
  }
}

// Check MongoDB
function checkMongoDB() {
  if (commandExists('mongod')) {
    try {
      const mongoVersion = execSync('mongod --version', { encoding: 'utf8' }).trim().split('\n')[0];
      info(`MongoDB version: ${mongoVersion}`);
      success('MongoDB is installed');
      return true;
    } catch (err) {
      error('Failed to check MongoDB version');
      return false;
    }
  } else {
    warning('MongoDB is not installed locally');
    info('You can still use a remote MongoDB instance or the mock database for development');
    return false;
  }
}

// Check Docker
function checkDocker() {
  if (commandExists('docker')) {
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      info(`Docker version: ${dockerVersion}`);
      success('Docker is installed');
      return true;
    } catch (err) {
      error('Failed to check Docker version');
      return false;
    }
  } else {
    warning('Docker is not installed');
    info('Docker is required for containerized deployment');
    return false;
  }
}

// Check Docker Compose
function checkDockerCompose() {
  if (commandExists('docker-compose')) {
    try {
      const dockerComposeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
      info(`Docker Compose version: ${dockerComposeVersion}`);
      success('Docker Compose is installed');
      return true;
    } catch (err) {
      error('Failed to check Docker Compose version');
      return false;
    }
  } else {
    warning('Docker Compose is not installed');
    info('Docker Compose is required for containerized deployment');
    return false;
  }
}

// Check Heroku CLI
function checkHerokuCLI() {
  if (commandExists('heroku')) {
    try {
      const herokuVersion = execSync('heroku --version', { encoding: 'utf8' }).trim().split('\n')[0];
      info(`Heroku CLI version: ${herokuVersion}`);
      success('Heroku CLI is installed');
      return true;
    } catch (err) {
      error('Failed to check Heroku CLI version');
      return false;
    }
  } else {
    warning('Heroku CLI is not installed');
    info('Heroku CLI is required for deploying to Heroku');
    return false;
  }
}

// Check Railway CLI
function checkRailwayCLI() {
  if (commandExists('railway')) {
    try {
      const railwayVersion = execSync('railway --version', { encoding: 'utf8' }).trim();
      info(`Railway CLI version: ${railwayVersion}`);
      success('Railway CLI is installed');
      return true;
    } catch (err) {
      error('Failed to check Railway CLI version');
      return false;
    }
  } else {
    warning('Railway CLI is not installed');
    info('Railway CLI is required for deploying to Railway.app');
    return false;
  }
}

// Check required files
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'server.js',
    '.gitignore'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!fileExists(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length === 0) {
    success('All required files are present');
    return true;
  } else {
    error(`Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  const envFile = path.join(__dirname, '.env');
  
  if (fileExists(envFile)) {
    success('.env file exists');
    
    try {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const envLines = envContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
      
      info(`Found ${envLines.length} environment variables in .env file`);
      
      // Check for required variables
      const requiredVars = [
        'NODE_ENV',
        'PORT',
        'JWT_SECRET'
      ];
      
      const missingVars = [];
      
      for (const varName of requiredVars) {
        if (!envContent.includes(`${varName}=`)) {
          missingVars.push(varName);
        }
      }
      
      if (missingVars.length === 0) {
        success('All required environment variables are present in .env file');
      } else {
        warning(`Missing environment variables in .env file: ${missingVars.join(', ')}`);
      }
      
      return true;
    } catch (err) {
      error(`Failed to read .env file: ${err.message}`);
      return false;
    }
  } else {
    warning('.env file does not exist');
    info('You should create a .env file with the required environment variables');
    return false;
  }
}

// Check system resources
function checkSystemResources() {
  const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024));
  const cpuCount = os.cpus().length;
  
  info(`Total memory: ${totalMemory} GB`);
  info(`Free memory: ${freeMemory} GB`);
  info(`CPU cores: ${cpuCount}`);
  
  if (totalMemory < 2) {
    warning('Low memory: The system has less than 2 GB of RAM');
  } else {
    success('Sufficient memory available');
  }
  
  if (cpuCount < 2) {
    warning('Low CPU: The system has less than 2 CPU cores');
  } else {
    success('Sufficient CPU cores available');
  }
  
  return true;
}

// Main function
function main() {
  log('='.repeat(50), 'cyan');
  log('Car Exchange Module Environment Check', 'cyan');
  log('='.repeat(50), 'cyan');
  log('');
  
  // Check Node.js and npm
  const nodeOk = checkNodeVersion();
  const npmOk = checkNpmVersion();
  
  log('');
  
  // Check Git
  const gitOk = checkGitVersion();
  
  log('');
  
  // Check MongoDB
  const mongoDbOk = checkMongoDB();
  
  log('');
  
  // Check Docker and Docker Compose
  const dockerOk = checkDocker();
  const dockerComposeOk = checkDockerCompose();
  
  log('');
  
  // Check Heroku CLI and Railway CLI
  const herokuOk = checkHerokuCLI();
  const railwayOk = checkRailwayCLI();
  
  log('');
  
  // Check required files
  const filesOk = checkRequiredFiles();
  
  log('');
  
  // Check environment variables
  const envVarsOk = checkEnvironmentVariables();
  
  log('');
  
  // Check system resources
  const resourcesOk = checkSystemResources();
  
  log('');
  log('='.repeat(50), 'cyan');
  log('Environment Check Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  log('');
  
  log(`Node.js: ${nodeOk ? '✓' : '✗'}`, nodeOk ? 'green' : 'red');
  log(`npm: ${npmOk ? '✓' : '✗'}`, npmOk ? 'green' : 'red');
  log(`Git: ${gitOk ? '✓' : '✗'}`, gitOk ? 'green' : 'red');
  log(`MongoDB: ${mongoDbOk ? '✓' : '⚠'}`, mongoDbOk ? 'green' : 'yellow');
  log(`Docker: ${dockerOk ? '✓' : '⚠'}`, dockerOk ? 'green' : 'yellow');
  log(`Docker Compose: ${dockerComposeOk ? '✓' : '⚠'}`, dockerComposeOk ? 'green' : 'yellow');
  log(`Heroku CLI: ${herokuOk ? '✓' : '⚠'}`, herokuOk ? 'green' : 'yellow');
  log(`Railway CLI: ${railwayOk ? '✓' : '⚠'}`, railwayOk ? 'green' : 'yellow');
  log(`Required Files: ${filesOk ? '✓' : '✗'}`, filesOk ? 'green' : 'red');
  log(`Environment Variables: ${envVarsOk ? '✓' : '⚠'}`, envVarsOk ? 'green' : 'yellow');
  log(`System Resources: ${resourcesOk ? '✓' : '⚠'}`, resourcesOk ? 'green' : 'yellow');
  
  log('');
  
  const criticalOk = nodeOk && npmOk && gitOk && filesOk;
  
  if (criticalOk) {
    success('All critical dependencies are installed and configured correctly.');
    log('You can proceed with deployment using the appropriate deployment script.');
  } else {
    error('Some critical dependencies are missing or not configured correctly.');
    log('Please install or configure the missing dependencies before proceeding with deployment.');
  }
  
  log('');
  log('For detailed deployment instructions, refer to the following documents:');
  log('- DEPLOYMENT_GUIDE.md: Comprehensive guide for deploying to various environments');
  log('- DEPLOYMENT_SUMMARY.md: Summary of deployment options and features');
  log('- DEPLOYMENT_CHECKLIST.md: Checklist to ensure all deployment steps are completed');
  log('');
}

// Run the main function
main();
