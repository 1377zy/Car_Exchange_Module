const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  trim: {
    type: String
  },
  vin: {
    type: String,
    unique: true
  },
  stockNumber: {
    type: String
  },
  condition: {
    type: String,
    enum: ['new', 'used', 'certified'],
    default: 'used'
  },
  exteriorColor: {
    type: String
  },
  interiorColor: {
    type: String
  },
  mileage: {
    type: Number
  },
  price: {
    type: Number,
    required: true
  },
  msrp: {
    type: Number
  },
  transmission: {
    type: String,
    enum: ['automatic', 'manual', 'cvt', 'other']
  },
  drivetrain: {
    type: String,
    enum: ['fwd', 'rwd', 'awd', '4wd', 'other']
  },
  engine: {
    type: String
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'hybrid', 'electric', 'other']
  },
  mpg: {
    city: Number,
    highway: Number,
    combined: Number
  },
  features: [String],
  description: {
    type: String
  },
  images: [{
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['available', 'pending', 'sold', 'reserved'],
    default: 'available'
  },
  location: {
    type: String
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
VehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('vehicle', VehicleSchema);
