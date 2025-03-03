import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeadsToday: 0,
    totalVehicles: 0,
    upcomingAppointments: 0,
    recentCommunications: 0,
    unreadNotifications: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users/dashboard');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <div>
          <span className="me-2">Welcome, {currentUser?.firstName || 'User'}!</span>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <Row>
        {/* Leads Card */}
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Leads</Card.Title>
              <div className="d-flex justify-content-between align-items-center">
                <h3>{stats.totalLeads}</h3>
                <span className="badge bg-success">{stats.newLeadsToday} new today</span>
              </div>
              <Card.Text>
                Track and manage potential customers interested in your vehicles.
              </Card.Text>
              <Link to="/leads">
                <Button variant="primary">View Leads</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Vehicles Card */}
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Vehicles</Card.Title>
              <h3>{stats.totalVehicles}</h3>
              <Card.Text>
                Manage your inventory of vehicles available for sale or trade.
              </Card.Text>
              <Link to="/vehicles">
                <Button variant="primary">View Vehicles</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Appointments Card */}
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Appointments</Card.Title>
              <h3>{stats.upcomingAppointments}</h3>
              <Card.Text>
                Schedule and manage test drives and customer meetings.
              </Card.Text>
              <Link to="/appointments">
                <Button variant="primary">View Appointments</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Communications Card */}
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Communications</Card.Title>
              <h3>{stats.recentCommunications}</h3>
              <Card.Text>
                Track emails, calls, and messages with customers.
              </Card.Text>
              <Link to="/communications">
                <Button variant="primary">View Communications</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Notifications Card */}
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Notifications</Card.Title>
              <h3>{stats.unreadNotifications}</h3>
              <Card.Text>
                Stay updated with important alerts and notifications.
              </Card.Text>
              <Link to="/notifications">
                <Button variant="primary">View Notifications</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Settings Card */}
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Settings</Card.Title>
              <Card.Text>
                Configure your account preferences and notification settings.
              </Card.Text>
              <Link to="/settings">
                <Button variant="primary">View Settings</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
