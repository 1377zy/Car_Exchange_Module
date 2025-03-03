# Car Exchange Module Deployment Guide

## Introduction

This guide provides comprehensive instructions for deploying the Car Exchange Module to various environments. Choose the deployment option that best fits your needs.

## Table of Contents

1. [GitHub Repository Setup](#github-repository-setup)
2. [Local Development (No MongoDB)](#local-development-no-mongodb)
3. [Local Deployment (With MongoDB)](#local-deployment-with-mongodb)
4. [Cloud Deployment - Render.com](#cloud-deployment---rendercom)
5. [Cloud Deployment - Railway.app](#cloud-deployment---railwayapp)
6. [Cloud Deployment - Heroku](#cloud-deployment---heroku)
7. [Docker Deployment](#docker-deployment)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

## GitHub Repository Setup

Before deploying to cloud services, you should set up a GitHub repository for your code.

### Automated Setup

Use our GitHub repository setup script:

```bash
node setup-github-repo.js
```

This script will guide you through the process of creating a GitHub repository and pushing your code.

### Manual Setup

1. Create a new repository on GitHub
2. Initialize Git in your local directory (if not already done)
3. Add the GitHub repository as a remote
4. Push your code to GitHub

For detailed instructions, see [GITHUB_SETUP.md](GITHUB_SETUP.md).

## Local Development (No MongoDB)

For quick local development without setting up MongoDB:

```bash
# Prepare the environment
node deploy-local-dev.js

# Start the application
npm start
```

This will:
- Set up environment variables for local development
- Install dependencies
- Seed a mock database with sample data
- Start the development server

## Local Deployment (With MongoDB)

For a more production-like local deployment:

```bash
# Install MongoDB locally or use a remote MongoDB instance

# Update the MongoDB connection string
node update-mongodb-connection.js

# Start the server
npm start
```

## Cloud Deployment - Render.com

For deploying to Render.com:

```bash
# Prepare for Render deployment
node deploy-to-render.js

# Push your code to GitHub
git push origin master
```

Then:
1. Go to [Render.com](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure the following settings:
   - Build Command: `./build.sh`
   - Start Command: `npm start`
4. Add environment variables in the Render dashboard
5. Deploy your application

## Cloud Deployment - Railway.app

For deploying to Railway.app:

```bash
# Prepare for Railway deployment
node deploy-to-railway.js

# Install the Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link

# Deploy your application
railway up

# Set environment variables
railway variables set JWT_SECRET=your_secret
```

Alternatively, you can deploy through the Railway dashboard:
1. Push your code to GitHub
2. Go to [Railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy your application

## Cloud Deployment - Heroku

For deploying to Heroku:

```bash
# Prepare for Heroku deployment
node deploy-to-heroku.js

# Install the Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create a new Heroku app
heroku create car-exchange-module

# Set environment variables
heroku config:set JWT_SECRET=your_secret

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Push your code to Heroku
git push heroku master
```

Alternatively, you can deploy through the Heroku dashboard:
1. Push your code to GitHub
2. Go to [Heroku.com](https://heroku.com) and create a new app
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy your application

## Docker Deployment

For containerized deployment:

```bash
# Make sure Docker and Docker Compose are installed

# Build and start the containers
docker-compose up -d
```

This will:
- Build the Docker images
- Start the containers
- Set up MongoDB and Redis
- Start the application

## Environment Variables

The following environment variables are required for deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment (production, development, test) | production |
| PORT | Port for the server to listen on | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/car_exchange |
| JWT_SECRET | Secret key for JWT authentication | your_secure_secret |
| CORS_ORIGINS | Allowed CORS origins (comma-separated) | https://example.com |
| FRONTEND_URL | URL of the frontend application | https://example.com |
| REDIS_ENABLED | Enable Redis for caching (optional) | false |

## Troubleshooting

### MongoDB Connection Issues

If you're having trouble connecting to MongoDB:

1. Check that the MongoDB connection string is correct
2. Ensure that MongoDB is running
3. Check that the MongoDB user has the correct permissions
4. Try running `node check-mongodb.js` to test the connection

### Application Not Starting

If the application fails to start:

1. Check the logs for errors
2. Ensure that all environment variables are set correctly
3. Try running the application in development mode: `NODE_ENV=development npm start`
4. Check that all dependencies are installed: `npm install`

### Deployment Failures

If deployment to a cloud service fails:

1. Check the deployment logs
2. Ensure that the build and start commands are correct
3. Verify that all environment variables are set
4. Check that the application works locally before deploying

For more detailed troubleshooting, refer to the documentation for the specific deployment platform.
