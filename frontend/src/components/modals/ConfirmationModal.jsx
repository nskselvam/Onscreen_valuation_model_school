import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * Reusable Confirmation Modal Component
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {function} onHide - Function to close modal
 * @param {function} onConfirm - Function to execute on confirmation
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Yes, Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} confirmVariant - Bootstrap variant for confirm button (default: "success")
 * @param {boolean} isLoading - Shows loading state on confirm button
 */
const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  confirmVariant = "success",
  isLoading = false
}) => {
  
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={!isLoading}
    >
      <Modal.Header 
        closeButton={!isLoading}
        style={{ 
          background: 'linear-gradient(135deg, #1e3a6e, #2a5298)', 
          color: '#fff',
          borderBottom: 'none'
        }}
      >
        <Modal.Title style={{ fontSize: '1.1rem', fontWeight: '600' }}>
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ 
            fontSize: '2rem', 
            color: '#ffc107',
            flexShrink: 0
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              margin: 0, 
              fontSize: '1rem', 
              color: '#495057',
              lineHeight: '1.6'
            }}>
              {message}
            </p>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ 
        borderTop: '1px solid #dee2e6',
        padding: '16px 24px',
        gap: '12px'
      }}>
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={isLoading}
          style={{ 
            padding: '8px 20px',
            fontSize: '0.95rem',
            fontWeight: '500',
            minWidth: '100px'
          }}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          disabled={isLoading}
          style={{ 
            padding: '8px 20px',
            fontSize: '0.95rem',
            fontWeight: '600',
            minWidth: '120px',
            position: 'relative'
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
