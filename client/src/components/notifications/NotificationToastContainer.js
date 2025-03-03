import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer } from 'react-bootstrap';
import NotificationToast from './NotificationToast';
import { registerNotificationListener } from '../../utils/notificationHandler';
import { playNotificationSound } from '../../utils/audioUtils';

/**
 * Notification Toast Container Component
 * Manages and displays real-time notification toasts
 */
const NotificationToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const [preferences, setPreferences] = useState(null);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        const data = await response.json();
        setPreferences(data);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        // Set default preferences if failed to load
        setPreferences({
          browser: { enabled: true, types: { leads: true, appointments: true, vehicles: true, communications: true } },
          sound: { enabled: true, types: { leads: true, appointments: true, vehicles: true, communications: true } }
        });
      }
    };
    
    loadPreferences();
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((notification) => {
    // Check if notification should be shown as toast based on preferences
    if (preferences?.browser?.enabled) {
      const notificationType = notification.type === 'lead' ? 'leads' : 
                              notification.type === 'appointment' ? 'appointments' :
                              notification.type === 'vehicle' ? 'vehicles' :
                              notification.type === 'communication' ? 'communications' : 'system';
      
      // If this notification type is disabled in preferences, don't show toast
      if (preferences.browser.types && notificationType in preferences.browser.types && 
          !preferences.browser.types[notificationType]) {
        return;
      }
      
      // Add toast with unique ID
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      setToasts(prevToasts => [
        ...prevToasts,
        { id: toastId, notification, timestamp: Date.now() }
      ]);
      
      // Play sound if enabled
      if (preferences?.sound?.enabled) {
        const soundType = notification.type === 'lead' ? 'leads' : 
                         notification.type === 'appointment' ? 'appointments' :
                         notification.type === 'vehicle' ? 'vehicles' :
                         notification.type === 'communication' ? 'communications' : 'system';
        
        // If this notification type is enabled for sound
        if (preferences.sound.types && soundType in preferences.sound.types && 
            preferences.sound.types[soundType]) {
          // Play sound based on priority
          playNotificationSound(notification.priority || 'normal');
        }
      }
    }
  }, [preferences]);

  // Register notification listener
  useEffect(() => {
    const unregister = registerNotificationListener({
      onNotification: handleNewNotification
    });
    
    return () => {
      unregister();
    };
  }, [handleNewNotification]);

  // Auto-remove toasts after timeout
  useEffect(() => {
    const toastTimeout = 5000; // 5 seconds
    
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        const now = Date.now();
        setToasts(prevToasts => 
          prevToasts.filter(toast => now - toast.timestamp < toastTimeout)
        );
      }, toastTimeout);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [toasts]);

  // Handle close toast
  const handleCloseToast = (toastId) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  };

  // Limit number of visible toasts
  const visibleToasts = toasts.slice(0, 3);

  return (
    <ToastContainer className="notification-toast-container" position="top-end">
      {visibleToasts.map(toast => (
        <NotificationToast
          key={toast.id}
          notification={toast.notification}
          onClose={() => handleCloseToast(toast.id)}
        />
      ))}
    </ToastContainer>
  );
};

export default NotificationToastContainer;
