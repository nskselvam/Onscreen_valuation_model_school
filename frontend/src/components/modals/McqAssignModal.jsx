import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { useEvaluatorDataFromTheBackQuery } from '../../redux-slice/mcqOperationSlice';


/**
 * MCQ Assignment Modal Component
 */
const McqAssignModal = ({
    show = false,
    onHide = () => { },
    initialData = {},
    onSave = () => { },
}) => {
    const [formData, setFormData] = useState({
        subcode: '',
        mcqAssign: 'Y',
        NoOfQbs: '',
        Eva_Id: '',
    });
    const [errors, setErrors] = useState({});

    const camp_offcer_id_examiner = useSelector((state) => state?.auth?.userInfo?.camp_offcer_id_examiner);
    const Camp_id = useSelector((state) => state?.auth?.userInfo?.Camp_id);

    // Fetch evaluator data
    const { data: evaluatorData, isLoading: isEvaluatorDataLoading } = useEvaluatorDataFromTheBackQuery();

    // Format evaluator options for React Select
    const evaluatorOptions = useMemo(() => {
        if (!evaluatorData?.data) return [];
        return evaluatorData.data.map(evaluator => ({
            value: evaluator.Eva_Id,
            label: `${evaluator.Eva_Id} - ${evaluator.FACULTY_NAME}`,
            data: evaluator
        }));
    }, [evaluatorData]);

    // Update form data when initialData changes
    useEffect(() => {
        if (show) {
            setFormData({
                subcode: initialData.Subcode || '',
                mcqAssign: initialData.mcq_flg === 'N' ? 'N' : 'Y',
                NoOfQbs: initialData.mcq_qst || '',
                Eva_Id: initialData.Eva_Id || '',
            });
            setErrors({});
        }
    }, [initialData, show]);

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
        
        if (!formData.mcqAssign) {
            newErrors.mcqAssign = 'MCQ Assignment status is required';
        }
        
        if (formData.mcqAssign === 'Y') {
            if (!formData.NoOfQbs || formData.NoOfQbs <= 0) {
                newErrors.NoOfQbs = 'Number of questions must be greater than 0';
            }
            if (!formData.Eva_Id?.trim()) {
                newErrors.Eva_Id = 'Evaluator ID is required when assigning MCQ';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Save with Confirmation
    const handleSave = () => {
        if (!validateForm()) {
            return;
        }

        const confirmMessage = formData.mcqAssign === 'Y'
            ? `Are you sure you want to assign ${formData.NoOfQbs} MCQ questions to Evaluator ${formData.Eva_Id} for subject ${formData.subcode}?`
            : `Are you sure you want to unassign MCQ for subject ${formData.subcode}?`;

        if (window.confirm(confirmMessage)) {
            onSave({
                subcode: formData.subcode,
                SubName: initialData.SUBNAME || '',
                Dep_Name: initialData.Dep_Name || '',
                Eva_Month: initialData.Eva_Mon_Year || '',
                mcqAssign: formData.mcqAssign,
                NoOfQbs: formData.NoOfQbs,
                Eva_Id: formData.Eva_Id,
                camp_offcer_id_examiner: camp_offcer_id_examiner,
                Camp_id: Camp_id,
            });
            handleClose();
        }
    };

    // Handle Modal Close
    const handleClose = () => {
        setFormData({
            subcode: '',
            mcqAssign: 'Y',
            NoOfQbs: '',
            Eva_Id: '',
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="md" centered>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <Modal.Title style={{ fontWeight: '600', color: '#333' }}>
                    Assign MCQ
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '24px' }}>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                            Subject Code
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.subcode}
                            disabled
                            style={{ backgroundColor: '#f5f5f5' }}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                            MCQ Assignment <span style={{ color: 'red' }}>*</span>
                        </Form.Label>
                        <Form.Select
                            name="mcqAssign"
                            value={formData.mcqAssign}
                            onChange={handleInputChange}
                            isInvalid={!!errors.mcqAssign}
                        >
                            <option value="Y">Assigned (Y)</option>
                            <option value="N">Not Assigned (N)</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.mcqAssign}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {formData.mcqAssign === 'Y' && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Number of MCQ Questions <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="NoOfQbs"
                                    value={formData.NoOfQbs}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.NoOfQbs}
                                    placeholder="Enter number of questions"
                                    min="0"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.NoOfQbs}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500', color: '#555' }}>
                                    Evaluator ID <span style={{ color: 'red' }}>*</span>
                                </Form.Label>
                                <Select
                                    name="Eva_Id"
                                    value={evaluatorOptions.find(option => option.value === formData.Eva_Id) || null}
                                    onChange={(selectedOption) => {
                                        const value = selectedOption ? selectedOption.value : '';
                                        setFormData({ ...formData, Eva_Id: value });
                                        if (errors.Eva_Id) {
                                            setErrors({ ...errors, Eva_Id: '' });
                                        }
                                    }}
                                    options={evaluatorOptions}
                                    isLoading={isEvaluatorDataLoading}
                                    placeholder="Select evaluator..."
                                    isClearable
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            borderColor: errors.Eva_Id ? '#dc3545' : base.borderColor,
                                            '&:hover': {
                                                borderColor: errors.Eva_Id ? '#dc3545' : base.borderColor
                                            }
                                        })
                                    }}
                                />
                                {errors.Eva_Id && (
                                    <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        {errors.Eva_Id}
                                    </div>
                                )}
                            </Form.Group>
                        </>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '1px solid #dee2e6', padding: '16px 24px' }}>
                <Button 
                    variant="secondary" 
                    onClick={handleClose}
                    style={{ minWidth: '80px' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    style={{ minWidth: '80px', backgroundColor: '#1976d2', borderColor: '#1976d2' }}
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default McqAssignModal;
