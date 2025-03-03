const promClient = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseOperationDurationSeconds = new promClient.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2]
});

const notificationsDeliveredCounter = new promClient.Counter({
  name: 'notifications_delivered_total',
  help: 'Total number of notifications delivered',
  labelNames: ['type', 'channel']
});

const activeUsersGauge = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

const socketConnectionsGauge = new promClient.Gauge({
  name: 'socket_connections',
  help: 'Number of active socket connections'
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(databaseOperationDurationSeconds);
register.registerMetric(notificationsDeliveredCounter);
register.registerMetric(activeUsersGauge);
register.registerMetric(socketConnectionsGauge);

// Middleware to track HTTP request duration and count
const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint to avoid infinite loops
  if (req.path === '/api/metrics') {
    return next();
  }
  
  // Start timer
  const start = Date.now();
  
  // Record end time and metrics on response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    
    // Increment request counter
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    // Record request duration
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode
      },
      duration
    );
  });
  
  next();
};

// Endpoint to expose metrics
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).send('Error generating metrics');
  }
};

// Helper function to track database operations
const trackDatabaseOperation = (operation, collection, durationMs) => {
  databaseOperationDurationSeconds.observe(
    { operation, collection },
    durationMs / 1000 // Convert to seconds
  );
};

// Helper function to track notification delivery
const trackNotificationDelivered = (type, channel) => {
  notificationsDeliveredCounter.inc({ type, channel });
};

// Helper function to update active users count
const updateActiveUsers = (count) => {
  activeUsersGauge.set(count);
};

// Helper function to update socket connections count
const updateSocketConnections = (count) => {
  socketConnectionsGauge.set(count);
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  trackDatabaseOperation,
  trackNotificationDelivered,
  updateActiveUsers,
  updateSocketConnections
};
