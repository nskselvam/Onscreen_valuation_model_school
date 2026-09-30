import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

// Role Master data for mapping role IDs to names
const roleMaster = [
    { id: "0", name: "Admin" },
    { id: "1", name: "Chief Examiner" },
    { id: "2", name: "Examiner" },
    { id: "4", name: "Camp Officer" },
    { id: "5", name: "Camp Officer Assistant" },
    { id: "6", name: "Section Staff" },
];

/**
 * User Edit Modal Component
 */

const UserEditModal = ({
    show = false,
    currentRow = { id: '', Eva_Id: '', FACULTY_NAME: '', Email_Id: '', Mobile_Number: '', Role: '' },
    mode = 'edit', // 'add' or 'edit'
    onSave = () => { },
    onHide = () => { },
}) => {
    const [formData, setFormData] = useState(currentRow);
    const [selectedRole, setSelectedRole] = useState('');
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });

    // Update form data when currentRow changes
    useEffect(() => {
        if (show) {
            setFormData(currentRow);
            setSelectedRole(currentRow.Role || '');
            setErrors({});
            setMessage({ type: '', text: '' });
        }
    }, [show, currentRow]);

    // Handle Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
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
    };

    // Validate Form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!selectedRole) {
            newErrors.Role = 'Role is required';
        }
        if (!formData.Dep_Name?.trim()) {
            newErrors.Dep_Name = 'Department Name is required';
        }
        if (!formData.Eva_Id?.trim()) {
            newErrors.Eva_Id = 'User ID is required';
        }
        if (!formData.FACULTY_NAME?.trim()) {
            newErrors.FACULTY_NAME = 'Name is required';
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

        // Mobile number validation
        if (!formData.Mobile_Number?.trim()) {
            newErrors.Mobile_Number = 'Mobile number is required';
        } else {
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(formData.Mobile_Number)) {
                newErrors.Mobile_Number = 'Mobile number must be 10 digits';
            }
        }

        // Role-specific validations
        if (selectedRole == 1 && !formData.Camp_Id) {
            newErrors.Camp_Id = 'Camp ID is required for Chief Examiner role';
        }
        if ((selectedRole == 1 || selectedRole == 2) && !formData.Camp_Officer_Id) {
            newErrors.Camp_Officer_Id = 'Camp Officer ID is required for Chief Examiner and Examiner roles';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Save
    const handleSave = () => {
        if (!validateForm()) {
            setMessage({ type: 'danger', text: 'Please fill all required fields correctly.' });
            return;
        }

        onSave(formData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
        
        // Close modal after short delay
        setTimeout(() => {
            handleClose();
        }, 1000);
    };

    // Handle Modal Close
    const handleClose = () => {
        setFormData(currentRow);
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
            size="xl"
        >
            <Modal.Header
                closeButton
                style={{ backgroundColor: '#335e8a', color: 'white' }}
            >
                <Modal.Title>
                    {mode === 'add' ? 'Add New User' : 'Edit User 1'}
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
                            {roleMaster.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.Role}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Department Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Dep_Name"
                                    value={formData.Dep_Name || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter department name"
                                    isInvalid={!!errors.Dep_Name}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Dep_Name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Evaluation Month/Year
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Eva_Mon_Year"
                                    value={formData.Eva_Mon_Year || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., May_2026"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    {/* Basic User Information */}
                    {(selectedRole == 0 || selectedRole == 6 || selectedRole == 5 || selectedRole == 4 || selectedRole == 1 || selectedRole == 2) && (
                        <div>
                            <div className="row">
                                <div className="col-md-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            User ID <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="Eva_Id"
                                            value={formData.Eva_Id || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter user ID"
                                            isInvalid={!!errors.Eva_Id}
                                            disabled={mode === 'edit'}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.Eva_Id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </div>

                                <div className="col-md-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Name <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="FACULTY_NAME"
                                            value={formData.FACULTY_NAME || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter name"
                                            isInvalid={!!errors.FACULTY_NAME}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.FACULTY_NAME}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <Form.Group className="mb-3">
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
                                </div>

                                <div className="col-md-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Mobile Number <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="Mobile_Number"
                                            value={formData.Mobile_Number || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter mobile number"
                                            isInvalid={!!errors.Mobile_Number}
                                            maxLength="10"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.Mobile_Number}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chief Examiner and Examiner specific fields */}
                    {(selectedRole == 1 || selectedRole == 2) && (
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Camp ID <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Camp_Id"
                                        value={formData.Camp_Id || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter camp ID"
                                        isInvalid={!!errors.Camp_Id}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Camp_Id}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Camp Officer ID <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Camp_Officer_Id"
                                        value={formData.Camp_Officer_Id || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter camp officer ID"
                                        isInvalid={!!errors.Camp_Officer_Id}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Camp_Officer_Id}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </div>
                        </div>
                    )}

                    {/* Examiner specific fields */}
                    {selectedRole == 2 && (
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Maximum Paper in Day
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="Maximum_Paper_in_Day"
                                        value={formData.Maximum_Paper_in_Day || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter maximum paper in day"
                                    />
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Total Paper In Each Subject
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="Total_Paper_In_Each_Subject"
                                        value={formData.Total_Paper_In_Each_Subject || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter total paper in each subject"
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    )}
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
                    style={{ minWidth: '100px' }}
                >
                    {mode === 'add' ? 'Add User' : 'Save Changes'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UserEditModal;