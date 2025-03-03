#!/bin/bash
# Car Exchange Module Deployment Script

# Exit on error
set -e

# Configuration
APP_NAME="car-exchange-module"
DEPLOY_ENV=${1:-production}  # Default to production if no argument provided
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="./backups"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Car Exchange Module Deployment Script  ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}Deploying to: ${DEPLOY_ENV}${NC}"
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"
echo ""

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker is not installed.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed.${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Backup current deployment if it exists
if [ -f ".env" ] && [ -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}Backing up current deployment...${NC}"
    tar -czf "${BACKUP_DIR}/${APP_NAME}-${DEPLOY_ENV}-${TIMESTAMP}.tar.gz" .env docker-compose.yml
    echo -e "${GREEN}Backup created: ${BACKUP_DIR}/${APP_NAME}-${DEPLOY_ENV}-${TIMESTAMP}.tar.gz${NC}"
fi

# Load appropriate environment file
if [ "${DEPLOY_ENV}" = "production" ]; then
    ENV_FILE=".env.production"
elif [ "${DEPLOY_ENV}" = "staging" ]; then
    ENV_FILE=".env.staging"
else
    echo -e "${RED}Error: Invalid environment '${DEPLOY_ENV}'. Use 'production' or 'staging'.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "${ENV_FILE}" ]; then
    echo -e "${RED}Error: Environment file '${ENV_FILE}' not found.${NC}"
    echo -e "${YELLOW}Please create it from .env.example:${NC}"
    echo -e "cp .env.example ${ENV_FILE}"
    exit 1
fi

# Copy environment file
echo -e "${YELLOW}Setting up environment...${NC}"
cp "${ENV_FILE}" .env
echo -e "${GREEN}Environment configured.${NC}"

# Pull latest images
echo -e "${YELLOW}Pulling latest Docker images...${NC}"
docker-compose pull
echo -e "${GREEN}Docker images updated.${NC}"

# Stop and remove existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down
echo -e "${GREEN}Existing containers stopped.${NC}"

# Start new containers
echo -e "${YELLOW}Starting new containers...${NC}"
docker-compose up -d --build
echo -e "${GREEN}New containers started.${NC}"

# Check if containers are running
echo -e "${YELLOW}Checking container status...${NC}"
sleep 5
CONTAINERS=$(docker-compose ps -q)
ALL_RUNNING=true

for CONTAINER in ${CONTAINERS}; do
    STATUS=$(docker inspect --format='{{.State.Status}}' ${CONTAINER})
    if [ "${STATUS}" != "running" ]; then
        ALL_RUNNING=false
        CONTAINER_NAME=$(docker inspect --format='{{.Name}}' ${CONTAINER} | sed 's/\///')
        echo -e "${RED}Container ${CONTAINER_NAME} is not running (status: ${STATUS})${NC}"
    fi
done

if [ "${ALL_RUNNING}" = true ]; then
    echo -e "${GREEN}All containers are running.${NC}"
else
    echo -e "${RED}Some containers failed to start. Check logs with 'docker-compose logs'.${NC}"
    exit 1
fi

# Cleanup old images
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -af
echo -e "${GREEN}Cleanup completed.${NC}"

# Display success message
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!     ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${YELLOW}Environment: ${DEPLOY_ENV}${NC}"
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"
echo ""
echo -e "${BLUE}To view logs:${NC} docker-compose logs -f"
echo -e "${BLUE}To stop:${NC} docker-compose down"
echo -e "${BLUE}To restart:${NC} docker-compose restart"
echo ""
