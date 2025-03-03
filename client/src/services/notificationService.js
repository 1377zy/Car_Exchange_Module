/**
 * Notification Service
 * Handles client-side notification management and real-time updates
 */

import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeader } from '../utils/authUtils';
import { playNotificationSound } from '../utils/notificationSoundUtils';

const API_URL = process.env.REACT_APP_API_URL || '';

// Notification event listeners
const listeners = {
  onNotification: [],
  onNotificationRead: [],
  onNotificationsRead: [],
  onPreferencesUpdated: [],
  onUnreadCountUpdated: []
};

/**
 * Fetch notifications with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise} Promise resolving to notifications data
 */
export const fetchNotifications = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Fetch a single notification by ID
 * @param {string} id - Notification ID
 * @returns {Promise} Promise resolving to notification data
 */
export const fetchNotification = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} id - Notification ID
 * @returns {Promise} Promise resolving to updated notification
 */
export const markAsRead = async (id) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/${id}/read`,
      {},
      {
        headers: getAuthHeader()
      }
    );
    
    // Notify listeners
    notifyListeners('onNotificationRead', id);
    
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark multiple notifications as read
 * @param {Array} ids - Array of notification IDs
 * @returns {Promise} Promise resolving to result
 */
export const markMultipleAsRead = async (ids) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/notifications/mark-read`,
      { notificationIds: ids },
      {
        headers: getAuthHeader()
      }
    );
    
    // Notify listeners for each ID
    ids.forEach(id => {
      notifyListeners('onNotificationRead', id);
    });
    
    return response.data;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise} Promise resolving to result
 */
export const markAllAsRead = async () => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/read-all`,
      {},
      {
        headers: getAuthHeader()
      }
    );
    
    // Notify listeners
    notifyListeners('onNotificationsRead');
    
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @returns {Promise} Promise resolving to result
 */
export const deleteNotification = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/notifications/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete multiple notifications
 * @param {Array} ids - Array of notification IDs
 * @returns {Promise} Promise resolving to result
 */
export const deleteMultipleNotifications = async (ids) => {
  try {
    const response = await axios.delete(`${API_URL}/api/notifications`, {
      headers: getAuthHeader(),
      data: { notificationIds: ids }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
};

/**
 * Delete all notifications
 * @returns {Promise} Promise resolving to result
 */
export const deleteAllNotifications = async () => {
  try {
    const response = await axios.delete(`${API_URL}/api/notifications/clear-all`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Fetch notification preferences
 * @returns {Promise} Promise resolving to preferences data
 */
export const fetchNotificationPreferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications/preferences`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - Updated preferences
 * @returns {Promise} Promise resolving to updated preferences
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/preferences`,
      preferences,
      {
        headers: getAuthHeader()
      }
    );
    
    // Notify listeners
    notifyListeners('onPreferencesUpdated', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Get VAPID public key for push notifications
 * @returns {Promise} Promise resolving to VAPID public key
 */
export const getVapidPublicKey = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications/vapid-public-key`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    throw error;
  }
};

/**
 * Save push subscription to server
 * @param {PushSubscription} subscription - Push subscription object
 * @returns {Promise} Promise resolving to result
 */
export const savePushSubscription = async (subscription) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/notifications/push-subscription`,
      { subscription },
      {
        headers: getAuthHeader()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
};

/**
 * Delete push subscription from server
 * @returns {Promise} Promise resolving to result
 */
export const deletePushSubscription = async () => {
  try {
    const response = await axios.delete(`${API_URL}/api/notifications/push-subscription`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    throw error;
  }
};

/**
 * Handle a new notification
 * @param {Object} notification - Notification object
 */
export const handleNewNotification = (notification) => {
  // Notify listeners
  notifyListeners('onNotification', notification);
  
  // Show toast notification
  showNotificationToast(notification);
  
  // Play sound if enabled in notification
  if (notification.playSound) {
    playNotificationSound(notification.priority || 'normal');
  }
};

/**
 * Show a notification toast
 * @param {Object} notification - Notification object
 */
export const showNotificationToast = (notification) => {
  const { title, message, type, autoClose = 5000, priority = 'normal' } = notification;
  
  // Determine toast type based on notification type or priority
  let toastType = 'info';
  
  switch (type) {
    case 'success':
      toastType = 'success';
      break;
    case 'error':
      toastType = 'error';
      break;
    case 'warning':
      toastType = 'warning';
      break;
    default:
      // Use priority to determine type if type not specified
      if (priority === 'high') {
        toastType = 'error';
      } else if (priority === 'low') {
        toastType = 'default';
      } else {
        toastType = 'info';
      }
  }
  
  // Show toast
  toast[toastType](
    <div onClick={() => handleNotificationClick(notification)}>
      <strong>{title}</strong>
      <div>{message}</div>
    </div>,
    {
      autoClose,
      onClick: () => handleNotificationClick(notification)
    }
  );
};

/**
 * Handle notification click
 * @param {Object} notification - Notification object
 */
export const handleNotificationClick = (notification) => {
  // Mark as read
  if (notification._id) {
    markAsRead(notification._id).catch(error => {
      console.error('Error marking notification as read:', error);
    });
  }
  
  // Navigate to link if available
  if (notification.link) {
    window.location.href = notification.link;
  }
};

/**
 * Add an event listener
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove the listener
 */
export const addEventListener = (event, callback) => {
  if (!listeners[event]) {
    console.warn(`Event ${event} is not supported`);
    return () => {};
  }
  
  // Add listener
  listeners[event].push(callback);
  
  // Return function to remove listener
  return () => {
    const index = listeners[event].indexOf(callback);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
  };
};

/**
 * Notify all listeners for an event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
export const notifyListeners = (event, data) => {
  if (!listeners[event]) {
    console.warn(`Event ${event} is not supported`);
    return;
  }
  
  // Notify all listeners
  listeners[event].forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(`Error in ${event} listener:`, error);
    }
  });
};

/**
 * Update unread count
 * @param {number} count - Unread count
 */
export const updateUnreadCount = (count) => {
  notifyListeners('onUnreadCountUpdated', count);
};

export default {
  fetchNotifications,
  fetchNotification,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  deleteAllNotifications,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  getVapidPublicKey,
  savePushSubscription,
  deletePushSubscription,
  handleNewNotification,
  showNotificationToast,
  handleNotificationClick,
  addEventListener,
  notifyListeners,
  updateUnreadCount
};
