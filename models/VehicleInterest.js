const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleInterestSchema = new Schema({
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'lead',
    required: true
  },
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'vehicle'
  },
  // If the vehicle doesn't exist in inventory but customer is interested in a specific type
  vehiclePreferences: {
    make: String,
    model: String,
    year: {
      min: Number,
      max: Number
    },
    priceRange: {
      min: Number,
      max: Number
    },
    condition: {
      type: String,
      enum: ['new', 'used', 'certified', 'any']
    },
    features: [String],
    notes: String
  },
  interestLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'hot'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'test-drive-scheduled', 'test-drive-completed', 'offer-made', 'purchased', 'lost'],
    default: 'active'
  },
  notes: [{
    text: {
      type: String,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user'
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
VehicleInterestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('vehicleInterest', VehicleInterestSchema);
