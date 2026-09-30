import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useAddNewUserMutation } from '../../redux-slice/adminOperationApiSlice';
import { useGetDistrictDataQuery } from '../../redux-slice/GeneralGetSqlOperationApiSlice';

/**
 * User Role Add Modal Component - Simplified version
 * Only shows Role, Name, and Email fields
 */
const UserRoleModal = ({
    show = false,
    onHide = () => { },
    onSave = () => { },
    roleMasters = [],
}) => {
    const [formData, setFormData] = useState({ User_Id: '', User_Name: '', Email_Id: '', Role: '', D_Code: '', Mobile_Number: '' });
    const [selectedRole, setSelectedRole] = useState('');
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });

    const [addNewUser, { isLoading: isAdding }] = useAddNewUserMutation();
    const { data: districtData } = useGetDistrictDataQuery();
    const districts = districtData?.data || [];

    const allowedRoles = ['0', '1', '2'];

    // Clear message when modal opens
    useEffect(() => {
        if (show) {
            setMessage({ type: '', text: '' });
        }
    }, [show]);
    const filteredRoleMasters = roleMasters.filter((role) =>
        allowedRoles.includes(String(role.user_role_code))
    );

    // Handle Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
        // Clear general error message when user starts typing
        if (message.text) {
            setMessage({ type: '', text: '' });
        }
    };

    // Handle Role Select Change
    const handleRoleChange = (e) => {
        const roleId = e.target.value;
        setSelectedRole(roleId);
        setFormData({ ...formData, Role: roleId });
        if (errors.Role) {
            setErrors({ ...errors, Role: '' });
        }
        // Clear general error message when user changes role
        if (message.text) {
            setMessage({ type: '', text: '' });
        }
    };

    // Validate Form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!selectedRole) {
            newErrors.Role = 'Role is required';
        }
        
        if (!formData.User_Id?.trim()) {
            newErrors.User_Id = 'User ID is required';
        }
        if (!formData.User_Name?.trim()) {
            newErrors.User_Name = 'Name is required';
        }

        // Email validation
        if (!formData.Email_Id?.trim()) {
            newErrors.Email_Id = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.Email_Id)) {
                newErrors.Email_Id = 'Please enter a valid email address';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Save
    const handleSave = async () => {
        if (!validateForm()) {
            setMessage({ type: 'danger', text: 'Please fill all required fields correctly.' });
            return;
        }
        
        try {
            const result = await addNewUser(formData).unwrap();
            
            // Show success message
            setMessage({ type: 'success', text: 'User added successfully!' });
            
            // Clear form and close modal after 1.5 seconds
            setTimeout(() => {
                setFormData({ User_Id: '', User_Name: '', Email_Id: '', Role: '', D_Code: '', Mobile_Number: '' });
                setSelectedRole('');
                setErrors({});
                setMessage({ type: '', text: '' });
                onHide();
                if (onSave) onSave(result);
            }, 1500);
            
        } catch (error) {
            console.error('Error adding user:', error);
            const errorMessage = error?.data?.message || error?.message || error?.error || 'Failed to add user. Please try again.';
            setMessage({ 
                type: 'danger', 
                text: errorMessage
            });
        }
    };

    // Handle Modal Close
    const handleClose = () => {
        setFormData({ User_Id: '', User_Name: '', Email_Id: '', Role: '', D_Code: '', Mobile_Number: '' });
        setSelectedRole('');
        setErrors({});
        setMessage({ type: '', text: '' });
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            backdrop="static"
            keyboard={false}
            size="lg"
        >
            <Modal.Header
                closeButton
                style={{ backgroundColor: '#335e8a', color: 'white' }}
            >
                <Modal.Title>
                    Add New User
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4 py-4">
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

                <Form>
                    {/* User ID Field */}
                    <Form.Group className="mb-4">
                        <Form.Label>
                            User ID <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="User_Id"
                            value={formData.User_Id || ''}
                            onChange={handleInputChange}
                            placeholder="Enter user ID"
                            isInvalid={!!errors.User_Id}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.User_Id}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Role Selection */}
                    <Form.Group className="mb-4">
                        <Form.Label>
                            Role <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                            name="Role"
                            value={selectedRole}
                            onChange={handleRoleChange}
                            isInvalid={!!errors.Role}
                        >
                            <option value="">-- Select Role --</option>
                            {filteredRoleMasters.map((role) => (
                                <option key={role.user_role_code} value={role.user_role_code}>
                                    {role.user_role}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.Role}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* District Code Field */}
                    <Form.Group className="mb-4">
                        <Form.Label>District Code</Form.Label>
                        <Form.Select
                            name="D_Code"
                            value={formData.D_Code || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">-- Select District --</option>
                            {districts.map((district) => (
                                <option key={district.DCODE} value={district.DCODE}>
                                    {district.DCODE} — {district.DNAME}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Username Field */}
                    <Form.Group className="mb-4">
                        <Form.Label>
                            Username <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="User_Name"
                            value={formData.User_Name || ''}
                            onChange={handleInputChange}
                            placeholder="Enter username"
                            isInvalid={!!errors.User_Name}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.User_Name}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Email Field */}
                    <Form.Group className="mb-4">
                        <Form.Label>
                            Email <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="email"
                            name="Email_Id"
                            value={formData.Email_Id || ''}
                            onChange={handleInputChange}
                            placeholder="Enter email"
                            isInvalid={!!errors.Email_Id}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.Email_Id}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    style={{ minWidth: '100px' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isAdding}
                    style={{ minWidth: '100px' }}
                >
                    {isAdding ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Adding...
                        </>
                    ) : (
                        'Add User'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UserRoleModal;
