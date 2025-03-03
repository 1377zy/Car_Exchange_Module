const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const VehicleInterest = require('../models/VehicleInterest');
const Lead = require('../models/Lead');
const Vehicle = require('../models/Vehicle');
const notificationManager = require('../utils/notificationManager');

/**
 * @route   POST api/vehicle-interests
 * @desc    Create a vehicle interest
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('lead', 'Lead ID is required').not().isEmpty(),
      check('vehicle', 'Vehicle ID is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { lead, vehicle, notes, interestLevel } = req.body;

      // Check if lead exists
      const leadExists = await Lead.findById(lead);
      if (!leadExists) {
        return res.status(404).json({ msg: 'Lead not found' });
      }

      // Check if vehicle exists
      const vehicleExists = await Vehicle.findById(vehicle);
      if (!vehicleExists) {
        return res.status(404).json({ msg: 'Vehicle not found' });
      }

      // Check if interest already exists
      const existingInterest = await VehicleInterest.findOne({ lead, vehicle });
      if (existingInterest) {
        return res.status(400).json({ msg: 'Interest already exists for this lead and vehicle' });
      }

      // Create new interest
      const newInterest = new VehicleInterest({
        lead,
        vehicle,
        notes,
        interestLevel: interestLevel || 'medium',
        createdBy: req.user.id
      });

      const interest = await newInterest.save();

      // Notify lead owner if different from creator
      if (leadExists.assignedTo && leadExists.assignedTo.toString() !== req.user.id) {
        await notificationManager.createNotification(
          leadExists.assignedTo,
          {
            type: 'vehicleInterest',
            title: 'New Vehicle Interest',
            message: `New vehicle interest added for ${leadExists.firstName} ${leadExists.lastName}`,
            link: `/leads/${lead}/interests`,
            relatedTo: {
              model: 'vehicleInterest',
              id: interest._id
            }
          }
        );
      }

      // Populate response
      const populatedInterest = await VehicleInterest.findById(interest._id)
        .populate('lead', 'firstName lastName email phone')
        .populate('vehicle', 'make model year trim price images')
        .populate('createdBy', 'name');

      res.json(populatedInterest);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET api/vehicle-interests
 * @desc    Get all vehicle interests
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const { lead, vehicle, interestLevel, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by lead
    if (lead) {
      query.lead = lead;
    }
    
    // Filter by vehicle
    if (vehicle) {
      query.vehicle = vehicle;
    }
    
    // Filter by interest level
    if (interestLevel) {
      query.interestLevel = interestLevel;
    }
    
    // If user is an agent, only show interests for their leads
    if (req.user.role === 'agent') {
      const assignedLeads = await Lead.find({ assignedTo: req.user.id }).select('_id');
      const leadIds = assignedLeads.map(lead => lead._id);
      query.lead = { $in: leadIds };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get interests with pagination
    const interests = await VehicleInterest.find(query)
      .populate('lead', 'firstName lastName email phone')
      .populate('vehicle', 'make model year trim price images status')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await VehicleInterest.countDocuments(query);
    
    res.json({
      interests,
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
 * @route   GET api/vehicle-interests/:id
 * @desc    Get vehicle interest by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const interest = await VehicleInterest.findById(req.params.id)
      .populate('lead', 'firstName lastName email phone')
      .populate('vehicle', 'make model year trim price images status')
      .populate('createdBy', 'name');
    
    if (!interest) {
      return res.status(404).json({ msg: 'Vehicle interest not found' });
    }
    
    // Check if user has permission to view this interest
    if (req.user.role === 'agent') {
      const lead = await Lead.findById(interest.lead._id);
      if (lead.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to view this interest' });
      }
    }
    
    res.json(interest);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle interest not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/vehicle-interests/:id
 * @desc    Update vehicle interest
 * @access  Private
 */
router.put(
  '/:id',
  [
    auth,
    [
      check('interestLevel', 'Interest level is required').isIn(['low', 'medium', 'high'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const interest = await VehicleInterest.findById(req.params.id);
      
      if (!interest) {
        return res.status(404).json({ msg: 'Vehicle interest not found' });
      }
      
      // Check if user has permission to update this interest
      if (req.user.role === 'agent') {
        const lead = await Lead.findById(interest.lead);
        if (lead.assignedTo.toString() !== req.user.id) {
          return res.status(403).json({ msg: 'Not authorized to update this interest' });
        }
      }
      
      const { interestLevel, notes, status } = req.body;
      
      // Update fields
      if (interestLevel) interest.interestLevel = interestLevel;
      if (notes) interest.notes = notes;
      if (status) interest.status = status;
      
      interest.updatedAt = Date.now();
      
      await interest.save();
      
      // Populate response
      const updatedInterest = await VehicleInterest.findById(req.params.id)
        .populate('lead', 'firstName lastName email phone')
        .populate('vehicle', 'make model year trim price images status')
        .populate('createdBy', 'name');
      
      res.json(updatedInterest);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Vehicle interest not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE api/vehicle-interests/:id
 * @desc    Delete vehicle interest
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const interest = await VehicleInterest.findById(req.params.id);
    
    if (!interest) {
      return res.status(404).json({ msg: 'Vehicle interest not found' });
    }
    
    // Check if user has permission to delete this interest
    if (req.user.role === 'agent') {
      const lead = await Lead.findById(interest.lead);
      if (lead.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to delete this interest' });
      }
    }
    
    await interest.remove();
    
    res.json({ msg: 'Vehicle interest removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle interest not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;
