/**
 * Car Exchange Module Service Worker
 * Handles background notifications and caching
 */

const CACHE_NAME = 'car-exchange-cache-v1';
const OFFLINE_URL = '/offline.html';

// URLs to cache for offline access
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.chunk.css',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/media/logo.png',
  '/favicon.ico',
  '/manifest.json',
  '/sounds/notification-normal.mp3',
  '/sounds/notification-high.mp3',
  '/sounds/notification-low.mp3'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Cache assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache install error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Ensure service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip browser-sync and socket.io requests
  if (event.request.url.includes('browser-sync') || 
      event.request.url.includes('socket.io')) {
    return;
  }
  
  // Network first, falling back to cache strategy for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              
              // For API requests that fail and aren't in cache, return a basic JSON response
              if (event.request.headers.get('accept').includes('application/json')) {
                return new Response(
                  JSON.stringify({ error: 'You are offline' }),
                  {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                      'Content-Type': 'application/json'
                    })
                  }
                );
              }
              
              // For other failed requests, show offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Cache first, falling back to network strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Not in cache, get from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the response for future
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // Network failed, show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return nothing for other requests
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (error) {
    // If not JSON, try to get as text
    notificationData = {
      title: 'New Notification',
      body: event.data ? event.data.text() : 'No details available',
      icon: '/favicon.ico'
    };
  }
  
  const title = notificationData.title || 'Car Exchange Module';
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/favicon.ico',
    badge: '/notification-badge.png',
    tag: notificationData.tag || 'default',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [],
    // Add vibration pattern for mobile devices
    vibrate: notificationData.vibrate || [200, 100, 200],
    // Add notification image if provided
    image: notificationData.image || null,
    // Add notification timestamp
    timestamp: notificationData.timestamp || Date.now()
  };
  
  // Add notification actions based on type
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'lead':
        options.actions = [
          { action: 'view_lead', title: 'View Lead' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        break;
      case 'appointment':
        options.actions = [
          { action: 'view_appointment', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        break;
      case 'vehicle':
        options.actions = [
          { action: 'view_vehicle', title: 'View Vehicle' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        break;
      case 'communication':
        options.actions = [
          { action: 'view_communication', title: 'View Message' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        break;
      case 'system':
        options.actions = [
          { action: 'view_details', title: 'Details' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
        break;
    }
  }
  
  // Show notification
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        // Broadcast to all clients that a notification was shown
        return self.clients.matchAll({ type: 'window' })
          .then(clients => {
            if (clients && clients.length) {
              clients.forEach(client => {
                client.postMessage({
                  type: 'NOTIFICATION_DISPLAYED',
                  notification: {
                    id: notificationData.id,
                    title,
                    body: options.body,
                    timestamp: options.timestamp,
                    type: notificationData.type
                  }
                });
              });
            }
          });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get notification data
  const notificationData = event.notification.data;
  
  // Handle notification click action
  let url = '/';
  let action = event.action;
  
  // If notification has a specific URL, use it
  if (notificationData && notificationData.url) {
    url = notificationData.url;
  } else if (action) {
    // Handle specific actions
    switch (action) {
      case 'view_lead':
        url = `/leads/${notificationData.leadId}`;
        break;
      case 'view_appointment':
        url = `/appointments/${notificationData.appointmentId}`;
        break;
      case 'view_vehicle':
        url = `/vehicles/${notificationData.vehicleId}`;
        break;
      case 'view_communication':
        url = `/communications/${notificationData.communicationId}`;
        break;
      case 'view_details':
        url = notificationData.link || '/notifications';
        break;
      case 'dismiss':
        // Just dismiss the notification without navigation
        return;
      default:
        // Use the link from notification data if available
        url = notificationData.link || '/';
    }
  } else if (notificationData && notificationData.link) {
    // Use the link from notification data
    url = notificationData.link;
  }
  
  // Broadcast to all clients that a notification was clicked
  const broadcastClickEvent = self.clients.matchAll({ type: 'window' })
    .then(clients => {
      if (clients && clients.length) {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification: {
              id: notificationData.id,
              action: action || 'default'
            }
          });
        });
      }
    });
  
  // Open the URL
  event.waitUntil(
    Promise.all([
      broadcastClickEvent,
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    ])
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  // You can track notification close events here if needed
  const notificationData = event.notification.data;
  
  // Broadcast to all clients that a notification was closed
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        if (clients && clients.length && notificationData && notificationData.id) {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_CLOSED',
              notification: {
                id: notificationData.id
              }
            });
          });
          
          // Example: Send analytics data about closed notifications
          console.log(`Notification ${notificationData.id} was closed without being clicked`);
        }
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
