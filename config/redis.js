/**
 * Redis Configuration
 * This file configures Redis connection for the application
 */

const redis = require('redis');
const { promisify } = require('util');

// Check if Redis is enabled
const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

let client = null;
let getAsync = null;
let setAsync = null;
let delAsync = null;

// Initialize Redis client if enabled
if (isRedisEnabled) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  client = redis.createClient({
    url: redisUrl,
    retry_strategy: function(options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        // End reconnecting on a specific error
        console.error('Redis connection refused. Check if Redis server is running.');
        return new Error('Redis server refused connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout
        return new Error('Redis retry time exhausted');
      }
      if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
      }
      // Reconnect after
      return Math.min(options.attempt * 100, 3000);
    }
  });

  client.on('error', (err) => {
    console.error('Redis Error:', err);
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  // Promisify Redis functions
  getAsync = promisify(client.get).bind(client);
  setAsync = promisify(client.set).bind(client);
  delAsync = promisify(client.del).bind(client);
} else {
  console.log('Redis is disabled. Using mock Redis implementation.');
  
  // Mock Redis implementation using in-memory storage
  const mockStorage = new Map();
  
  getAsync = async (key) => {
    return mockStorage.get(key) || null;
  };
  
  setAsync = async (key, value, mode, duration) => {
    mockStorage.set(key, value);
    
    // Handle expiration if specified
    if (mode === 'EX' && duration) {
      setTimeout(() => {
        mockStorage.delete(key);
      }, duration * 1000);
    }
    
    return 'OK';
  };
  
  delAsync = async (key) => {
    return mockStorage.delete(key) ? 1 : 0;
  };
  
  // Mock client for health checks
  client = {
    ping: (callback) => {
      if (callback) {
        callback(null, 'PONG');
      }
      return 'PONG';
    }
  };
}

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync,
  isRedisEnabled
};
