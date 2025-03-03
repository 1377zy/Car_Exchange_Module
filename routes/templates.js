const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Template = require('../models/Template');

/**
 * @route   POST api/templates
 * @desc    Create a template
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['email', 'sms']),
      check('content', 'Content is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, type, subject, content, description, isGlobal } = req.body;

      // Check if template name already exists for this user
      const existingTemplate = await Template.findOne({ 
        name, 
        createdBy: req.user.id
      });
      
      if (existingTemplate) {
        return res.status(400).json({ msg: 'Template with this name already exists' });
      }

      // Validate subject for email templates
      if (type === 'email' && !subject) {
        return res.status(400).json({ msg: 'Subject is required for email templates' });
      }

      // Create new template
      const newTemplate = new Template({
        name,
        type,
        subject: type === 'email' ? subject : null,
        content,
        description,
        isGlobal: isGlobal && ['admin', 'manager'].includes(req.user.role) ? true : false,
        createdBy: req.user.id
      });

      const template = await newTemplate.save();

      res.json(template);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET api/templates
 * @desc    Get all templates
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const { type, search, global } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by global/personal
    if (global === 'true') {
      query.isGlobal = true;
    } else if (global === 'false') {
      query.isGlobal = false;
      query.createdBy = req.user.id;
    } else {
      // Show both global templates and user's personal templates
      query.$or = [
        { isGlobal: true },
        { createdBy: req.user.id }
      ];
    }
    
    // Search by name or description
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = [
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        }
      ];
    }
    
    // Get templates
    const templates = await Template.find(query)
      .populate('createdBy', 'name')
      .sort({ isGlobal: -1, name: 1 });
    
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/templates/:id
 * @desc    Get template by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    // Check if user has permission to view this template
    if (!template.isGlobal && template.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this template' });
    }
    
    res.json(template);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/templates/:id
 * @desc    Update template
 * @access  Private
 */
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('content', 'Content is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Template not found' });
      }
      
      // Check if user has permission to update this template
      if (
        !template.isGlobal && 
        template.createdBy.toString() !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ msg: 'Not authorized to update this template' });
      }
      
      // Only admins and managers can update global templates
      if (
        template.isGlobal && 
        !['admin', 'manager'].includes(req.user.role)
      ) {
        return res.status(403).json({ msg: 'Not authorized to update global templates' });
      }
      
      const { name, subject, content, description, isGlobal } = req.body;
      
      // Check if new name conflicts with existing template
      if (name !== template.name) {
        const existingTemplate = await Template.findOne({ 
          name, 
          createdBy: template.createdBy,
          _id: { $ne: req.params.id }
        });
        
        if (existingTemplate) {
          return res.status(400).json({ msg: 'Template with this name already exists' });
        }
      }
      
      // Update fields
      template.name = name;
      if (subject !== undefined && template.type === 'email') template.subject = subject;
      template.content = content;
      if (description !== undefined) template.description = description;
      
      // Only admins and managers can set global status
      if (isGlobal !== undefined && ['admin', 'manager'].includes(req.user.role)) {
        template.isGlobal = isGlobal;
      }
      
      await template.save();
      
      // Populate response
      const updatedTemplate = await Template.findById(req.params.id)
        .populate('createdBy', 'name');
      
      res.json(updatedTemplate);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Template not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE api/templates/:id
 * @desc    Delete template
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    // Check if user has permission to delete this template
    if (
      !template.isGlobal && 
      template.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ msg: 'Not authorized to delete this template' });
    }
    
    // Only admins can delete global templates
    if (template.isGlobal && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only admins can delete global templates' });
    }
    
    await template.remove();
    
    res.json({ msg: 'Template removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/templates/:id/duplicate
 * @desc    Duplicate a template
 * @access  Private
 */
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    // Check if user has permission to view this template
    if (!template.isGlobal && template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to duplicate this template' });
    }
    
    // Create new template name
    let newName = `${template.name} (Copy)`;
    let nameCounter = 1;
    
    // Check if name exists
    let nameExists = await Template.findOne({ 
      name: newName, 
      createdBy: req.user.id 
    });
    
    // If name exists, append counter
    while (nameExists) {
      nameCounter++;
      newName = `${template.name} (Copy ${nameCounter})`;
      nameExists = await Template.findOne({ 
        name: newName, 
        createdBy: req.user.id 
      });
    }
    
    // Create new template
    const newTemplate = new Template({
      name: newName,
      type: template.type,
      subject: template.subject,
      content: template.content,
      description: template.description ? `${template.description} (Duplicated)` : null,
      isGlobal: false, // Duplicated templates are always personal
      createdBy: req.user.id
    });
    
    await newTemplate.save();
    
    res.json(newTemplate);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;
