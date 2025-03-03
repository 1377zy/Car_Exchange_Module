/**
 * Server-side Socket.io Manager
 * This file manages socket connections, rooms, and event handling for real-time notifications
 */

const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const userRoomPrefix = 'user:';
const vehicleRoomPrefix = 'vehicle:';
const leadRoomPrefix = 'lead:';
const roleRoomPrefix = 'role:';
const userSockets = new Map(); // Map of userId to array of socket instances

/**
 * Socket Manager for handling real-time communications
 */
const socketManager = {
  /**
   * Initialize Socket.io server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    io = socketio(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Set user data on socket
        socket.userId = decoded.user.id;
        socket.userRole = decoded.user.role;
        
        // Update user's last active timestamp
        await User.findByIdAndUpdate(decoded.user.id, {
          lastActive: Date.now()
        });
        
        next();
      } catch (err) {
        console.error('Socket authentication error:', err.message);
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    io.on('connection', socket => {
      console.log(`User connected: ${socket.userId} (${socket.userRole})`);
      
      // Store socket reference for this user
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, []);
      }
      userSockets.get(socket.userId).push(socket);
      
      // Join user to their private room
      const userRoom = `${userRoomPrefix}${socket.userId}`;
      socket.join(userRoom);
      
      // Join user to role room
      const roleRoom = `${roleRoomPrefix}${socket.userRole}`;
      socket.join(roleRoom);
      
      // Update online status
      this.updateUserStatus(socket.userId, true);
      
      // Broadcast user status to relevant users
      this.broadcastUserStatus(socket.userId, true);
      
      // Handle room joining
      socket.on('join:room', room => {
        if (typeof room === 'string' && room.trim() !== '') {
          console.log(`User ${socket.userId} joined room ${room}`);
          socket.join(room);
        }
      });
      
      // Handle room leaving
      socket.on('leave:room', room => {
        if (typeof room === 'string' && room.trim() !== '') {
          console.log(`User ${socket.userId} left room ${room}`);
          socket.leave(room);
        }
      });
      
      // Test notification event
      socket.on('notification:test', async (notificationData) => {
        try {
          // Create a test notification
          const notification = {
            user: socket.userId,
            type: notificationData.type || 'system',
            title: notificationData.title || 'Test Notification',
            message: notificationData.message || 'This is a test notification',
            priority: notificationData.priority || 'normal',
            link: notificationData.link || '',
            data: notificationData.data || {},
            read: false,
            createdAt: new Date()
          };
          
          // Generate a temporary ID for the notification
          notification._id = `test-${Date.now()}`;
          
          // Send the notification to the user
          io.to(userRoom).emit('notification:new', notification);
          
          console.log(`Test notification sent to user ${socket.userId}`);
        } catch (error) {
          console.error('Error sending test notification:', error);
        }
      });
      
      // Handle notification read
      socket.on('notification:read', notificationId => {
        if (notificationId) {
          // This allows other devices of the same user to stay in sync
          socket.to(`${userRoomPrefix}${socket.userId}`).emit('notification:read', notificationId);
        }
      });
      
      // Handle notification preferences update
      socket.on('notification:preferences', preferences => {
        if (preferences) {
          // Sync preferences across user's devices
          socket.to(`${userRoomPrefix}${socket.userId}`).emit('notification:preferences', preferences);
        }
      });
      
      // Handle lead assignment
      socket.on('lead:assigned', data => {
        if (data && data.leadId && data.assignedTo) {
          // Notify the assigned user
          io.to(`${userRoomPrefix}${data.assignedTo}`).emit('lead:assigned', data);
          
          // Join the user to the lead's room
          socket.join(`${leadRoomPrefix}${data.leadId}`);
        }
      });
      
      // Handle appointment updates
      socket.on('appointment:update', data => {
        if (data && data.appointmentId) {
          // Notify relevant users
          if (data.assignedTo) {
            io.to(`${userRoomPrefix}${data.assignedTo}`).emit('appointment:update', data);
          }
          
          // Notify admin room
          io.to('admin').emit('appointment:update', {
            ...data,
            adminNotification: true
          });
        }
      });
      
      // Handle vehicle interest
      socket.on('vehicle:interest', data => {
        if (data && data.vehicleId && data.leadId) {
          // Join the lead's room for this vehicle
          socket.join(`${vehicleRoomPrefix}${data.vehicleId}`);
          
          // Notify admins and managers
          io.to('admin').emit('vehicle:interest', {
            ...data,
            timestamp: Date.now()
          });
          
          // If the vehicle has an assigned sales agent, notify them too
          if (data.salesAgentId) {
            io.to(`${userRoomPrefix}${data.salesAgentId}`).emit('vehicle:interest', {
              ...data,
              timestamp: Date.now()
            });
          }
        }
      });
      
      // Handle vehicle price updates
      socket.on('vehicle:price_update', data => {
        if (data && data.vehicleId && data.price) {
          // Notify all users in the vehicle room
          io.to(`${vehicleRoomPrefix}${data.vehicleId}`).emit('vehicle:price_update', {
            ...data,
            timestamp: Date.now()
          });
          
          // Notify admins
          io.to('admin').emit('vehicle:price_update', {
            ...data,
            adminNotification: true,
            timestamp: Date.now()
          });
        }
      });
      
      // Handle vehicle status updates (sold, pending, available)
      socket.on('vehicle:status_update', data => {
        if (data && data.vehicleId && data.status) {
          // Notify all users in the vehicle room
          io.to(`${vehicleRoomPrefix}${data.vehicleId}`).emit('vehicle:status_update', {
            ...data,
            timestamp: Date.now()
          });
          
          // Notify admins
          io.to('admin').emit('vehicle:status_update', {
            ...data,
            adminNotification: true,
            timestamp: Date.now()
          });
        }
      });
      
      // Handle communication sent
      socket.on('communication:sent', data => {
        if (data && data.leadId && data.type) {
          // Notify all users in the lead's room
          io.to(`${leadRoomPrefix}${data.leadId}`).emit('communication:sent', {
            ...data,
            timestamp: Date.now()
          });
          
          // Notify admins for monitoring
          io.to('admin').emit('communication:sent', {
            ...data,
            adminNotification: true,
            timestamp: Date.now()
          });
        }
      });
      
      // Handle communication received (inbound)
      socket.on('communication:received', data => {
        if (data && data.leadId && data.type) {
          // Notify all users in the lead's room
          io.to(`${leadRoomPrefix}${data.leadId}`).emit('communication:received', {
            ...data,
            timestamp: Date.now()
          });
          
          // If the lead has an assigned agent, send a high priority notification
          if (data.assignedTo) {
            io.to(`${userRoomPrefix}${data.assignedTo}`).emit('communication:received', {
              ...data,
              highPriority: true,
              timestamp: Date.now()
            });
          }
          
          // Notify admins for monitoring
          io.to('admin').emit('communication:received', {
            ...data,
            adminNotification: true,
            timestamp: Date.now()
          });
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.userId}`);
        
        // Remove socket from our tracking
        if (userSockets.has(socket.userId)) {
          const userSocketArray = userSockets.get(socket.userId);
          const index = userSocketArray.indexOf(socket);
          if (index !== -1) {
            userSocketArray.splice(index, 1);
          }
          
          // If it was the last socket for this user, they're fully offline
          if (userSocketArray.length === 0) {
            userSockets.delete(socket.userId);
            this.broadcastUserStatus(socket.userId, false);
          }
        }
        
        // Update user's last active timestamp on disconnect
        if (socket.userId) {
          try {
            await User.findByIdAndUpdate(socket.userId, {
              lastActive: Date.now()
            });
          } catch (err) {
            console.error('Error updating last active status:', err.message);
          }
        }
      });
    });

    console.log('Socket.io initialized');
    return io;
  },
  
  /**
   * Broadcast a user's online status
   * @param {string} userId - User ID whose status changed
   * @param {boolean} online - Whether the user is online or offline
   */
  broadcastUserStatus(userId, online) {
    if (!io) return;
    
    io.emit('user:status', {
      userId,
      online,
      timestamp: Date.now()
    });
  },

  /**
   * Send notification to a specific user
   * @param {string} userId - User ID to send notification to
   * @param {Object} notification - Notification object
   */
  sendNotification(userId, notification) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    // Check if notification has an action property
    if (notification.action) {
      // This is a control notification (mark as read, preferences updated, etc.)
      io.to(`${userRoomPrefix}${userId}`).emit(`notification:${notification.action}`, notification);
    } else {
      // This is a new notification
      io.to(`${userRoomPrefix}${userId}`).emit('notification:new', notification);
    }
  },
  
  /**
   * Send notification to multiple users
   * @param {Array} userIds - Array of user IDs to send notification to
   * @param {Object} notification - Notification object
   */
  sendNotificationToMany(userIds, notification) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    userIds.forEach(userId => {
      io.to(`${userRoomPrefix}${userId}`).emit('notification:new', notification);
    });
  },
  
  /**
   * Broadcast notification to all connected users
   * @param {Object} notification - Notification object
   */
  broadcastNotification(notification) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    io.emit('notification:broadcast', notification);
  },
  
  /**
   * Send lead update to assigned user
   * @param {string} leadId - Lead ID
   * @param {string} userId - User ID to send update to
   * @param {Object} update - Update object
   */
  sendLeadUpdate(leadId, userId, update) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    // Send to specific user
    io.to(`${userRoomPrefix}${userId}`).emit('lead:update', {
      leadId,
      ...update,
      timestamp: Date.now()
    });
    
    // Also notify admin room for monitoring
    io.to('admin').emit('lead:update', {
      leadId,
      userId,
      ...update,
      adminNotification: true,
      timestamp: Date.now()
    });
  },
  
  /**
   * Send appointment update to assigned user
   * @param {string} appointmentId - Appointment ID
   * @param {string} userId - User ID to send update to
   * @param {Object} update - Update object
   */
  sendAppointmentUpdate(appointmentId, userId, update) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    // Send to specific user
    io.to(`${userRoomPrefix}${userId}`).emit('appointment:update', {
      appointmentId,
      ...update,
      timestamp: Date.now()
    });
    
    // Also notify admin room
    io.to('admin').emit('appointment:update', {
      appointmentId,
      userId,
      ...update,
      adminNotification: true,
      timestamp: Date.now()
    });
  },
  
  /**
   * Send vehicle update to interested users
   * @param {string} vehicleId - Vehicle ID
   * @param {Array} userIds - Array of user IDs to notify
   * @param {Object} update - Update object
   */
  sendVehicleUpdate(vehicleId, userIds, update) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    // Send to specific vehicle room
    io.to(`${vehicleRoomPrefix}${vehicleId}`).emit('vehicle:update', {
      vehicleId,
      ...update,
      timestamp: Date.now()
    });
    
    // Also send to specific users who might not be in the room
    if (userIds && userIds.length > 0) {
      userIds.forEach(userId => {
        io.to(`${userRoomPrefix}${userId}`).emit('vehicle:update', {
          vehicleId,
          ...update,
          timestamp: Date.now()
        });
      });
    }
  },
  
  /**
   * Send vehicle interest notification to admins and managers
   * @param {string} vehicleId - Vehicle ID
   * @param {string} leadId - Lead ID
   * @param {Object} interestData - Interest data
   */
  sendVehicleInterestNotification(vehicleId, leadId, interestData) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    // Notify admins and managers
    io.to('admin').emit('vehicle:interest', {
      vehicleId,
      leadId,
      ...interestData,
      timestamp: Date.now()
    });
    
    // If there's a sales agent assigned to this vehicle, notify them too
    if (interestData.salesAgentId) {
      io.to(`${userRoomPrefix}${interestData.salesAgentId}`).emit('vehicle:interest', {
        vehicleId,
        leadId,
        ...interestData,
        timestamp: Date.now()
      });
    }
  },
  
  /**
   * Send vehicle price change notification to interested users
   * @param {string} vehicleId - Vehicle ID
   * @param {number} oldPrice - Old price
   * @param {number} newPrice - New price
   * @param {Object} vehicleData - Vehicle data
   */
  sendVehiclePriceChangeNotification(vehicleId, oldPrice, newPrice, vehicleData) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    const priceChange = {
      vehicleId,
      oldPrice,
      newPrice,
      ...vehicleData,
      timestamp: Date.now()
    };
    
    // Notify all users in the vehicle room
    io.to(`${vehicleRoomPrefix}${vehicleId}`).emit('vehicle:price_change', priceChange);
    
    // Notify admins
    io.to('admin').emit('vehicle:price_change', {
      ...priceChange,
      adminNotification: true
    });
  },
  
  /**
   * Send vehicle status change notification (sold, pending, available)
   * @param {string} vehicleId - Vehicle ID
   * @param {string} oldStatus - Old status
   * @param {string} newStatus - New status
   * @param {Object} vehicleData - Vehicle data
   */
  sendVehicleStatusChangeNotification(vehicleId, oldStatus, newStatus, vehicleData) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    const statusChange = {
      vehicleId,
      oldStatus,
      newStatus,
      ...vehicleData,
      timestamp: Date.now()
    };
    
    // Notify all users in the vehicle room
    io.to(`${vehicleRoomPrefix}${vehicleId}`).emit('vehicle:status_change', statusChange);
    
    // Notify admins
    io.to('admin').emit('vehicle:status_change', {
      ...statusChange,
      adminNotification: true
    });
  },
  
  /**
   * Send communication notification
   * @param {string} leadId - Lead ID
   * @param {string} userId - User ID who sent the communication
   * @param {Object} communicationData - Communication data
   */
  sendCommunicationNotification(leadId, userId, communicationData) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    // Notify all users in the lead's room
    io.to(`${leadRoomPrefix}${leadId}`).emit('communication:sent', {
      leadId,
      userId,
      ...communicationData,
      timestamp: Date.now()
    });
    
    // Notify admins for monitoring
    io.to('admin').emit('communication:sent', {
      leadId,
      userId,
      ...communicationData,
      adminNotification: true,
      timestamp: Date.now()
    });
  },
  
  /**
   * Send incoming communication notification (when lead responds)
   * @param {string} leadId - Lead ID
   * @param {string} assignedUserId - User ID assigned to the lead
   * @param {Object} communicationData - Communication data
   */
  sendIncomingCommunicationNotification(leadId, assignedUserId, communicationData) {
    if (!io) {
      console.warn('Socket.io not initialized');
      return;
    }
    
    const notificationData = {
      leadId,
      ...communicationData,
      timestamp: Date.now(),
      highPriority: true
    };
    
    // Notify the assigned user with high priority
    if (assignedUserId) {
      io.to(`${userRoomPrefix}${assignedUserId}`).emit('communication:received', notificationData);
    }
    
    // Notify all users in the lead's room
    io.to(`${leadRoomPrefix}${leadId}`).emit('communication:received', notificationData);
    
    // Notify admins for monitoring
    io.to('admin').emit('communication:received', {
      ...notificationData,
      adminNotification: true
    });
  },
  
  /**
   * Check if a user is currently online
   * @param {string} userId - User ID to check
   * @returns {boolean} Whether the user is online
   */
  isUserOnline(userId) {
    return userSockets.has(userId) && userSockets.get(userId).length > 0;
  },
  
  /**
   * Get count of online users
   * @returns {number} Number of online users
   */
  getOnlineUsersCount() {
    return userSockets.size;
  },
  
  /**
   * Get Socket.io instance
   * @returns {Object} Socket.io instance
   */
  getIO() {
    return io;
  }
};

module.exports = socketManager;
