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
  History as HistoryIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import NotificationHistory from '../components/notifications/NotificationHistory';

/**
 * NotificationHistoryPage Component
 * Displays a comprehensive history of all notifications
 */
const NotificationHistoryPage = () => {
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
        <Typography color="text.primary">History</Typography>
      </Breadcrumbs>
      
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <HistoryIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Notification History
        </Typography>
      </Box>
      
      {/* Description */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Typography variant="body1">
          View and manage your notification history. Use the filters to find specific notifications
          or search by content. You can mark notifications as read, delete them, or export your history.
        </Typography>
      </Paper>
      
      {/* Notification History Component */}
      <NotificationHistory />
    </Container>
  );
};

export default NotificationHistoryPage;
