import { useState, useEffect, useCallback, useRef } from 'react';
import useLogout from './useLogout';

/**
 * Custom hook for automatic logout after user inactivity
 * 
 * Features:
 * - Auto logout after 2 minutes (120 seconds) of inactivity
 * - Warning countdown for the last 30 seconds
 * - Tracks mouse, keyboard, touch, and scroll events
 * - Automatically clears state (redirect handled by app routing)
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.idleTimeout - Total idle time in milliseconds (default: 120000ms = 2 minutes)
 * @param {number} options.warningTime - Warning time in milliseconds (default: 30000ms = 30 seconds)
 * @param {boolean} options.enabled - Enable/disable idle timeout (default: true)
 * @param {function} options.onLogout - Optional callback called after logout
 * @returns {Object} { showWarning, remainingTime, resetTimer }
 */
const useIdleTimeout = (options = {}) => {
  const {
    idleTimeout = 120000, // 2 minutes in milliseconds
    warningTime = 30000, // 30 seconds in milliseconds
    enabled = true,
    onLogout = null
  } = options;

  const logout = useLogout();
  
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isInitializedRef = useRef(false);
  const logoutRef = useRef(logout);
  const onLogoutRef = useRef(onLogout);

  // Update refs when callbacks change
  useEffect(() => {
    logoutRef.current = logout;
    onLogoutRef.current = onLogout;
  }, [logout, onLogout]);

  // Calculate when warning should start
  const warningStartTime = idleTimeout - warningTime;

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    setRemainingTime(0);
    logout();
    // Call optional callback (can be used for navigation from component level)
    if (onLogout) {
      onLogout();
    }
  }, [logout, onLogout, clearTimers]);

  // Reset idle timer (exposed for manual reset from "Stay Logged In" button)
  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearTimers();
    setShowWarning(false);
    setRemainingTime(0);
    lastActivityRef.current = Date.now();

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      
      const initialTimeLeft = Math.ceil((idleTimeout - (Date.now() - lastActivityRef.current)) / 1000);
      setRemainingTime(initialTimeLeft);
      
      countdownIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        const timeLeft = idleTimeout - elapsed;
        
        if (timeLeft <= 0) {
          setRemainingTime(0);
          clearInterval(countdownIntervalRef.current);
        } else {
          setRemainingTime(Math.ceil(timeLeft / 1000));
        }
      }, 1000);
    }, warningStartTime);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, idleTimeout);
  }, [enabled, idleTimeout, warningStartTime, clearTimers, handleLogout]);

  // Setup event listeners - run only when enabled changes
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setShowWarning(false);
      return;
    }
    
    // Start the timer
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingTime(0);

    // Set warning timeout
    const warningTimeout = setTimeout(() => {
      setShowWarning(true);
      
      const initialTimeLeft = Math.ceil((idleTimeout - (Date.now() - lastActivityRef.current)) / 1000);
      setRemainingTime(initialTimeLeft);
      
      // Countdown interval
      const countdownInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        const timeLeft = idleTimeout - elapsed;
        
        if (timeLeft <= 0) {
          setRemainingTime(0);
          clearInterval(countdownInterval);
        } else {
          const secondsLeft = Math.ceil(timeLeft / 1000);
          setRemainingTime(secondsLeft);
        }
      }, 1000);
      
      countdownIntervalRef.current = countdownInterval;
    }, warningStartTime);

    // Set logout timeout
    const logoutTimeout = setTimeout(() => {
      clearTimers();
      setShowWarning(false);
      setRemainingTime(0);
      logoutRef.current();
      if (onLogoutRef.current) {
        onLogoutRef.current();
      }
    }, idleTimeout);

    warningTimeoutRef.current = warningTimeout;
    timeoutRef.current = logoutTimeout;

    // Activity handler
    const handleUserActivity = () => {
      
      // Clear existing timers
      clearTimers();
      setShowWarning(false);
      setRemainingTime(0);
      lastActivityRef.current = Date.now();

      // Restart warning timeout
      const newWarningTimeout = setTimeout(() => {
        setShowWarning(true);
        
        const initialTimeLeft = Math.ceil((idleTimeout - (Date.now() - lastActivityRef.current)) / 1000);
        setRemainingTime(initialTimeLeft);
        
        const countdownInterval = setInterval(() => {
          const now = Date.now();
          const elapsed = now - lastActivityRef.current;
          const timeLeft = idleTimeout - elapsed;
          
          if (timeLeft <= 0) {
            setRemainingTime(0);
            clearInterval(countdownInterval);
          } else {
            setRemainingTime(Math.ceil(timeLeft / 1000));
          }
        }, 1000);
        
        countdownIntervalRef.current = countdownInterval;
      }, warningStartTime);

      // Restart logout timeout
      const newLogoutTimeout = setTimeout(() => {
        clearTimers();
        setShowWarning(false);
        setRemainingTime(0);
        logoutRef.current();
        if (onLogoutRef.current) {
          onLogoutRef.current();
        }
      }, idleTimeout);

      warningTimeoutRef.current = newWarningTimeout;
      timeoutRef.current = newLogoutTimeout;
    };

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearTimers();
    };
  }, [enabled, idleTimeout, warningStartTime, clearTimers]);

  return {
    showWarning,
    remainingTime,
    resetTimer
  };
};

export default useIdleTimeout;
