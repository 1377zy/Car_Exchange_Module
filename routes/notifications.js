const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const notificationManager = require('../utils/notificationManager');

/**
 * @route   GET api/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters
    const { 
      read, 
      limit = 20, 
      page = 1, 
      type, 
      sortField = 'createdAt', 
      sortDirection = 'desc' 
    } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    
    // Filter by read status
    if (read === 'true') {
      query.read = true;
    } else if (read === 'false') {
      query.read = false;
    }
    
    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortField] = sortDirection === 'asc' ? 1 : -1;
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id,
      read: false
    });
    
    res.json({
      notifications,
      unreadCount,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalNotifications: total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/notifications/:id
 * @desc    Get a specific notification
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // Mark as read if not already
    if (!notification.read) {
      notification.read = true;
      notification.readAt = Date.now();
      await notification.save();
    }
    
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/notifications/mark-read
 * @desc    Mark multiple notifications as read
 * @access  Private
 */
router.post('/mark-read', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ msg: 'Notification IDs are required' });
    }
    
    // Update all notifications
    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        user: req.user.id,
        read: false
      },
      {
        $set: { 
          read: true,
          readAt: Date.now()
        }
      }
    );
    
    res.json({ 
      msg: 'Notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true, readAt: Date.now() } }
    );
    
    res.json({ 
      msg: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    await notification.remove();
    
    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/notifications
 * @desc    Delete multiple notifications
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ msg: 'Notification IDs are required' });
    }
    
    // Delete notifications
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      user: req.user.id
    });
    
    res.json({ 
      msg: 'Notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/notifications/clear-all
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });
    
    res.json({ 
      msg: 'All notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/notifications/preferences
 * @desc    Get user's notification preferences
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = await notificationManager.createDefaultPreferences(req.user.id);
    }
    
    res.json(preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/notifications/preferences
 * @desc    Update user's notification preferences
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const { email, browser, sms, sound } = req.body;
    
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    // If no preferences exist, create new preferences
    if (!preferences) {
      preferences = await notificationManager.createDefaultPreferences(req.user.id);
    }
    
    // Update existing preferences
    if (email) {
      preferences.email = {
        ...preferences.email,
        ...email
      };
    }
    
    if (browser) {
      preferences.browser = {
        ...preferences.browser,
        ...browser
      };
    }
    
    if (sms) {
      preferences.sms = {
        ...preferences.sms,
        ...sms
      };
    }
    
    if (sound) {
      preferences.sound = {
        ...preferences.sound,
        ...sound
      };
    }
    
    await preferences.save();
    
    res.json(preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
