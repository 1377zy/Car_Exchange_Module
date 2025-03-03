const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const { format } = winston;

// Define log directory
const logDir = process.env.LOG_DIR || 'logs';

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create console format with colors for development
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create file transport for rotating logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
});

// Create error-specific transport for rotating logs
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  zippedArchive: true
});

// Create transports array based on environment
const transports = [
  new winston.transports.Console({
    format: consoleFormat
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(fileRotateTransport);
  transports.push(errorFileRotateTransport);
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'car-exchange-api' },
  transports
});

// Add Sentry integration if enabled
if (process.env.SENTRY_ENABLED === 'true' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.2
  });
  
  // Create a Sentry transport
  class SentryTransport extends winston.Transport {
    constructor(opts) {
      super(opts);
      this.name = 'sentry';
      this.level = opts.level || 'error';
    }
    
    log(info, callback) {
      const { level, message, ...meta } = info;
      
      if (level === 'error' || level === 'fatal') {
        if (meta.error instanceof Error) {
          Sentry.captureException(meta.error);
        } else {
          Sentry.captureMessage(message, {
            level: Sentry.Severity.Error,
            extra: meta
          });
        }
      }
      
      callback();
    }
  }
  
  // Add Sentry transport
  logger.add(new SentryTransport({ level: 'error' }));
}

// Create a stream object for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Helper function to log API requests
logger.logApiRequest = (req, res, next) => {
  const start = Date.now();
  
  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    // Log at different levels based on status code
    if (res.statusCode >= 500) {
      logger.error(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous'
      });
    } else if (res.statusCode >= 400) {
      logger.warn(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous'
      });
    } else {
      logger.http(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous'
      });
    }
  });
  
  next();
};

module.exports = logger;
