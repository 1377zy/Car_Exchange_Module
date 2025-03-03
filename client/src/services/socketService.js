/**
 * Socket Service
 * Manages Socket.io connection and real-time events
 */

import io from 'socket.io-client';
import { getToken } from '../utils/authUtils';
import notificationService from './notificationService';

let socket = null;
const eventListeners = new Map();

/**
 * Initialize the socket connection
 * @param {string} serverUrl - Socket.io server URL
 * @returns {Object} Socket instance
 */
export const initializeSocket = (serverUrl) => {
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
  setupEventListeners();

  return socket;
};

/**
 * Set up socket event listeners
 */
const setupEventListeners = () => {
  if (!socket) {
    return;
  }

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
    notifyListeners('connect');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    notifyListeners('disconnect');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    notifyListeners('error', error);
  });

  // Notification events
  socket.on('notification:new', (notification) => {
    notificationService.handleNewNotification(notification);
    notifyListeners('notification:new', notification);
  });
  
  socket.on('notification:read', (notificationId) => {
    notifyListeners('notification:read', notificationId);
  });
  
  socket.on('notification:mark_all_read', () => {
    notifyListeners('notification:mark_all_read');
  });
  
  socket.on('notification:preferences_updated', (preferences) => {
    notifyListeners('notification:preferences_updated', preferences);
  });
  
  // Lead events
  socket.on('lead:assigned', (data) => {
    notificationService.handleNewNotification({
      type: 'lead',
      title: 'New Lead Assigned',
      message: `You have been assigned a new lead: ${data.leadName || 'Unknown'}`,
      priority: 'high',
      link: `/leads/${data.leadId}`,
      data
    });
    notifyListeners('lead:assigned', data);
  });
  
  socket.on('lead:update', (data) => {
    notificationService.handleNewNotification({
      type: 'lead',
      title: 'Lead Updated',
      message: `Lead ${data.leadName || 'Unknown'} has been updated`,
      priority: 'normal',
      link: `/leads/${data.leadId}`,
      data
    });
    notifyListeners('lead:update', data);
  });
  
  // Appointment events
  socket.on('appointment:update', (data) => {
    notificationService.handleNewNotification({
      type: 'appointment',
      title: 'Appointment Updated',
      message: data.message || 'An appointment has been updated',
      priority: data.priority || 'normal',
      link: `/appointments/${data.appointmentId}`,
      data
    });
    notifyListeners('appointment:update', data);
  });
  
  socket.on('appointment:reminder', (data) => {
    notificationService.handleNewNotification({
      type: 'appointment',
      title: 'Appointment Reminder',
      message: data.message || 'You have an upcoming appointment',
      priority: 'high',
      link: `/appointments/${data.appointmentId}`,
      data
    });
    notifyListeners('appointment:reminder', data);
  });
  
  // Vehicle events
  socket.on('vehicle:interest', (data) => {
    notificationService.handleNewNotification({
      type: 'vehicle',
      title: 'New Vehicle Interest',
      message: `A lead has shown interest in ${data.vehicleName || 'a vehicle'}`,
      priority: 'high',
      link: `/vehicles/${data.vehicleId}`,
      data
    });
    notifyListeners('vehicle:interest', data);
  });
  
  socket.on('vehicle:price_update', (data) => {
    notificationService.handleNewNotification({
      type: 'vehicle',
      title: 'Vehicle Price Updated',
      message: `Price updated for ${data.vehicleName || 'a vehicle'}`,
      priority: 'normal',
      link: `/vehicles/${data.vehicleId}`,
      data
    });
    notifyListeners('vehicle:price_update', data);
  });
  
  socket.on('vehicle:status_update', (data) => {
    notificationService.handleNewNotification({
      type: 'vehicle',
      title: 'Vehicle Status Updated',
      message: `Status updated to ${data.status} for ${data.vehicleName || 'a vehicle'}`,
      priority: 'normal',
      link: `/vehicles/${data.vehicleId}`,
      data
    });
    notifyListeners('vehicle:status_update', data);
  });
  
  // Communication events
  socket.on('communication:sent', (data) => {
    notificationService.handleNewNotification({
      type: 'communication',
      title: 'Communication Sent',
      message: `${data.type || 'Message'} sent to ${data.recipientName || 'recipient'}`,
      priority: 'low',
      link: `/leads/${data.leadId}/communications`,
      data
    });
    notifyListeners('communication:sent', data);
  });
  
  socket.on('communication:received', (data) => {
    notificationService.handleNewNotification({
      type: 'communication',
      title: 'New Communication Received',
      message: `${data.type || 'Message'} received from ${data.senderName || 'sender'}`,
      priority: 'high',
      link: `/leads/${data.leadId}/communications`,
      data
    });
    notifyListeners('communication:received', data);
  });
  
  // User status events
  socket.on('user:status', (data) => {
    notifyListeners('user:status', data);
  });
};

/**
 * Add an event listener
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove the listener
 */
export const addEventListener = (event, callback) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  
  eventListeners.get(event).push(callback);
  
  // Return function to remove listener
  return () => {
    const listeners = eventListeners.get(event);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

/**
 * Notify all listeners for an event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
const notifyListeners = (event, data) => {
  const listeners = eventListeners.get(event);
  if (!listeners) return;
  
  listeners.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(`Error in socket event listener for ${event}:`, error);
    }
  });
};

/**
 * Emit an event to the server
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
export const emit = (event, data) => {
  if (!socket || !socket.connected) {
    console.warn('Socket not connected, cannot emit event:', event);
    return;
  }
  
  socket.emit(event, data);
};

/**
 * Join a room
 * @param {string} room - Room name
 */
export const joinRoom = (room) => {
  if (!socket || !socket.connected) {
    console.warn('Socket not connected, cannot join room:', room);
    return;
  }
  
  socket.emit('join:room', room);
};

/**
 * Leave a room
 * @param {string} room - Room name
 */
export const leaveRoom = (room) => {
  if (!socket || !socket.connected) {
    console.warn('Socket not connected, cannot leave room:', room);
    return;
  }
  
  socket.emit('leave:room', room);
};

/**
 * Disconnect the socket
 */
export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the socket instance
 * @returns {Object} Socket instance
 */
export const getSocket = () => socket;

/**
 * Check if socket is connected
 * @returns {boolean} Whether socket is connected
 */
export const isConnected = () => socket && socket.connected;

export default {
  initializeSocket,
  addEventListener,
  emit,
  joinRoom,
  leaveRoom,
  disconnect,
  getSocket,
  isConnected
};
