# Real-Time Notification System

The notification system provides real-time updates to users about important events in the Car Exchange Module. It uses Socket.io for real-time communication and supports multiple notification types, priorities, and delivery methods.

## Features

- **Real-time notifications** via Socket.io
- **Multiple notification types**: leads, appointments, vehicles, communications, system
- **Priority levels**: high, normal, low
- **Delivery methods**: in-app, browser notifications, email, SMS
- **Sound alerts** for different priority levels
- **Notification preferences** customization
- **Cross-device synchronization** for read status and preferences
- **Filtering and sorting** of notifications
- **Mark as read/unread** functionality
- **Batch operations** for multiple notifications

## Components

### NotificationBell

A bell icon component that displays the unread notification count and provides access to the notification panel.

```jsx
import { NotificationBell } from './components/notifications';

// In your header or navigation component
<NotificationBell />
```

### NotificationPanel

A panel that displays a list of notifications with filtering and sorting options.

### NotificationItem

A component that displays a single notification with actions (mark as read, delete).

### NotificationPreferences

A component that allows users to customize their notification preferences.

### NotificationDemo

A demo component showcasing the notification system features.

```jsx
import { NotificationDemo } from './components/notifications';

// In your route or page component
<NotificationDemo />
```

## Services

### NotificationService

Handles client-side notification management and API calls.

```javascript
import notificationService from './services/notificationService';

// Fetch notifications
const notifications = await notificationService.fetchNotifications();

// Mark as read
await notificationService.markAsRead(notificationId);

// Update preferences
await notificationService.updateNotificationPreferences(preferences);
```

### SocketService

Manages Socket.io connection and real-time events.

```javascript
import socketService from './services/socketService';

// Initialize socket
socketService.initializeSocket(API_URL);

// Add event listener
const removeListener = socketService.addEventListener('notification:new', handleNewNotification);

// Emit event
socketService.emit('notification:read', notificationId);
```

## Context

### NotificationContext

Provides notification state and methods throughout the application.

```jsx
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';

// Wrap your app with the provider
<NotificationProvider>
  <App />
</NotificationProvider>

// Use the context in your components
const MyComponent = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {/* Component content */}
    </div>
  );
};
```

## Notification Types

The system supports the following notification types:

- **Lead**: Updates about lead assignments, status changes, etc.
- **Appointment**: Reminders, scheduling, and updates for appointments
- **Vehicle**: Updates about vehicle inventory, price changes, customer interest
- **Communication**: Email and SMS communications with customers
- **System**: System-wide announcements and updates

## Customization

Users can customize their notification preferences for each delivery method:

- **Browser**: Show browser notifications (requires permission)
- **Email**: Receive email notifications
- **SMS**: Receive SMS notifications
- **Sound**: Play sound alerts for notifications

For each delivery method, users can choose which notification types they want to receive.

## Integration with Backend

The notification system integrates with the backend API through:

1. **REST API endpoints** for CRUD operations on notifications and preferences
2. **Socket.io events** for real-time updates

### API Endpoints

- `GET /api/notifications` - Get notifications with filtering and pagination
- `GET /api/notifications/:id` - Get a specific notification
- `PUT /api/notifications/:id/read` - Mark a notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete a notification
- `DELETE /api/notifications/clear-all` - Delete all notifications
- `GET /api/notifications/preferences` - Get notification preferences
- `PUT /api/notifications/preferences` - Update notification preferences

### Socket Events

- `notification:new` - New notification received
- `notification:read` - Notification marked as read
- `notification:mark_all_read` - All notifications marked as read
- `notification:preferences_updated` - Notification preferences updated

## Security

The notification system includes security features:

- **JWT authentication** for Socket.io connections
- **User-specific rooms** to ensure notifications are only sent to the intended recipients
- **Role-based access** for certain notification types
- **Validation** of all incoming data
