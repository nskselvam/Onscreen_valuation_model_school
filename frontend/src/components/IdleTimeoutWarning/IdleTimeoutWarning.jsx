import React from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import { FaExclamationTriangle, FaClock } from 'react-icons/fa';
import './IdleTimeoutWarning.css';

/**
 * Warning modal that displays when user is about to be logged out due to inactivity
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {number} remainingTime - Remaining time in seconds before auto-logout
 * @param {function} onStayLoggedIn - Callback when user clicks "Stay Logged In"
 */
const IdleTimeoutWarning = ({ show, remainingTime, onStayLoggedIn }) => {

  // Calculate progress percentage dynamically based on initial time
  const [initialTime, setInitialTime] = React.useState(remainingTime);
  
  React.useEffect(() => {
    if (show && remainingTime > initialTime) {
      setInitialTime(remainingTime);
    }
  }, [show, remainingTime, initialTime]);
  
  const totalWarningTime = initialTime > 0 ? initialTime : 10; // Use actual initial time
  const progressPercentage = (remainingTime / totalWarningTime) * 100;
  
  // Determine color based on remaining time
  const getProgressVariant = () => {
    if (remainingTime > 7) return 'success';
    if (remainingTime > 3) return 'warning';
    return 'danger';
  };

  return (
    <Modal 
      show={show} 
      onHide={onStayLoggedIn}
      centered 
      backdrop="static"
      keyboard={false}
      className="idle-timeout-modal"
    >
      <Modal.Header className="idle-timeout-header">
        <div className="idle-timeout-icon-wrapper">
          <FaExclamationTriangle className="idle-timeout-icon" />
        </div>
        <Modal.Title className="idle-timeout-title">
          Session Timeout Warning
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="idle-timeout-body">
        <div className="idle-timeout-message">
          <p className="main-message">
            Your session is about to expire due to inactivity
          </p>
          <div className="countdown-section">
            <FaClock className="clock-icon" />
            <div className="time-display">
              <span className="time-value">{remainingTime}</span>
              <span className="time-label">seconds remaining</span>
            </div>
          </div>
          
          <ProgressBar 
            now={progressPercentage} 
            variant={getProgressVariant()}
            className="timeout-progress"
            animated
          />
          
          <p className="sub-message">
            Click "Stay Logged In" to continue your session, or you will be automatically logged out.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer className="idle-timeout-footer">
        <Button 
          variant="primary" 
          onClick={onStayLoggedIn}
          className="stay-logged-in-btn"
          size="lg"
        >
          Stay Logged In
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IdleTimeoutWarning;
