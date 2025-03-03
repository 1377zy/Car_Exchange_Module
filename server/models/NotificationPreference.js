/**
 * Notification Preference Model
 * Stores user preferences for notifications
 */

const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  // Notification channels
  email: {
    type: Boolean,
    default: true
  },
  sms: {
    type: Boolean,
    default: false
  },
  browser: {
    type: Boolean,
    default: true
  },
  push: {
    type: Boolean,
    default: true
  },
  sound: {
    type: Boolean,
    default: true
  },
  // Notification types
  types: {
    leads: {
      type: Boolean,
      default: true
    },
    appointments: {
      type: Boolean,
      default: true
    },
    vehicles: {
      type: Boolean,
      default: true
    },
    communications: {
      type: Boolean,
      default: true
    },
    system: {
      type: Boolean,
      default: true
    }
  },
  // Sound notification settings
  soundVolume: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 1
  },
  soundNotifications: {
    type: Boolean,
    default: true
  },
  // Browser notification settings
  browserNotifications: {
    type: Boolean,
    default: true
  },
  requireInteraction: {
    type: Boolean,
    default: false
  },
  showOnlyWhenHidden: {
    type: Boolean,
    default: true
  },
  // Custom sound preferences
  customSounds: {
    leads: {
      type: String,
      default: 'default'
    },
    appointments: {
      type: String,
      default: 'default'
    },
    vehicles: {
      type: String,
      default: 'default'
    },
    communications: {
      type: String,
      default: 'default'
    },
    system: {
      type: String,
      default: 'default'
    }
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
NotificationPreferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a unique index on user to ensure one preference document per user
NotificationPreferenceSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('notificationPreference', NotificationPreferenceSchema);
