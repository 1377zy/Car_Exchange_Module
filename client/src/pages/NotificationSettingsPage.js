import React, { useState, useContext, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  VolumeUp as VolumeIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as MobileIcon,
  NotificationsActive as BrowserIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import NotificationPreferences from '../components/notifications/NotificationPreferences';

/**
 * TabPanel component for tab content
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-settings-tabpanel-${index}`}
      aria-labelledby={`notification-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * NotificationSettingsPage Component
 * Provides a comprehensive interface for managing notification settings
 */
const NotificationSettingsPage = () => {
  const { 
    preferences, 
    updatePreferences, 
    loadingPreferences,
    browserPermission,
    requestBrowserPermission,
    pushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    refreshPreferences
  } = useContext(NotificationContext);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle refresh preferences
  const handleRefreshPreferences = async () => {
    setIsRefreshing(true);
    try {
      await refreshPreferences();
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(true);
      setErrorMessage('Failed to refresh notification preferences. Please try again.');
      console.error('Error refreshing preferences:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle save preferences
  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // Save preferences is handled by the context when updatePreferences is called
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(true);
      setErrorMessage('Failed to save notification preferences. Please try again.');
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSaveSuccess(false);
    setSaveError(false);
  };
  
  // Loading state
  if (loadingPreferences) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '50vh'
        }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading notification settings...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Error state if preferences couldn't be loaded
  if (!preferences) {
    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          sx={{ mt: 4 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefreshPreferences}
              disabled={isRefreshing}
            >
              {isRefreshing ? <CircularProgress size={20} /> : 'Retry'}
            </Button>
          }
        >
          Failed to load notification preferences. Please try again later.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mt: 2, mb: 2 }}
      >
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/settings" underline="hover" color="inherit">
          Settings
        </Link>
        <Typography color="text.primary">Notification Settings</Typography>
      </Breadcrumbs>
      
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Notification Settings
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Refresh preferences">
            <IconButton 
              onClick={handleRefreshPreferences} 
              disabled={isRefreshing || isSaving}
              color="primary"
            >
              {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSavePreferences}
            disabled={isSaving || isRefreshing}
            sx={{ ml: 1 }}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
      
      {/* Main Content */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            aria-label="notification settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<SettingsIcon />} 
              label="General" 
              id="notification-settings-tab-0" 
              aria-controls="notification-settings-tabpanel-0" 
            />
            <Tab 
              icon={<VolumeIcon />} 
              label="Sound" 
              id="notification-settings-tab-1" 
              aria-controls="notification-settings-tabpanel-1" 
            />
            <Tab 
              icon={<BrowserIcon />} 
              label="Browser" 
              id="notification-settings-tab-2" 
              aria-controls="notification-settings-tabpanel-2" 
            />
            <Tab 
              icon={<MobileIcon />} 
              label="Push" 
              id="notification-settings-tab-3" 
              aria-controls="notification-settings-tabpanel-3" 
            />
            <Tab 
              icon={<EmailIcon />} 
              label="Email" 
              id="notification-settings-tab-4" 
              aria-controls="notification-settings-tabpanel-4" 
            />
            <Tab 
              icon={<SmsIcon />} 
              label="SMS" 
              id="notification-settings-tab-5" 
              aria-controls="notification-settings-tabpanel-5" 
            />
          </Tabs>
        </Box>
        
        {/* Embed the NotificationPreferences component */}
        <NotificationPreferences />
      </Paper>
      
      {/* Help Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <HelpIcon sx={{ mr: 2, color: 'info.main' }} />
          <Typography variant="h6">Need Help?</Typography>
        </Box>
        
        <Typography variant="body2" paragraph>
          Customize how and when you receive notifications from the Car Exchange Module. 
          You can enable or disable different notification channels, set preferences for 
          specific notification types, and control notification sounds.
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader title="Browser Notifications" />
              <CardContent>
                <Typography variant="body2">
                  Browser notifications appear on your desktop even when the application is in the background.
                  You need to grant permission for these notifications to work.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => setCurrentTab(2)}
                >
                  Configure
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader title="Push Notifications" />
              <CardContent>
                <Typography variant="body2">
                  Push notifications allow you to receive updates on your mobile device even when you're not using the application.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => setCurrentTab(3)}
                >
                  Configure
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader title="Email & SMS" />
              <CardContent>
                <Typography variant="body2">
                  Configure email and SMS notifications to stay updated even when you're not online.
                  Make sure your contact information is up to date.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => setCurrentTab(4)}
                >
                  Configure
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Notification settings saved successfully!
        </Alert>
      </Snackbar>
      
      {/* Error Snackbar */}
      <Snackbar
        open={saveError}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {errorMessage || 'An error occurred. Please try again.'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettingsPage;
