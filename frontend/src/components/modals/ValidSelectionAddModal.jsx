import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';

/**
 * Valid Selection Add Modal Component
 */
const ValidSelectionAddModal = ({
    show = false,
    onHide = () => {},
    onSave = () => {},
    defaultSubcode = '',
}) => {
    const [formData, setFormData] = useState({
        sub_code: '',
        Dep_Name: '',
        section: '',
        sub_section: '',
        add_sub_section: '',
        qstn_num: '',
        max_mark: '',
        Eva_Mon_Year: '',
        BL_Point: '',
        CO_Point: '',
        PO_Point: '',
    });
    const [errors, setErrors] = useState({});
     const subjectsFromStore = useSelector((state) => state.masterDataAdminData.master_data_admin);

    useEffect(() => {
        if (show) {
            const subjectData = subjectsFromStore?.find(subject => subject.Subcode === defaultSubcode);
            const Eva_Month = subjectData?.Eva_Mon_Year || '';
            const Dep_Name = subjectData?.Dep_Name || '';
            setFormData({
                sub_code: defaultSubcode || '',
                Dep_Name: Dep_Name,
                section: '',
                sub_section: '',
                add_sub_section: '',
                qstn_num: '',
                max_mark: '',
                Eva_Mon_Year: Eva_Month,
                BL_Point: '',
                CO_Point: '',
                PO_Point: '',
            });
            setErrors({});
        }
    }, [show, defaultSubcode, subjectsFromStore]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.sub_code?.trim()) {
            newErrors.sub_code = 'Subject Code is required';
        }
        if (!formData.Dep_Name?.trim()) {
            newErrors.Dep_Name = 'Department Name is required';
        }
        if (!formData.section?.trim()) {
            newErrors.section = 'Section is required';
        }
        if (!formData.qstn_num?.toString().trim()) {
            newErrors.qstn_num = 'Question No is required';
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
            sub_code: '',
            Dep_Name: '',
            section: '',
            sub_section: '',
            add_sub_section: '',
            qstn_num: '',
            max_mark: '',
            Eva_Mon_Year: '',
            BL_Point: '',
            CO_Point: '',
            PO_Point: '',
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <Modal.Title style={{ fontWeight: '600', color: '#333' }}>
                    Add Valid Section
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
                                    name="sub_code"
                                    value={formData.sub_code}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.sub_code}
                                    placeholder="Enter subject code"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.sub_code}
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
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Section <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.section}
                                    placeholder="Enter section"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.section}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Sub Section
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="sub_section"
                                    value={formData.sub_section}
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
                                    Add Sub Section
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="add_sub_section"
                                    value={formData.add_sub_section}
                                    onChange={handleInputChange}
                                    placeholder="Enter add sub section"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Question No <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="qstn_num"
                                    value={formData.qstn_num}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.qstn_num}
                                    placeholder="Enter question number"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.qstn_num}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Max Marks
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="max_mark"
                                    value={formData.max_mark}
                                    onChange={handleInputChange}
                                    placeholder="Enter max marks"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    BL Point
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="BL_Point"
                                    value={formData.BL_Point}
                                    onChange={handleInputChange}
                                    placeholder="Enter BL point"
                                />
                            </Form.Group>
                        </div>

                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    CO Point
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="CO_Point"
                                    value={formData.CO_Point}
                                    onChange={handleInputChange}
                                    placeholder="Enter CO point"
                                />
                            </Form.Group>
                        </div>

                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    PO Point
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="PO_Point"
                                    value={formData.PO_Point}
                                    onChange={handleInputChange}
                                    placeholder="Enter PO point"
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
                    Add Section
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ValidSelectionAddModal;
