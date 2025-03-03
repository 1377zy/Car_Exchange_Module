import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  Badge, 
  IconButton, 
  Popover, 
  Box, 
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { NotificationContext } from '../../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';
import './NotificationBell.css';

/**
 * NotificationBell Component
 * Displays a bell icon with unread count and notification panel
 */
const NotificationBell = () => {
  const { 
    unreadCount, 
    notifications, 
    loadingPreferences, 
    browserPermission,
    requestBrowserPermission
  } = useContext(NotificationContext);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [animate, setAnimate] = useState(false);
  const bellRef = useRef(null);
  
  // Handle bell click
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle panel close
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Check if panel is open
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;
  
  // Add animation when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimate(true);
      const timeout = setTimeout(() => {
        setAnimate(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [unreadCount]);
  
  // Handle browser permission request
  const handleRequestPermission = async (event) => {
    event.stopPropagation();
    await requestBrowserPermission();
  };
  
  if (loadingPreferences) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  return (
    <div className="notification-bell-container">
      <Badge
        badgeContent={unreadCount}
        color="error"
        max={99}
        overlap="circular"
        className={animate ? 'notification-bell-animate' : ''}
      >
        <IconButton
          ref={bellRef}
          aria-label="Notifications"
          aria-describedby={id}
          onClick={handleClick}
          color="inherit"
          className="notification-bell-button"
        >
          {unreadCount > 0 ? (
            <NotificationsActiveIcon className="notification-bell-icon active" />
          ) : (
            <NotificationsIcon className="notification-bell-icon" />
          )}
        </IconButton>
      </Badge>
      
      {browserPermission !== 'granted' && (
        <Tooltip title="Enable browser notifications" placement="bottom">
          <IconButton
            size="small"
            color="primary"
            onClick={handleRequestPermission}
            className="notification-permission-button"
          >
            <NotificationsOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        className="notification-popover"
      >
        <NotificationPanel onClose={handleClose} />
      </Popover>
    </div>
  );
};

export default NotificationBell;
