import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import axios from 'axios';
import { updateNotificationPreferences, requestNotificationPermission } from '../../utils/notificationHandler';
import { setNotificationVolume, muteNotificationSounds, unmuteNotificationSounds } from '../../utils/audioUtils';

import './NotificationSettings.css';

/**
 * Notification Settings Component
 * Allows users to configure their notification preferences
 */
const NotificationSettings = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(Notification.permission);
  const [volume, setVolume] = useState(0.7);

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/notifications/preferences');
        setPreferences(response.data);
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Update preferences via API
      await updateNotificationPreferences(preferences);
      
      // Update volume settings
      setNotificationVolume(volume);
      
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle change
  const handleToggleChange = (section, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle notification type toggle
  const handleTypeToggle = (section, type, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        types: {
          ...prev[section].types,
          [type]: value
        }
      }
    }));
  };

  // Handle browser permission request
  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setNotificationVolume(newVolume);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="notification-settings-loading">
        <Spinner animation="border" />
        <p>Loading notification preferences...</p>
      </div>
    );
  }

  // Render error state
  if (error && !preferences) {
    return (
      <Alert variant="danger">
        {error}
        <Button 
          variant="link" 
          onClick={() => window.location.reload()}
          className="d-block mt-2"
        >
          Retry
        </Button>
      </Alert>
    );
  }

  // If preferences not loaded, show placeholder
  if (!preferences) {
    return (
      <Alert variant="info">
        Unable to load notification preferences. Please try again later.
      </Alert>
    );
  }

  return (
    <div className="notification-settings">
      <Card>
        <Card.Header>
          <h5 className="mb-0">Notification Preferences</h5>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
              Notification preferences saved successfully!
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* Email Notifications */}
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Email Notifications</h6>
                  <Form.Check
                    type="switch"
                    id="email-enabled"
                    checked={preferences.email?.enabled || false}
                    onChange={(e) => handleToggleChange('email', 'enabled', e.target.checked)}
                    label=""
                  />
                </div>
              </Card.Header>
              <Card.Body className={!preferences.email?.enabled ? 'disabled-section' : ''}>
                <p className="text-muted">
                  Receive notifications via email for the following events:
                </p>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="email-leads"
                        label="Lead Updates"
                        checked={preferences.email?.types?.leads || false}
                        onChange={(e) => handleTypeToggle('email', 'leads', e.target.checked)}
                        disabled={!preferences.email?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="email-appointments"
                        label="Appointment Updates"
                        checked={preferences.email?.types?.appointments || false}
                        onChange={(e) => handleTypeToggle('email', 'appointments', e.target.checked)}
                        disabled={!preferences.email?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="email-vehicles"
                        label="Vehicle Updates"
                        checked={preferences.email?.types?.vehicles || false}
                        onChange={(e) => handleTypeToggle('email', 'vehicles', e.target.checked)}
                        disabled={!preferences.email?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="email-communications"
                        label="Communication Updates"
                        checked={preferences.email?.types?.communications || false}
                        onChange={(e) => handleTypeToggle('email', 'communications', e.target.checked)}
                        disabled={!preferences.email?.enabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Frequency</Form.Label>
                  <Form.Select
                    value={preferences.email?.frequency || 'immediate'}
                    onChange={(e) => handleToggleChange('email', 'frequency', e.target.value)}
                    disabled={!preferences.email?.enabled}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="hourly">Hourly Digest</option>
                    <option value="daily">Daily Digest</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>
            
            {/* Browser Notifications */}
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Browser Notifications</h6>
                  <Form.Check
                    type="switch"
                    id="browser-enabled"
                    checked={preferences.browser?.enabled || false}
                    onChange={(e) => handleToggleChange('browser', 'enabled', e.target.checked)}
                    label=""
                  />
                </div>
              </Card.Header>
              <Card.Body className={!preferences.browser?.enabled ? 'disabled-section' : ''}>
                <p className="text-muted">
                  Receive notifications in your browser for the following events:
                </p>
                
                {browserPermission !== 'granted' && (
                  <Alert variant="warning" className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Browser notifications are not enabled for this site.</span>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={handleRequestPermission}
                      >
                        Enable Notifications
                      </Button>
                    </div>
                  </Alert>
                )}
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="browser-leads"
                        label="Lead Updates"
                        checked={preferences.browser?.types?.leads || false}
                        onChange={(e) => handleTypeToggle('browser', 'leads', e.target.checked)}
                        disabled={!preferences.browser?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="browser-appointments"
                        label="Appointment Updates"
                        checked={preferences.browser?.types?.appointments || false}
                        onChange={(e) => handleTypeToggle('browser', 'appointments', e.target.checked)}
                        disabled={!preferences.browser?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="browser-vehicles"
                        label="Vehicle Updates"
                        checked={preferences.browser?.types?.vehicles || false}
                        onChange={(e) => handleTypeToggle('browser', 'vehicles', e.target.checked)}
                        disabled={!preferences.browser?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="browser-communications"
                        label="Communication Updates"
                        checked={preferences.browser?.types?.communications || false}
                        onChange={(e) => handleTypeToggle('browser', 'communications', e.target.checked)}
                        disabled={!preferences.browser?.enabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            {/* SMS Notifications */}
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">SMS Notifications</h6>
                  <Form.Check
                    type="switch"
                    id="sms-enabled"
                    checked={preferences.sms?.enabled || false}
                    onChange={(e) => handleToggleChange('sms', 'enabled', e.target.checked)}
                    label=""
                  />
                </div>
              </Card.Header>
              <Card.Body className={!preferences.sms?.enabled ? 'disabled-section' : ''}>
                <p className="text-muted">
                  Receive notifications via SMS for the following events:
                </p>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sms-leads"
                        label="Lead Updates"
                        checked={preferences.sms?.types?.leads || false}
                        onChange={(e) => handleTypeToggle('sms', 'leads', e.target.checked)}
                        disabled={!preferences.sms?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sms-appointments"
                        label="Appointment Updates"
                        checked={preferences.sms?.types?.appointments || false}
                        onChange={(e) => handleTypeToggle('sms', 'appointments', e.target.checked)}
                        disabled={!preferences.sms?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sms-communications"
                        label="Communication Updates"
                        checked={preferences.sms?.types?.communications || false}
                        onChange={(e) => handleTypeToggle('sms', 'communications', e.target.checked)}
                        disabled={!preferences.sms?.enabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>SMS Frequency</Form.Label>
                  <Form.Select
                    value={preferences.sms?.frequency || 'high_priority'}
                    onChange={(e) => handleToggleChange('sms', 'frequency', e.target.value)}
                    disabled={!preferences.sms?.enabled}
                  >
                    <option value="high_priority">High Priority Only</option>
                    <option value="all">All Notifications</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>
            
            {/* Sound Notifications */}
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Sound Notifications</h6>
                  <Form.Check
                    type="switch"
                    id="sound-enabled"
                    checked={preferences.sound?.enabled || false}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      handleToggleChange('sound', 'enabled', enabled);
                      if (enabled) {
                        unmuteNotificationSounds();
                      } else {
                        muteNotificationSounds();
                      }
                    }}
                    label=""
                  />
                </div>
              </Card.Header>
              <Card.Body className={!preferences.sound?.enabled ? 'disabled-section' : ''}>
                <p className="text-muted">
                  Play sounds for the following notification types:
                </p>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sound-leads"
                        label="Lead Updates"
                        checked={preferences.sound?.types?.leads || false}
                        onChange={(e) => handleTypeToggle('sound', 'leads', e.target.checked)}
                        disabled={!preferences.sound?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sound-appointments"
                        label="Appointment Updates"
                        checked={preferences.sound?.types?.appointments || false}
                        onChange={(e) => handleTypeToggle('sound', 'appointments', e.target.checked)}
                        disabled={!preferences.sound?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sound-vehicles"
                        label="Vehicle Updates"
                        checked={preferences.sound?.types?.vehicles || false}
                        onChange={(e) => handleTypeToggle('sound', 'vehicles', e.target.checked)}
                        disabled={!preferences.sound?.enabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sound-communications"
                        label="Communication Updates"
                        checked={preferences.sound?.types?.communications || false}
                        onChange={(e) => handleTypeToggle('sound', 'communications', e.target.checked)}
                        disabled={!preferences.sound?.enabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Volume: {Math.round(volume * 100)}%</Form.Label>
                  <Form.Range
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={!preferences.sound?.enabled}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Sound Priority</Form.Label>
                  <Form.Select
                    value={preferences.sound?.priority || 'all'}
                    onChange={(e) => handleToggleChange('sound', 'priority', e.target.value)}
                    disabled={!preferences.sound?.enabled}
                  >
                    <option value="all">All Notifications</option>
                    <option value="high_only">High Priority Only</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : 'Save Preferences'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default NotificationSettings;
