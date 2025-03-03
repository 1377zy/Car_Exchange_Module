/**
 * Notification Manager Utility
 * Handles creating and sending notifications to users
 */

const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const socketManager = require('./socketManager');
const emailSender = require('./emailSender');
const User = require('../models/User');

/**
 * Notification manager utility
 */
const notificationManager = {
  /**
   * Create a notification for a user
   * @param {Object} options - Notification options
   * @param {string} options.userId - User ID to notify
   * @param {string} options.type - Notification type (lead, appointment, communication, vehicle, system)
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.link - Link to navigate to when notification is clicked
   * @param {string} options.priority - Notification priority (low, normal, high)
   * @param {Object} options.relatedTo - Related entity info (model and id)
   * @returns {Promise} Promise resolving to the created notification
   */
  async createNotification(options) {
    try {
      const { userId, type, title, message, link, priority = 'normal', relatedTo } = options;
      
      if (!userId || !type || !title || !message) {
        throw new Error('User ID, type, title, and message are required');
      }
      
      // Create notification in database
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        link,
        priority,
        relatedTo,
        read: false
      });
      
      await notification.save();
      
      // Send real-time notification via Socket.io
      socketManager.sendNotification(userId, {
        _id: notification._id,
        type,
        title,
        message,
        link,
        priority,
        relatedTo,
        createdAt: notification.createdAt
      });
      
      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  },
  
  /**
   * Create notifications for multiple users
   * @param {Array} userIds - Array of user IDs to notify
   * @param {Object} notificationData - Notification data (type, title, message, etc.)
   * @returns {Promise} Promise resolving to an array of created notifications
   */
  async createNotificationForMany(userIds, notificationData) {
    try {
      if (!userIds || !userIds.length) {
        throw new Error('User IDs are required');
      }
      
      const notifications = [];
      
      // Create notifications for each user
      for (const userId of userIds) {
        const notification = await this.createNotification({
          userId,
          ...notificationData
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (err) {
      console.error('Error creating notifications for many users:', err);
      throw err;
    }
  },
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Promise resolving to the updated notification
   */
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      notification.read = true;
      notification.readAt = new Date();
      
      await notification.save();
      
      // Notify other devices via Socket.io
      socketManager.sendNotification(notification.user.toString(), {
        action: 'mark_read',
        notificationId: notification._id
      });
      
      return notification;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  },
  
  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {boolean} options.unreadOnly - Get only unread notifications
   * @param {string} options.type - Filter by notification type
   * @param {number} options.limit - Limit number of results
   * @param {number} options.skip - Skip number of results
   * @returns {Promise} Promise resolving to an array of notifications
   */
  async getNotifications(userId, options = {}) {
    try {
      const { unreadOnly, type, limit = 50, skip = 0 } = options;
      
      // Build query
      const query = { user: userId };
      
      if (unreadOnly) {
        query.read = false;
      }
      
      if (type) {
        query.type = type;
      }
      
      // Get notifications
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
      
      return notifications;
    } catch (err) {
      console.error('Error getting notifications:', err);
      throw err;
    }
  },
  
  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise} Promise resolving to the unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        read: false
      });
      
      return count;
    } catch (err) {
      console.error('Error getting unread notification count:', err);
      throw err;
    }
  },
  
  /**
   * Create a lead notification
   * @param {Object} lead - Lead object
   * @param {string} action - Action performed (created, updated, assigned)
   * @param {string} userId - User ID to notify
   * @returns {Promise} Promise resolving to the created notification
   */
  async createLeadNotification(lead, action, userId) {
    try {
      let title, message;
      
      switch (action) {
        case 'created':
          title = 'New Lead Created';
          message = `New lead created: ${lead.firstName} ${lead.lastName}`;
          break;
        case 'updated':
          title = 'Lead Updated';
          message = `Lead updated: ${lead.firstName} ${lead.lastName}`;
          break;
        case 'assigned':
          title = 'Lead Assigned to You';
          message = `Lead assigned to you: ${lead.firstName} ${lead.lastName}`;
          break;
        default:
          title = 'Lead Activity';
          message = `Lead activity: ${lead.firstName} ${lead.lastName}`;
      }
      
      return this.createNotification({
        userId,
        type: 'lead',
        title,
        message,
        link: `/leads/${lead._id}`,
        relatedTo: {
          model: 'lead',
          id: lead._id
        }
      });
    } catch (err) {
      console.error('Error creating lead notification:', err);
      throw err;
    }
  },
  
  /**
   * Create an appointment notification
   * @param {Object} appointment - Appointment object
   * @param {string} action - Action performed (created, updated, reminder)
   * @param {string} userId - User ID to notify
   * @returns {Promise} Promise resolving to the created notification
   */
  async createAppointmentNotification(appointment, action, userId) {
    try {
      let title, message, priority = 'normal';
      
      // Format date for display
      const date = new Date(appointment.startTime);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      
      switch (action) {
        case 'created':
          title = 'New Appointment Scheduled';
          message = `New appointment scheduled for ${formattedDate}`;
          break;
        case 'updated':
          title = 'Appointment Updated';
          message = `Appointment updated for ${formattedDate}`;
          break;
        case 'reminder':
          title = 'Appointment Reminder';
          message = `Reminder: You have an appointment scheduled for ${formattedDate}`;
          priority = 'high';
          break;
        case 'cancelled':
          title = 'Appointment Cancelled';
          message = `Appointment for ${formattedDate} has been cancelled`;
          break;
        default:
          title = 'Appointment Activity';
          message = `Appointment activity for ${formattedDate}`;
      }
      
      return this.createNotification({
        userId,
        type: 'appointment',
        title,
        message,
        priority,
        link: `/appointments/${appointment._id}`,
        relatedTo: {
          model: 'appointment',
          id: appointment._id
        }
      });
    } catch (err) {
      console.error('Error creating appointment notification:', err);
      throw err;
    }
  },
  
  /**
   * Create a vehicle interest notification
   * @param {Object} vehicleInterest - Vehicle interest object
   * @param {Object} vehicle - Vehicle object
   * @param {Object} lead - Lead object
   * @param {string} userId - User ID to notify
   * @returns {Promise} Promise resolving to the created notification
   */
  async createVehicleInterestNotification(vehicleInterest, vehicle, lead, userId) {
    try {
      const title = 'New Vehicle Interest';
      const message = `${lead.firstName} ${lead.lastName} is interested in ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      
      return this.createNotification({
        userId,
        type: 'vehicle',
        title,
        message,
        link: `/vehicle-interests/${vehicleInterest._id}`,
        priority: 'normal',
        relatedTo: {
          model: 'vehicleInterest',
          id: vehicleInterest._id
        }
      });
    } catch (err) {
      console.error('Error creating vehicle interest notification:', err);
      throw err;
    }
  },
  
  /**
   * Create a vehicle update notification
   * @param {Object} vehicle - Vehicle object
   * @param {string} action - Action performed (created, updated, price_change, sold)
   * @param {string} userId - User ID to notify
   * @returns {Promise} Promise resolving to the created notification
   */
  async createVehicleUpdateNotification(vehicle, action, userId) {
    try {
      let title, message, priority = 'normal';
      
      switch (action) {
        case 'created':
          title = 'New Vehicle Added';
          message = `New vehicle added: ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
          break;
        case 'updated':
          title = 'Vehicle Updated';
          message = `Vehicle updated: ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
          break;
        case 'price_change':
          title = 'Vehicle Price Changed';
          message = `Price updated for ${vehicle.year} ${vehicle.make} ${vehicle.model}: $${vehicle.price.toLocaleString()}`;
          priority = 'high';
          break;
        case 'sold':
          title = 'Vehicle Sold';
          message = `Vehicle has been sold: ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
          break;
        default:
          title = 'Vehicle Update';
          message = `Update for ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      }
      
      return this.createNotification({
        userId,
        type: 'vehicle',
        title,
        message,
        priority,
        link: `/vehicles/${vehicle._id}`,
        relatedTo: {
          model: 'vehicle',
          id: vehicle._id
        }
      });
    } catch (err) {
      console.error('Error creating vehicle update notification:', err);
      throw err;
    }
  },
  
  /**
   * Create a communication notification
   * @param {Object} communication - Communication object
   * @param {Object} lead - Lead object
   * @param {string} userId - User ID to notify
   * @returns {Promise} Promise resolving to the created notification
   */
  async createCommunicationNotification(communication, lead, userId) {
    try {
      let title, message;
      
      switch (communication.type) {
        case 'email':
          title = 'New Email Communication';
          message = `Email sent to ${lead.firstName} ${lead.lastName}`;
          break;
        case 'sms':
          title = 'New SMS Communication';
          message = `SMS sent to ${lead.firstName} ${lead.lastName}`;
          break;
        case 'call':
          title = 'New Call Logged';
          message = `Call with ${lead.firstName} ${lead.lastName} logged`;
          break;
        default:
          title = 'New Communication';
          message = `Communication with ${lead.firstName} ${lead.lastName}`;
      }
      
      return this.createNotification({
        userId,
        type: 'communication',
        title,
        message,
        link: `/leads/${lead._id}/communications`,
        relatedTo: {
          model: 'communication',
          id: communication._id
        }
      });
    } catch (err) {
      console.error('Error creating communication notification:', err);
      throw err;
    }
  },
  
  /**
   * Create a lead response notification
   * @param {Object} communication - Communication object
   * @param {Object} lead - Lead object
   * @param {string} userId - User ID to notify
   * @returns {Promise} Promise resolving to the created notification
   */
  async createLeadResponseNotification(communication, lead, userId) {
    try {
      let title, message, priority = 'high';
      
      switch (communication.type) {
        case 'email':
          title = 'Lead Email Response';
          message = `${lead.firstName} ${lead.lastName} responded to your email`;
          break;
        case 'sms':
          title = 'Lead SMS Response';
          message = `${lead.firstName} ${lead.lastName} responded to your SMS`;
          break;
        default:
          title = 'Lead Response';
          message = `${lead.firstName} ${lead.lastName} responded to your communication`;
      }
      
      return this.createNotification({
        userId,
        type: 'communication',
        title,
        message,
        priority,
        link: `/leads/${lead._id}/communications`,
        relatedTo: {
          model: 'communication',
          id: communication._id
        }
      });
    } catch (err) {
      console.error('Error creating lead response notification:', err);
      throw err;
    }
  },
  
  /**
   * Create default notification preferences for a user
   * @param {string} userId - User ID
   * @returns {Promise} Promise resolving to the created preferences
   */
  async createDefaultPreferences(userId) {
    try {
      const preferences = new NotificationPreference({
        user: userId,
        email: {
          enabled: true,
          types: {
            leads: true,
            appointments: true,
            communications: true,
            vehicles: true,
            system: true
          }
        },
        browser: {
          enabled: true,
          types: {
            leads: true,
            appointments: true,
            communications: true,
            vehicles: true,
            system: true
          }
        },
        sms: {
          enabled: false,
          types: {
            leads: false,
            appointments: true,
            communications: false,
            vehicles: false,
            system: false
          }
        },
        sound: {
          enabled: true,
          volume: 0.5
        }
      });
      
      await preferences.save();
      return preferences;
    } catch (err) {
      console.error('Error creating default notification preferences:', err);
      throw err;
    }
  },
  
  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Promise} Promise resolving to the user's notification preferences
   */
  async getUserPreferences(userId) {
    try {
      // Try to find existing preferences
      let preferences = await NotificationPreference.findOne({ user: userId });
      
      // If no preferences exist, create default preferences
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }
      
      return preferences;
    } catch (err) {
      console.error('Error getting user notification preferences:', err);
      throw err;
    }
  },
  
  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {Object} updates - Preference updates
   * @returns {Promise} Promise resolving to the updated preferences
   */
  async updateUserPreferences(userId, updates) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Update preferences with new values
      Object.keys(updates).forEach(key => {
        if (key !== 'user' && key !== '_id') {
          preferences[key] = updates[key];
        }
      });
      
      await preferences.save();
      
      // Notify other devices via Socket.io
      socketManager.sendNotification(userId, {
        action: 'preferences_updated',
        preferences
      });
      
      return preferences;
    } catch (err) {
      console.error('Error updating user notification preferences:', err);
      throw err;
    }
  },
  
  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise} Promise resolving to the number of notifications updated
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      
      // Notify other devices via Socket.io
      socketManager.sendNotification(userId, {
        action: 'mark_all_read'
      });
      
      return result.nModified;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  },
  
  /**
   * Delete old notifications
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise} Promise resolving to the number of notifications deleted
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      return result.deletedCount;
    } catch (err) {
      console.error('Error deleting old notifications:', err);
      throw err;
    }
  }
};

module.exports = notificationManager;
