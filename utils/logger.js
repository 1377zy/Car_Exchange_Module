/**
 * Simple Logger Utility
 * Provides logging functionality for development environment
 */

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    console.debug(`[DEBUG] ${message}`, meta);
  },
  
  http: (message, meta = {}) => {
    console.log(`[HTTP] ${message}`, meta);
  }
};

module.exports = logger;
