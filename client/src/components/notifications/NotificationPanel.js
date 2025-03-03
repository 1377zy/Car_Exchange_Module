import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  MarkChatRead as MarkReadIcon,
  Settings as SettingsIcon,
  DeleteSweep as DeleteIcon,
  Close as CloseIcon,
  Inbox as InboxIcon,
  Email as EmailIcon,
  Event as EventIcon,
  DirectionsCar as CarIcon,
  Message as MessageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { NotificationContext } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import NotificationPreferences from './NotificationPreferences';
import './NotificationPanel.css';

/**
 * NotificationPanel Component
 * Displays a list of notifications with actions
 */
const NotificationPanel = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    loadingPreferences,
    markAllAsRead, 
    clearAllNotifications,
    fetchNotifications
  } = useContext(NotificationContext);
  
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  const contentRef = useRef(null);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  // Handle clear all notifications
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await clearAllNotifications();
      } catch (error) {
        console.error('Error clearing all notifications:', error);
      }
    }
  };
  
  // Refresh notifications
  const refreshNotifications = async () => {
    setLoading(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, []);
  
  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'read' && !notification.read) return false;
    if (filter === 'unread' && notification.read) return false;
    
    // Filter by type
    if (activeTab !== 'all' && notification.type !== activeTab) return false;
    
    return true;
  });
  
  // Get icon for notification type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'lead':
        return <InboxIcon />;
      case 'appointment':
        return <EventIcon />;
      case 'vehicle':
        return <CarIcon />;
      case 'communication':
        return <MessageIcon />;
      case 'system':
        return <InfoIcon />;
      default:
        return <EmailIcon />;
    }
  };
  
  return (
    <Box className="notification-panel" sx={{ width: 350, maxHeight: 500 }}>
      <Box className="notification-panel-header" sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid #eee'
      }}>
        <Typography variant="h6" component="div">
          Notifications {unreadCount > 0 && <span>({unreadCount})</span>}
        </Typography>
        <Box>
          {unreadCount > 0 && (
            <IconButton
              size="small"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <MarkReadIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => setShowPreferences(true)}
            title="Notification preferences"
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClearAll}
            title="Clear all notifications"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All" value="all" />
        <Tab label="Leads" value="lead" />
        <Tab label="Appointments" value="appointment" />
        <Tab label="Vehicles" value="vehicle" />
        <Tab label="Messages" value="communication" />
      </Tabs>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        p: 1, 
        borderBottom: '1px solid #eee' 
      }}>
        <Button 
          size="small" 
          variant={filter === 'all' ? 'contained' : 'text'} 
          onClick={() => handleFilterChange('all')}
          sx={{ mx: 0.5 }}
        >
          All
        </Button>
        <Button 
          size="small" 
          variant={filter === 'unread' ? 'contained' : 'text'} 
          onClick={() => handleFilterChange('unread')}
          sx={{ mx: 0.5 }}
        >
          Unread
        </Button>
        <Button 
          size="small" 
          variant={filter === 'read' ? 'contained' : 'text'} 
          onClick={() => handleFilterChange('read')}
          sx={{ mx: 0.5 }}
        >
          Read
        </Button>
      </Box>
      
      <Box 
        ref={contentRef}
        sx={{ 
          overflowY: 'auto', 
          maxHeight: 350,
          p: 0
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications found
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredNotifications.map(notification => (
              <NotificationItem 
                key={notification._id} 
                notification={notification} 
              />
            ))}
          </List>
        )}
      </Box>
      
      <Dialog
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent dividers>
          <NotificationPreferences onClose={() => setShowPreferences(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default NotificationPanel;
