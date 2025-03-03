/**
 * Deploy to Heroku Script
 * 
 * This script helps prepare the Car Exchange Module for deployment to Heroku
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing Car Exchange Module for Heroku deployment...');

// Check if Procfile exists
if (!fs.existsSync('./Procfile')) {
  console.log('Creating Procfile...');
  fs.writeFileSync('./Procfile', 'web: npm start');
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

if (!packageJson.scripts['heroku-postbuild']) {
  packageJson.scripts['heroku-postbuild'] = 'NPM_CONFIG_PRODUCTION=false npm run install-client && npm run build-client';
  modified = true;
}

if (modified) {
  console.log('Updating package.json with necessary scripts...');
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
}

// Create a Heroku-specific .env file if it doesn't exist
if (!fs.existsSync('./.env.heroku')) {
  console.log('Creating .env.heroku file...');
  const envContent = `NODE_ENV=production
JWT_SECRET=replace_with_secure_secret_in_heroku_dashboard
CORS_ORIGINS=https://car-exchange-frontend.herokuapp.com,https://car-exchange-module.herokuapp.com
FRONTEND_URL=https://car-exchange-frontend.herokuapp.com
REDIS_ENABLED=false
`;
  fs.writeFileSync('./.env.heroku', envContent);
}

// Create a heroku.yml file if it doesn't exist
if (!fs.existsSync('./heroku.yml')) {
  console.log('Creating heroku.yml file...');
  const herokuYml = `build:
  docker:
    web: Dockerfile
run:
  web: npm start
`;
  fs.writeFileSync('./heroku.yml', herokuYml);
}

// Create an app.json file if it doesn't exist
if (!fs.existsSync('./app.json')) {
  console.log('Creating app.json file...');
  const appJson = `{
  "name": "Car Exchange Module",
  "description": "Business Development Center (BDC) application for auto dealerships",
  "repository": "https://github.com/yourusername/car-exchange-module",
  "keywords": ["node", "express", "mongodb", "bdc", "auto", "dealership"],
  "env": {
    "NODE_ENV": {
      "description": "Environment (production, development, test)",
      "value": "production"
    },
    "JWT_SECRET": {
      "description": "Secret key for JWT authentication",
      "generator": "secret"
    },
    "MONGODB_URI": {
      "description": "MongoDB connection string",
      "required": true
    },
    "CORS_ORIGINS": {
      "description": "Allowed CORS origins (comma-separated)",
      "value": "https://car-exchange-frontend.herokuapp.com,https://car-exchange-module.herokuapp.com"
    },
    "FRONTEND_URL": {
      "description": "URL of the frontend application",
      "value": "https://car-exchange-frontend.herokuapp.com"
    }
  },
  "addons": [
    {
      "plan": "mongolab:sandbox",
      "as": "MONGODB"
    },
    {
      "plan": "heroku-redis:hobby-dev",
      "as": "REDIS"
    }
  ],
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ]
}`;
  fs.writeFileSync('./app.json', appJson);
}

console.log('\nPreparation for Heroku deployment complete!');
console.log('\nNext steps:');
console.log('1. Install the Heroku CLI: npm install -g heroku');
console.log('2. Login to Heroku: heroku login');
console.log('3. Create a new Heroku app: heroku create car-exchange-module');
console.log('4. Set environment variables: heroku config:set JWT_SECRET=your_secret');
console.log('5. Add MongoDB addon: heroku addons:create mongolab:sandbox');
console.log('6. Push your code to Heroku: git push heroku master');
console.log('\nAlternatively, you can deploy through the Heroku dashboard:');
console.log('1. Push your code to GitHub');
console.log('2. Go to heroku.com and create a new app');
console.log('3. Connect your GitHub repository');
console.log('4. Configure environment variables');
console.log('5. Deploy your application');
console.log('\nSee GITHUB_DEPLOYMENT.md for more detailed instructions.');
