/**
 * Client-side Notification Handler
 * Manages real-time notifications from Socket.io and browser notifications
 */

import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { getToken } from './authService';
import { playNotificationSound } from './audioUtils';

let socket = null;
let notificationListeners = [];
let notificationPreferences = null;

/**
 * Initialize the notification handler
 * @param {string} serverUrl - Socket.io server URL
 * @param {Function} onConnect - Callback for connection event
 * @param {Function} onDisconnect - Callback for disconnection event
 * @param {Function} onError - Callback for error event
 */
export const initializeNotifications = (
  serverUrl,
  onConnect = () => {},
  onDisconnect = () => {},
  onError = () => {}
) => {
  // If socket already exists, disconnect it
  if (socket) {
    socket.disconnect();
  }

  const token = getToken();
  
  if (!token) {
    console.error('No auth token available for socket connection');
    return null;
  }

  // Create new socket connection with auth token
  socket = io(serverUrl, {
    auth: {
      token
    }
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
    onConnect();
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    onDisconnect();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    onError(error);
  });

  // Handle incoming notifications
  socket.on('notification:new', handleNotification);
  
  // Handle notification read status sync across devices
  socket.on('notification:read', (notificationId) => {
    // Notify all listeners about the read notification
    notificationListeners.forEach(listener => {
      if (listener.onNotificationRead) {
        listener.onNotificationRead(notificationId);
      }
    });
  });
  
  // Handle notification preferences sync across devices
  socket.on('notification:preferences', (preferences) => {
    notificationPreferences = preferences;
    
    // Notify all listeners about updated preferences
    notificationListeners.forEach(listener => {
      if (listener.onPreferencesUpdated) {
        listener.onPreferencesUpdated(preferences);
      }
    });
  });
  
  // Handle mark all read sync across devices
  socket.on('notification:mark_all_read', () => {
    // Notify all listeners
    notificationListeners.forEach(listener => {
      if (listener.onAllNotificationsRead) {
        listener.onAllNotificationsRead();
      }
    });
  });
  
  // Handle lead updates
  socket.on('lead:update', (data) => {
    handleLeadUpdate(data);
  });
  
  // Handle lead assignment
  socket.on('lead:assigned', (data) => {
    handleLeadAssignment(data);
  });
  
  // Handle appointment updates
  socket.on('appointment:update', (data) => {
    handleAppointmentUpdate(data);
  });
  
  // Handle vehicle updates
  socket.on('vehicle:update', (data) => {
    handleVehicleUpdate(data);
  });
  
  // Handle vehicle interest
  socket.on('vehicle:interest', (data) => {
    handleVehicleInterest(data);
  });
  
  // Handle vehicle price changes
  socket.on('vehicle:price_change', (data) => {
    handleVehiclePriceChange(data);
  });
  
  // Handle vehicle status changes
  socket.on('vehicle:status_change', (data) => {
    handleVehicleStatusChange(data);
  });
  
  // Handle outgoing communications
  socket.on('communication:sent', (data) => {
    handleCommunicationSent(data);
  });
  
  // Handle incoming communications
  socket.on('communication:received', (data) => {
    handleCommunicationReceived(data);
  });
  
  // Handle user status updates
  socket.on('user:status', (data) => {
    handleUserStatusChange(data);
  });

  return socket;
};

/**
 * Register a notification listener
 * @param {Object} listener - Listener object with callback functions
 * @returns {Function} Function to unregister the listener
 */
export const registerNotificationListener = (listener) => {
  notificationListeners.push(listener);
  
  // Return function to unregister
  return () => {
    const index = notificationListeners.indexOf(listener);
    if (index !== -1) {
      notificationListeners.splice(index, 1);
    }
  };
};

/**
 * Handle incoming notification
 * @param {Object} notification - Notification object
 */
const handleNotification = (notification) => {
  // Check if we should show this notification based on preferences
  if (shouldShowNotification(notification)) {
    // Show toast notification
    showToastNotification(notification);
    
    // Show browser notification if enabled
    showBrowserNotification(notification);
    
    // Play sound if enabled
    if (shouldPlaySound(notification)) {
      playNotificationSound(notification.priority || 'normal');
    }
  }
  
  // Notify all listeners
  notificationListeners.forEach(listener => {
    if (listener.onNotification) {
      listener.onNotification(notification);
    }
  });
};

/**
 * Handle lead update
 * @param {Object} data - Lead update data
 */
const handleLeadUpdate = (data) => {
  // Create notification object
  const notification = {
    type: 'lead',
    title: 'Lead Updated',
    message: data.message || `Lead ${data.leadId} has been updated`,
    link: `/leads/${data.leadId}`,
    priority: data.priority || 'normal',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle lead assignment
 * @param {Object} data - Lead assignment data
 */
const handleLeadAssignment = (data) => {
  // Create notification object
  const notification = {
    type: 'lead',
    title: 'Lead Assigned',
    message: data.message || `Lead ${data.leadId} has been assigned to you`,
    link: `/leads/${data.leadId}`,
    priority: 'high',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle appointment update
 * @param {Object} data - Appointment update data
 */
const handleAppointmentUpdate = (data) => {
  // Create notification object
  const notification = {
    type: 'appointment',
    title: data.title || 'Appointment Update',
    message: data.message || `Appointment ${data.appointmentId} has been updated`,
    link: `/appointments/${data.appointmentId}`,
    priority: data.priority || 'normal',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle vehicle update
 * @param {Object} data - Vehicle update data
 */
const handleVehicleUpdate = (data) => {
  // Create notification object
  const notification = {
    type: 'vehicle',
    title: data.title || 'Vehicle Update',
    message: data.message || `Vehicle ${data.vehicleId} has been updated`,
    link: `/vehicles/${data.vehicleId}`,
    priority: data.priority || 'normal',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle vehicle interest
 * @param {Object} data - Vehicle interest data
 */
const handleVehicleInterest = (data) => {
  // Create notification object
  const notification = {
    type: 'vehicle',
    title: 'New Vehicle Interest',
    message: data.message || `New interest in vehicle ${data.vehicleId}`,
    link: `/vehicles/${data.vehicleId}/interests`,
    priority: 'high',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle vehicle price change
 * @param {Object} data - Vehicle price change data
 */
const handleVehiclePriceChange = (data) => {
  const oldPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.oldPrice);
  const newPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.newPrice);
  
  // Create notification object
  const notification = {
    type: 'vehicle',
    title: 'Vehicle Price Changed',
    message: `Price changed from ${oldPrice} to ${newPrice}`,
    link: `/vehicles/${data.vehicleId}`,
    priority: 'normal',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle vehicle status change
 * @param {Object} data - Vehicle status change data
 */
const handleVehicleStatusChange = (data) => {
  // Create notification object
  const notification = {
    type: 'vehicle',
    title: 'Vehicle Status Changed',
    message: `Status changed from ${data.oldStatus} to ${data.newStatus}`,
    link: `/vehicles/${data.vehicleId}`,
    priority: data.newStatus === 'sold' ? 'high' : 'normal',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle communication sent
 * @param {Object} data - Communication data
 */
const handleCommunicationSent = (data) => {
  // Create notification object
  const notification = {
    type: 'communication',
    title: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Sent`,
    message: data.message || `${data.type} sent to lead ${data.leadId}`,
    link: `/leads/${data.leadId}/communications`,
    priority: 'normal',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle communication received
 * @param {Object} data - Communication data
 */
const handleCommunicationReceived = (data) => {
  // Create notification object
  const notification = {
    type: 'communication',
    title: `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Received`,
    message: data.message || `New ${data.type} received from lead ${data.leadId}`,
    link: `/leads/${data.leadId}/communications`,
    priority: 'high',
    data
  };
  
  // Handle as regular notification
  handleNotification(notification);
};

/**
 * Handle user status change
 * @param {Object} data - User status data
 */
const handleUserStatusChange = (data) => {
  // Notify all listeners
  notificationListeners.forEach(listener => {
    if (listener.onUserStatusChange) {
      listener.onUserStatusChange(data);
    }
  });
};

/**
 * Check if notification should be shown based on user preferences
 * @param {Object} notification - Notification object
 * @returns {boolean} Whether to show the notification
 */
const shouldShowNotification = (notification) => {
  // If no preferences are set, show all notifications
  if (!notificationPreferences) return true;
  
  // Check if notifications are enabled for this type
  const { browser } = notificationPreferences;
  
  if (!browser || !browser.enabled) return false;
  
  // Check if this specific notification type is enabled
  const notificationType = notification.type || 'other';
  return browser.types && browser.types[notificationType] !== false;
};

/**
 * Check if sound should be played for this notification
 * @param {Object} notification - Notification object
 * @returns {boolean} Whether to play sound
 */
const shouldPlaySound = (notification) => {
  // If no preferences are set, play sound for high priority only
  if (!notificationPreferences) return notification.priority === 'high';
  
  // Check if sound is enabled
  const { sound } = notificationPreferences;
  
  if (!sound || !sound.enabled) return false;
  
  // Check if sound is enabled for this notification type
  const notificationType = notification.type || 'other';
  return sound.types && sound.types[notificationType] !== false;
};

/**
 * Show toast notification
 * @param {Object} notification - Notification object
 */
const showToastNotification = (notification) => {
  const toastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  };
  
  // Set toast type based on priority
  let toastType = 'info';
  
  switch (notification.priority) {
    case 'high':
      toastType = 'error';
      break;
    case 'normal':
      toastType = 'info';
      break;
    case 'low':
      toastType = 'default';
      break;
    default:
      toastType = 'info';
  }
  
  // Create toast content
  const content = (
    <div onClick={() => handleNotificationClick(notification)}>
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
    </div>
  );
  
  // Show toast
  toast[toastType](content, toastOptions);
};

/**
 * Show browser notification
 * @param {Object} notification - Notification object
 */
const showBrowserNotification = (notification) => {
  // Check if browser notifications are supported and permitted
  if (!('Notification' in window)) return;
  
  // If permission not granted, don't show
  if (Notification.permission !== 'granted') return;
  
  // Create browser notification
  const browserNotification = new Notification(notification.title, {
    body: notification.message,
    icon: '/logo192.png'
  });
  
  // Handle click
  browserNotification.onclick = () => {
    handleNotificationClick(notification);
    browserNotification.close();
  };
};

/**
 * Handle notification click
 * @param {Object} notification - Notification object
 */
const handleNotificationClick = (notification) => {
  // If notification has a link, navigate to it
  if (notification.link) {
    window.location.href = notification.link;
  }
  
  // Mark notification as read if it has an ID
  if (notification._id) {
    markNotificationAsRead(notification._id);
  }
  
  // Notify all listeners
  notificationListeners.forEach(listener => {
    if (listener.onNotificationClick) {
      listener.onNotificationClick(notification);
    }
  });
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = (notificationId) => {
  if (!socket || !socket.connected) return;
  
  // Emit event to server
  socket.emit('notification:read', notificationId);
  
  // Make API call to mark as read
  fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  }).catch(error => {
    console.error('Error marking notification as read:', error);
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = () => {
  if (!socket || !socket.connected) return;
  
  // Make API call to mark all as read
  fetch('/api/notifications/mark-all-read', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  }).then(() => {
    // Emit event to server to sync with other devices
    socket.emit('notification:mark_all_read');
    
    // Notify all listeners
    notificationListeners.forEach(listener => {
      if (listener.onAllNotificationsRead) {
        listener.onAllNotificationsRead();
      }
    });
  }).catch(error => {
    console.error('Error marking all notifications as read:', error);
  });
};

/**
 * Update notification preferences
 * @param {Object} preferences - New preferences
 */
export const updateNotificationPreferences = (preferences) => {
  if (!socket || !socket.connected) return;
  
  // Make API call to update preferences
  fetch('/api/notifications/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(preferences)
  }).then(response => response.json())
    .then(updatedPreferences => {
      // Update local preferences
      notificationPreferences = updatedPreferences;
      
      // Emit event to server to sync with other devices
      socket.emit('notification:preferences', updatedPreferences);
      
      // Notify all listeners
      notificationListeners.forEach(listener => {
        if (listener.onPreferencesUpdated) {
          listener.onPreferencesUpdated(updatedPreferences);
        }
      });
    })
    .catch(error => {
      console.error('Error updating notification preferences:', error);
    });
};

/**
 * Request browser notification permission
 * @returns {Promise} Promise resolving to the permission state
 */
export const requestNotificationPermission = () => {
  // Check if browser notifications are supported
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }
  
  // If already granted, return current permission
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }
  
  // If already denied, return current permission
  if (Notification.permission === 'denied') {
    return Promise.resolve('denied');
  }
  
  // Request permission
  return Notification.requestPermission();
};

/**
 * Join a room
 * @param {string} room - Room to join
 */
export const joinRoom = (room) => {
  if (!socket || !socket.connected) return;
  
  socket.emit('join:room', room);
};

/**
 * Leave a room
 * @param {string} room - Room to leave
 */
export const leaveRoom = (room) => {
  if (!socket || !socket.connected) return;
  
  socket.emit('leave:room', room);
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeNotifications,
  registerNotificationListener,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateNotificationPreferences,
  requestNotificationPermission,
  joinRoom,
  leaveRoom,
  disconnectSocket
};
