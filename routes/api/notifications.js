const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Notification = require('../../models/Notification');
const NotificationPreference = require('../../models/NotificationPreference');
const notificationManager = require('../../utils/notificationManager');

/**
 * @route   GET api/notifications
 * @desc    Get user notifications with pagination and filtering
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, read, sortField = 'createdAt', sortDirection = 'desc' } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    
    // Add type filter if provided
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Add read filter if provided
    if (read === 'true') {
      query.read = true;
    } else if (read === 'false') {
      query.read = false;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortField] = sortDirection === 'asc' ? 1 : -1;
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      notifications,
      unreadCount,
      currentPage: parseInt(page),
      totalPages,
      totalNotifications: total
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    console.error('Error fetching notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Mark as read if not already
    if (!notification.read) {
      notification.read = true;
      notification.readAt = Date.now();
      await notification.save();
    }
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(400).json({ message: 'Notification IDs are required' });
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
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/notifications/mark-all-read
 * @desc    Mark all user notifications as read
 * @access  Private
 */
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { 
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
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.remove();
    
    res.json({ message: 'Notification removed' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(400).json({ message: 'Notification IDs are required' });
    }
    
    // Delete notifications
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      user: req.user.id
    });
    
    res.json({ 
      message: 'Notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error deleting notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    // Find user preferences or create default
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    // If no preferences found, create default
    if (!preferences) {
      preferences = await notificationManager.createDefaultPreferences(req.user.id);
    }
    
    res.json(preferences);
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const { email, browser, sms, sound } = req.body;
    
    // Find user preferences or create default
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    // If no preferences found, create default
    if (!preferences) {
      preferences = await notificationManager.createDefaultPreferences(req.user.id);
    }
    
    // Update preferences
    if (email !== undefined) preferences.email = email;
    if (browser !== undefined) preferences.browser = browser;
    if (sms !== undefined) preferences.sms = sms;
    if (sound !== undefined) preferences.sound = sound;
    
    // Save updated preferences
    await preferences.save();
    
    res.json(preferences);
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
