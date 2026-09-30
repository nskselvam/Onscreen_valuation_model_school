import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useDeleteAdminUserMutation } from '../../redux-slice/adminOperationApiSlice'

/**
 * Delete User Modal Component - Simplified
 * Only supports deleting entire user
 */
const DeleteUserModal = ({
    show = false,
    onHide = () => { },
    userData = null,
    onConfirm = () => { },
}) => {

    const [deleteAdminUser, { isLoading }] = useDeleteAdminUserMutation();
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleConfirm = async () => {
        const deleteData = {
            userId: userData.id
        };

        try {
            await deleteAdminUser(deleteData).unwrap();
            
            setMessage({ type: 'success', text: 'User deleted successfully!' });
            
            // Close modal after showing success message
            setTimeout(() => {
                onConfirm(deleteData);
                handleClose();
            }, 1500);
        } catch (error) {
            console.error('Delete failed:', error);
            setMessage({ 
                type: 'danger', 
                text: error?.data?.message || 'Failed to delete. Please try again.' 
            });
        }
    };

    const handleClose = () => {
        setMessage({ type: '', text: '' });
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={false} size="lg">
            <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
                <Modal.Title>Delete User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Success/Error Message */}
                {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                        {message.text}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setMessage({ type: '', text: '' })}
                        ></button>
                    </div>
                )}

                {userData && (
                    <div>
                        <div className="mb-3" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Name:</strong> {userData.candidateName}</p>
                            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Email:</strong> {userData.Email_Id}</p>
                        </div>

                        <div className="alert alert-warning" style={{ marginTop: '15px', borderLeft: '4px solid #ff9800' }}>
                            <strong>⚠️ Warning:</strong> This will permanently delete the user "<strong>{userData.candidateName}</strong>" and all associated data.
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '2px solid #dee2e6' }}>
                <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleConfirm}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Deleting...
                        </>
                    ) : (
                        'Delete'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteUserModal;
