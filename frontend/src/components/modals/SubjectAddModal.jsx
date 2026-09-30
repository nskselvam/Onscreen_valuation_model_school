import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * Subject Add Modal Component
 */
const SubjectAddModal = ({
    show = false,
    onHide = () => {},
    onSave = () => {},
}) => {
    const [formData, setFormData] = useState({
        Subcode: '',
        SUBNAME: '',
        Dep_Name: '',
        Eva_Mon_Year: '',
        Rate_Per_Script: '',
        Min_Amount: '',
        Valcnt: '1',
        Degree_Status: '',
        Type_of_Exam: '',
        qb_flg: 'N',
        ans_flg: 'N',
        mismatch_flg: 'N',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            setFormData({
                Subcode: '',
                SUBNAME: '',
                Dep_Name: '',
                Eva_Mon_Year: '',
                Rate_Per_Script: '',
                Min_Amount: '',
                Valcnt: '1',
                Degree_Status: '',
                Type_of_Exam: '',
                qb_flg: 'N',
                ans_flg: 'N',
                mismatch_flg: 'N',
            });
            setErrors({});
        }
    }, [show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.Subcode?.trim()) {
            newErrors.Subcode = 'Subject Code is required';
        }
        if (!formData.SUBNAME?.trim()) {
            newErrors.SUBNAME = 'Subject Name is required';
        }
        if (!formData.Dep_Name?.trim()) {
            newErrors.Dep_Name = 'Department Name is required';
        }
        if (!formData.Eva_Mon_Year?.trim()) {
            newErrors.Eva_Mon_Year = 'Evaluation Month/Year is required';
        }
        if (!formData.Valcnt?.trim()) {
            newErrors.Valcnt = 'Valuation Count is required';
        }
        if (!formData.Type_of_Exam?.trim()) {
            newErrors.Type_of_Exam = 'Type of Exam is required';
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
            Subcode: '',
            SUBNAME: '',
            Dep_Name: '',
            Eva_Mon_Year: '',
            Rate_Per_Script: '',
            Min_Amount: '',
            Valcnt: '1',
            Degree_Status: '',
            Type_of_Exam: '',
            qb_flg: 'N',
            ans_flg: 'N',
            mismatch_flg: 'N',
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <Modal.Title style={{ fontWeight: '600', color: '#333' }}>
                    Add Subject
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
                                    name="Subcode"
                                    value={formData.Subcode}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Subcode}
                                    placeholder="Enter subject code"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Subcode}
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
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Eva_Mon_Year}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Valuation Count <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Valcnt"
                                    value={formData.Valcnt}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Valcnt}
                                    placeholder="Enter valuation count"
                                    min="1"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Valcnt}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                            Subject Name <span style={{ color: 'red' }}>*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="SUBNAME"
                            value={formData.SUBNAME}
                            onChange={handleInputChange}
                            isInvalid={!!errors.SUBNAME}
                            placeholder="Enter subject name"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.SUBNAME}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Rate Per Script
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Rate_Per_Script"
                                    value={formData.Rate_Per_Script}
                                    onChange={handleInputChange}
                                    placeholder="Enter rate per script"
                                />
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Minimum Amount
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Min_Amount"
                                    value={formData.Min_Amount}
                                    onChange={handleInputChange}
                                    placeholder="Enter minimum amount"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Degree Status
                                </Form.Label>
                                <Form.Select
                                    name="Degree_Status"
                                    value={formData.Degree_Status}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Degree Status</option>
                                    <option value="UG">UG</option>
                                    <option value="PG">PG</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Type of Exam <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Select
                                    name="Type_of_Exam"
                                    value={formData.Type_of_Exam}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Type_of_Exam}
                                >
                                    <option value="">Select Type</option>
                                    <option value="R">Regular</option>
                                    <option value="S">Supply</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.Type_of_Exam}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Question Paper Flag
                                </Form.Label>
                                <Form.Select
                                    name="qb_flg"
                                    value={formData.qb_flg}
                                    onChange={handleInputChange}
                                >
                                    <option value="Y">Yes</option>
                                    <option value="N">No</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Answer Key Flag
                                </Form.Label>
                                <Form.Select
                                    name="ans_flg"
                                    value={formData.ans_flg}
                                    onChange={handleInputChange}
                                >
                                    <option value="Y">Yes</option>
                                    <option value="N">No</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Mismatch Flag
                                </Form.Label>
                                <Form.Select
                                    name="mismatch_flg"
                                    value={formData.mismatch_flg}
                                    onChange={handleInputChange}
                                >
                                    <option value="Y">Yes</option>
                                    <option value="N">No</option>
                                </Form.Select>
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
                    Add Subject
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SubjectAddModal;
