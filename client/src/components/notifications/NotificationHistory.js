import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  Divider, 
  Button, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  Pagination,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  CheckCircle as MarkReadIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
  MoreVert as MoreIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { NotificationContext } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import axios from 'axios';

/**
 * NotificationHistory Component
 * Displays a comprehensive history of notifications with filtering and search
 */
const NotificationHistory = () => {
  const { markAllAsRead, deleteNotification } = useContext(NotificationContext);
  
  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    read: '',
    priority: '',
    startDate: '',
    endDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // Fetch notifications on mount and when filters/pagination change
  useEffect(() => {
    fetchNotifications();
  }, [page, limit, filters, sortBy, sortOrder, searchQuery]);
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        ...filters
      };
      
      // Add search query if present
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Make API request
      const response = await axios.get('/api/notifications/history', { params });
      
      // Update state with response data
      setNotifications(response.data.notifications);
      setTotalPages(response.data.pagination.pages);
      setTotalCount(response.data.pagination.total);
    } catch (err) {
      console.error('Error fetching notification history:', err);
      setError('Failed to load notification history. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Handle limit change
  const handleLimitChange = (event) => {
    setLimit(event.target.value);
    setPage(1); // Reset to first page when changing limit
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when changing filters
  };
  
  // Handle search
  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      setSearchQuery(event.target.value);
      setPage(1); // Reset to first page when searching
    }
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    if (event.target.value === '') {
      setSearchQuery('');
      setPage(1);
    }
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page when changing sort
  };
  
  // Handle toggle filters
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      type: '',
      read: '',
      priority: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchNotifications();
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event) => {
    setActionMenuAnchor(event.currentTarget);
  };
  
  // Handle action menu close
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read. Please try again.');
    }
    handleActionMenuClose();
  };
  
  // Handle export notifications
  const handleExportNotifications = () => {
    // Implementation for exporting notifications
    // This could download a CSV or JSON file of notifications
    alert('Export functionality would go here');
    handleActionMenuClose();
  };
  
  // Handle print notifications
  const handlePrintNotifications = () => {
    window.print();
    handleActionMenuClose();
  };
  
  // Handle toggle select mode
  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedNotifications([]);
    handleActionMenuClose();
  };
  
  // Handle select notification
  const handleSelectNotification = (notificationId) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };
  
  // Handle select all notifications
  const handleSelectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(notification => notification._id));
    }
  };
  
  // Handle delete selected notifications
  const handleDeleteSelected = async () => {
    try {
      // This would be a batch operation in a real API
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      setSelectedNotifications([]);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting selected notifications:', err);
      setError('Failed to delete selected notifications. Please try again.');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Render loading state
  if (loading && notifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ overflow: 'hidden' }}>
      {/* Header with search and filters */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search notifications..."
              variant="outlined"
              size="small"
              onChange={handleSearchChange}
              onKeyPress={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterAltIcon />}
                onClick={handleToggleFilters}
              >
                Filters
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<SortIcon />}
                onClick={handleActionMenuOpen}
              >
                Actions
              </Button>
              
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        {/* Filter panel */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="notification-type-label">Type</InputLabel>
                  <Select
                    labelId="notification-type-label"
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="lead">Leads</MenuItem>
                    <MenuItem value="appointment">Appointments</MenuItem>
                    <MenuItem value="vehicle">Vehicles</MenuItem>
                    <MenuItem value="communication">Communications</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="notification-read-label">Status</InputLabel>
                  <Select
                    labelId="notification-read-label"
                    name="read"
                    value={filters.read}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="false">Unread</MenuItem>
                    <MenuItem value="true">Read</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="notification-priority-label">Priority</InputLabel>
                  <Select
                    labelId="notification-priority-label"
                    name="priority"
                    value={filters.priority}
                    onChange={handleFilterChange}
                    label="Priority"
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Applied filters */}
        {(filters.type || filters.read || filters.priority || filters.startDate || filters.endDate) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.type && (
              <Chip 
                label={`Type: ${filters.type}`} 
                onDelete={() => handleFilterChange({ target: { name: 'type', value: '' } })}
                size="small"
              />
            )}
            
            {filters.read && (
              <Chip 
                label={`Status: ${filters.read === 'true' ? 'Read' : 'Unread'}`} 
                onDelete={() => handleFilterChange({ target: { name: 'read', value: '' } })}
                size="small"
              />
            )}
            
            {filters.priority && (
              <Chip 
                label={`Priority: ${filters.priority}`} 
                onDelete={() => handleFilterChange({ target: { name: 'priority', value: '' } })}
                size="small"
              />
            )}
            
            {filters.startDate && (
              <Chip 
                label={`From: ${filters.startDate}`} 
                onDelete={() => handleFilterChange({ target: { name: 'startDate', value: '' } })}
                size="small"
              />
            )}
            
            {filters.endDate && (
              <Chip 
                label={`To: ${filters.endDate}`} 
                onDelete={() => handleFilterChange({ target: { name: 'endDate', value: '' } })}
                size="small"
              />
            )}
          </Box>
        )}
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Results count */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {totalCount === 0 ? 'No notifications found' : `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, totalCount)} of ${totalCount} notifications`}
        </Typography>
        
        <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
          <Select
            value={limit}
            onChange={handleLimitChange}
            displayEmpty
          >
            <MenuItem value={5}>5 per page</MenuItem>
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Notification list */}
      {notifications.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No notifications found matching your criteria
          </Typography>
          <Button 
            variant="text" 
            startIcon={<RefreshIcon />} 
            onClick={handleClearFilters}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification._id}>
              <NotificationItem 
                notification={notification} 
                selectMode={selectMode}
                selected={selectedNotifications.includes(notification._id)}
                onSelect={() => handleSelectNotification(notification._id)}
              />
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
      
      {/* Action menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleMarkAllAsRead}>
          <ListItemIcon>
            <MarkReadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark All as Read</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleToggleSelectMode}>
          <ListItemIcon>
            {selectMode ? <ClearIcon fontSize="small" /> : <FilterIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{selectMode ? 'Exit Select Mode' : 'Select Notifications'}</ListItemText>
        </MenuItem>
        
        {selectMode && (
          <MenuItem onClick={handleSelectAllNotifications}>
            <ListItemIcon>
              <FilterIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
            </ListItemText>
          </MenuItem>
        )}
        
        {selectMode && selectedNotifications.length > 0 && (
          <MenuItem onClick={handleDeleteSelected}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Selected ({selectedNotifications.length})</ListItemText>
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleExportNotifications}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Notifications</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handlePrintNotifications}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Notifications</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default NotificationHistory;
