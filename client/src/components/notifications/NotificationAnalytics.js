import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  NotificationsActive as NotificationsIcon,
  Check as ReadIcon,
  Delete as DeletedIcon,
  Visibility as ViewedIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];
const TYPE_COLORS = {
  lead: '#0088FE',
  appointment: '#00C49F',
  vehicle: '#FFBB28',
  communication: '#FF8042',
  system: '#8884D8'
};

/**
 * NotificationAnalytics Component
 * Displays analytics and insights about notification patterns
 */
const NotificationAnalytics = () => {
  // State
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  
  // Fetch analytics on mount and when time range changes
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);
  
  // Fetch analytics from API
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/notifications/analytics', {
        params: { timeRange }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching notification analytics:', err);
      setError('Failed to load notification analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchAnalytics();
  };
  
  // Render loading state
  if (loading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Mock data for demonstration (in a real app, this would come from the API)
  const mockAnalytics = {
    summary: {
      total: 156,
      unread: 23,
      read: 133,
      highPriority: 18,
      normalPriority: 98,
      lowPriority: 40
    },
    byType: [
      { name: 'Leads', value: 42, color: TYPE_COLORS.lead },
      { name: 'Appointments', value: 35, color: TYPE_COLORS.appointment },
      { name: 'Vehicles', value: 28, color: TYPE_COLORS.vehicle },
      { name: 'Communications', value: 31, color: TYPE_COLORS.communication },
      { name: 'System', value: 20, color: TYPE_COLORS.system }
    ],
    byPriority: [
      { name: 'High', value: 18, color: '#FF6B6B' },
      { name: 'Normal', value: 98, color: '#FFBB28' },
      { name: 'Low', value: 40, color: '#00C49F' }
    ],
    byTime: [
      { name: 'Mon', total: 22, read: 18, unread: 4 },
      { name: 'Tue', total: 25, read: 20, unread: 5 },
      { name: 'Wed', total: 30, read: 24, unread: 6 },
      { name: 'Thu', total: 28, read: 22, unread: 6 },
      { name: 'Fri', total: 26, read: 20, unread: 6 },
      { name: 'Sat', total: 15, read: 12, unread: 3 },
      { name: 'Sun', total: 10, read: 7, unread: 3 }
    ],
    responseTime: {
      average: '3.5 hours',
      byType: [
        { name: 'Leads', time: 2.1 },
        { name: 'Appointments', time: 1.5 },
        { name: 'Vehicles', time: 4.2 },
        { name: 'Communications', time: 3.8 },
        { name: 'System', time: 6.0 }
      ]
    },
    engagementRate: {
      overall: '78%',
      byType: [
        { name: 'Leads', rate: 85 },
        { name: 'Appointments', rate: 92 },
        { name: 'Vehicles', rate: 72 },
        { name: 'Communications', rate: 68 },
        { name: 'System', rate: 45 }
      ]
    }
  };
  
  // Use mock data for demonstration
  const data = analytics || mockAnalytics;
  
  return (
    <Box>
      {/* Header with time range selector */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Notification Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton size="small" onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {data.summary.total}
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
              <ReadIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {data.summary.read}
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
              <ViewedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {data.summary.unread}
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
              <DeletedIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {data.summary.highPriority}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Notifications by Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Notifications by Type
              </Typography>
              <Tooltip title="Distribution of notifications by type">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.byType}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip formatter={(value) => [`${value} notifications`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Notifications by Priority */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Notifications by Priority
              </Typography>
              <Tooltip title="Distribution of notifications by priority level">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.byPriority}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip formatter={(value) => [`${value} notifications`, 'Count']} />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#8884d8">
                  {data.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Notifications by Time */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Notifications Over Time
              </Typography>
              <Tooltip title="Notification activity over the selected time period">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.byTime}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="read" name="Read" stroke="#82ca9d" />
                <Line type="monotone" dataKey="unread" name="Unread" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Response Time */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Average Response Time
              </Typography>
              <Tooltip title="Average time to read notifications by type">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="div" color="primary">
                {data.responseTime.average}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Average Response Time
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.responseTime.byType}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <ChartTooltip formatter={(value) => [`${value} hours`, 'Response Time']} />
                <Bar dataKey="time" name="Hours" fill="#8884d8">
                  {data.responseTime.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Engagement Rate */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Engagement Rate
              </Typography>
              <Tooltip title="Percentage of notifications that received user interaction">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="div" color="primary">
                {data.engagementRate.overall}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Engagement Rate
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.engagementRate.byType}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <ChartTooltip formatter={(value) => [`${value}%`, 'Engagement Rate']} />
                <Bar dataKey="rate" name="Rate (%)" fill="#8884d8">
                  {data.engagementRate.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationAnalytics;
