# Car Exchange Module

A comprehensive dealership management system for vehicle inventory, lead management, and customer communications.

## Features

- **User Management**: Role-based access control with admin, manager, agent, and user roles
- **Lead Management**: Track and manage customer leads through the sales pipeline
- **Vehicle Inventory**: Manage vehicle listings with detailed information and images
- **Appointment Scheduling**: Schedule and manage test drives and consultations
- **Communication Tracking**: Track all customer communications including emails and SMS
- **Notification System**: Real-time notifications for new leads, appointments, and messages
- **Reporting**: Generate reports on sales, inventory, and lead conversion

## Deployment Options

### Local Development (No MongoDB Required)

For quick local development without setting up MongoDB:

1. Run the local development deployment script:
   ```
   node deploy-local-dev.js
   ```

2. This script will:
   - Check for Node.js and npm
   - Set up environment variables for local development
   - Install dependencies
   - Seed a mock database with sample data
   - Offer to start the development server

3. Access the application:
   - API: http://localhost:5000
   - Frontend (if built): http://localhost:3000

### Local Deployment (With MongoDB)

For a more production-like local deployment:

1. Install MongoDB locally or use a remote MongoDB instance

2. Update the MongoDB connection string:
   ```
   node update-mongodb-connection.js
   ```

3. Run the deployment script:
   ```
   node deploy.js
   ```

4. Start the server:
   ```
   npm start
   ```

### Cloud Deployment (Render.com)

For deploying to Render.com:

1. Run the Render deployment preparation script:
   ```
   node deploy-to-render.js
   ```

2. Push your code to GitHub:
   ```
   git push origin master
   ```

3. Go to [Render.com](https://render.com) and create a new Web Service

4. Connect your GitHub repository

5. Configure the following settings:
   - Build Command: `./build.sh`
   - Start Command: `npm start`

6. Add environment variables in the Render dashboard:
   - `NODE_ENV`: production
   - `JWT_SECRET`: [your-secure-secret]
   - `MONGODB_URI`: [your-mongodb-connection-string]
   - `CORS_ORIGINS`: [your-frontend-url]
   - `FRONTEND_URL`: [your-frontend-url]

7. Deploy your application

### Docker Deployment

For containerized deployment:

1. Make sure Docker and Docker Compose are installed

2. Build and start the containers:
   ```
   docker-compose up -d
   ```

3. Access the application:
   - API: http://localhost:5000
   - Frontend: http://localhost:3000
   - Monitoring: http://localhost:9090 (Prometheus) and http://localhost:3001 (Grafana)

## API Endpoints

The API includes the following main endpoints:

- `/api/auth`: User authentication endpoints
- `/api/users`: User management
- `/api/leads`: Lead management
- `/api/vehicles`: Vehicle inventory management
- `/api/vehicle-interests`: Track customer interest in vehicles
- `/api/communications`: Email and SMS communication
- `/api/appointments`: Schedule and manage appointments
- `/api/templates`: Email and SMS templates
- `/api/notifications`: User notifications
- `/api/health`: Health check endpoint

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Real-time**: Socket.io for notifications
- **Frontend**: React with Material-UI
- **Monitoring**: Prometheus and Grafana
- **Containerization**: Docker and Docker Compose

## Development

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- MongoDB (optional for local development)

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: Copy `.env.example` to `.env` and update values
4. Start the development server: `npm run dev`

## License

This project is proprietary and confidential.
