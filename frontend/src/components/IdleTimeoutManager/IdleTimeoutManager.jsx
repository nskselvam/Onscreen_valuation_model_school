import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useIdleTimeout from '../../hooks/useIdleTimeout';
import IdleTimeoutWarning from '../IdleTimeoutWarning/IdleTimeoutWarning';

/**
 * Component that monitors user activity and shows warning before auto-logout
 * Only active when user is logged in
 */
const IdleTimeoutManager = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Only enable idle timeout if user is logged in
  const isLoggedIn = !!userInfo;
  
  // Handle navigation after logout
  const handleLogout = () => {
    navigate('/login');
  };
  
  const { showWarning, remainingTime, resetTimer } = useIdleTimeout({
    idleTimeout: 300000, // 5 minutes (300 seconds)
    warningTime: 30000,  // 30 seconds warning
    enabled: isLoggedIn, // Only enable when user is logged in
    onLogout: handleLogout // Navigate to login after logout
  });

  // Handler for when user wants to stay logged in
  const handleStayLoggedIn = () => {
    resetTimer();
  };

  // Only render modal if user is logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <React.Fragment>
      {isLoggedIn && (
        <IdleTimeoutWarning
          key={`idle-warning-${showWarning}`}
          show={showWarning}
          remainingTime={remainingTime}
          onStayLoggedIn={handleStayLoggedIn}
        />
      )}
    </React.Fragment>
  );
};

export default IdleTimeoutManager;
