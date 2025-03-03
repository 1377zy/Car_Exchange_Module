import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, ListGroup, Spinner } from 'react-bootstrap';
import { BsBell, BsBellFill, BsCheck, BsCheckAll, BsGear } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationPreferences from './NotificationPreferences';
import NotificationBadge from './NotificationBadge';

import './NotificationCenter.css';

/**
 * Notification Center Component
 * Displays a dropdown with recent notifications and unread count
 */
const NotificationCenter = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead,
    requestBrowserNotificationPermission,
    browserNotificationPermission
  } = useNotifications();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to link if present
    if (notification.link) {
      navigate(notification.link);
    }
    
    // Close dropdown
    setShowDropdown(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    setShowPreferences(true);
    setShowDropdown(false);
  }, []);
  
  // Handle browser notification permission request
  const handleRequestPermission = useCallback(async () => {
    await requestBrowserNotificationPermission();
  }, [requestBrowserNotificationPermission]);

  // Render notification item
  const renderNotificationItem = (notification) => {
    const timeAgo = notification.createdAt 
      ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) 
      : '';
    
    return (
      <ListGroup.Item 
        key={notification.id} 
        className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.priority || 'normal'}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notification-content">
          <div className="notification-header">
            <span className="notification-title">{notification.title}</span>
            {!notification.read && <Badge bg="primary" className="unread-badge" />}
          </div>
          <p className="notification-message">{notification.message}</p>
          <div className="notification-footer">
            <small className="notification-time">{timeAgo}</small>
            {notification.type && (
              <Badge 
                bg={
                  notification.type === 'lead' ? 'primary' :
                  notification.type === 'appointment' ? 'success' :
                  notification.type === 'vehicle' ? 'warning' :
                  notification.type === 'communication' ? 'info' :
                  notification.type === 'system' ? 'secondary' : 'dark'
                }
                className="notification-type-badge"
              >
                {notification.type}
              </Badge>
            )}
          </div>
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <>
      <Dropdown 
        className="notification-center"
        show={showDropdown}
        onToggle={(isOpen) => setShowDropdown(isOpen)}
      >
        <Dropdown.Toggle variant="link" id="notification-dropdown" className="notification-toggle">
          <NotificationBadge count={unreadCount}>
            {unreadCount > 0 ? (
              <BsBellFill className="notification-icon" />
            ) : (
              <BsBell className="notification-icon" />
            )}
          </NotificationBadge>
        </Dropdown.Toggle>

        <Dropdown.Menu align="end" className="notification-menu">
          <div className="notification-header-container">
            <h6 className="notification-header-title">Notifications</h6>
            <div className="notification-actions">
              <Button 
                variant="link" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="mark-read-button"
              >
                <BsCheckAll /> Mark all read
              </Button>
              <Button 
                variant="link" 
                size="sm" 
                onClick={handleSettingsClick}
                className="settings-button"
              >
                <BsGear />
              </Button>
            </div>
          </div>

          <div className="notification-content-container">
            {loading && (
              <div className="notification-loading">
                <Spinner animation="border" size="sm" /> Loading...
              </div>
            )}

            {error && (
              <div className="notification-error">
                {error}
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="notification-empty">
                No notifications yet
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <ListGroup variant="flush" className="notification-list">
                {notifications.map(renderNotificationItem)}
              </ListGroup>
            )}
          </div>
          
          {browserNotificationPermission !== 'granted' && (
            <div className="notification-permission-prompt">
              <p>Enable browser notifications to stay updated</p>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleRequestPermission}
                disabled={browserNotificationPermission === 'denied'}
              >
                {browserNotificationPermission === 'denied' 
                  ? 'Notifications blocked' 
                  : 'Enable notifications'}
              </Button>
            </div>
          )}
          
          <Dropdown.Item 
            className="view-all-link"
            onClick={() => {
              navigate('/notifications');
              setShowDropdown(false);
            }}
          >
            View all notifications
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      
      {showPreferences && (
        <NotificationPreferences onClose={() => setShowPreferences(false)} />
      )}
    </>
  );
};

export default NotificationCenter;
