const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Lead = require('../models/Lead');
const User = require('../models/User');
const notificationManager = require('../utils/notificationManager');

/**
 * @route   POST api/leads
 * @desc    Create a lead
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone number is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        source,
        status,
        assignedTo,
        notes,
        tags
      } = req.body;

      // Create new lead
      const newLead = new Lead({
        firstName,
        lastName,
        email,
        phone,
        address,
        source,
        status,
        assignedTo: assignedTo || req.user.id,
        tags
      });

      // Add initial note if provided
      if (notes) {
        newLead.notes = [{
          text: notes,
          createdBy: req.user.id
        }];
      }

      const lead = await newLead.save();

      // Send notification to assigned user if different from creator
      if (assignedTo && assignedTo !== req.user.id) {
        await notificationManager.createLeadNotification(lead, 'assigned', assignedTo);
      }

      // Notify managers about new lead
      const managers = await User.find({ role: 'manager' }).select('_id');
      const managerIds = managers.map(manager => manager._id.toString());
      
      if (managerIds.length > 0) {
        await notificationManager.createNotificationForMany(
          managerIds,
          {
            type: 'lead',
            title: 'New Lead Created',
            message: `New lead created: ${firstName} ${lastName}`,
            link: `/leads/${lead._id}`,
            relatedTo: {
              model: 'lead',
              id: lead._id
            }
          }
        );
      }

      res.json(lead);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET api/leads
 * @desc    Get all leads
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const { status, assignedTo, search, sort, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    } else if (req.user.role === 'agent') {
      // Agents can only see their assigned leads
      query.assignedTo = req.user.id;
    }
    
    // Search by name, email, or phone
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    if (sort) {
      switch (sort) {
        case 'name':
          sortOption = { firstName: 1, lastName: 1 };
          break;
        case 'status':
          sortOption = { status: 1, createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get leads with pagination
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await Lead.countDocuments(query);
    
    res.json({
      leads,
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
 * @route   GET api/leads/:id
 * @desc    Get lead by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.createdBy', 'name');
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    
    // Check if user has permission to view this lead
    if (
      req.user.role === 'agent' && 
      lead.assignedTo && 
      lead.assignedTo._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this lead' });
    }
    
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/leads/:id
 * @desc    Update lead
 * @access  Private
 */
router.put(
  '/:id',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone number is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Check if user has permission to update this lead
      if (
        req.user.role === 'agent' && 
        lead.assignedTo && 
        lead.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to update this lead' });
      }
      
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        source,
        status,
        assignedTo,
        tags,
        nextFollowUp
      } = req.body;
      
      // Update fields
      lead.firstName = firstName;
      lead.lastName = lastName;
      lead.email = email;
      lead.phone = phone;
      if (address) lead.address = address;
      if (source) lead.source = source;
      if (status) lead.status = status;
      if (tags) lead.tags = tags;
      if (nextFollowUp) lead.nextFollowUp = nextFollowUp;
      
      // Check if assignedTo is changing
      const isReassigning = assignedTo && lead.assignedTo.toString() !== assignedTo;
      
      if (isReassigning) {
        lead.assignedTo = assignedTo;
        
        // Notify new assignee
        await notificationManager.createLeadNotification(lead, 'assigned', assignedTo);
      }
      
      await lead.save();
      
      // Populate response data
      lead = await Lead.findById(req.params.id)
        .populate('assignedTo', 'name email')
        .populate('notes.createdBy', 'name');
      
      res.json(lead);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   POST api/leads/:id/notes
 * @desc    Add note to lead
 * @access  Private
 */
router.post(
  '/:id/notes',
  [
    auth,
    [
      check('text', 'Note text is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Check if user has permission to add notes to this lead
      if (
        req.user.role === 'agent' && 
        lead.assignedTo && 
        lead.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to add notes to this lead' });
      }
      
      const newNote = {
        text: req.body.text,
        createdBy: req.user.id
      };
      
      lead.notes.unshift(newNote);
      lead.lastContact = Date.now();
      
      await lead.save();
      
      // Populate the new note with user info
      const populatedLead = await Lead.findById(req.params.id)
        .populate('notes.createdBy', 'name');
      
      res.json(populatedLead.notes);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE api/leads/:id
 * @desc    Delete lead
 * @access  Private/Admin
 */
router.delete('/:id', [auth, roleAuth(['admin', 'manager'])], async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    
    await lead.remove();
    
    res.json({ msg: 'Lead removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;
