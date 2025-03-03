const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Vehicle = require('../models/Vehicle');
const VehicleInterest = require('../models/VehicleInterest');
const socketManager = require('../utils/socketManager');

/**
 * @route   POST api/vehicles
 * @desc    Create a vehicle
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('make', 'Make is required').not().isEmpty(),
      check('model', 'Model is required').not().isEmpty(),
      check('year', 'Year is required').isNumeric(),
      check('price', 'Price is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        make,
        model,
        year,
        trim,
        vin,
        stockNumber,
        condition,
        exteriorColor,
        interiorColor,
        mileage,
        price,
        msrp,
        transmission,
        drivetrain,
        engine,
        fuelType,
        mpg,
        features,
        description,
        images,
        status,
        location
      } = req.body;

      // Check if VIN already exists
      if (vin) {
        const existingVehicle = await Vehicle.findOne({ vin });
        if (existingVehicle) {
          return res.status(400).json({ msg: 'Vehicle with this VIN already exists' });
        }
      }

      // Create new vehicle
      const newVehicle = new Vehicle({
        make,
        model,
        year,
        trim,
        vin,
        stockNumber,
        condition,
        exteriorColor,
        interiorColor,
        mileage,
        price,
        msrp,
        transmission,
        drivetrain,
        engine,
        fuelType,
        mpg,
        features,
        description,
        images,
        status,
        location
      });

      const vehicle = await newVehicle.save();

      res.json(vehicle);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET api/vehicles
 * @desc    Get all vehicles
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const {
      make,
      model,
      year,
      minPrice,
      maxPrice,
      condition,
      status,
      search,
      sort,
      limit = 20,
      page = 1
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by make
    if (make) {
      query.make = make;
    }
    
    // Filter by model
    if (model) {
      query.model = model;
    }
    
    // Filter by year
    if (year) {
      query.year = year;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    // Filter by condition
    if (condition) {
      query.condition = condition;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default to available vehicles
      query.status = 'available';
    }
    
    // Search by make, model, vin, or stockNumber
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { make: searchRegex },
        { model: searchRegex },
        { vin: searchRegex },
        { stockNumber: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { price: 1 };
          break;
        case 'price-desc':
          sortOption = { price: -1 };
          break;
        case 'year-desc':
          sortOption = { year: -1, make: 1, model: 1 };
          break;
        case 'year-asc':
          sortOption = { year: 1, make: 1, model: 1 };
          break;
        case 'make':
          sortOption = { make: 1, model: 1, year: -1 };
          break;
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get vehicles with pagination
    const vehicles = await Vehicle.find(query)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await Vehicle.countDocuments(query);
    
    res.json({
      vehicles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private
 */
router.put(
  '/:id',
  [
    auth,
    [
      check('make', 'Make is required').not().isEmpty(),
      check('model', 'Model is required').not().isEmpty(),
      check('year', 'Year is required').isNumeric(),
      check('price', 'Price is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let vehicle = await Vehicle.findById(req.params.id);
      
      if (!vehicle) {
        return res.status(404).json({ msg: 'Vehicle not found' });
      }
      
      const {
        make,
        model,
        year,
        trim,
        vin,
        stockNumber,
        condition,
        exteriorColor,
        interiorColor,
        mileage,
        price,
        msrp,
        transmission,
        drivetrain,
        engine,
        fuelType,
        mpg,
        features,
        description,
        images,
        status,
        location
      } = req.body;
      
      // Check if VIN is changing and already exists
      if (vin && vin !== vehicle.vin) {
        const existingVehicle = await Vehicle.findOne({ vin });
        if (existingVehicle) {
          return res.status(400).json({ msg: 'Vehicle with this VIN already exists' });
        }
      }
      
      // Update fields
      vehicle.make = make;
      vehicle.model = model;
      vehicle.year = year;
      if (trim !== undefined) vehicle.trim = trim;
      if (vin !== undefined) vehicle.vin = vin;
      if (stockNumber !== undefined) vehicle.stockNumber = stockNumber;
      if (condition !== undefined) vehicle.condition = condition;
      if (exteriorColor !== undefined) vehicle.exteriorColor = exteriorColor;
      if (interiorColor !== undefined) vehicle.interiorColor = interiorColor;
      if (mileage !== undefined) vehicle.mileage = mileage;
      vehicle.price = price;
      if (msrp !== undefined) vehicle.msrp = msrp;
      if (transmission !== undefined) vehicle.transmission = transmission;
      if (drivetrain !== undefined) vehicle.drivetrain = drivetrain;
      if (engine !== undefined) vehicle.engine = engine;
      if (fuelType !== undefined) vehicle.fuelType = fuelType;
      if (mpg !== undefined) vehicle.mpg = mpg;
      if (features !== undefined) vehicle.features = features;
      if (description !== undefined) vehicle.description = description;
      if (images !== undefined) vehicle.images = images;
      if (status !== undefined) vehicle.status = status;
      if (location !== undefined) vehicle.location = location;
      
      vehicle.updatedAt = Date.now();
      
      await vehicle.save();
      
      // Find leads interested in this vehicle and notify them
      if (status === 'available' && vehicle.status !== 'available') {
        const interests = await VehicleInterest.find({ vehicle: vehicle._id })
          .populate('lead', 'assignedTo');
        
        // Get unique assigned users
        const userIds = [...new Set(interests.map(interest => 
          interest.lead && interest.lead.assignedTo ? 
          interest.lead.assignedTo.toString() : null
        ).filter(id => id))];
        
        // Send notifications
        if (userIds.length > 0) {
          socketManager.sendVehicleUpdate(
            vehicle._id.toString(),
            userIds,
            {
              status: 'available',
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year
            }
          );
        }
      }
      
      res.json(vehicle);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Vehicle not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private/Admin
 */
router.delete('/:id', [auth, roleAuth(['admin', 'manager'])], async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    
    // Check if vehicle has any interests
    const interestCount = await VehicleInterest.countDocuments({ vehicle: req.params.id });
    
    if (interestCount > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete vehicle with active interests. Remove interests first or change vehicle status to sold.' 
      });
    }
    
    await vehicle.remove();
    
    res.json({ msg: 'Vehicle removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/vehicles/:id/images
 * @desc    Add images to vehicle
 * @access  Private
 */
router.post(
  '/:id/images',
  [
    auth,
    [
      check('images', 'Images array is required').isArray()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const vehicle = await Vehicle.findById(req.params.id);
      
      if (!vehicle) {
        return res.status(404).json({ msg: 'Vehicle not found' });
      }
      
      const { images } = req.body;
      
      // Add images to vehicle
      vehicle.images = [...vehicle.images, ...images];
      
      await vehicle.save();
      
      res.json(vehicle.images);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Vehicle not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE api/vehicles/:id/images/:imageId
 * @desc    Remove image from vehicle
 * @access  Private
 */
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    
    // Find image index
    const imageIndex = vehicle.images.findIndex(img => img._id.toString() === req.params.imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ msg: 'Image not found' });
    }
    
    // Remove image
    vehicle.images.splice(imageIndex, 1);
    
    await vehicle.save();
    
    res.json(vehicle.images);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle or image not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;
