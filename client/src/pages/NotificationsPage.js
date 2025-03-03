import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions,
  List,
  Divider,
  Button,
  IconButton,
  Chip,
  Badge,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Timeline as AnalyticsIcon,
  Settings as SettingsIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { NotificationContext } from '../contexts/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';

/**
 * Notifications Page Component
 * Displays a dashboard of user notifications with links to detailed views
 */
const NotificationsPage = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAllAsRead, 
    deleteNotification 
  } = useContext(NotificationContext);
  
  const [activeTab, setActiveTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  // Filter notifications by read status
  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 5);
  
  // Calculate notification stats
  const notificationStats = {
    total: notifications.length,
    unread: unreadNotifications.length,
    read: notifications.length - unreadNotifications.length,
    highPriority: notifications.filter(n => n.priority === 'high').length,
    normalPriority: notifications.filter(n => n.priority === 'normal').length,
    lowPriority: notifications.filter(n => n.priority === 'low').length
  };
  
  // Group notifications by type
  const notificationsByType = {
    lead: notifications.filter(n => n.type === 'lead').length,
    appointment: notifications.filter(n => n.type === 'appointment').length,
    vehicle: notifications.filter(n => n.type === 'vehicle').length,
    communication: notifications.filter(n => n.type === 'communication').length,
    system: notifications.filter(n => n.type === 'system').length
  };
  
  return (
    <Container maxWidth="lg">
      {/* Page Header */}
      <Box sx={{ mb: 4, mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Notifications
          </Typography>
        </Box>
        
        <Box>
          <IconButton 
            color="primary" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            sx={{ mr: 1 }}
          >
            {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
          
          <Button
            variant="outlined"
            startIcon={<MarkReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadNotifications.length === 0}
            sx={{ mr: 1 }}
          >
            Mark All Read
          </Button>
        </Box>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Notification Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="div" color="text.primary">
                {notificationStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Notifications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="div" color="error.main">
                {notificationStats.unread}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unread Notifications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="div" color="success.main">
                {notificationStats.read}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Read Notifications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="div" color="warning.main">
                {notificationStats.highPriority}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Recent Notifications */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Recent Notifications" 
              action={
                <Button
                  component={RouterLink}
                  to="/notifications/history"
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                >
                  View All
                </Button>
              }
            />
            
            <Divider />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentNotifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No notifications found
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {recentNotifications.map((notification, index) => (
                  <React.Fragment key={notification._id}>
                    <NotificationItem notification={notification} />
                    {index < recentNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
            
            <Divider />
            
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                fullWidth
                component={RouterLink}
                to="/notifications/history"
                endIcon={<ArrowForwardIcon />}
              >
                View All Notifications
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Quick Links */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Notification Management" />
            
            <Divider />
            
            <List>
              <Button
                fullWidth
                component={RouterLink}
                to="/notifications/history"
                startIcon={<HistoryIcon />}
                sx={{ p: 2, justifyContent: 'flex-start', textAlign: 'left' }}
              >
                Notification History
              </Button>
              
              <Divider />
              
              <Button
                fullWidth
                component={RouterLink}
                to="/notifications/analytics"
                startIcon={<AnalyticsIcon />}
                sx={{ p: 2, justifyContent: 'flex-start', textAlign: 'left' }}
              >
                Notification Analytics
              </Button>
              
              <Divider />
              
              <Button
                fullWidth
                component={RouterLink}
                to="/settings/notifications"
                startIcon={<SettingsIcon />}
                sx={{ p: 2, justifyContent: 'flex-start', textAlign: 'left' }}
              >
                Notification Settings
              </Button>
            </List>
          </Card>
          
          {/* Notification Types */}
          <Card>
            <CardHeader title="Notification Types" />
            
            <Divider />
            
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Chip 
                    label={`Leads: ${notificationsByType.lead}`}
                    color="primary"
                    variant="outlined"
                    sx={{ width: '100%', mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Chip 
                    label={`Appointments: ${notificationsByType.appointment}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ width: '100%', mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Chip 
                    label={`Vehicles: ${notificationsByType.vehicle}`}
                    color="success"
                    variant="outlined"
                    sx={{ width: '100%', mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Chip 
                    label={`Communications: ${notificationsByType.communication}`}
                    color="warning"
                    variant="outlined"
                    sx={{ width: '100%', mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Chip 
                    label={`System: ${notificationsByType.system}`}
                    color="info"
                    variant="outlined"
                    sx={{ width: '100%', mb: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
            
            <Divider />
            
            <CardActions>
              <Button
                fullWidth
                component={RouterLink}
                to="/notifications/history"
                startIcon={<FilterIcon />}
              >
                Filter by Type
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotificationsPage;
