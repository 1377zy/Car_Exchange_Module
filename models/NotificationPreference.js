const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationPreferenceSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  email: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: {
      leads: {
        type: Boolean,
        default: true
      },
      appointments: {
        type: Boolean,
        default: true
      },
      communications: {
        type: Boolean,
        default: true
      },
      vehicles: {
        type: Boolean,
        default: true
      },
      system: {
        type: Boolean,
        default: true
      }
    }
  },
  browser: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: {
      leads: {
        type: Boolean,
        default: true
      },
      appointments: {
        type: Boolean,
        default: true
      },
      communications: {
        type: Boolean,
        default: true
      },
      vehicles: {
        type: Boolean,
        default: true
      },
      system: {
        type: Boolean,
        default: true
      }
    }
  },
  sms: {
    enabled: {
      type: Boolean,
      default: false
    },
    types: {
      leads: {
        type: Boolean,
        default: false
      },
      appointments: {
        type: Boolean,
        default: true
      },
      communications: {
        type: Boolean,
        default: false
      },
      vehicles: {
        type: Boolean,
        default: false
      },
      system: {
        type: Boolean,
        default: false
      }
    }
  },
  sound: {
    enabled: {
      type: Boolean,
      default: true
    },
    volume: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
NotificationPreferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('notificationPreference', NotificationPreferenceSchema);
