/**
 * Client-side Socket.io Manager
 * Handles real-time communication with the server
 */

import io from 'socket.io-client';
import { getToken } from './authUtils';
import { handleNewNotification } from '../services/notificationService';
import { playNotificationSound } from './notificationSoundUtils';

// Socket instance
let socket = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Event listeners
const listeners = {
  onConnect: [],
  onDisconnect: [],
  onReconnect: [],
  onReconnectFailed: [],
  onUserStatus: [],
  onNotification: [],
  onNotificationRead: [],
  onNotificationPreferences: [],
  onMessage: [],
  onCarUpdate: [],
  onDealUpdate: []
};

/**
 * Initialize socket connection
 * @param {string} serverUrl - Server URL
 * @returns {Promise<boolean>} Connection success
 */
export const initializeSocket = (serverUrl) => {
  return new Promise((resolve, reject) => {
    try {
      // If already connected, disconnect first
      if (socket) {
        socket.disconnect();
      }
      
      // Create new socket connection
      socket = io(serverUrl, {
        auth: {
          token: getToken()
        },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });
      
      // Connection event
      socket.on('connect', () => {
        console.log('Socket connected');
        isConnected = true;
        reconnectAttempts = 0;
        notifyListeners('onConnect');
        resolve(true);
      });
      
      // Disconnection event
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        isConnected = false;
        notifyListeners('onDisconnect', reason);
      });
      
      // Reconnection event
      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        isConnected = true;
        notifyListeners('onReconnect', attemptNumber);
      });
      
      // Reconnection failure event
      socket.on('reconnect_failed', () => {
        console.log('Socket reconnection failed');
        notifyListeners('onReconnectFailed');
      });
      
      // Error event
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // User status event
      socket.on('user:status', (data) => {
        notifyListeners('onUserStatus', data);
      });
      
      // New notification event
      socket.on('notification:new', (notification) => {
        // Handle the notification
        handleNewNotification(notification);
        notifyListeners('onNotification', notification);
      });
      
      // Notification read event
      socket.on('notification:read', (notificationId) => {
        notifyListeners('onNotificationRead', notificationId);
      });
      
      // Notification preferences event
      socket.on('notification:preferences', (preferences) => {
        notifyListeners('onNotificationPreferences', preferences);
      });
      
      // Sound notification play event
      socket.on('notification:sound:play', ({ priority, volume }) => {
        playNotificationSound(priority, { volume });
      });
      
      // Browser notification permission update
      socket.on('notification:browser:permission', (status) => {
        notifyListeners('onBrowserPermission', status);
      });
      
      // Push subscription update
      socket.on('notification:push:subscription', (subscription) => {
        notifyListeners('onPushSubscription', subscription);
      });
      
      // New message event
      socket.on('message:new', (message) => {
        notifyListeners('onMessage', message);
      });
      
      // Message sent event
      socket.on('message:sent', (message) => {
        notifyListeners('onMessageSent', message);
      });
      
      // Car update event
      socket.on('car:update', (update) => {
        notifyListeners('onCarUpdate', update);
      });
      
      // Cars update event (general)
      socket.on('cars:update', (update) => {
        notifyListeners('onCarsUpdate', update);
      });
      
      // Deal update event
      socket.on('deal:update', (update) => {
        notifyListeners('onDealUpdate', update);
      });
      
      // Deals update event (general)
      socket.on('deals:update', (update) => {
        notifyListeners('onDealsUpdate', update);
      });
      
    } catch (error) {
      console.error('Socket initialization error:', error);
      reject(error);
    }
  });
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};

/**
 * Check if socket is connected
 * @returns {boolean} Whether socket is connected
 */
export const isSocketConnected = () => {
  return isConnected && socket && socket.connected;
};

/**
 * Join a room
 * @param {string} room - Room name
 */
export const joinRoom = (room) => {
  if (isSocketConnected() && room) {
    socket.emit('join:room', room);
  }
};

/**
 * Leave a room
 * @param {string} room - Room name
 */
export const leaveRoom = (room) => {
  if (isSocketConnected() && room) {
    socket.emit('leave:room', room);
  }
};

/**
 * Notify server about notification read
 * @param {string} notificationId - Notification ID
 */
export const notifyNotificationRead = (notificationId) => {
  if (isSocketConnected() && notificationId) {
    socket.emit('notification:read', notificationId);
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - Updated preferences
 */
export const updateNotificationPreferences = (preferences) => {
  if (isSocketConnected() && preferences) {
    socket.emit('notification:preferences', preferences);
  }
};

/**
 * Update browser notification permission
 * @param {string} status - Permission status
 */
export const updateBrowserPermission = (status) => {
  if (isSocketConnected() && status) {
    socket.emit('notification:browser:permission', status);
  }
};

/**
 * Update push notification subscription
 * @param {Object} subscription - Push subscription
 */
export const updatePushSubscription = (subscription) => {
  if (isSocketConnected() && subscription) {
    socket.emit('notification:push:subscription', subscription);
  }
};

/**
 * Test sound notification
 * @param {string} priority - Sound priority
 * @param {number} volume - Sound volume
 */
export const testSoundNotification = (priority = 'normal', volume = 0.7) => {
  if (isSocketConnected()) {
    socket.emit('notification:sound:test', { priority, volume });
  }
};

/**
 * Add event listener
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove listener
 */
export const addEventListener = (event, callback) => {
  if (!listeners[event]) {
    console.warn(`Event ${event} is not supported`);
    return () => {};
  }
  
  listeners[event].push(callback);
  
  return () => {
    const index = listeners[event].indexOf(callback);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
  };
};

/**
 * Notify listeners of an event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
const notifyListeners = (event, data) => {
  if (!listeners[event]) {
    return;
  }
  
  listeners[event].forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(`Error in ${event} listener:`, error);
    }
  });
};

export default {
  initializeSocket,
  disconnectSocket,
  isSocketConnected,
  joinRoom,
  leaveRoom,
  notifyNotificationRead,
  updateNotificationPreferences,
  updateBrowserPermission,
  updatePushSubscription,
  testSoundNotification,
  addEventListener
};
