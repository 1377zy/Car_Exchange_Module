import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  DirectionsCar as CarIcon,
  Email as EmailIcon,
  Notifications as NotificationIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  MarkChatRead as MarkReadIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { NotificationContext } from '../../contexts/NotificationContext';
import './NotificationItem.css';

/**
 * NotificationItem Component
 * Displays a single notification with actions
 */
const NotificationItem = ({ notification }) => {
  const { markAsRead, deleteNotification } = useContext(NotificationContext);
  const navigate = useNavigate();
  
  // Format date
  const formattedDate = notification.createdAt 
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : 'recently';
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'lead':
        return <PersonIcon />;
      case 'appointment':
        return <EventIcon />;
      case 'vehicle':
        return <CarIcon />;
      case 'communication':
        return <EmailIcon />;
      default:
        return <NotificationIcon />;
    }
  };
  
  // Get color based on notification type
  const getColor = () => {
    switch (notification.type) {
      case 'lead':
        return '#4caf50';
      case 'appointment':
        return '#2196f3';
      case 'vehicle':
        return '#ff9800';
      case 'communication':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };
  
  // Get background color based on priority
  const getBackgroundColor = () => {
    if (!notification.read) {
      return 'rgba(0, 0, 0, 0.04)';
    }
    return 'transparent';
  };
  
  // Handle click on notification
  const handleClick = () => {
    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification._id).catch(err => {
        console.error('Error marking notification as read:', err);
      });
    }
    
    // Navigate to link if present
    if (notification.action && notification.action.payload && notification.action.payload.url) {
      navigate(notification.action.payload.url);
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    
    if (!notification.read) {
      markAsRead(notification._id).catch(err => {
        console.error('Error marking notification as read:', err);
      });
    }
  };
  
  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    
    deleteNotification(notification._id).catch(err => {
      console.error('Error deleting notification:', err);
    });
  };
  
  return (
    <ListItem 
      button
      alignItems="flex-start"
      onClick={handleClick}
      className={`notification-item ${notification.priority || 'normal'}`}
      sx={{ 
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: getBackgroundColor(),
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: getColor() }}>
          {getIcon()}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
              {notification.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Box>
        }
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxHeight: '2.5em',
                lineHeight: '1.25em'
              }}
            >
              {notification.message}
            </Typography>
            
            {notification.priority === 'high' && (
              <Chip 
                label="High Priority" 
                size="small" 
                color="error" 
                variant="outlined"
                sx={{ mt: 0.5, mr: 0.5 }}
              />
            )}
            
            {notification.data && notification.data.details && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {notification.data.details}
              </Typography>
            )}
          </>
        }
      />
      
      <ListItemSecondaryAction>
        {!notification.read ? (
          <Tooltip title="Mark as read">
            <IconButton edge="end" size="small" onClick={handleMarkAsRead}>
              <MarkReadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        
        <Tooltip title="Delete">
          <IconButton edge="end" size="small" onClick={handleDelete} sx={{ ml: 1 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default NotificationItem;
