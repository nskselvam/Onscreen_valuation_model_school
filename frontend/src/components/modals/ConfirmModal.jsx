import React from 'react'
import { Modal, Button } from 'react-bootstrap'

/**
 * Reusable Confirmation Modal Template
 * Usage:
 * <ConfirmModal
 *   show={showModal}
 *   title="Delete Items"
 *   message="Are you sure you want to delete selected items?"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   confirmVariant="danger"
 *   isLoading={isLoading}
 * />
 */
const ConfirmModal = ({
  show = false,
  title = 'Confirm',
  message = 'Are you sure?',
  onConfirm = () => {},
  onCancel = () => {},
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  children = null
}) => {
  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children || <p>{message}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button 
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ConfirmModal
