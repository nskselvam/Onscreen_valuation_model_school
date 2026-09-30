/**
 * Global Loading Component
 * Used for Suspense fallbacks
 */

import React from 'react';
import './Loading.css';

const Loading = ({ message = 'Loading...', size = 'medium', fullScreen = false }) => {
  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        minHeight: '200px'
      };

  const spinnerSize = {
    small: '24px',
    medium: '40px',
    large: '64px'
  }[size];

  return (
    <div style={containerStyle}>
      <div
        className="spinner-border text-primary"
        role="status"
        style={{ width: spinnerSize, height: spinnerSize }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <div style={{ marginTop: '16px', color: '#6c757d', fontSize: '14px' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Loading;
