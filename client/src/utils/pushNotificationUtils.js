/**
 * Push Notification Utilities
 * Handles service worker registration and push notification subscription
 */

import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || '';

// Store push notification preferences
let pushPreferences = {
  enabled: true,
  topics: {
    leads: true,
    appointments: true,
    vehicles: true,
    communications: true,
    system: true
  }
};

/**
 * Check if the browser supports push notifications
 * @returns {boolean} Whether push notifications are supported
 */
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Update push notification preferences
 * @param {Object} preferences - New preferences
 * @returns {Object} Updated preferences
 */
export const updatePushPreferences = (preferences = {}) => {
  pushPreferences = {
    ...pushPreferences,
    ...preferences
  };
  
  return { ...pushPreferences };
};

/**
 * Get current push notification preferences
 * @returns {Object} Current preferences
 */
export const getPushPreferences = () => {
  return { ...pushPreferences };
};

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration>} Service worker registration
 */
export const registerServiceWorker = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  try {
    // Check if service worker is already registered
    if (navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker already registered with scope:', registration.scope);
      return registration;
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

/**
 * Convert a base64 string to a Uint8Array
 * @param {string} base64String - Base64 string to convert
 * @returns {Uint8Array} Converted array
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Subscribe to push notifications
 * @param {string} publicVapidKey - VAPID public key
 * @returns {Promise<PushSubscription>} Push subscription
 */
export const subscribeToPushNotifications = async (publicVapidKey) => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  try {
    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.ready;
    
    // Get existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    
    // If already subscribed, return the existing subscription
    if (existingSubscription) {
      return existingSubscription;
    }
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // Send the subscription to the server
    await axios.post(`${API_URL}/api/notifications/push-subscription`, { 
      subscription,
      preferences: pushPreferences
    });
    
    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} Whether unsubscription was successful
 */
export const unsubscribeFromPushNotifications = async () => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Send unsubscribe request to server
      await axios.delete(`${API_URL}/api/notifications/push-subscription`, {
        data: { subscription }
      });
      
      // Unsubscribe on the client side
      await subscription.unsubscribe();
      console.log('Successfully unsubscribed from push notifications');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    throw error;
  }
};

/**
 * Get the current push notification subscription
 * @returns {Promise<PushSubscription|null>} Push subscription or null
 */
export const getPushSubscription = async () => {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
};

/**
 * Check if the user is subscribed to push notifications
 * @returns {Promise<boolean>} Whether user is subscribed
 */
export const isPushNotificationSubscribed = async () => {
  const subscription = await getPushSubscription();
  return !!subscription;
};

/**
 * Update push subscription on the server
 * @param {Object} preferences - Push notification preferences
 * @returns {Promise<boolean>} Whether update was successful
 */
export const updatePushSubscriptionPreferences = async (preferences) => {
  try {
    // Update local preferences
    updatePushPreferences(preferences);
    
    // Get current subscription
    const subscription = await getPushSubscription();
    
    if (!subscription) {
      return false;
    }
    
    // Update on server
    await axios.put(`${API_URL}/api/notifications/push-subscription`, {
      subscription,
      preferences: pushPreferences
    });
    
    return true;
  } catch (error) {
    console.error('Failed to update push subscription preferences:', error);
    return false;
  }
};

/**
 * Send a test push notification
 * @returns {Promise<boolean>} Whether test was successful
 */
export const sendTestPushNotification = async () => {
  try {
    // Check if subscribed
    const isSubscribed = await isPushNotificationSubscribed();
    
    if (!isSubscribed) {
      console.warn('Not subscribed to push notifications');
      return false;
    }
    
    // Send test notification request to server
    await axios.post(`${API_URL}/api/notifications/test-push`);
    
    return true;
  } catch (error) {
    console.error('Failed to send test push notification:', error);
    return false;
  }
};

export default {
  isPushNotificationSupported,
  updatePushPreferences,
  getPushPreferences,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  isPushNotificationSubscribed,
  updatePushSubscriptionPreferences,
  sendTestPushNotification
};
