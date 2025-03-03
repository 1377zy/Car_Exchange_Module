# Car Exchange Module - Deployment Guide

This guide provides instructions for deploying the Car Exchange Module to production and staging environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Backup and Restore](#backup-and-restore)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB (managed service or self-hosted)
- Redis (managed service or self-hosted)
- SSL certificates for your domain
- GitHub account (for CI/CD)

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/car-exchange-module.git
   cd car-exchange-module
   ```

2. Create environment files:
   ```bash
   cp .env.example .env.production
   cp .env.example .env.staging
   ```

3. Edit the environment files with your specific configuration:
   - Database credentials
   - Redis credentials
   - JWT secrets
   - Email/SMS service credentials
   - S3 credentials (if using S3 for file storage)
   - Monitoring credentials

## Docker Deployment

### Manual Deployment

1. Deploy using the deployment script:
   ```bash
   # For production
   ./deployment/deploy.sh production
   
   # For staging
   ./deployment/deploy.sh staging
   ```

2. Verify the deployment:
   ```bash
   docker-compose ps
   ```

### Docker Compose Configuration

The `docker-compose.yml` file includes the following services:

- **MongoDB**: Database server
- **Redis**: Caching and session management
- **API**: Node.js backend API
- **Nginx**: Web server and reverse proxy
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

## CI/CD Pipeline

The CI/CD pipeline is configured using GitHub Actions in `.github/workflows/main.yml`.

### Pipeline Stages

1. **Test**: Runs unit and integration tests
2. **Build**: Builds the application and creates a deployment package
3. **Deploy to Staging**: Automatically deploys to staging when the develop branch is updated
4. **Deploy to Production**: Automatically deploys to production when the main branch is updated

### GitHub Secrets

The following secrets need to be configured in your GitHub repository:

- `SSH_PRIVATE_KEY`: SSH key for deployment
- `SSH_USER`: SSH username for deployment
- `STAGING_HOST`: Hostname for staging server
- `PRODUCTION_HOST`: Hostname for production server
- `STAGING_ENV`: Complete .env file content for staging
- `PRODUCTION_ENV`: Complete .env file content for production
- `SLACK_WEBHOOK_URL`: Webhook URL for Slack notifications

## Monitoring and Logging

### Prometheus and Grafana

1. Access Grafana at `https://your-domain:3000`
2. Default login: admin/admin (change this immediately)
3. Prometheus metrics are available at `https://your-domain:9090`

### Logging

Logs are stored in the following locations:

- Application logs: `./logs/application-*.log`
- Error logs: `./logs/error-*.log`
- Access logs: Managed by Nginx

### Health Checks

- API health check: `https://your-domain/api/health`
- Web server health check: `https://your-domain/health`

## Backup and Restore

### Database Backup

1. Create a MongoDB backup:
   ```bash
   docker-compose exec mongodb mongodump --uri="mongodb://username:password@localhost:27017/car_exchange" --out=/data/backup/$(date +%Y%m%d)
   ```

2. Copy the backup to your local machine:
   ```bash
   docker cp car-exchange-mongodb:/data/backup ./backups
   ```

### Restore from Backup

1. Copy the backup to the MongoDB container:
   ```bash
   docker cp ./backups/20230101 car-exchange-mongodb:/data/restore
   ```

2. Restore the database:
   ```bash
   docker-compose exec mongodb mongorestore --uri="mongodb://username:password@localhost:27017/car_exchange" --drop /data/restore/20230101
   ```

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check logs: `docker-compose logs [service-name]`
   - Verify environment variables
   - Check disk space and permissions

2. **Database connection issues**:
   - Verify MongoDB connection string
   - Check network connectivity
   - Ensure MongoDB user has correct permissions

3. **Nginx configuration**:
   - Test configuration: `docker-compose exec nginx nginx -t`
   - Check SSL certificate paths and permissions

### Support

For additional support, contact the development team at:
- Email: support@carexchange.example.com
- Internal Slack: #car-exchange-support
