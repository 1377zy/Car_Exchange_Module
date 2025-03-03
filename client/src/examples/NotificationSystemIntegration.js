import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import { NotificationBell, NotificationDemo } from '../components/notifications';
import socketService from '../services/socketService';
import { playNotificationSound, preloadNotificationSounds } from '../utils/audioUtils';

/**
 * Example Header Component
 * Shows how to integrate the NotificationBell
 */
const Header = () => {
  return (
    <header className="app-header">
      <div className="app-logo">
        <h1>Car Exchange Module</h1>
      </div>
      <nav className="app-nav">
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/leads">Leads</Link></li>
          <li><Link to="/vehicles">Vehicles</Link></li>
          <li><Link to="/appointments">Appointments</Link></li>
          <li><Link to="/communications">Communications</Link></li>
          <li><Link to="/notification-demo">Notification Demo</Link></li>
        </ul>
      </nav>
      <div className="app-actions">
        <NotificationBell />
        <div className="user-profile">
          <span>John Doe</span>
          <div className="avatar">JD</div>
        </div>
      </div>
    </header>
  );
};

/**
 * Example Dashboard Component
 */
const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome to the Car Exchange Module. This is an example of how to integrate the notification system.</p>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Leads</h3>
          <p>You have 5 active leads</p>
        </div>
        <div className="dashboard-card">
          <h3>Appointments</h3>
          <p>You have 3 upcoming appointments</p>
        </div>
        <div className="dashboard-card">
          <h3>Vehicles</h3>
          <p>12 vehicles in inventory</p>
        </div>
        <div className="dashboard-card">
          <h3>Communications</h3>
          <p>2 unread messages</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Example Placeholder Components
 */
const Leads = () => <div><h2>Leads</h2><p>Leads management page</p></div>;
const Vehicles = () => <div><h2>Vehicles</h2><p>Vehicle inventory page</p></div>;
const Appointments = () => <div><h2>Appointments</h2><p>Appointments management page</p></div>;
const Communications = () => <div><h2>Communications</h2><p>Communications page</p></div>;

/**
 * Main App Component
 * Shows how to integrate the NotificationProvider
 */
const App = () => {
  useEffect(() => {
    // Initialize socket connection
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    socketService.initializeSocket(API_URL);
    
    // Preload notification sounds
    preloadNotificationSounds();
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);
  
  return (
    <NotificationProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/notification-demo" element={<NotificationDemo />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>&copy; 2023 Car Exchange Module. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </NotificationProvider>
  );
};

export default App;
