import React from 'react';
import PropTypes from 'prop-types';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationBadge.css';

/**
 * NotificationBadge Component
 * Displays a badge with the number of unread notifications
 * Can be attached to any element to show notification count
 */
const NotificationBadge = ({ 
  count, 
  showZero = false, 
  max = 99, 
  className = '', 
  style = {},
  onClick,
  children 
}) => {
  const { unreadCount } = useNotifications();
  
  // Use provided count or get from context
  const displayCount = count !== undefined ? count : unreadCount;
  
  // Don't render if count is 0 and showZero is false
  if (displayCount === 0 && !showZero) {
    return children || null;
  }
  
  // Format the count for display
  const formattedCount = displayCount > max ? `${max}+` : displayCount;
  
  return (
    <div className={`notification-badge-container ${className}`} style={style} onClick={onClick}>
      {children}
      <span className="notification-badge">
        {formattedCount}
      </span>
    </div>
  );
};

NotificationBadge.propTypes = {
  count: PropTypes.number,
  showZero: PropTypes.bool,
  max: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  children: PropTypes.node
};

export default NotificationBadge;
