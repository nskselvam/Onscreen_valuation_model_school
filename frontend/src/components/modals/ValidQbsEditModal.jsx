import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * Valid QBS Edit Modal Component
 */
const ValidQbsEditModal = ({
    show = false,
    onHide = () => {},
    initialData = {},
    onSave = () => {},
}) => {
    const [formData, setFormData] = useState({
        SUBCODE: '',
        Dep_Name: '',
        SECTION: '',
        SUB_SEC: '',
        FROM_QST: '',
        TO_QST: '',
        MARK_MAX: '',
        NOQST: '',
        C_QST: '',
        Eva_Mon_Year: '',
        ...initialData,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            setFormData({
                SUBCODE: '',
                Dep_Name: '',
                SECTION: '',
                SUB_SEC: '',
                FROM_QST: '',
                TO_QST: '',
                MARK_MAX: '',
                NOQST: '',
                C_QST: '',
                Eva_Mon_Year: '',
                ...initialData,
            });
            setErrors({});
        }
    }, [show, initialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.SUBCODE?.trim()) {
            newErrors.SUBCODE = 'Subject Code is required';
        }
        if (!formData.Dep_Name?.trim()) {
            newErrors.Dep_Name = 'Department Name is required';
        }
        if (!formData.SECTION?.trim()) {
            newErrors.SECTION = 'Section is required';
        }
        if (!formData.FROM_QST?.toString().trim()) {
            newErrors.FROM_QST = 'From Question is required';
        }
        if (!formData.TO_QST?.toString().trim()) {
            newErrors.TO_QST = 'To Question is required';
        }
        if (!formData.Eva_Mon_Year?.trim()) {
            newErrors.Eva_Mon_Year = 'Evaluation Month/Year is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }
        onSave(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            SUBCODE: '',
            Dep_Name: '',
            SECTION: '',
            SUB_SEC: '',
            FROM_QST: '',
            TO_QST: '',
            MARK_MAX: '',
            NOQST: '',
            C_QST: '',
            Eva_Mon_Year: '',
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <Modal.Title style={{ fontWeight: '600', color: '#333' }}>
                    Edit Valid Question
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '24px' }}>
                <Form>
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Subject Code <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="SUBCODE"
                                    value={formData.SUBCODE}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.SUBCODE}
                                    placeholder="Enter subject code"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.SUBCODE}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Department Name <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Dep_Name"
                                    value={formData.Dep_Name}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Dep_Name}
                                    placeholder="Enter department name"
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Dep_Name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Evaluation Month/Year <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Eva_Mon_Year"
                                    value={formData.Eva_Mon_Year}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Eva_Mon_Year}
                                    placeholder="e.g., Nov_2025"
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Eva_Mon_Year}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Section <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="SECTION"
                                    value={formData.SECTION}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.SECTION}
                                    placeholder="Enter section"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.SECTION}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Sub Section
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="SUB_SEC"
                                    value={formData.SUB_SEC}
                                    onChange={handleInputChange}
                                    placeholder="Enter sub section"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    From Question <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="FROM_QST"
                                    value={formData.FROM_QST}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.FROM_QST}
                                    placeholder="Enter from question"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.FROM_QST}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    To Question <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="TO_QST"
                                    value={formData.TO_QST}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.TO_QST}
                                    placeholder="Enter to question"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.TO_QST}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Max Marks
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="MARK_MAX"
                                    value={formData.MARK_MAX}
                                    onChange={handleInputChange}
                                    placeholder="Enter max marks"
                                />
                            </Form.Group>
                        </div>

                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    No. of Questions
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="NOQST"
                                    value={formData.NOQST}
                                    onChange={handleInputChange}
                                    placeholder="Enter number of questions"
                                />
                            </Form.Group>
                        </div>

                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Choice Questions
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="C_QST"
                                    value={formData.C_QST}
                                    onChange={handleInputChange}
                                    placeholder="Enter choice questions"
                                />
                            </Form.Group>
                        </div>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    style={{ paddingLeft: '24px', paddingRight: '24px' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    style={{ paddingLeft: '24px', paddingRight: '24px' }}
                >
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ValidQbsEditModal;
