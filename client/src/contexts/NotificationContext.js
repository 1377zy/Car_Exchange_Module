import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { 
  initializeSocket, 
  addEventListener, 
  updateNotificationPreferences,
  updateBrowserPermission,
  updatePushSubscription
} from '../utils/socketClient';
import {
  requestBrowserPermission,
  checkBrowserPermission,
  showBrowserNotification
} from '../utils/browserNotificationUtils';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSupported
} from '../utils/pushNotificationUtils';
import { playNotificationSound } from '../utils/notificationSoundUtils';

// Create the notification context
export const NotificationContext = createContext();

// Default notification preferences
const defaultPreferences = {
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
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [browserPermission, setBrowserPermission] = useState('default');
  const [pushSubscription, setPushSubscription] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Initialize browser notification permission
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await checkBrowserPermission();
      setBrowserPermission(permission);
    };
    
    checkPermission();
  }, []);
  
  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const connectSocket = async () => {
        try {
          const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          await initializeSocket(serverUrl);
          setSocketConnected(true);
          
          // Add socket event listeners
          const removeConnectListener = addEventListener('onConnect', () => {
            console.log('Socket connected');
            setSocketConnected(true);
          });
          
          const removeDisconnectListener = addEventListener('onDisconnect', () => {
            console.log('Socket disconnected');
            setSocketConnected(false);
          });
          
          const removeNotificationListener = addEventListener('onNotification', handleNewNotification);
          
          const removeNotificationReadListener = addEventListener('onNotificationRead', handleNotificationRead);
          
          const removeNotificationPreferencesListener = addEventListener('onNotificationPreferences', handlePreferencesUpdate);
          
          // Cleanup function
          return () => {
            removeConnectListener();
            removeDisconnectListener();
            removeNotificationListener();
            removeNotificationReadListener();
            removeNotificationPreferencesListener();
          };
        } catch (error) {
          console.error('Failed to initialize socket:', error);
        }
      };
      
      connectSocket();
    }
  }, [isAuthenticated]);
  
  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(defaultPreferences);
    }
  }, [isAuthenticated]);
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
      
      // Count unread notifications
      const unread = response.data.notifications.filter(notification => !notification.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Fetch notification preferences from API
  const fetchPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const response = await axios.get('/api/notifications/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Use default preferences if fetch fails
      setPreferences(defaultPreferences);
    } finally {
      setLoadingPreferences(false);
    }
  };
  
  // Handle new notification
  const handleNewNotification = useCallback((notification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    
    // Play sound if enabled
    if (preferences.soundNotifications && preferences.sound) {
      playNotificationSound(notification.priority || 'normal', {
        volume: preferences.soundVolume || 0.7
      });
    }
    
    // Show browser notification if enabled
    if (
      preferences.browserNotifications && 
      preferences.browser && 
      browserPermission === 'granted'
    ) {
      // Only show when app is hidden if that preference is set
      const appIsHidden = document.hidden;
      if (!preferences.showOnlyWhenHidden || (preferences.showOnlyWhenHidden && appIsHidden)) {
        showBrowserNotification({
          title: notification.title,
          body: notification.message,
          icon: '/logo192.png',
          tag: notification._id,
          requireInteraction: preferences.requireInteraction,
          data: {
            url: notification.action?.payload?.url || '/notifications',
            id: notification._id
          }
        });
      }
    }
  }, [preferences, browserPermission]);
  
  // Handle notification read
  const handleNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);
  
  // Handle preferences update
  const handlePreferencesUpdate = useCallback((newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  }, []);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      handleNotificationRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      
      // Remove from state
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      
      // Update unread count if needed
      const wasUnread = notifications.find(n => n._id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };
  
  // Update notification preferences
  const updatePreferences = async (updatedPreferences) => {
    try {
      // Update local state optimistically
      setPreferences(prev => ({
        ...prev,
        ...updatedPreferences
      }));
      
      // Send to server
      const response = await axios.put('/api/notifications/preferences', updatedPreferences);
      
      // Update with server response
      setPreferences(response.data);
      
      // Update socket server
      if (socketConnected) {
        updateNotificationPreferences(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      
      // Revert to previous state on error
      fetchPreferences();
      throw error;
    }
  };
  
  // Request browser notification permission
  const requestBrowserNotificationPermission = async () => {
    const permission = await requestBrowserPermission();
    setBrowserPermission(permission);
    
    // Update server
    if (socketConnected) {
      updateBrowserPermission(permission);
    }
    
    return permission;
  };
  
  // Subscribe to push notifications
  const subscribeToPush = async () => {
    try {
      // Get VAPID public key
      const { data } = await axios.get('/api/notifications/vapid-public-key');
      const { vapidPublicKey } = data;
      
      // Subscribe
      const subscription = await subscribeToPushNotifications(vapidPublicKey);
      
      // Save subscription to server
      await axios.post('/api/notifications/push-subscription', { subscription });
      
      // Update local state
      setPushSubscription(subscription);
      
      // Update socket server
      if (socketConnected) {
        updatePushSubscription(subscription);
      }
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  };
  
  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    try {
      // Unsubscribe
      await unsubscribeFromPushNotifications();
      
      // Remove subscription from server
      await axios.delete('/api/notifications/push-subscription');
      
      // Update local state
      setPushSubscription(null);
      
      // Update socket server
      if (socketConnected) {
        updatePushSubscription(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        loadingPreferences,
        browserPermission,
        pushSubscription,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        updatePreferences,
        requestBrowserPermission: requestBrowserNotificationPermission,
        subscribeToPush,
        unsubscribeFromPush
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);
