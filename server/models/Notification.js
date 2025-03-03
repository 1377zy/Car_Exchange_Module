/**
 * Notification Model
 * Stores user notifications
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['leads', 'appointments', 'vehicles', 'communications', 'system'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  icon: {
    type: String,
    default: 'notification'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Optional reference to related entity
  entityType: {
    type: String,
    enum: ['lead', 'appointment', 'vehicle', 'communication', 'user', null],
    default: null
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Action to take when notification is clicked
  action: {
    type: {
      type: String,
      enum: ['link', 'route', 'function', null],
      default: null
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  // Additional data for the notification
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Delivery channels
  deliveredVia: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    browser: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sound: {
      type: Boolean,
      default: false
    }
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  }
});

// Create indexes for efficient querying
NotificationSchema.index({ user: 1, read: 1 });
NotificationSchema.index({ user: 1, type: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion

module.exports = mongoose.model('notification', NotificationSchema);
