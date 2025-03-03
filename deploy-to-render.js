/**
 * Deploy to Render Script
 * 
 * This script helps prepare the Car Exchange Module for deployment to Render.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing Car Exchange Module for Render deployment...');

// Check if render.yaml exists
if (!fs.existsSync('./render.yaml')) {
  console.error('Error: render.yaml not found. Please make sure it exists in the project root.');
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
  packageJson.scripts.start = 'node server.js';
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

// Create a Render-specific .env file if it doesn't exist
if (!fs.existsSync('./.env.render')) {
  console.log('Creating .env.render file...');
  const envContent = `NODE_ENV=production
PORT=10000
JWT_SECRET=replace_with_secure_secret_in_render_dashboard
CORS_ORIGINS=https://car-exchange-frontend.onrender.com,https://car-exchange-module.onrender.com
FRONTEND_URL=https://car-exchange-frontend.onrender.com
REDIS_ENABLED=false
`;
  fs.writeFileSync('./.env.render', envContent);
}

// Create a build.sh script for Render
if (!fs.existsSync('./build.sh')) {
  console.log('Creating build.sh script for Render...');
  const buildScript = `#!/usr/bin/env bash
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
`;
  fs.writeFileSync('./build.sh', buildScript);
  // Make it executable
  try {
    execSync('chmod +x ./build.sh');
  } catch (error) {
    console.log('Note: Could not make build.sh executable. This is fine on Windows.');
  }
}

console.log('\nPreparation for Render deployment complete!');
console.log('\nNext steps:');
console.log('1. Push your code to GitHub');
console.log('2. Go to render.com and create a new Web Service');
console.log('3. Connect your GitHub repository');
console.log('4. Configure the following settings:');
console.log('   - Build Command: ./build.sh');
console.log('   - Start Command: npm start');
console.log('5. Add environment variables in the Render dashboard');
console.log('6. Deploy your application');
console.log('\nSee GITHUB_DEPLOYMENT.md for more detailed instructions.');
