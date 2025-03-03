/**
 * Health Check Routes
 * Provides endpoints to check the health of the application and its dependencies
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');

// Mock Redis for development
const redis = {
  status: 'disabled',
  info: () => Promise.resolve('Mock Redis Info')
};

/**
 * @route GET /api/health
 * @desc Health check endpoint for the API
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // System information
    const systemInfo = {
      uptime: Math.floor(process.uptime()),
      memory: {
        free: os.freemem(),
        total: os.totalmem(),
        usage: process.memoryUsage()
      },
      cpu: os.cpus().length,
      hostname: os.hostname()
    };
    
    // Determine overall status
    const isHealthy = dbStatus === 'connected';
    
    // Build response
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: dbStatus
        },
        redis: {
          status: 'disabled'
        }
      },
      system: systemInfo
    };
    
    // Send response with appropriate status code
    return res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check failed', error);
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check endpoint for the API (admin only)
 * @access Private/Admin
 */
router.get('/detailed', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // System information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: Math.floor(process.uptime()),
      memory: {
        free: os.freemem(),
        total: os.totalmem(),
        usage: process.memoryUsage()
      },
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0].model,
        load: os.loadavg()
      },
      network: os.networkInterfaces(),
      hostname: os.hostname()
    };
    
    // Determine overall status
    const isHealthy = dbStatus === 'connected';
    
    // Build response
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: dbStatus,
          name: 'Mock MongoDB',
          version: mongoose.version,
          host: 'mock://localhost'
        },
        redis: {
          status: 'disabled',
          info: 'Mock Redis disabled for development'
        }
      },
      system: systemInfo,
      processEnv: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 5000
      }
    };
    
    // Send response with appropriate status code
    return res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Detailed health check failed', error);
    return res.status(500).json({
      status: 'error',
      message: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
