/**
 * Car Exchange Module Deployment Script
 * 
 * This script provides an interactive interface to deploy the Car Exchange Module
 * to various environments.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute commands
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// Display menu and get user choice
async function showMenu() {
  console.log('\n=== Car Exchange Module Deployment ===\n');
  console.log('1. Local Development (No MongoDB)');
  console.log('2. Local Deployment (With MongoDB)');
  console.log('3. Cloud Deployment - Render.com');
  console.log('4. Cloud Deployment - Railway.app');
  console.log('5. Cloud Deployment - Heroku');
  console.log('6. Docker Deployment');
  console.log('7. GitHub Repository Setup');
  console.log('8. Verify Deployment');
  console.log('9. Exit');
  
  return new Promise(resolve => {
    rl.question('\nSelect an option (1-9): ', answer => {
      resolve(answer.trim());
    });
  });
}

// Deploy for local development (no MongoDB)
async function deployLocalDev() {
  console.log('\n=== Local Development Deployment ===\n');
  
  if (fileExists(path.join(__dirname, 'deploy-local-dev.js'))) {
    console.log('Running deploy-local-dev.js...');
    runCommand('node deploy-local-dev.js');
  } else {
    console.log('deploy-local-dev.js not found. Setting up environment manually...');
    
    // Create .env file if it doesn't exist
    if (!fileExists(path.join(__dirname, '.env'))) {
      console.log('Creating .env file...');
      const envContent = `NODE_ENV=development
PORT=5000
JWT_SECRET=local_development_secret
MONGODB_URI=
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
REDIS_ENABLED=false
USE_MOCK_DB=true
`;
      fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    }
    
    // Install dependencies
    console.log('Installing dependencies...');
    runCommand('npm install');
    
    // Start the application
    const startApp = await new Promise(resolve => {
      rl.question('Do you want to start the application now? (y/n): ', answer => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (startApp) {
      console.log('Starting the application...');
      runCommand('npm run start:dev');
    }
  }
}

// Deploy for local deployment (with MongoDB)
async function deployLocalWithMongoDB() {
  console.log('\n=== Local Deployment with MongoDB ===\n');
  
  // Check if MongoDB is installed
  try {
    runCommand('mongod --version');
    console.log('MongoDB is installed.');
  } catch (error) {
    console.log('MongoDB is not installed or not in your PATH.');
    console.log('Please install MongoDB or use a remote MongoDB instance.');
    
    const useMongoDB = await new Promise(resolve => {
      rl.question('Do you want to continue with a remote MongoDB instance? (y/n): ', answer => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (!useMongoDB) {
      return;
    }
  }
  
  // Get MongoDB connection string
  const mongoDBUri = await new Promise(resolve => {
    rl.question('Enter MongoDB connection string (leave empty for localhost): ', answer => {
      resolve(answer.trim() || 'mongodb://localhost:27017/car_exchange');
    });
  });
  
  // Update .env file
  console.log('Updating .env file...');
  const envContent = `NODE_ENV=development
PORT=5000
JWT_SECRET=local_development_secret
MONGODB_URI=${mongoDBUri}
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
REDIS_ENABLED=false
USE_MOCK_DB=false
`;
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  
  // Install dependencies
  console.log('Installing dependencies...');
  runCommand('npm install');
  
  // Check MongoDB connection
  console.log('Checking MongoDB connection...');
  if (fileExists(path.join(__dirname, 'check-mongodb.js'))) {
    runCommand('node check-mongodb.js');
  } else {
    console.log('check-mongodb.js not found. Skipping MongoDB connection check.');
  }
  
  // Start the application
  const startApp = await new Promise(resolve => {
    rl.question('Do you want to start the application now? (y/n): ', answer => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
  
  if (startApp) {
    console.log('Starting the application...');
    runCommand('npm start');
  }
}

// Deploy to Render.com
async function deployToRender() {
  console.log('\n=== Cloud Deployment - Render.com ===\n');
  
  if (fileExists(path.join(__dirname, 'deploy-to-render.js'))) {
    console.log('Running deploy-to-render.js...');
    runCommand('node deploy-to-render.js');
  } else {
    console.log('deploy-to-render.js not found.');
    console.log('Please follow these steps to deploy to Render.com:');
    console.log('1. Create a render.yaml file');
    console.log('2. Push your code to GitHub');
    console.log('3. Go to Render.com and create a new Web Service');
    console.log('4. Connect your GitHub repository');
    console.log('5. Configure build and start commands');
    console.log('6. Add environment variables');
    console.log('7. Deploy your application');
  }
}

// Deploy to Railway.app
async function deployToRailway() {
  console.log('\n=== Cloud Deployment - Railway.app ===\n');
  
  if (fileExists(path.join(__dirname, 'deploy-to-railway.js'))) {
    console.log('Running deploy-to-railway.js...');
    runCommand('node deploy-to-railway.js');
  } else {
    console.log('deploy-to-railway.js not found.');
    console.log('Please follow these steps to deploy to Railway.app:');
    console.log('1. Install the Railway CLI: npm install -g @railway/cli');
    console.log('2. Login to Railway: railway login');
    console.log('3. Link your project: railway link');
    console.log('4. Deploy your application: railway up');
    console.log('5. Set environment variables: railway variables set JWT_SECRET=your_secret');
  }
}

// Deploy to Heroku
async function deployToHeroku() {
  console.log('\n=== Cloud Deployment - Heroku ===\n');
  
  if (fileExists(path.join(__dirname, 'deploy-to-heroku.js'))) {
    console.log('Running deploy-to-heroku.js...');
    runCommand('node deploy-to-heroku.js');
  } else {
    console.log('deploy-to-heroku.js not found.');
    console.log('Please follow these steps to deploy to Heroku:');
    console.log('1. Install the Heroku CLI: npm install -g heroku');
    console.log('2. Login to Heroku: heroku login');
    console.log('3. Create a new Heroku app: heroku create car-exchange-module');
    console.log('4. Set environment variables: heroku config:set JWT_SECRET=your_secret');
    console.log('5. Add MongoDB addon: heroku addons:create mongolab:sandbox');
    console.log('6. Push your code to Heroku: git push heroku master');
  }
}

// Deploy with Docker
async function deployWithDocker() {
  console.log('\n=== Docker Deployment ===\n');
  
  // Check if Docker is installed
  try {
    runCommand('docker --version');
    console.log('Docker is installed.');
  } catch (error) {
    console.log('Docker is not installed or not in your PATH.');
    console.log('Please install Docker and Docker Compose before continuing.');
    return;
  }
  
  // Check if Docker Compose is installed
  try {
    runCommand('docker-compose --version');
    console.log('Docker Compose is installed.');
  } catch (error) {
    console.log('Docker Compose is not installed or not in your PATH.');
    console.log('Please install Docker Compose before continuing.');
    return;
  }
  
  // Check if docker-compose.yml exists
  if (!fileExists(path.join(__dirname, 'docker-compose.yml'))) {
    console.log('docker-compose.yml not found.');
    console.log('Please create a docker-compose.yml file before continuing.');
    return;
  }
  
  // Build and start containers
  console.log('Building and starting containers...');
  runCommand('docker-compose up -d');
  
  console.log('\nContainers started successfully!');
  console.log('You can access the application at:');
  console.log('- API: http://localhost:5000');
  console.log('- Frontend: http://localhost:3000');
  console.log('- Monitoring: http://localhost:9090 (Prometheus) and http://localhost:3001 (Grafana)');
}

// Set up GitHub repository
async function setupGitHubRepo() {
  console.log('\n=== GitHub Repository Setup ===\n');
  
  if (fileExists(path.join(__dirname, 'setup-github-repo.js'))) {
    console.log('Running setup-github-repo.js...');
    runCommand('node setup-github-repo.js');
  } else {
    console.log('setup-github-repo.js not found.');
    console.log('Please follow these steps to set up a GitHub repository:');
    console.log('1. Create a new repository on GitHub');
    console.log('2. Initialize Git in your local directory (if not already done)');
    console.log('3. Add the GitHub repository as a remote');
    console.log('4. Push your code to GitHub');
  }
}

// Verify deployment
async function verifyDeployment() {
  console.log('\n=== Verify Deployment ===\n');
  
  if (fileExists(path.join(__dirname, 'verify-deployment.js'))) {
    console.log('Running verify-deployment.js...');
    runCommand('node verify-deployment.js');
  } else {
    console.log('verify-deployment.js not found.');
    console.log('Please verify your deployment manually:');
    console.log('1. Check that the application is running');
    console.log('2. Test the API endpoints');
    console.log('3. Verify database connections');
    console.log('4. Check environment variables');
  }
}

// Main function
async function main() {
  console.log('Car Exchange Module Deployment Script');
  console.log('====================================');
  
  let exit = false;
  
  while (!exit) {
    const choice = await showMenu();
    
    switch (choice) {
      case '1':
        await deployLocalDev();
        break;
      case '2':
        await deployLocalWithMongoDB();
        break;
      case '3':
        await deployToRender();
        break;
      case '4':
        await deployToRailway();
        break;
      case '5':
        await deployToHeroku();
        break;
      case '6':
        await deployWithDocker();
        break;
      case '7':
        await setupGitHubRepo();
        break;
      case '8':
        await verifyDeployment();
        break;
      case '9':
        exit = true;
        break;
      default:
        console.log('Invalid option. Please try again.');
    }
  }
  
  console.log('\nThank you for using the Car Exchange Module Deployment Script!');
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('An error occurred:', error);
  rl.close();
});
