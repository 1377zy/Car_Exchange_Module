import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Paper, 
  Slider, 
  Button,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  NotificationsActive, 
  VolumeUp, 
  NotificationsNone,
  Notifications,
  PhoneAndroid,
  Email,
  Settings,
  Info,
  Refresh
} from '@mui/icons-material';
import { NotificationContext } from '../../contexts/NotificationContext';
import { 
  requestBrowserPermission, 
  checkBrowserPermission 
} from '../../utils/browserNotificationUtils';
import { 
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSupported
} from '../../utils/pushNotificationUtils';
import { testSoundNotification } from '../../utils/socketClient';
import './NotificationPreferences.css';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
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

const NotificationPreferences = () => {
  const { 
    preferences, 
    updatePreferences, 
    loadingPreferences,
    browserPermission,
    requestBrowserPermission: requestPermission,
    pushSubscription,
    subscribeToPush,
    unsubscribeFromPush
  } = useContext(NotificationContext);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [testingSounds, setTestingSounds] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  
  useEffect(() => {
    // Set initial volume from preferences
    if (preferences && preferences.soundVolume !== undefined) {
      setVolume(preferences.soundVolume);
    }
    
    // Check if push notifications are supported
    const checkPushSupport = async () => {
      const isSupported = await isPushNotificationSupported();
      setPushSupported(isSupported);
    };
    
    checkPushSupport();
  }, [preferences]);
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleToggleChange = (event) => {
    const { name, checked } = event.target;
    updatePreferences({ [name]: checked });
  };
  
  const handleTypeToggleChange = (event) => {
    const { name, checked } = event.target;
    updatePreferences({
      types: {
        ...preferences.types,
        [name]: checked
      }
    });
  };
  
  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
  };
  
  const handleVolumeChangeCommitted = () => {
    updatePreferences({ soundVolume: volume });
  };
  
  const handleTestSound = (priority = 'normal') => {
    setTestingSounds(true);
    testSoundNotification(priority, volume);
    setTimeout(() => setTestingSounds(false), 1500);
  };
  
  const handleRequestBrowserPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      updatePreferences({ browserNotifications: true });
    }
  };
  
  const handleSubscribeToPush = async () => {
    await subscribeToPush();
  };
  
  const handleUnsubscribeFromPush = async () => {
    await unsubscribeFromPush();
  };
  
  if (loadingPreferences) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!preferences) {
    return (
      <Alert severity="error">
        Failed to load notification preferences. Please try again later.
      </Alert>
    );
  }
  
  return (
    <Paper elevation={3} className="notification-preferences-container">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="notification preference tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<Notifications />} 
            label="General" 
            id="notification-tab-0" 
            aria-controls="notification-tabpanel-0" 
          />
          <Tab 
            icon={<VolumeUp />} 
            label="Sound" 
            id="notification-tab-1" 
            aria-controls="notification-tabpanel-1" 
          />
          <Tab 
            icon={<NotificationsActive />} 
            label="Browser" 
            id="notification-tab-2" 
            aria-controls="notification-tabpanel-2" 
          />
          <Tab 
            icon={<PhoneAndroid />} 
            label="Push" 
            id="notification-tab-3" 
            aria-controls="notification-tabpanel-3" 
          />
        </Tabs>
      </Box>
      
      {/* General Tab */}
      <TabPanel value={currentTab} index={0}>
        <Typography variant="h6" gutterBottom>
          Notification Channels
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email}
                  onChange={handleToggleChange}
                  name="email"
                  color="primary"
                />
              }
              label="Email Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.sms}
                  onChange={handleToggleChange}
                  name="sms"
                  color="primary"
                />
              }
              label="SMS Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.browser}
                  onChange={handleToggleChange}
                  name="browser"
                  color="primary"
                />
              }
              label="Browser Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.push}
                  onChange={handleToggleChange}
                  name="push"
                  color="primary"
                />
              }
              label="Push Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.sound}
                  onChange={handleToggleChange}
                  name="sound"
                  color="primary"
                />
              }
              label="Sound Notifications"
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Notification Types
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.types?.leads}
                  onChange={handleTypeToggleChange}
                  name="leads"
                  color="primary"
                />
              }
              label="Lead Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.types?.appointments}
                  onChange={handleTypeToggleChange}
                  name="appointments"
                  color="primary"
                />
              }
              label="Appointment Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.types?.vehicles}
                  onChange={handleTypeToggleChange}
                  name="vehicles"
                  color="primary"
                />
              }
              label="Vehicle Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.types?.communications}
                  onChange={handleTypeToggleChange}
                  name="communications"
                  color="primary"
                />
              }
              label="Communication Notifications"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.types?.system}
                  onChange={handleTypeToggleChange}
                  name="system"
                  color="primary"
                />
              }
              label="System Notifications"
            />
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Sound Tab */}
      <TabPanel value={currentTab} index={1}>
        <Typography variant="h6" gutterBottom>
          Sound Settings
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.soundNotifications}
                onChange={handleToggleChange}
                name="soundNotifications"
                color="primary"
              />
            }
            label="Enable Sound Notifications"
          />
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography id="volume-slider" gutterBottom>
            Notification Volume
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <VolumeUp />
            </Grid>
            <Grid item xs>
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                onChangeCommitted={handleVolumeChangeCommitted}
                aria-labelledby="volume-slider"
                step={0.1}
                marks
                min={0}
                max={1}
                disabled={!preferences.soundNotifications}
              />
            </Grid>
          </Grid>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Test Notification Sounds
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<NotificationsNone />}
                onClick={() => handleTestSound('low')}
                disabled={testingSounds || !preferences.soundNotifications}
              >
                Low Priority
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Notifications />}
                onClick={() => handleTestSound('normal')}
                disabled={testingSounds || !preferences.soundNotifications}
              >
                Normal Priority
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<NotificationsActive />}
                onClick={() => handleTestSound('high')}
                disabled={testingSounds || !preferences.soundNotifications}
              >
                High Priority
              </Button>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>
      
      {/* Browser Tab */}
      <TabPanel value={currentTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Browser Notification Settings
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Browser notifications allow you to receive notifications even when the app is in the background or another tab.
          </Alert>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Permission Status: <strong>{browserPermission}</strong>
            </Typography>
            
            {browserPermission !== 'granted' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Notifications />}
                onClick={handleRequestBrowserPermission}
                sx={{ mt: 1 }}
              >
                Request Permission
              </Button>
            )}
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={preferences.browserNotifications}
                onChange={handleToggleChange}
                name="browserNotifications"
                color="primary"
                disabled={browserPermission !== 'granted'}
              />
            }
            label="Enable Browser Notifications"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.requireInteraction}
                onChange={handleToggleChange}
                name="requireInteraction"
                color="primary"
                disabled={!preferences.browserNotifications || browserPermission !== 'granted'}
              />
            }
            label="Require Interaction (notifications won't auto-dismiss)"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showOnlyWhenHidden}
                onChange={handleToggleChange}
                name="showOnlyWhenHidden"
                color="primary"
                disabled={!preferences.browserNotifications || browserPermission !== 'granted'}
              />
            }
            label="Show Only When App is Hidden"
          />
        </Box>
      </TabPanel>
      
      {/* Push Tab */}
      <TabPanel value={currentTab} index={3}>
        <Typography variant="h6" gutterBottom>
          Push Notification Settings
        </Typography>
        
        {!pushSupported ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Push notifications allow you to receive notifications even when the browser is closed.
              {browserPermission !== 'granted' && (
                <strong> You must first enable browser notifications.</strong>
              )}
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Push Subscription Status: <strong>{pushSubscription ? 'Subscribed' : 'Not Subscribed'}</strong>
              </Typography>
              
              {!pushSubscription ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Notifications />}
                  onClick={handleSubscribeToPush}
                  disabled={browserPermission !== 'granted'}
                  sx={{ mt: 1 }}
                >
                  Subscribe to Push Notifications
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<NotificationsNone />}
                  onClick={handleUnsubscribeFromPush}
                  sx={{ mt: 1 }}
                >
                  Unsubscribe from Push Notifications
                </Button>
              )}
            </Box>
          </>
        )}
      </TabPanel>
    </Paper>
  );
};

export default NotificationPreferences;
