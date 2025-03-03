const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Communication = require('../models/Communication');
const Lead = require('../models/Lead');
const Template = require('../models/Template');
const emailSender = require('../utils/emailSender');
const smsSender = require('../utils/smsSender');

/**
 * @route   POST api/communications/email
 * @desc    Send an email to a lead
 * @access  Private
 */
router.post(
  '/email',
  [
    auth,
    [
      check('lead', 'Lead ID is required').not().isEmpty(),
      check('subject', 'Subject is required').not().isEmpty(),
      check('body', 'Email body is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { lead, subject, body, templateId } = req.body;

      // Check if lead exists
      const leadData = await Lead.findById(lead);
      if (!leadData) {
        return res.status(404).json({ msg: 'Lead not found' });
      }

      // Check if user has permission to contact this lead
      if (
        req.user.role === 'agent' && 
        leadData.assignedTo && 
        leadData.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to contact this lead' });
      }

      let emailBody = body;
      let emailSubject = subject;

      // If using a template, get the template
      if (templateId) {
        const template = await Template.findById(templateId);
        if (!template) {
          return res.status(404).json({ msg: 'Template not found' });
        }
        
        if (template.type !== 'email') {
          return res.status(400).json({ msg: 'Template is not an email template' });
        }
        
        // Process template with lead data
        emailBody = await emailSender.processTemplate(template.content, leadData);
        emailSubject = template.subject;
      }

      // Send email
      const emailResult = await emailSender.sendEmail(
        leadData.email,
        emailSubject,
        emailBody
      );

      if (!emailResult.success) {
        return res.status(500).json({ msg: 'Failed to send email', error: emailResult.error });
      }

      // Create communication record
      const newCommunication = new Communication({
        lead: lead,
        type: 'email',
        subject: emailSubject,
        content: emailBody,
        sentBy: req.user.id,
        status: 'sent',
        templateUsed: templateId || null
      });

      const communication = await newCommunication.save();

      // Update lead's last contact date
      leadData.lastContact = Date.now();
      await leadData.save();

      // Populate response
      const populatedCommunication = await Communication.findById(communication._id)
        .populate('lead', 'firstName lastName email')
        .populate('sentBy', 'name')
        .populate('templateUsed', 'name');

      res.json(populatedCommunication);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   POST api/communications/sms
 * @desc    Send an SMS to a lead
 * @access  Private
 */
router.post(
  '/sms',
  [
    auth,
    [
      check('lead', 'Lead ID is required').not().isEmpty(),
      check('message', 'Message is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { lead, message, templateId } = req.body;

      // Check if lead exists
      const leadData = await Lead.findById(lead);
      if (!leadData) {
        return res.status(404).json({ msg: 'Lead not found' });
      }

      // Check if lead has a phone number
      if (!leadData.phone) {
        return res.status(400).json({ msg: 'Lead does not have a phone number' });
      }

      // Check if user has permission to contact this lead
      if (
        req.user.role === 'agent' && 
        leadData.assignedTo && 
        leadData.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to contact this lead' });
      }

      let smsMessage = message;

      // If using a template, get the template
      if (templateId) {
        const template = await Template.findById(templateId);
        if (!template) {
          return res.status(404).json({ msg: 'Template not found' });
        }
        
        if (template.type !== 'sms') {
          return res.status(400).json({ msg: 'Template is not an SMS template' });
        }
        
        // Process template with lead data
        smsMessage = await smsSender.processTemplate(template.content, leadData);
      }

      // Send SMS
      const smsResult = await smsSender.sendSMS(
        leadData.phone,
        smsMessage
      );

      if (!smsResult.success) {
        return res.status(500).json({ msg: 'Failed to send SMS', error: smsResult.error });
      }

      // Create communication record
      const newCommunication = new Communication({
        lead: lead,
        type: 'sms',
        content: smsMessage,
        sentBy: req.user.id,
        status: 'sent',
        templateUsed: templateId || null
      });

      const communication = await newCommunication.save();

      // Update lead's last contact date
      leadData.lastContact = Date.now();
      await leadData.save();

      // Populate response
      const populatedCommunication = await Communication.findById(communication._id)
        .populate('lead', 'firstName lastName phone')
        .populate('sentBy', 'name')
        .populate('templateUsed', 'name');

      res.json(populatedCommunication);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   POST api/communications/call
 * @desc    Log a call to a lead
 * @access  Private
 */
router.post(
  '/call',
  [
    auth,
    [
      check('lead', 'Lead ID is required').not().isEmpty(),
      check('notes', 'Call notes are required').not().isEmpty(),
      check('duration', 'Call duration is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { lead, notes, duration, outcome } = req.body;

      // Check if lead exists
      const leadData = await Lead.findById(lead);
      if (!leadData) {
        return res.status(404).json({ msg: 'Lead not found' });
      }

      // Check if user has permission to contact this lead
      if (
        req.user.role === 'agent' && 
        leadData.assignedTo && 
        leadData.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to log calls for this lead' });
      }

      // Create communication record
      const newCommunication = new Communication({
        lead: lead,
        type: 'call',
        content: notes,
        metadata: {
          duration: duration,
          outcome: outcome || 'completed'
        },
        sentBy: req.user.id,
        status: 'completed'
      });

      const communication = await newCommunication.save();

      // Update lead's last contact date
      leadData.lastContact = Date.now();
      await leadData.save();

      // Add note to lead
      leadData.notes.unshift({
        text: `Call: ${notes} (${outcome || 'completed'})`,
        createdBy: req.user.id
      });
      await leadData.save();

      // Populate response
      const populatedCommunication = await Communication.findById(communication._id)
        .populate('lead', 'firstName lastName phone')
        .populate('sentBy', 'name');

      res.json(populatedCommunication);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET api/communications
 * @desc    Get all communications
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const { lead, type, sentBy, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by lead
    if (lead) {
      query.lead = lead;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by sender
    if (sentBy) {
      query.sentBy = sentBy;
    }
    
    // If user is an agent, only show communications for their leads
    if (req.user.role === 'agent') {
      const assignedLeads = await Lead.find({ assignedTo: req.user.id }).select('_id');
      const leadIds = assignedLeads.map(lead => lead._id);
      query.lead = { $in: leadIds };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get communications with pagination
    const communications = await Communication.find(query)
      .populate('lead', 'firstName lastName email phone')
      .populate('sentBy', 'name')
      .populate('templateUsed', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await Communication.countDocuments(query);
    
    res.json({
      communications,
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
 * @route   GET api/communications/:id
 * @desc    Get communication by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const communication = await Communication.findById(req.params.id)
      .populate('lead', 'firstName lastName email phone')
      .populate('sentBy', 'name')
      .populate('templateUsed', 'name');
    
    if (!communication) {
      return res.status(404).json({ msg: 'Communication not found' });
    }
    
    // Check if user has permission to view this communication
    if (req.user.role === 'agent') {
      const lead = await Lead.findById(communication.lead._id);
      if (lead.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to view this communication' });
      }
    }
    
    res.json(communication);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Communication not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/communications/:id
 * @desc    Delete communication
 * @access  Private/Admin
 */
router.delete('/:id', [auth, roleAuth(['admin', 'manager'])], async (req, res) => {
  try {
    const communication = await Communication.findById(req.params.id);
    
    if (!communication) {
      return res.status(404).json({ msg: 'Communication not found' });
    }
    
    await communication.remove();
    
    res.json({ msg: 'Communication removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Communication not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;
