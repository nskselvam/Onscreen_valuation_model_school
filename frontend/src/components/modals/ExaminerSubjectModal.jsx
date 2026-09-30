import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useGetSubjectDataQuery } from '../../redux-slice/SubjectMasterApiSlice';
import { useAddupdateSubjectDataMutation } from '../../redux-slice/adminOperationApiSlice';
import { useSelector } from 'react-redux';

/**
 * Examiner Subject Modal Component
 * For adding or editing subject assignments for examiners
 */
const ExaminerSubjectModal = ({
    show = false,
    onHide = () => {},
    onSave = () => {},
    currentData = null,
    mode = 'add', // 'add' or 'edit'
    evaId = null, // Eva_Id from parent component
    selectedRole = null
}) => {
    const [formData, setFormData] = useState({
        mode: mode || 'add',
        Subject_Code: '',
        Subject_Name: '',
        Evaluation_Type: '',
        Camp_Id: '',
        Camp_Officer_Id: '',
        Total_Paper_In_Each_Subject: '',
        Dep_Name: '',
        Examiner_Valuation_Status: 'N',
        Recordid: null,
        Eva_Id: null,
        id: null,
        selectedRole: selectedRole || null,
        chief_examiner:null
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [subjectSearch, setSubjectSearch] = useState('');
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

    const DegreeMaster = useSelector((state) => state.auth.degreeInfo);



    // Fetch subject data
    const { data: subjectData } = useGetSubjectDataQuery();
    
    const [addUpdateSubjectData] = useAddupdateSubjectDataMutation();

    // Update form data when modal opens or currentData changes
    useEffect(() => {
        
        if (show) {
            if (mode === 'edit' && currentData) {
                const subjectCode = currentData.sub_code || currentData.Subject_Code || '';
                let subjectName = currentData.sub_name || currentData.Subject_Name || '';
                
                // If subject name is empty or 'N/A', try to fetch from subject master data
                if ((!subjectName || subjectName === 'N/A') && subjectCode && subjectData) {
                    const subjects = Array.isArray(subjectData) ? subjectData : 
                        Array.isArray(subjectData?.data) ? subjectData.data : [];
                    const foundSubject = subjects.find(s => s.Subcode === subjectCode);
                    if (foundSubject) {
                        subjectName = foundSubject.SUBNAME;
                    }
                }
                
                setFormData({
                    mode: 'edit',
                    Subject_Code: subjectCode,
                    Subject_Name: subjectName,
                    Evaluation_Type: currentData.Eva_Subject || currentData.Evaluation_Type || '1',
                    Camp_Id: currentData.Camp_id || currentData.Camp_Id || '',
                    Camp_Officer_Id: currentData.camp_offcer_id_examiner || currentData.Camp_Officer_Id || '',
                    Total_Paper_In_Each_Subject: currentData.Sub_Max_Papers || currentData.Total_Paper_In_Each_Subject || '',
                    Dep_Name: currentData.department || currentData.Dep_Name || '',
                    Examiner_Valuation_Status: currentData.Examiner_Valuation_Status || 'N',
                    Recordid: currentData.Recordid || null,
                    Eva_Id: currentData.Eva_Id || null,
                    id: currentData.id || 0,
                    selectedRole: selectedRole || currentData?.selectedRole || null,
                    chief_examiner: currentData.chief_examiner || null
                });
            } else {
                // Reset form for add mode
                setFormData({
                    mode: 'add',
                    Subject_Code: '',
                    Subject_Name: '',
                    Evaluation_Type: '',
                    Camp_Id: '',
                    Camp_Officer_Id: '',
                    Total_Paper_In_Each_Subject: '',
                    Dep_Name: '',
                    Examiner_Valuation_Status: 'N',
                    Recordid: null,
                    Eva_Id: evaId || currentData?.Eva_Id || null,
                    id: null,
                    selectedRole: selectedRole || null,
                    chief_examiner: null
                });
            }
            setErrors({});
            setMessage({ type: '', text: '' });
        }
    }, [show, mode, currentData, subjectData, evaId, selectedRole]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // If subject code changes, try to auto-fill subject name
        if (name === 'Subject_Code' && value) {
            const subjects = Array.isArray(subjectData) ? subjectData : 
                Array.isArray(subjectData?.data) ? subjectData.data : [];
            const foundSubject = subjects.find(s => s.Subcode === value.trim());
            if (foundSubject) {
                setFormData(prev => ({ 
                    ...prev, 
                    [name]: value,
                    Subject_Name: foundSubject.SUBNAME 
                }));
            }
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Handle subject selection from dropdown
    const handleSubjectSelect = (subject) => {
        setFormData({
            ...formData,
            Subject_Code: subject.Subcode,
            Subject_Name: subject.SUBNAME
        });
        setShowSubjectDropdown(false);
        setSubjectSearch('');
        
        // Clear errors
        if (errors.Subject_Code) {
            setErrors({ ...errors, Subject_Code: '' });
        }
    };

    // Filter subjects based on search
    const getFilteredSubjects = () => {
        const subjects = Array.isArray(subjectData) ? subjectData :
            Array.isArray(subjectData?.data) ? subjectData.data : [];

        if (!subjectSearch.trim()) return subjects.slice(0, 50); // Limit initial display

        return subjects.filter(subject =>
            subject.Subcode?.toLowerCase().includes(subjectSearch.toLowerCase()) ||
            subject.SUBNAME?.toLowerCase().includes(subjectSearch.toLowerCase())
        );
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.Subject_Code.trim()) {
            newErrors.Subject_Code = 'Subject Code is required';
        }

        if (!formData.Dep_Name.trim()) {
            newErrors.Dep_Name = 'Department is required';
        }

        if (!formData.Evaluation_Type) {
            newErrors.Evaluation_Type = 'Evaluation Type is required';
        }

        if (!formData.Camp_Id.trim()) {
            newErrors.Camp_Id = 'Camp ID is required';
        }

        if (!formData.Camp_Officer_Id.trim()) {
            newErrors.Camp_Officer_Id = 'Camp Officer ID is required';
        }

        if (!formData.Total_Paper_In_Each_Subject.trim() && selectedRole === '2') {
            newErrors.Total_Paper_In_Each_Subject = 'Total Papers is required';
        } else if ((isNaN(formData.Total_Paper_In_Each_Subject) || parseInt(formData.Total_Paper_In_Each_Subject) < 0) && selectedRole === '2') {
            newErrors.Total_Paper_In_Each_Subject = 'Please enter a valid number';
        }
        if ((!formData.chief_examiner || !formData.chief_examiner.trim()) && selectedRole === '1') {
            newErrors.chief_examiner = 'Examiner Id is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = async () => {
        if (!validateForm()) {
            setMessage({ type: 'danger', text: 'Please fill all required fields correctly.' });
            return;
        }
        
        // Add mode to formData
        const dataToSave = {
            ...formData,
            mode: mode,
            Eva_Id: evaId || currentData?.Eva_Id || formData.Eva_Id,
            selectedRole: selectedRole || currentData?.selectedRole || formData.selectedRole,
        };
        
        try {
            const result = await addUpdateSubjectData(dataToSave).unwrap();
            onSave(dataToSave);
            setMessage({ type: 'success', text: `Subject ${mode === 'add' ? 'added' : 'updated'} successfully!` });
        } catch (error) {
            console.error('Error saving subject:', error);
            
            // Handle different error types
            let errorMessage = 'Failed to save subject. Please try again.';
            
            if (error?.status === 404) {
                errorMessage = 'Endpoint not found (404). Please check the API configuration.';
            } else if (error?.status === 400) {
                errorMessage = error?.data?.message || 'Bad request (400). Please check the data.';
            } else if (error?.status === 500) {
                errorMessage = 'Server error (500). Please contact support.';
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            setMessage({ 
                type: 'danger', 
                text: errorMessage 
            });
        }
        
        // Don't auto-close, let user see success message
        // They can close manually or you can add a close button after success
    };

    // Handle modal close
    const handleClose = () => {
        setFormData({
            mode: 'add',
            Subject_Code: '',
            Subject_Name: '',
            Evaluation_Type: '1',
            Camp_Id: '',
            Camp_Officer_Id: '',
            Total_Paper_In_Each_Subject: '',
            Dep_Name: '',
            Examiner_Valuation_Status: 'N',
            Recordid: null,
            Eva_Id: null,
            id: null,
            selectedRole: null
        });
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
                    {mode === 'add' ? 'Add New Subject' : 'Edit Subject'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4 py-4">
                {/* Success/Error Message */}
                {message.text && (
                    <Alert 
                        variant={message.type} 
                        dismissible 
                        onClose={() => setMessage({ type: '', text: '' })}
                    >
                        {message.text}
                    </Alert>
                )}

                <Form>
                    <div className="row">
                        <div className="col-md-12">
                            <Form.Group className="mb-3" style={{ position: 'relative' }}>
                                <Form.Label>
                                    Search Subject <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={subjectSearch}
                                    onChange={(e) => {
                                        setSubjectSearch(e.target.value);
                                        setShowSubjectDropdown(true);
                                    }}
                                    onFocus={() => setShowSubjectDropdown(true)}
                                    placeholder="Search by subject code or name..."
                                />
                                
                                {/* Subject Dropdown */}
                                {showSubjectDropdown && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            backgroundColor: 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            zIndex: 1000,
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {getFilteredSubjects().map((subject) => (
                                            <div
                                                key={subject.Subcode}
                                                onClick={() => handleSubjectSelect(subject)}
                                                style={{
                                                    padding: '10px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    backgroundColor: formData.Subject_Code === subject.Subcode ? '#e6f2ff' : 'white'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 
                                                    formData.Subject_Code === subject.Subcode ? '#e6f2ff' : 'white'}
                                            >
                                                <div style={{ fontWeight: '500', fontSize: '13px' }}>
                                                    {subject.Subcode}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {subject.SUBNAME}
                                                </div>
                                            </div>
                                        ))}
                                        {getFilteredSubjects().length === 0 && (
                                            <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                                                No subjects found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Form.Group>
                        </div>
                    </div>

                    {/* Display selected subject */}
                    {formData.Subject_Code && (
                        <div className="row">
                            <div className="col-md-12">
                                <div 
                                    className="alert alert-info d-flex justify-content-between align-items-center"
                                    style={{ padding: '10px 15px' }}
                                >
                                    <div>
                                        <strong>{formData.Subject_Code}</strong>
                                        {formData.Subject_Name && (
                                            <span className="ms-2">- {formData.Subject_Name}</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                            setFormData({ ...formData, Subject_Code: '', Subject_Name: '' });
                                            setSubjectSearch('');
                                        }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Subject Code (Read-only)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.Subject_Code}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#f8f9fa' }}
                                />
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Subject Name (Read-only)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.Subject_Name}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#f8f9fa' }}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Department <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    name="Dep_Name"
                                    value={formData.Dep_Name}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Dep_Name}
                                >
                                    <option value="">-- Select Department --</option>
                                    {Array.isArray(DegreeMaster) && DegreeMaster.map((dept ) =>  dept.Flg === 'Y' && (
                                        <option key={dept.D_Code} value={dept.D_Code}>
                                            {dept.Degree_Name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.Dep_Name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Evaluation Type <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    name="Evaluation_Type"
                                    value={formData.Evaluation_Type}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Evaluation_Type}
                                >
                                    <option value="">-- Select Valuation Type --</option>
                                    <option value="1">Valuation - 1</option>
                                    <option value="2">Valuation - 2</option>
                                    <option value="3">Valuation - 3</option>
                                    <option value="4">Valuation - 4</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.Evaluation_Type}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Camp ID <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Camp_Id"
                                    value={formData.Camp_Id}
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
                                    value={formData.Camp_Officer_Id}
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

                    <div className="row">
                        {selectedRole === '2' ? (
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Total Papers in Subject <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Total_Paper_In_Each_Subject"
                                    value={formData.Total_Paper_In_Each_Subject}
                                    onChange={handleInputChange}
                                    placeholder="Enter total papers"
                                    min="0"
                                    isInvalid={!!errors.Total_Paper_In_Each_Subject}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.Total_Paper_In_Each_Subject}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                        ):(<div className="col-md-6">

                         <Form.Group className='mb-3'>

                            <Form.Label>
                                Examiner Id <span className="text-danger">*</span>
                            </Form.Label>

                            <Form.Control
                            text="text"
                            name="chief_examiner"
                            value={formData.chief_examiner}
                            onChange={handleInputChange}
                            placeholder='Enter the Examiner Id'
                            isInvalid={!!errors.chief_examiner}
                            />

                            <Form.Control.Feedback type="invalid">
                                {errors.chief_examiner}
                            </Form.Control.Feedback>
                         </Form.Group>

                            </div>
                            )}

                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Examiner Status <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    name="Examiner_Valuation_Status"
                                    value={formData.Examiner_Valuation_Status}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Examiner_Valuation_Status}
                                    selected={formData.Examiner_Valuation_Status === 'Y' ? 'Y' : 'N'}
                                >
                                    <option value="N">No</option>
                                    <option value="Y">Yes</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.Examiner_Valuation_Status}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    </div>
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
                    {mode === 'add' ? 'Add Subject' : 'Save Changes'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ExaminerSubjectModal;