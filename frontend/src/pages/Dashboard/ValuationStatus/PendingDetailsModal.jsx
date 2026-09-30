import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import {useGetFacultyDataMutation} from '../../../redux-slice/generalApiSlice';
import {useSubmitPendingAssignmentMutation} from '../../../redux-slice/valuationStatusApiSlice';
import { toast } from 'react-toastify';

const PendingDetailsModal = ({ show, onHide, rowData, valuationType, refetch }) => {
    const [assignmentType, setAssignmentType] = useState('1');
    const [selectedEvaluator, setSelectedEvaluator] = useState('');
    const [examinerList, setExaminerList] = useState([]);
    const [loadingExaminers, setLoadingExaminers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch examiner list when modal opens and assignment type is 2
    useEffect(() => {
        if (show && assignmentType === '2' && rowData) {
            fetchExaminerList();
        }
    }, [show, assignmentType, rowData]);

    const [getFacultyData] = useGetFacultyDataMutation();
    const [submitPendingAssignment] = useSubmitPendingAssignmentMutation();

    const fetchExaminerList = async () => {
        setLoadingExaminers(true);
        try {
            const response = await getFacultyData({ subcode: rowData.subcode , Eva_Id: rowData.Evaluator_Id }).unwrap();
            // Response structure: { message: "...", data: [...] }
            setExaminerList(response.data || []);
        } catch (error) {
            console.error('Error fetching examiner list:', error);
            setExaminerList([]);
        } finally {
            setLoadingExaminers(false);
        }
    };
    //     setLoadingExaminers(true);
    //     try {
    //         // Fetch examiners based on subject code
    //         const response = await axios.get('/api/common/examiners', {
    //             params: {
    //                 subcode: rowData.subcode,
    //                 camp_id: rowData.Camp_id
    //             }
    //         });
    //         if (response.data.success) {
    //             setExaminerList(response.data.data || []);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching examiner list:', error);
    //         setExaminerList([]);
    //     } finally {
    //         setLoadingExaminers(false);
    //     }
    // };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (assignmentType === '2' && !selectedEvaluator) {
            toast.error('Please select a specific examiner');
            return;
        }

        setSubmitting(true);
        try {
            const response = await submitPendingAssignment({
                barcode: rowData.barcode,
                subcode: rowData.subcode,
                assignmentType: assignmentType,
                selectedEvaluator: assignmentType === '2' ? selectedEvaluator : null,
                Valuation_Type: valuationType,
                Dep_Name: rowData.Dep_Name
            }).unwrap();

            if (response.success) {
                toast.success(response.message);
                onHide();
                if (refetch) refetch();
            } else {
                toast.error(response.message || 'Assignment failed');
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            toast.error(error?.data?.message || 'Error submitting assignment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header
                closeButton
                style={{
                    backgroundColor: '#2c5282',
                    color: '#ffffff',
                    padding: '20px 30px',
                    borderBottom: '3px solid #1e3a5f'
                }}
            >
                <Modal.Title style={{ fontSize: '20px', fontWeight: '700' }}>
                    📋 Pending Paper Details
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '30px', backgroundColor: '#fafbfc' }}>
                {rowData && (
                    <Form onSubmit={handleSubmit}>
                        {/* Assignment Type Section */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            marginBottom: '24px'
                        }}>
                            <h6 style={{
                                color: '#2c5282',
                                fontWeight: '700',
                                marginBottom: '20px',
                                fontSize: '16px',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '10px'
                            }}>
                                Assignment Configuration
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Assignment Type <span style={{ color: '#dc3545' }}>*</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={assignmentType}
                                            onChange={(e) => setAssignmentType(e.target.value)}
                                            style={{
                                                fontSize: '14px',
                                                padding: '10px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <option value="1">🌐 Open to All</option>
                                            <option value="2">👤 Specific Examiner</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                {assignmentType === '2' && (
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#2c5282',
                                                marginBottom: '10px',
                                                fontSize: '14px'
                                            }}>
                                                Select Specific Examiner <span style={{ color: '#dc3545' }}>*</span>
                                            </Form.Label>
                                            <Form.Select
                                                value={selectedEvaluator}
                                                onChange={(e) => setSelectedEvaluator(e.target.value)}
                                                style={{
                                                    fontSize: '14px',
                                                    padding: '10px 15px',
                                                    borderRadius: '8px',
                                                    border: '2px solid #e2e8f0',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                disabled={loadingExaminers}
                                            >
                                                <option value="">-- Select Examiner --</option>
                                                {examinerList.map((examiner) => (
                                                    <option key={examiner.Eva_Id} value={examiner.Eva_Id}>
                                                        {examiner.Eva_Id} - {examiner.FACULTY_NAME}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {loadingExaminers && (
                                                <Form.Text style={{
                                                    color: '#6c757d',
                                                    fontSize: '12px',
                                                    marginTop: '6px',
                                                    display: 'block'
                                                }}>
                                                    ⏳ Loading examiners...
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                )}
                            </Row>
                        </div>

                        {/* Answer Script Details Section */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            marginBottom: '24px'
                        }}>
                            <h6 style={{
                                color: '#2c5282',
                                fontWeight: '700',
                                marginBottom: '20px',
                                fontSize: '16px',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '10px'
                            }}>
                                📄 Answer Script Details
                            </h6>
                            <Row className="g-3">
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Dummy Number
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.barcode || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '15px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0',
                                                fontWeight: '600',
                                                color: '#1e40af'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="g-3 mt-2">
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Subject Code
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.subcode || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={7}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Subject Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.Subject_Name || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        {/* Evaluator Information Section */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            marginBottom: '24px'
                        }}>
                            <h6 style={{
                                color: '#2c5282',
                                fontWeight: '700',
                                marginBottom: '20px',
                                fontSize: '16px',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '10px'
                            }}>
                                👨‍🏫 Current Evaluator Information
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Evaluator ID
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.Evaluator_Id || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Evaluator Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.FACULTY_NAME || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="g-3 mt-2">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            📧 Email
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={rowData.Email_Id || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            📱 Phone Number
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.Mobile_Number || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        {/* Camp Information Section */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                            <h6 style={{
                                color: '#2c5282',
                                fontWeight: '700',
                                marginBottom: '20px',
                                fontSize: '16px',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '10px'
                            }}>
                                🏢 Camp Information
                            </h6>
                            <Row className="g-3">
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#2c5282',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}>
                                            Camp ID
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={rowData.Camp_id || ''}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f0f4f8',
                                                fontSize: '14px',
                                                padding: '12px 15px',
                                                borderRadius: '8px',
                                                border: '2px solid #e2e8f0',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer style={{
                padding: '20px 30px',
                backgroundColor: '#fafbfc',
                borderTop: '2px solid #e2e8f0'
            }}>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    ✕ Close
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        backgroundColor: '#2c5282',
                        border: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {submitting ? '⏳ Submitting...' : '✓ Submit Assignment'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PendingDetailsModal;
