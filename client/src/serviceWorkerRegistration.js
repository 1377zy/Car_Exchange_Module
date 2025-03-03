/**
 * Service Worker Registration
 * This file handles the registration of the service worker for offline support and notifications
 */

// Check if the service worker is supported in this browser
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

/**
 * Register the service worker
 * @param {Object} config Configuration options
 */
export function register(config = {}) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    // Our service worker won't work if PUBLIC_URL is on a different origin
    // from what our page is served on. This might happen if a CDN is used to
    // serve assets; see https://github.com/facebook/create-react-app/issues/2374
    if (publicUrl.origin !== window.location.origin) {
      console.warn('Service worker registration skipped; different origin');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Check if a service worker still exists or not
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost
        navigator.serviceWorker.ready.then(() => {
          console.log('This web app is being served cache-first by a service worker');
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  } else {
    console.log('Service Worker is not supported in this environment');
  }
}

/**
 * Register a valid service worker
 * @param {string} swUrl Service worker URL
 * @param {Object} config Configuration options
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Successfully registered
      console.log('Service Worker registered successfully');
      
      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('New content is available and will be used when all tabs for this page are closed');

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
      
      // Subscribe to push notifications if supported
      if ('PushManager' in window) {
        console.log('Push notifications are supported');
        
        // We'll implement push subscription in the notification context
      }
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

/**
 * Check if a service worker is valid
 * @param {string} swUrl Service worker URL
 * @param {Object} config Configuration options
 */
function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode');
    });
}

/**
 * Unregister the service worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Error unregistering service worker:', error);
      });
  }
}

/**
 * Subscribe to push notifications
 * @param {ServiceWorkerRegistration} registration Service worker registration
 * @param {string} applicationServerKey VAPID public key
 * @returns {Promise<PushSubscription>} Push subscription
 */
export async function subscribeToPushNotifications(registration, applicationServerKey) {
  try {
    // Check if push manager is supported
    if (!('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser');
      return null;
    }
    
    // Get existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If already subscribed, return the subscription
    if (subscription) {
      return subscription;
    }
    
    // Otherwise, create a new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Must be true for Chrome
      applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
    });
    
    console.log('User is subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} Success status
 */
export async function unsubscribeFromPushNotifications() {
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get existing subscription
    const subscription = await registration.pushManager.getSubscription();
    
    // If no subscription, return success
    if (!subscription) {
      return true;
    }
    
    // Unsubscribe
    const result = await subscription.unsubscribe();
    console.log('User is unsubscribed from push notifications');
    return result;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Convert base64 string to Uint8Array for applicationServerKey
 * @param {string} base64String Base64 encoded string
 * @returns {Uint8Array} Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
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
}
