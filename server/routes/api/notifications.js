/**
 * Notification API Routes
 * Handles notification management, preferences, and push subscriptions
 */

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Notification = require('../../models/Notification');
const NotificationPreference = require('../../models/NotificationPreference');
const PushSubscription = require('../../models/PushSubscription');
const socketManager = require('../../utils/socketManager');
const webpush = require('web-push');

// Configure web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@carexchange.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * @route   GET api/notifications
 * @desc    Get all notifications for the authenticated user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Query parameters
    const query = { user: req.user.id };
    
    // Filter by read status if specified
    if (req.query.read === 'true') {
      query.read = true;
    } else if (req.query.read === 'false') {
      query.read = false;
    }
    
    // Filter by type if specified
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/notifications/:id
 * @desc    Get a notification by ID
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
    console.error('Error fetching notification:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true, readAt: Date.now() } },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    
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
router.post('/mark-read', [
  auth,
  [
    check('notificationIds', 'Notification IDs are required').isArray()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { notificationIds } = req.body;
    
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, user: req.user.id },
      { $set: { read: true, readAt: Date.now() } }
    );
    
    res.json({
      success: true,
      count: result.nModified
    });
  } catch (err) {
    console.error('Error marking notifications as read:', err.message);
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
      success: true,
      count: result.nModified
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    res.json({ msg: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    
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
    
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      user: req.user.id
    });
    
    res.json({
      success: true,
      count: result.deletedCount
    });
  } catch (err) {
    console.error('Error deleting notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/notifications/clear-all
 * @desc    Delete all notifications for the user
 * @access  Private
 */
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.id
    });
    
    res.json({
      success: true,
      count: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing all notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/notifications/preferences
 * @desc    Get notification preferences for the user
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({
      user: req.user.id
    });
    
    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = new NotificationPreference({
        user: req.user.id,
        email: true,
        sms: false,
        browser: true,
        push: true,
        sound: true,
        types: {
          leads: true,
          appointments: true,
          vehicles: true,
          communications: true,
          system: true
        },
        soundVolume: 0.7,
        soundNotifications: true,
        browserNotifications: true,
        requireInteraction: false,
        showOnlyWhenHidden: true
      });
      
      await preferences.save();
    }
    
    res.json(preferences);
  } catch (err) {
    console.error('Error fetching notification preferences:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const {
      email,
      sms,
      browser,
      push,
      sound,
      types,
      soundVolume,
      soundNotifications,
      browserNotifications,
      requireInteraction,
      showOnlyWhenHidden,
      customSounds
    } = req.body;
    
    // Build preferences object
    const preferencesFields = {};
    
    if (email !== undefined) preferencesFields.email = email;
    if (sms !== undefined) preferencesFields.sms = sms;
    if (browser !== undefined) preferencesFields.browser = browser;
    if (push !== undefined) preferencesFields.push = push;
    if (sound !== undefined) preferencesFields.sound = sound;
    if (types) preferencesFields.types = types;
    if (soundVolume !== undefined) preferencesFields.soundVolume = soundVolume;
    if (soundNotifications !== undefined) preferencesFields.soundNotifications = soundNotifications;
    if (browserNotifications !== undefined) preferencesFields.browserNotifications = browserNotifications;
    if (requireInteraction !== undefined) preferencesFields.requireInteraction = requireInteraction;
    if (showOnlyWhenHidden !== undefined) preferencesFields.showOnlyWhenHidden = showOnlyWhenHidden;
    if (customSounds) preferencesFields.customSounds = customSounds;
    
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (preferences) {
      // Update existing preferences
      preferences = await NotificationPreference.findOneAndUpdate(
        { user: req.user.id },
        { $set: preferencesFields },
        { new: true }
      );
    } else {
      // Create new preferences
      preferences = new NotificationPreference({
        user: req.user.id,
        ...preferencesFields
      });
      
      await preferences.save();
    }
    
    // Update socket manager with new preferences
    socketManager.setUserNotificationPreferences(req.user.id, preferences);
    
    res.json(preferences);
  } catch (err) {
    console.error('Error updating notification preferences:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/notifications/vapid-public-key
 * @desc    Get VAPID public key for push notifications
 * @access  Private
 */
router.get('/vapid-public-key', auth, (req, res) => {
  if (!vapidPublicKey) {
    return res.status(501).json({ msg: 'Push notifications not configured on server' });
  }
  
  res.json({ vapidPublicKey });
});

/**
 * @route   POST api/notifications/push-subscription
 * @desc    Save push subscription
 * @access  Private
 */
router.post('/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ msg: 'Subscription data is required' });
    }
    
    // Check if subscription already exists
    let pushSubscription = await PushSubscription.findOne({
      user: req.user.id,
      'subscription.endpoint': subscription.endpoint
    });
    
    if (pushSubscription) {
      // Update existing subscription
      pushSubscription = await PushSubscription.findOneAndUpdate(
        { user: req.user.id, 'subscription.endpoint': subscription.endpoint },
        {
          $set: {
            subscription,
            updatedAt: Date.now()
          }
        },
        { new: true }
      );
    } else {
      // Create new subscription
      pushSubscription = new PushSubscription({
        user: req.user.id,
        subscription,
        device: req.headers['user-agent'] || 'Unknown device'
      });
      
      await pushSubscription.save();
    }
    
    // Update user's notification preferences
    await NotificationPreference.findOneAndUpdate(
      { user: req.user.id },
      { $set: { push: true } },
      { upsert: true }
    );
    
    res.json(pushSubscription);
  } catch (err) {
    console.error('Error saving push subscription:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/notifications/push-subscription
 * @desc    Delete push subscription
 * @access  Private
 */
router.delete('/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (subscription && subscription.endpoint) {
      // Delete specific subscription
      await PushSubscription.findOneAndDelete({
        user: req.user.id,
        'subscription.endpoint': subscription.endpoint
      });
    } else {
      // Delete all subscriptions for user
      await PushSubscription.deleteMany({
        user: req.user.id
      });
    }
    
    res.json({ msg: 'Push subscription(s) deleted' });
  } catch (err) {
    console.error('Error deleting push subscription:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/notifications/test-push
 * @desc    Send a test push notification
 * @access  Private
 */
router.post('/test-push', auth, async (req, res) => {
  try {
    // Get user's push subscriptions
    const subscriptions = await PushSubscription.find({
      user: req.user.id
    });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ msg: 'No push subscriptions found' });
    }
    
    // Create test notification payload
    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test push notification',
      icon: '/favicon.ico',
      badge: '/notification-badge.png',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        id: 'test-' + Date.now(),
        type: 'test',
        url: '/notifications'
      }
    });
    
    // Send push notification to all user's subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        return true;
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // If subscription is invalid, delete it
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
        
        return false;
      }
    });
    
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(result => result).length;
    
    res.json({
      success: true,
      sent: successCount,
      total: subscriptions.length
    });
  } catch (err) {
    console.error('Error sending test push notification:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
