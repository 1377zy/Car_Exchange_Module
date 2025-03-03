const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'lead',
    required: true
  },
  type: {
    type: String,
    enum: ['test-drive', 'sales-consultation', 'service', 'delivery', 'follow-up', 'other'],
    default: 'sales-consultation'
  },
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'vehicle'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    default: 'Dealership'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date
    }
  }],
  outcome: {
    status: {
      type: String,
      enum: ['successful', 'follow-up-needed', 'not-interested', 'purchased', 'other']
    },
    notes: String,
    nextSteps: String
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('appointment', AppointmentSchema);
