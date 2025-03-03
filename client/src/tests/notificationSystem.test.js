/**
 * Notification System Tests
 * 
 * This file contains tests for the notification system components and functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import { NotificationBell, NotificationPanel, NotificationItem, NotificationPreferences } from '../components/notifications';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';

// Mock services
jest.mock('../services/socketService');
jest.mock('../services/notificationService');

// Mock audio utils
jest.mock('../utils/audioUtils', () => ({
  playNotificationSound: jest.fn(),
  setNotificationVolume: jest.fn(),
  isAudioSupported: jest.fn().mockReturnValue(true)
}));

// Sample notification data
const sampleNotifications = [
  {
    _id: '1',
    type: 'lead',
    title: 'New Lead Assigned',
    message: 'You have been assigned a new lead: John Doe',
    priority: 'high',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/leads/123',
    data: { leadId: '123', leadName: 'John Doe' }
  },
  {
    _id: '2',
    type: 'appointment',
    title: 'Appointment Reminder',
    message: 'You have an appointment with Sarah Smith in 30 minutes',
    priority: 'normal',
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    link: '/appointments/456',
    data: { appointmentId: '456', customerName: 'Sarah Smith' }
  },
  {
    _id: '3',
    type: 'vehicle',
    title: 'Vehicle Interest',
    message: 'A customer is interested in 2023 Toyota Camry',
    priority: 'low',
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    link: '/vehicles/789',
    data: { vehicleId: '789', vehicleName: '2023 Toyota Camry' }
  }
];

// Sample notification preferences
const samplePreferences = {
  email: {
    enabled: true,
    types: {
      leads: true,
      appointments: true,
      vehicles: false,
      communications: true,
      system: true
    }
  },
  sms: {
    enabled: false,
    types: {
      leads: false,
      appointments: true,
      vehicles: false,
      communications: false,
      system: false
    }
  },
  browser: {
    enabled: true,
    types: {
      leads: true,
      appointments: true,
      vehicles: true,
      communications: true,
      system: true
    }
  },
  sound: {
    enabled: true,
    types: {
      leads: true,
      appointments: true,
      vehicles: false,
      communications: true,
      system: false
    }
  }
};

// Setup mock implementations
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Mock notification service
  notificationService.fetchNotifications.mockResolvedValue(sampleNotifications);
  notificationService.markAsRead.mockResolvedValue({ success: true });
  notificationService.markAllAsRead.mockResolvedValue({ success: true });
  notificationService.deleteNotification.mockResolvedValue({ success: true });
  notificationService.clearAllNotifications.mockResolvedValue({ success: true });
  notificationService.fetchNotificationPreferences.mockResolvedValue(samplePreferences);
  notificationService.updateNotificationPreferences.mockResolvedValue({ success: true });
  
  // Mock socket service
  socketService.isConnected.mockReturnValue(true);
  socketService.addEventListener.mockImplementation((event, callback) => {
    // Store callback for testing
    socketService.callbacks = socketService.callbacks || {};
    socketService.callbacks[event] = callback;
    return jest.fn(); // Return a mock remove listener function
  });
});

// Helper function to render components with context
const renderWithContext = (component) => {
  return render(
    <NotificationProvider>
      {component}
    </NotificationProvider>
  );
};

describe('NotificationBell Component', () => {
  test('renders with correct unread count', async () => {
    renderWithContext(<NotificationBell />);
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalled();
    });
    
    // Check unread count (2 unread notifications in sample data)
    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveTextContent('2');
  });
  
  test('opens notification panel on click', async () => {
    renderWithContext(<NotificationBell />);
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalled();
    });
    
    // Click the bell
    fireEvent.click(screen.getByTestId('notification-bell-button'));
    
    // Check if panel is opened
    await waitFor(() => {
      expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    });
  });
});

describe('NotificationPanel Component', () => {
  test('displays notifications correctly', async () => {
    renderWithContext(<NotificationPanel isOpen={true} onClose={jest.fn()} />);
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalled();
    });
    
    // Check if notifications are displayed
    expect(screen.getByText('New Lead Assigned')).toBeInTheDocument();
    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Interest')).toBeInTheDocument();
  });
  
  test('filters notifications by type', async () => {
    renderWithContext(<NotificationPanel isOpen={true} onClose={jest.fn()} />);
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalled();
    });
    
    // Click on lead filter
    fireEvent.click(screen.getByTestId('filter-lead'));
    
    // Check if only lead notification is displayed
    expect(screen.getByText('New Lead Assigned')).toBeInTheDocument();
    expect(screen.queryByText('Appointment Reminder')).not.toBeInTheDocument();
    expect(screen.queryByText('Vehicle Interest')).not.toBeInTheDocument();
  });
  
  test('marks all as read', async () => {
    renderWithContext(<NotificationPanel isOpen={true} onClose={jest.fn()} />);
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalled();
    });
    
    // Click mark all as read
    fireEvent.click(screen.getByText('Mark all as read'));
    
    // Check if service was called
    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });
});

describe('NotificationItem Component', () => {
  const mockNotification = sampleNotifications[0];
  
  test('displays notification content correctly', () => {
    render(
      <NotificationItem 
        notification={mockNotification}
        onMarkAsRead={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('New Lead Assigned')).toBeInTheDocument();
    expect(screen.getByText('You have been assigned a new lead: John Doe')).toBeInTheDocument();
  });
  
  test('calls onMarkAsRead when mark as read button is clicked', () => {
    const mockMarkAsRead = jest.fn();
    
    render(
      <NotificationItem 
        notification={mockNotification}
        onMarkAsRead={mockMarkAsRead}
        onDelete={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByTestId('mark-read-button'));
    expect(mockMarkAsRead).toHaveBeenCalledWith(mockNotification._id);
  });
  
  test('calls onDelete when delete button is clicked', () => {
    const mockDelete = jest.fn();
    
    render(
      <NotificationItem 
        notification={mockNotification}
        onMarkAsRead={jest.fn()}
        onDelete={mockDelete}
      />
    );
    
    fireEvent.click(screen.getByTestId('delete-button'));
    expect(mockDelete).toHaveBeenCalledWith(mockNotification._id);
  });
});

describe('NotificationPreferences Component', () => {
  test('displays preferences correctly', async () => {
    renderWithContext(<NotificationPreferences isOpen={true} onClose={jest.fn()} />);
    
    // Wait for preferences to load
    await waitFor(() => {
      expect(notificationService.fetchNotificationPreferences).toHaveBeenCalled();
    });
    
    // Check if preferences are displayed
    expect(screen.getByTestId('email-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('sms-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('browser-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('sound-toggle')).toBeInTheDocument();
  });
  
  test('updates preferences when toggles are clicked', async () => {
    renderWithContext(<NotificationPreferences isOpen={true} onClose={jest.fn()} />);
    
    // Wait for preferences to load
    await waitFor(() => {
      expect(notificationService.fetchNotificationPreferences).toHaveBeenCalled();
    });
    
    // Toggle SMS notifications
    fireEvent.click(screen.getByTestId('sms-toggle'));
    
    // Click save button
    fireEvent.click(screen.getByText('Save Preferences'));
    
    // Check if service was called with updated preferences
    await waitFor(() => {
      expect(notificationService.updateNotificationPreferences).toHaveBeenCalled();
      const updatedPreferences = notificationService.updateNotificationPreferences.mock.calls[0][0];
      expect(updatedPreferences.sms.enabled).toBe(true);
    });
  });
});

describe('Real-time Notification Handling', () => {
  test('handles new notifications via socket', async () => {
    renderWithContext(<NotificationBell />);
    
    // Wait for notifications to load and socket listeners to be set up
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalled();
      expect(socketService.addEventListener).toHaveBeenCalledWith('notification:new', expect.any(Function));
    });
    
    // Simulate receiving a new notification via socket
    const newNotification = {
      _id: '4',
      type: 'communication',
      title: 'New Message',
      message: 'You received a new message',
      priority: 'normal',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    // Call the stored callback
    socketService.callbacks['notification:new'](newNotification);
    
    // Check if unread count is updated
    await waitFor(() => {
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveTextContent('3'); // 2 existing + 1 new
    });
  });
});

describe('Notification Sound Handling', () => {
  test('plays sound when receiving high priority notification', async () => {
    const { playNotificationSound } = require('../utils/audioUtils');
    
    renderWithContext(<NotificationBell />);
    
    // Wait for notifications to load and socket listeners to be set up
    await waitFor(() => {
      expect(socketService.addEventListener).toHaveBeenCalledWith('notification:new', expect.any(Function));
    });
    
    // Simulate receiving a high priority notification
    const highPriorityNotification = {
      _id: '5',
      type: 'lead',
      title: 'Urgent Lead',
      message: 'Urgent lead requires immediate attention',
      priority: 'high',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    // Call the stored callback
    socketService.callbacks['notification:new'](highPriorityNotification);
    
    // Check if sound was played with high priority
    expect(playNotificationSound).toHaveBeenCalledWith('high');
  });
});
