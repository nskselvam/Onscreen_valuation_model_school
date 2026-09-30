import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * Assign Examiner Modal Component
 */
const AssignExaminerModal = ({
    show = false,
    onHide = () => { },
    userData = null,
    onAssign = () => { },
}) => {
    const [formData, setFormData] = useState({
        subject: '',
        examType: '',
        maxPapersPerDay: '',
        totalPapers: '',
        campOfficerId: '',
        campId: '',
    });
    const [errors, setErrors] = useState({});

    // Reset form when modal opens/closes
    useEffect(() => {
        if (show) {
            setFormData({
                subject: '',
                examType: '',
                maxPapersPerDay: '',
                totalPapers: '',
                campOfficerId: '',
                campId: '',
            });
            setErrors({});
        }
    }, [show]);

    // Handle Input Change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Validate Form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.subject?.trim()) {
            newErrors.subject = 'Subject is required';
        }
        if (!formData.examType?.trim()) {
            newErrors.examType = 'Exam type is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Assign
    const handleAssign = () => {
        if (!validateForm()) {
            return;
        }
        
        const assignmentData = {
            ...formData,
            userId: userData?.Email_Id,
            userName: userData?.candidateName,
        };
        
        onAssign(assignmentData);
        handleClose();
    };

    // Handle Modal Close
    const handleClose = () => {
        setFormData({
            subject: '',
            examType: '',
            maxPapersPerDay: '',
            totalPapers: '',
            campOfficerId: '',
            campId: '',
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={false} size="lg">
            <Modal.Header closeButton style={{ backgroundColor: '#343a40', color: 'white' }}>
                <Modal.Title>Assign Examiner</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {userData && (
                    <div className="mb-3" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
                        <h6 style={{ marginBottom: '10px', color: '#495057' }}>Examiner Details</h6>
                        <p style={{ margin: '5px 0' }}><strong>User ID:</strong> {userData.Email_Id}</p>
                        <p style={{ margin: '5px 0' }}><strong>Name:</strong> {userData.candidateName}</p>
                        {userData.Email_Id && <p style={{ margin: '5px 0' }}><strong>Email:</strong> {userData.Email_Id}</p>}
                    </div>
                )}

                <Form>
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Subject <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="Enter subject"
                                    isInvalid={!!errors.subject}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.subject}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Exam Type <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Select
                                    name="examType"
                                    value={formData.examType}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.examType}
                                >
                                    <option value="">-- Select Exam Type --</option>
                                    <option value="theory">Theory</option>
                                    <option value="practical">Practical</option>
                                    <option value="viva">Viva</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.examType}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Maximum Papers Per Day</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="maxPapersPerDay"
                                    value={formData.maxPapersPerDay}
                                    onChange={handleInputChange}
                                    placeholder="Enter maximum papers per day"
                                    min="1"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Total Papers</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="totalPapers"
                                    value={formData.totalPapers}
                                    onChange={handleInputChange}
                                    placeholder="Enter total papers"
                                    min="1"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Camp Officer ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="campOfficerId"
                                    value={formData.campOfficerId}
                                    onChange={handleInputChange}
                                    placeholder="Enter camp officer ID"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Camp ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="campId"
                                    value={formData.campId}
                                    onChange={handleInputChange}
                                    placeholder="Enter camp ID"
                                />
                            </Form.Group>
                        </div>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAssign}>
                    Assign
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AssignExaminerModal;
