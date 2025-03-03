/**
 * Prepare for Cloud Deployment
 * 
 * This script helps prepare the Car Exchange Module for deployment to cloud services
 * like Heroku, Render, or Railway.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing Car Exchange Module for cloud deployment...');

// Check if Procfile exists
if (!fs.existsSync('./Procfile')) {
  console.log('Creating Procfile...');
  fs.writeFileSync('./Procfile', 'web: node server.js');
}

// Check if .env file exists
if (!fs.existsSync('./.env')) {
  console.log('Creating .env file from example...');
  if (fs.existsSync('./.env.example')) {
    fs.copyFileSync('./.env.example', './.env');
  } else {
    console.log('Warning: No .env.example file found. Creating a basic .env file...');
    const envContent = `NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/car_exchange
JWT_SECRET=change_this_to_a_secure_secret
CORS_ORIGINS=*
FRONTEND_URL=http://localhost:3000
`;
    fs.writeFileSync('./.env', envContent);
  }
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

if (!packageJson.scripts.postinstall && fs.existsSync('./client')) {
  packageJson.scripts.postinstall = 'cd client && npm install && npm run build';
  modified = true;
}

if (!packageJson.engines) {
  packageJson.engines = {
    node: '>=14.0.0',
    npm: '>=6.0.0'
  };
  modified = true;
}

if (modified) {
  console.log('Updating package.json with necessary scripts and engine requirements...');
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
}

// Check if MongoDB connection is properly configured
const serverFile = fs.readFileSync('./server.js', 'utf8');
if (!serverFile.includes('process.env.MONGODB_URI')) {
  console.log('Warning: server.js might not be using MONGODB_URI environment variable for database connection.');
  console.log('Please make sure your MongoDB connection uses process.env.MONGODB_URI.');
}

console.log('\nPreparation complete! Your application is ready for cloud deployment.');
console.log('\nNext steps:');
console.log('1. Push your code to GitHub');
console.log('2. Connect your GitHub repository to your cloud service provider');
console.log('3. Configure environment variables on your cloud service provider');
console.log('4. Deploy your application');
console.log('\nSee GITHUB_DEPLOYMENT.md for detailed instructions.');
