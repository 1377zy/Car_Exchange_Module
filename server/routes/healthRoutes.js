const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const os = require('os');

/**
 * @route GET /api/health
 * @desc Health check endpoint for the API
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Redis connection if enabled
    let redisStatus = 'disabled';
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        if (redis.status === 'ready') {
          redisStatus = 'connected';
        } else {
          redisStatus = 'disconnected';
        }
      } catch (error) {
        redisStatus = 'error';
        logger.error('Redis health check failed', { error });
      }
    }
    
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
    const isHealthy = dbStatus === 'connected' && 
                     (redisStatus === 'connected' || redisStatus === 'disabled');
    
    // Build response
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: dbStatus
        },
        redis: {
          status: redisStatus
        }
      },
      system: systemInfo
    };
    
    // Send response with appropriate status code
    return res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error });
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
    
    // Check Redis connection if enabled
    let redisStatus = 'disabled';
    let redisInfo = null;
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        if (redis.status === 'ready') {
          redisStatus = 'connected';
          // Get Redis info
          redisInfo = await redis.info();
        } else {
          redisStatus = 'disconnected';
        }
      } catch (error) {
        redisStatus = 'error';
        logger.error('Redis detailed health check failed', { error });
      }
    }
    
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
    const isHealthy = dbStatus === 'connected' && 
                     (redisStatus === 'connected' || redisStatus === 'disabled');
    
    // Build response
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: dbStatus,
          name: 'MongoDB',
          version: mongoose.version,
          host: process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1]?.split('/')[0] : 'unknown'
        },
        redis: {
          status: redisStatus,
          info: redisInfo
        }
      },
      system: systemInfo,
      processEnv: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    };
    
    // Send response with appropriate status code
    return res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    logger.error('Detailed health check failed', { error });
    return res.status(500).json({
      status: 'error',
      message: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
