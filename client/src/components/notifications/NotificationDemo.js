import React, { useState } from 'react';
import { 
  FaBell, 
  FaUserTie, 
  FaCalendarAlt, 
  FaCar, 
  FaEnvelope, 
  FaInfoCircle 
} from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import socketService from '../../services/socketService';
import './NotificationDemo.css';

/**
 * NotificationDemo Component
 * Demonstrates the notification system with test buttons
 */
const NotificationDemo = () => {
  const { socketConnected } = useNotifications();
  const [type, setType] = useState('lead');
  const [priority, setPriority] = useState('normal');
  
  // Send a test notification
  const sendTestNotification = () => {
    if (!socketConnected) {
      alert('Socket is not connected. Cannot send test notification.');
      return;
    }
    
    // Create notification data based on type
    let title, message, link, data;
    
    switch (type) {
      case 'lead':
        title = 'New Lead Assigned';
        message = 'You have been assigned a new lead: John Doe';
        link = '/leads/demo';
        data = { leadId: 'demo', leadName: 'John Doe' };
        break;
      case 'appointment':
        title = 'Appointment Reminder';
        message = 'You have an appointment with Sarah Smith in 30 minutes';
        link = '/appointments/demo';
        data = { appointmentId: 'demo', customerName: 'Sarah Smith', time: '2:30 PM' };
        break;
      case 'vehicle':
        title = 'Vehicle Interest';
        message = 'A customer is interested in 2023 Toyota Camry';
        link = '/vehicles/demo';
        data = { vehicleId: 'demo', vehicleName: '2023 Toyota Camry' };
        break;
      case 'communication':
        title = 'New Message Received';
        message = 'You received a new message from Mike Johnson';
        link = '/communications/demo';
        data = { communicationId: 'demo', senderName: 'Mike Johnson' };
        break;
      default:
        title = 'System Notification';
        message = 'This is a test system notification';
        link = '/dashboard';
        data = { systemInfo: 'Test notification' };
    }
    
    // Emit socket event to create notification
    socketService.emit('notification:test', {
      type,
      title,
      message,
      priority,
      link,
      data
    });
  };
  
  // Get icon based on notification type
  const getTypeIcon = (notificationType) => {
    switch (notificationType) {
      case 'lead':
        return <FaUserTie />;
      case 'appointment':
        return <FaCalendarAlt />;
      case 'vehicle':
        return <FaCar />;
      case 'communication':
        return <FaEnvelope />;
      default:
        return <FaInfoCircle />;
    }
  };
  
  return (
    <div className="notification-demo">
      <div className="notification-demo-header">
        <h2>
          <FaBell /> Notification System Demo
        </h2>
        <div className={`socket-status ${socketConnected ? 'connected' : 'disconnected'}`}>
          Socket: {socketConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="notification-demo-content">
        <div className="notification-demo-section">
          <h3>Send Test Notification</h3>
          <p>Use the options below to send a test notification.</p>
          
          <div className="notification-demo-options">
            <div className="notification-demo-option">
              <label>Notification Type:</label>
              <div className="notification-type-buttons">
                <button 
                  className={`type-button ${type === 'lead' ? 'active' : ''}`}
                  onClick={() => setType('lead')}
                >
                  <FaUserTie /> Lead
                </button>
                <button 
                  className={`type-button ${type === 'appointment' ? 'active' : ''}`}
                  onClick={() => setType('appointment')}
                >
                  <FaCalendarAlt /> Appointment
                </button>
                <button 
                  className={`type-button ${type === 'vehicle' ? 'active' : ''}`}
                  onClick={() => setType('vehicle')}
                >
                  <FaCar /> Vehicle
                </button>
                <button 
                  className={`type-button ${type === 'communication' ? 'active' : ''}`}
                  onClick={() => setType('communication')}
                >
                  <FaEnvelope /> Message
                </button>
                <button 
                  className={`type-button ${type === 'system' ? 'active' : ''}`}
                  onClick={() => setType('system')}
                >
                  <FaInfoCircle /> System
                </button>
              </div>
            </div>
            
            <div className="notification-demo-option">
              <label>Priority:</label>
              <div className="notification-priority-buttons">
                <button 
                  className={`priority-button high ${priority === 'high' ? 'active' : ''}`}
                  onClick={() => setPriority('high')}
                >
                  High
                </button>
                <button 
                  className={`priority-button normal ${priority === 'normal' ? 'active' : ''}`}
                  onClick={() => setPriority('normal')}
                >
                  Normal
                </button>
                <button 
                  className={`priority-button low ${priority === 'low' ? 'active' : ''}`}
                  onClick={() => setPriority('low')}
                >
                  Low
                </button>
              </div>
            </div>
          </div>
          
          <div className="notification-demo-preview">
            <h4>Preview:</h4>
            <div className={`notification-preview ${priority}`}>
              <div className="notification-preview-icon">
                {getTypeIcon(type)}
              </div>
              <div className="notification-preview-content">
                <div className="notification-preview-title">
                  {type === 'lead' && 'New Lead Assigned'}
                  {type === 'appointment' && 'Appointment Reminder'}
                  {type === 'vehicle' && 'Vehicle Interest'}
                  {type === 'communication' && 'New Message Received'}
                  {type === 'system' && 'System Notification'}
                </div>
                <div className="notification-preview-message">
                  {type === 'lead' && 'You have been assigned a new lead: John Doe'}
                  {type === 'appointment' && 'You have an appointment with Sarah Smith in 30 minutes'}
                  {type === 'vehicle' && 'A customer is interested in 2023 Toyota Camry'}
                  {type === 'communication' && 'You received a new message from Mike Johnson'}
                  {type === 'system' && 'This is a test system notification'}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className="send-notification-button"
            onClick={sendTestNotification}
            disabled={!socketConnected}
          >
            Send Test Notification
          </button>
          
          {!socketConnected && (
            <div className="socket-warning">
              Socket is disconnected. Connect to the server to send test notifications.
            </div>
          )}
        </div>
        
        <div className="notification-demo-section">
          <h3>How It Works</h3>
          <div className="notification-demo-info">
            <p>
              This demo showcases the real-time notification system using Socket.io. 
              When you send a test notification:
            </p>
            <ol>
              <li>The client emits a socket event to the server</li>
              <li>The server creates a notification in the database</li>
              <li>The server broadcasts the notification to the appropriate user(s)</li>
              <li>The client receives the notification and displays it</li>
              <li>Based on user preferences, the notification may trigger:
                <ul>
                  <li>A toast notification in the app</li>
                  <li>A browser notification (if enabled)</li>
                  <li>A sound alert (if enabled)</li>
                </ul>
              </li>
            </ol>
            <p>
              Notifications are also synchronized across all devices where the user is logged in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
