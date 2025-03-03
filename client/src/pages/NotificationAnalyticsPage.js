import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link,
  Paper,
  Divider
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  NavigateNext as NavigateNextIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import NotificationAnalytics from '../components/notifications/NotificationAnalytics';

/**
 * NotificationAnalyticsPage Component
 * Displays analytics and insights about notification patterns
 */
const NotificationAnalyticsPage = () => {
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
        <Link component={RouterLink} to="/notifications" underline="hover" color="inherit">
          Notifications
        </Link>
        <Typography color="text.primary">Analytics</Typography>
      </Breadcrumbs>
      
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <TimelineIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Notification Analytics
        </Typography>
      </Box>
      
      {/* Description */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Typography variant="body1">
          View insights and analytics about your notification patterns. Track engagement rates,
          response times, and distribution of notifications by type and priority.
        </Typography>
      </Paper>
      
      {/* Notification Analytics Component */}
      <NotificationAnalytics />
    </Container>
  );
};

export default NotificationAnalyticsPage;
