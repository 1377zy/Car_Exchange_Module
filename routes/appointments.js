const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Appointment = require('../models/Appointment');
const Lead = require('../models/Lead');
const User = require('../models/User');
const notificationManager = require('../utils/notificationManager');
const emailSender = require('../utils/emailSender');
const smsSender = require('../utils/smsSender');

/**
 * @route   POST api/appointments
 * @desc    Create an appointment
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('lead', 'Lead ID is required').not().isEmpty(),
      check('title', 'Title is required').not().isEmpty(),
      check('startTime', 'Start time is required').not().isEmpty(),
      check('endTime', 'End time is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        lead,
        title,
        description,
        startTime,
        endTime,
        location,
        appointmentType,
        sendReminder,
        reminderTime,
        reminderType,
        assignedTo
      } = req.body;

      // Check if lead exists
      const leadData = await Lead.findById(lead);
      if (!leadData) {
        return res.status(404).json({ msg: 'Lead not found' });
      }

      // Check if user has permission to schedule for this lead
      if (
        req.user.role === 'agent' && 
        leadData.assignedTo && 
        leadData.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to schedule appointments for this lead' });
      }

      // Validate appointment times
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        return res.status(400).json({ msg: 'End time must be after start time' });
      }
      
      if (start < new Date()) {
        return res.status(400).json({ msg: 'Cannot schedule appointments in the past' });
      }

      // Create new appointment
      const newAppointment = new Appointment({
        lead,
        title,
        description,
        startTime: start,
        endTime: end,
        location,
        appointmentType: appointmentType || 'in-person',
        status: 'scheduled',
        createdBy: req.user.id,
        assignedTo: assignedTo || leadData.assignedTo || req.user.id
      });

      // Set reminder if requested
      if (sendReminder) {
        newAppointment.reminder = {
          time: reminderTime || 60, // Default 60 minutes before
          type: reminderType || 'both', // Default both email and SMS
          sent: false
        };
      }

      const appointment = await newAppointment.save();

      // Add note to lead
      leadData.notes.unshift({
        text: `Appointment scheduled: ${title} on ${start.toLocaleString()}`,
        createdBy: req.user.id
      });
      await leadData.save();

      // Notify assigned user if different from creator
      if (newAppointment.assignedTo.toString() !== req.user.id) {
        await notificationManager.createNotification(
          newAppointment.assignedTo,
          {
            type: 'appointment',
            title: 'New Appointment Assigned',
            message: `New appointment with ${leadData.firstName} ${leadData.lastName} on ${start.toLocaleString()}`,
            link: `/appointments/${appointment._id}`,
            relatedTo: {
              model: 'appointment',
              id: appointment._id
            }
          }
        );
      }

      // Send confirmation to lead if they have email
      if (leadData.email) {
        const emailContent = `
          <p>Hello ${leadData.firstName},</p>
          <p>Your appointment has been scheduled:</p>
          <p><strong>${title}</strong></p>
          <p><strong>Date & Time:</strong> ${start.toLocaleString()}</p>
          <p><strong>Location:</strong> ${location || 'Our dealership'}</p>
          <p>We look forward to meeting with you!</p>
        `;

        await emailSender.sendEmail(
          leadData.email,
          'Appointment Confirmation',
          emailContent
        );
      }

      // Populate response
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('lead', 'firstName lastName email phone')
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name');

      res.json(populatedAppointment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET api/appointments
 * @desc    Get all appointments
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const {
      lead,
      assignedTo,
      status,
      startDate,
      endDate,
      limit = 20,
      page = 1
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by lead
    if (lead) {
      query.lead = lead;
    }
    
    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    } else if (req.user.role === 'agent') {
      // Agents can only see their assigned appointments
      query.assignedTo = req.user.id;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get appointments with pagination
    const appointments = await Appointment.find(query)
      .populate('lead', 'firstName lastName email phone')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort({ startTime: 1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await Appointment.countDocuments(query);
    
    res.json({
      appointments,
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
 * @route   GET api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('lead', 'firstName lastName email phone')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    // Check if user has permission to view this appointment
    if (
      req.user.role === 'agent' && 
      appointment.assignedTo && 
      appointment.assignedTo._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this appointment' });
    }
    
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/appointments/:id
 * @desc    Update appointment
 * @access  Private
 */
router.put(
  '/:id',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('startTime', 'Start time is required').not().isEmpty(),
      check('endTime', 'End time is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let appointment = await Appointment.findById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({ msg: 'Appointment not found' });
      }
      
      // Check if user has permission to update this appointment
      if (
        req.user.role === 'agent' && 
        appointment.assignedTo && 
        appointment.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to update this appointment' });
      }
      
      const {
        title,
        description,
        startTime,
        endTime,
        location,
        appointmentType,
        status,
        notes,
        sendReminder,
        reminderTime,
        reminderType,
        assignedTo
      } = req.body;
      
      // Validate appointment times
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        return res.status(400).json({ msg: 'End time must be after start time' });
      }
      
      // Update fields
      appointment.title = title;
      if (description !== undefined) appointment.description = description;
      appointment.startTime = start;
      appointment.endTime = end;
      if (location !== undefined) appointment.location = location;
      if (appointmentType !== undefined) appointment.appointmentType = appointmentType;
      if (status !== undefined) appointment.status = status;
      if (notes !== undefined) appointment.notes = notes;
      
      // Update reminder settings
      if (sendReminder !== undefined) {
        if (sendReminder) {
          appointment.reminder = {
            time: reminderTime || 60,
            type: reminderType || 'both',
            sent: false
          };
        } else {
          appointment.reminder = null;
        }
      }
      
      // Check if assignedTo is changing
      const isReassigning = assignedTo && appointment.assignedTo.toString() !== assignedTo;
      
      if (isReassigning) {
        appointment.assignedTo = assignedTo;
        
        // Notify new assignee
        await notificationManager.createNotification(
          assignedTo,
          {
            type: 'appointment',
            title: 'Appointment Reassigned to You',
            message: `Appointment on ${start.toLocaleString()} has been assigned to you`,
            link: `/appointments/${appointment._id}`,
            relatedTo: {
              model: 'appointment',
              id: appointment._id
            }
          }
        );
      }
      
      // If status changed to completed, add outcome notes
      if (status === 'completed' && appointment.status !== 'completed') {
        // Get lead data
        const lead = await Lead.findById(appointment.lead);
        
        // Add note to lead
        lead.notes.unshift({
          text: `Appointment completed: ${title}. ${notes || ''}`,
          createdBy: req.user.id
        });
        
        // Update lead's last contact date
        lead.lastContact = Date.now();
        await lead.save();
      }
      
      await appointment.save();
      
      // Populate response
      appointment = await Appointment.findById(req.params.id)
        .populate('lead', 'firstName lastName email phone')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name');
      
      res.json(appointment);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Appointment not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE api/appointments/:id
 * @desc    Delete appointment
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    // Check if user has permission to delete this appointment
    if (
      req.user.role === 'agent' && 
      appointment.assignedTo && 
      appointment.assignedTo.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(403).json({ msg: 'Not authorized to delete this appointment' });
    }
    
    await appointment.remove();
    
    res.json({ msg: 'Appointment removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/appointments/:id/cancel
 * @desc    Cancel an appointment
 * @access  Private
 */
router.post(
  '/:id/cancel',
  [
    auth,
    [
      check('reason', 'Cancellation reason is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const appointment = await Appointment.findById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({ msg: 'Appointment not found' });
      }
      
      // Check if user has permission to cancel this appointment
      if (
        req.user.role === 'agent' && 
        appointment.assignedTo && 
        appointment.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({ msg: 'Not authorized to cancel this appointment' });
      }
      
      // Check if appointment is already cancelled or completed
      if (appointment.status === 'cancelled') {
        return res.status(400).json({ msg: 'Appointment is already cancelled' });
      }
      
      if (appointment.status === 'completed') {
        return res.status(400).json({ msg: 'Cannot cancel a completed appointment' });
      }
      
      const { reason, notifyLead } = req.body;
      
      // Update appointment
      appointment.status = 'cancelled';
      appointment.notes = reason;
      
      await appointment.save();
      
      // Get lead data
      const lead = await Lead.findById(appointment.lead)
        .populate('assignedTo', 'name');
      
      // Add note to lead
      lead.notes.unshift({
        text: `Appointment cancelled: ${appointment.title}. Reason: ${reason}`,
        createdBy: req.user.id
      });
      await lead.save();
      
      // Notify lead if requested
      if (notifyLead && lead.email) {
        const emailContent = `
          <p>Hello ${lead.firstName},</p>
          <p>Unfortunately, your appointment scheduled for ${appointment.startTime.toLocaleString()} has been cancelled.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>We apologize for any inconvenience. Please contact us to reschedule at your convenience.</p>
        `;
        
        await emailSender.sendEmail(
          lead.email,
          'Appointment Cancellation',
          emailContent
        );
      }
      
      // Populate response
      const populatedAppointment = await Appointment.findById(req.params.id)
        .populate('lead', 'firstName lastName email phone')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name');
      
      res.json(populatedAppointment);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Appointment not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
