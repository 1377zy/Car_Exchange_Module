import React, { useState } from 'react';
import { Modal, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { BsTrash, BsCheck, BsArrowRight } from 'react-icons/bs';

import './NotificationDetailModal.css';

/**
 * Notification Detail Modal Component
 * Displays detailed information about a notification in a modal
 */
const NotificationDetailModal = ({ notification, show, onHide, onDelete, onMarkAsRead }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'PPpp'); // Format: Mar 2, 2025, 4:30 PM
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`/api/notifications/${notification._id}`);
      
      if (onDelete) {
        onDelete(notification._id);
      }
      
      onHide();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`/api/notifications/${notification._id}/read`);
      
      if (onMarkAsRead) {
        onMarkAsRead(notification._id);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to link
  const handleNavigate = () => {
    if (notification?.link) {
      navigate(notification.link);
      onHide();
    }
  };

  // If no notification, don't render
  if (!notification) {
    return null;
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="notification-detail-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center">
            <span className="notification-title">{notification.title}</span>
            {!notification.read && <Badge bg="primary" className="ms-2">New</Badge>}
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <div className="alert alert-danger mb-3">
            {error}
          </div>
        )}
        
        <div className="notification-metadata mb-3">
          <div className="metadata-item">
            <span className="metadata-label">Type:</span>
            <Badge 
              bg={
                notification.type === 'lead' ? 'primary' :
                notification.type === 'appointment' ? 'success' :
                notification.type === 'vehicle' ? 'warning' :
                notification.type === 'communication' ? 'info' :
                notification.type === 'system' ? 'secondary' : 'dark'
              }
            >
              {notification.type}
            </Badge>
          </div>
          
          <div className="metadata-item">
            <span className="metadata-label">Priority:</span>
            <Badge 
              bg={
                notification.priority === 'high' ? 'danger' :
                notification.priority === 'normal' ? 'primary' :
                'secondary'
              }
            >
              {notification.priority || 'normal'}
            </Badge>
          </div>
          
          <div className="metadata-item">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{formatDate(notification.createdAt)}</span>
          </div>
          
          {notification.read && (
            <div className="metadata-item">
              <span className="metadata-label">Read:</span>
              <span className="metadata-value">{formatDate(notification.readAt)}</span>
            </div>
          )}
        </div>
        
        <div className="notification-content mb-4">
          <p className="notification-message">{notification.message}</p>
          
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="notification-data">
              <h6>Additional Information:</h6>
              <ul className="data-list">
                {Object.entries(notification.data).map(([key, value]) => (
                  <li key={key} className="data-item">
                    <span className="data-key">{key}:</span>
                    <span className="data-value">
                      {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="outline-danger" 
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : <BsTrash />} Delete
        </Button>
        
        {!notification.read && (
          <Button 
            variant="outline-primary" 
            onClick={handleMarkAsRead}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : <BsCheck />} Mark as Read
          </Button>
        )}
        
        {notification.link && (
          <Button 
            variant="primary" 
            onClick={handleNavigate}
            disabled={loading}
          >
            View Details <BsArrowRight />
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationDetailModal;
