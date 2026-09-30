import React, { useEffect, useState } from 'react';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import './NetworkStatus.css';

const NetworkStatus = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    if (!isOnline) {
      setNotificationMessage('No Internet Connection');
      setShowNotification(true);
    } else if (isSlowConnection) {
      setNotificationMessage('Slow Internet Connection');
      setShowNotification(true);
      // Auto hide slow connection warning after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // Show brief "Connected" message when coming back online
      if (showNotification) {
        setNotificationMessage('Connected');
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      }
    }
  }, [isOnline, isSlowConnection]);

  if (!showNotification) {
    return null;
  }

  return (
    <div className={`network-status-banner ${!isOnline ? 'offline' : isSlowConnection ? 'slow' : 'online'}`}>
      <div className="network-status-content">
        <span className="network-status-icon">
          {!isOnline ? '⚠️' : isSlowConnection ? '🐌' : '✓'}
        </span>
        <span className="network-status-message">{notificationMessage}</span>
        {!isOnline && (
          <span className="network-status-description">
            Please check your internet connection
          </span>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
