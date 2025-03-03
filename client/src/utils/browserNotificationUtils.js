/**
 * Browser Notification Utilities
 * Handles browser notification permissions and display
 */

// Store notification preferences
let notificationPreferences = {
  enabled: true,
  requireInteraction: false,
  showOnlyWhenHidden: true
};

/**
 * Check if browser notifications are supported
 * @returns {boolean} Whether browser notifications are supported
 */
export const areBrowserNotificationsSupported = () => {
  return 'Notification' in window;
};

/**
 * Get current notification permission status
 * @returns {string} Permission status: 'granted', 'denied', 'default', or 'unsupported'
 */
export const getNotificationPermission = () => {
  if (!areBrowserNotificationsSupported()) {
    return 'unsupported';
  }
  
  return Notification.permission;
};

/**
 * Request permission to display browser notifications
 * @returns {Promise<string>} Promise resolving to permission status
 */
export const requestNotificationPermission = async () => {
  if (!areBrowserNotificationsSupported()) {
    return Promise.resolve('unsupported');
  }
  
  // If permission is already granted or denied, return current status
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Promise.resolve(Notification.permission);
  }
  
  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'error';
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - New preferences
 * @returns {Object} Updated preferences
 */
export const updateNotificationPreferences = (preferences = {}) => {
  notificationPreferences = {
    ...notificationPreferences,
    ...preferences
  };
  
  return { ...notificationPreferences };
};

/**
 * Get current notification preferences
 * @returns {Object} Current preferences
 */
export const getNotificationPreferences = () => {
  return { ...notificationPreferences };
};

/**
 * Check if notifications should be shown based on preferences and window state
 * @returns {boolean} Whether notifications should be shown
 */
export const shouldShowNotifications = () => {
  if (!notificationPreferences.enabled) {
    return false;
  }
  
  if (notificationPreferences.showOnlyWhenHidden && document.visibilityState === 'visible') {
    return false;
  }
  
  return getNotificationPermission() === 'granted';
};

/**
 * Show a browser notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} options.icon - URL to notification icon
 * @param {string} options.tag - Unique tag for the notification
 * @param {Object} options.data - Additional data to include with notification
 * @param {Function} options.onClick - Function to call when notification is clicked
 * @param {boolean} options.requireInteraction - Whether notification requires interaction to dismiss
 * @param {Array} options.actions - Actions for the notification (if supported)
 * @returns {Notification|null} Notification object or null if not supported/permitted
 */
export const showBrowserNotification = (options) => {
  const { 
    title, 
    body, 
    icon, 
    tag, 
    data, 
    onClick,
    requireInteraction = notificationPreferences.requireInteraction,
    actions = []
  } = options;
  
  // Check if we should show notifications based on preferences
  if (!shouldShowNotifications()) {
    return null;
  }
  
  try {
    // Create notification
    const notification = new Notification(title, {
      body,
      icon,
      tag,
      data,
      requireInteraction,
      silent: false, // Use system sound
      actions: actions.slice(0, 2) // Most browsers support max 2 actions
    });
    
    // Set up click handler
    if (onClick && typeof onClick === 'function') {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus(); // Focus the window
        onClick(notification.data); // Call the click handler with data
        notification.close(); // Close the notification
      };
    } else {
      // Default click handler
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus(); // Focus the window
        notification.close(); // Close the notification
      };
    }
    
    // Handle notification close
    notification.onclose = () => {
      // You can track notification close events here
    };
    
    return notification;
  } catch (error) {
    console.error('Error showing browser notification:', error);
    return null;
  }
};

/**
 * Show a test notification
 * @returns {Notification|null} Test notification
 */
export const showTestNotification = () => {
  return showBrowserNotification({
    title: 'Test Notification',
    body: 'This is a test notification to verify your settings.',
    icon: '/favicon.ico',
    tag: 'test-notification',
    data: { type: 'test' },
    requireInteraction: false
  });
};

/**
 * Close all notifications with a specific tag
 * @param {string} tag - Tag to match notifications
 */
export const closeNotificationsByTag = (tag) => {
  if (!areBrowserNotificationsSupported() || !navigator.serviceWorker) {
    return;
  }
  
  // If service worker is available, use it to close notifications
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.getNotifications({ tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    });
  }
};

/**
 * Close all notifications
 */
export const closeAllNotifications = () => {
  if (!areBrowserNotificationsSupported() || !navigator.serviceWorker) {
    return;
  }
  
  // If service worker is available, use it to close all notifications
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    });
  }
};

/**
 * Create a notification badge for the app (favicon)
 * @param {number} count - Number to display on badge
 */
export const setNotificationBadge = (count) => {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      navigator.setAppBadge(count).catch(error => {
        console.error('Error setting app badge:', error);
      });
    } else {
      navigator.clearAppBadge().catch(error => {
        console.error('Error clearing app badge:', error);
      });
    }
  }
};

/**
 * Check if notification badges are supported
 * @returns {boolean} Whether badges are supported
 */
export const areNotificationBadgesSupported = () => {
  return 'setAppBadge' in navigator;
};

export default {
  areBrowserNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  updateNotificationPreferences,
  getNotificationPreferences,
  shouldShowNotifications,
  showBrowserNotification,
  showTestNotification,
  closeNotificationsByTag,
  closeAllNotifications,
  setNotificationBadge,
  areNotificationBadgesSupported
};
