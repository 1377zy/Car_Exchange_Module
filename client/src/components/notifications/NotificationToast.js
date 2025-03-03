import React, { useEffect } from 'react';
import { Toast, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BsBell, BsCalendarEvent, BsEnvelope, BsChatDots, BsCar, BsGear } from 'react-icons/bs';
import { useNotifications } from '../../contexts/NotificationContext';
import { playNotificationSound } from '../../utils/notificationSoundUtils';
import { showBrowserNotification } from '../../utils/browserNotificationUtils';

import './NotificationToast.css';

/**
 * Notification Toast Component
 * Displays a toast notification for real-time alerts
 */
const NotificationToast = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const { preferences } = useNotifications();
  
  // If no notification, don't render
  if (!notification) return null;
  
  // Format time ago
  const timeAgo = notification.createdAt 
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) 
    : '';
  
  // Play sound and show browser notification on mount
  useEffect(() => {
    const handleNotificationEffects = async () => {
      // Play sound if enabled in preferences
      if (preferences?.soundNotifications) {
        await playNotificationSound(notification.priority || 'normal', {
          volume: preferences.soundVolume || 0.7
        });
      }
      
      // Show browser notification if enabled in preferences
      if (preferences?.browserNotifications) {
        const notificationType = notification.type;
        const shouldShowForType = preferences.browser?.types?.[notificationType];
        
        if (shouldShowForType) {
          showBrowserNotification({
            title: notification.title,
            body: notification.message,
            icon: '/logo192.png',
            tag: `notification-${notification.id}`,
            data: {
              url: notification.link,
              notificationId: notification.id
            }
          });
        }
      }
    };
    
    handleNotificationEffects();
  }, [notification, preferences]);
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'lead':
        return <BsBell className="notification-icon lead" />;
      case 'appointment':
        return <BsCalendarEvent className="notification-icon appointment" />;
      case 'vehicle':
        return <BsCar className="notification-icon vehicle" />;
      case 'communication':
        return notification.data?.channel === 'email' 
          ? <BsEnvelope className="notification-icon communication" />
          : <BsChatDots className="notification-icon communication" />;
      case 'system':
        return <BsGear className="notification-icon system" />;
      default:
        return <BsBell className="notification-icon" />;
    }
  };
  
  // Handle click
  const handleClick = () => {
    if (notification.link) {
      navigate(notification.link);
    }
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <Toast 
      className={`notification-toast ${notification.priority || 'normal'}`}
      onClose={onClose}
      onClick={handleClick}
    >
      <Toast.Header>
        <div className="notification-toast-icon">
          {getIcon()}
        </div>
        <strong className="me-auto">{notification.title}</strong>
        <Badge 
          bg={
            notification.type === 'lead' ? 'primary' :
            notification.type === 'appointment' ? 'success' :
            notification.type === 'vehicle' ? 'warning' :
            notification.type === 'communication' ? 'info' :
            notification.type === 'system' ? 'secondary' : 'dark'
          }
          className="type-badge"
        >
          {notification.type}
        </Badge>
        <small className="ms-2">{timeAgo}</small>
      </Toast.Header>
      <Toast.Body>
        <p className="notification-message">{notification.message}</p>
        {notification.link && (
          <div className="notification-link">
            Click to view details
          </div>
        )}
      </Toast.Body>
    </Toast>
  );
};

export default NotificationToast;
