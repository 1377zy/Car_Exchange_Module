import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Page Components
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/LeadsPage';
import VehiclesPage from './pages/VehiclesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import CommunicationsPage from './pages/CommunicationsPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationHistoryPage from './pages/NotificationHistoryPage';
import NotificationAnalyticsPage from './pages/NotificationAnalyticsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationSettings from './components/notifications/NotificationSettings';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Notification Components
import NotificationToastContainer from './components/notifications/NotificationToastContainer';

// Utils
import { initializeNotifications, requestNotificationPermission } from './utils/notificationHandler';
import { preloadNotificationSounds } from './utils/audioUtils';

// Auth & Context
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

import './App.css';

const App = () => {
  // Initialize notifications
  useEffect(() => {
    // Initialize notification system
    initializeNotifications();
    
    // Preload notification sounds
    preloadNotificationSounds();
    
    // Request notification permission if not already granted
    if (Notification.permission !== 'granted') {
      // We'll wait for user interaction before requesting permission
      const handleUserInteraction = () => {
        requestNotificationPermission();
        // Remove event listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };
      
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Header />
          
          <main className="main-content">
            <Container fluid>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Private Routes */}
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
                <Route path="/vehicles" element={<PrivateRoute><VehiclesPage /></PrivateRoute>} />
                <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
                <Route path="/communications" element={<PrivateRoute><CommunicationsPage /></PrivateRoute>} />
                
                {/* Notification Routes */}
                <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                <Route path="/notifications/history" element={<PrivateRoute><NotificationHistoryPage /></PrivateRoute>} />
                <Route path="/notifications/analytics" element={<PrivateRoute><NotificationAnalyticsPage /></PrivateRoute>} />
                
                {/* Settings Routes */}
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/settings/notifications" element={<PrivateRoute><NotificationSettingsPage /></PrivateRoute>} />
                
                {/* 404 Route */}
                <Route path="*" element={<div className="text-center p-5"><h2>404 - Page Not Found</h2></div>} />
              </Routes>
            </Container>
          </main>
          
          <Footer />
          
          {/* Notification Components */}
          <NotificationToastContainer />
          
          {/* React-Toastify Container for general app notifications */}
          <ToastContainer 
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
