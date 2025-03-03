/**
 * Deploy to Railway Script
 * 
 * This script helps prepare the Car Exchange Module for deployment to Railway.app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing Car Exchange Module for Railway deployment...');

// Check if railway.json exists
if (!fs.existsSync('./railway.json')) {
  console.error('Error: railway.json not found. Please make sure it exists in the project root.');
  process.exit(1);
}

// Check if package.json has necessary scripts
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
let modified = false;

if (!packageJson.scripts) {
  packageJson.scripts = {};
  modified = true;
}

if (!packageJson.scripts.start) {
  packageJson.scripts.start = 'node start.js';
  modified = true;
}

if (!packageJson.scripts.build && fs.existsSync('./client')) {
  packageJson.scripts.build = 'cd client && npm install && npm run build';
  modified = true;
}

if (modified) {
  console.log('Updating package.json with necessary scripts...');
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
}

// Create a Railway-specific .env file if it doesn't exist
if (!fs.existsSync('./.env.railway')) {
  console.log('Creating .env.railway file...');
  const envContent = `NODE_ENV=production
PORT=10000
JWT_SECRET=replace_with_secure_secret_in_railway_dashboard
CORS_ORIGINS=https://car-exchange-frontend.up.railway.app,https://car-exchange-module.up.railway.app
FRONTEND_URL=https://car-exchange-frontend.up.railway.app
REDIS_ENABLED=false
`;
  fs.writeFileSync('./.env.railway', envContent);
}

// Create a railway.toml file if it doesn't exist
if (!fs.existsSync('./railway.toml')) {
  console.log('Creating railway.toml file...');
  const railwayToml = `[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 5

[environments]
production.autoDeploy = true
`;
  fs.writeFileSync('./railway.toml', railwayToml);
}

console.log('\nPreparation for Railway deployment complete!');
console.log('\nNext steps:');
console.log('1. Install the Railway CLI: npm install -g @railway/cli');
console.log('2. Login to Railway: railway login');
console.log('3. Link your project: railway link');
console.log('4. Deploy your application: railway up');
console.log('5. Set environment variables: railway variables set JWT_SECRET=your_secret');
console.log('\nAlternatively, you can deploy through the Railway dashboard:');
console.log('1. Push your code to GitHub');
console.log('2. Go to railway.app and create a new project');
console.log('3. Connect your GitHub repository');
console.log('4. Configure environment variables');
console.log('5. Deploy your application');
console.log('\nSee GITHUB_DEPLOYMENT.md for more detailed instructions.');
