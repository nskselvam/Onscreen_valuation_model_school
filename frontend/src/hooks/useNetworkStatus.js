import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor network connectivity status
 * @returns {Object} { isOnline: boolean, isSlowConnection: boolean }
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Handler for when network comes online
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Network connected');
    };

    // Handler for when network goes offline
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network disconnected');
    };

    // Check connection speed if available
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
          // effectiveType can be: 'slow-2g', '2g', '3g', or '4g'
          const slowConnectionTypes = ['slow-2g', '2g'];
          setIsSlowConnection(slowConnectionTypes.includes(connection.effectiveType));

          // Monitor connection changes
          connection.addEventListener('change', () => {
            setIsSlowConnection(slowConnectionTypes.includes(connection.effectiveType));
          });
        }
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed on mount
    checkConnectionSpeed();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlowConnection };
};

export default useNetworkStatus;
