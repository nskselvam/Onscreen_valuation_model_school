import React, { useState } from 'react';
import { Container, Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import useIdleTimeout from '../../hooks/useIdleTimeout';
import IdleTimeoutWarning from '../IdleTimeoutWarning/IdleTimeoutWarning';

/**
 * Demo/Test page for Idle Timeout Feature
 * Useful for testing and demonstrating the idle timeout functionality
 */
const IdleTimeoutDemo = () => {
  const [enabled, setEnabled] = useState(true);
  const [customIdleTime, setCustomIdleTime] = useState(30000); // 30 seconds for demo
  const [customWarningTime, setCustomWarningTime] = useState(10000); // 10 seconds for demo
  const [activityLog, setActivityLog] = useState([]);

  const { showWarning, remainingTime, resetTimer } = useIdleTimeout({
    idleTimeout: customIdleTime,
    warningTime: customWarningTime,
    enabled: enabled
  });

  const logActivity = (activity) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLog(prev => [{
      time: timestamp,
      activity: activity
    }, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  const handleStayLoggedIn = () => {
    resetTimer();
    logActivity('User clicked "Stay Logged In"');
  };

  const handleManualReset = () => {
    resetTimer();
    logActivity('Manual timer reset');
  };

  const handleToggleEnabled = () => {
    setEnabled(!enabled);
    logActivity(enabled ? 'Idle timeout disabled' : 'Idle timeout enabled');
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">
        <FaClock className="me-2" />
        Idle Timeout Demo
      </h1>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-primary text-white">
              <strong>Current Status</strong>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Idle Timeout:</span>
                <Badge bg={enabled ? 'success' : 'danger'}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Warning Active:</span>
                <Badge bg={showWarning ? 'warning' : 'secondary'}>
                  {showWarning ? 'Yes' : 'No'}
                </Badge>
              </div>
              {showWarning && (
                <div className="d-flex justify-content-between align-items-center">
                  <span>Time Remaining:</span>
                  <Badge bg="danger" className="fs-5">
                    {remainingTime} seconds
                  </Badge>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-info text-white">
              <strong>Configuration</strong>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label">Idle Timeout (seconds):</label>
                <input
                  type="number"
                  className="form-control"
                  value={customIdleTime / 1000}
                  onChange={(e) => setCustomIdleTime(e.target.value * 1000)}
                  min="10"
                  max="300"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Warning Time (seconds):</label>
                <input
                  type="number"
                  className="form-control"
                  value={customWarningTime / 1000}
                  onChange={(e) => setCustomWarningTime(e.target.value * 1000)}
                  min="5"
                  max="60"
                />
              </div>
              <small className="text-muted">
                Note: Changes require page refresh to take effect
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-warning">
          <strong>Controls</strong>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant={enabled ? 'danger' : 'success'}
              onClick={handleToggleEnabled}
            >
              {enabled ? (
                <>
                  <FaTimesCircle className="me-2" />
                  Disable Idle Timeout
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-2" />
                  Enable Idle Timeout
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={handleManualReset}
              disabled={!enabled}
            >
              Reset Timer Manually
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <strong>Activity Log (Last 10 Events)</strong>
        </Card.Header>
        <Card.Body>
          {activityLog.length === 0 ? (
            <p className="text-muted text-center mb-0">
              No activity logged yet. Interact with the page or click buttons above.
            </p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {activityLog.map((log, index) => (
                <div
                  key={index}
                  className="border-bottom py-2"
                  style={{ fontSize: '14px' }}
                >
                  <span className="badge bg-secondary me-2">{log.time}</span>
                  <span>{log.activity}</span>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-4">
        <Card.Header className="bg-success text-white">
          <strong>Testing Instructions</strong>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>Ensure "Idle Timeout" is enabled (green badge)</li>
            <li>Stop moving your mouse and don't type anything</li>
            <li>After the idle timeout period, a warning modal will appear</li>
            <li>You can click "Stay Logged In" to reset the timer</li>
            <li>Or let the countdown reach 0 to trigger auto-logout</li>
            <li>
              Any activity (mouse move, click, keyboard, scroll) will reset the timer
            </li>
          </ol>
          <div className="alert alert-info mb-0 mt-3">
            <strong>Note:</strong> This demo uses shorter timeouts (30 sec idle, 10 sec warning)
            for easier testing. Production uses 2 minutes idle with 30 seconds warning.
          </div>
        </Card.Body>
      </Card>

      {/* Render the warning modal */}
      <IdleTimeoutWarning
        show={showWarning}
        remainingTime={remainingTime}
        onStayLoggedIn={handleStayLoggedIn}
      />
    </Container>
  );
};

export default IdleTimeoutDemo;
