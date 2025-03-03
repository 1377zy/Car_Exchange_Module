const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunicationSchema = new Schema({
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'lead',
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'call', 'note'],
    required: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  subject: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  template: {
    type: Schema.Types.ObjectId,
    ref: 'template'
  },
  attachments: [{
    filename: String,
    path: String,
    contentType: String
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'failed', 'received'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  metadata: {
    // For email: tracking data, etc.
    // For SMS: delivery receipts, etc.
    // For call: duration, recording URL, etc.
    type: Schema.Types.Mixed
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
CommunicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('communication', CommunicationSchema);
