/**
 * Production Configuration for Car Exchange Module
 * This file contains configuration settings for production deployment
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    corsOrigins: process.env.CORS_ORIGINS || 'https://carexchange.example.com',
    trustProxy: true,
    compressionEnabled: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false
    }
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50
    },
    // Replica set configuration for production
    replicaSet: {
      enabled: process.env.DB_REPLICA_SET_ENABLED === 'true',
      name: process.env.DB_REPLICA_SET_NAME || 'rs0'
    }
  },

  // Redis configuration for caching and session management
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    ttl: 86400 // 24 hours
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Email configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    from: process.env.EMAIL_FROM || 'noreply@carexchange.example.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY
    }
  },

  // SMS configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  },

  // File storage configuration
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    local: {
      uploadDir: process.env.UPLOAD_DIR || 'uploads/'
    },
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: ['console', 'file'],
    fileOptions: {
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }
  },

  // Socket.io configuration
  socketio: {
    cors: {
      origin: process.env.CORS_ORIGINS || 'https://carexchange.example.com',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  },

  // Push notification configuration
  pushNotifications: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@carexchange.example.com'
  },

  // Security settings
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'https://*.s3.amazonaws.com'],
          connectSrc: ["'self'", 'https://api.carexchange.example.com']
        }
      },
      hsts: {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true
      }
    },
    rateLimit: true,
    cors: true,
    csrf: process.env.CSRF_PROTECTION === 'true'
  },

  // Monitoring configuration
  monitoring: {
    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.2
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: process.env.PROMETHEUS_PORT || 9090
    }
  }
};
