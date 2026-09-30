import React, { useState } from 'react'
import { Modal, Button, Row, Col, Form, Card } from 'react-bootstrap'
import { useValuationRemarksMalpracticeMutation } from '../../redux-slice/valuationApiSlice'
import { useSelector } from 'react-redux'
import ChiefDashboard from '../../pages/Dashboard/Dashboard/ChiefDashboard';

const ValuationRemarksModal = ({ show, onHide, basicData, Modal_Type }) => {
    const [subject, setSubject] = useState('')
    const [reason, setReason] = useState('Answer Sheet Related Issues')
    const [description, setDescription] = useState('')
    const [errorModal, setErrorModal] = useState('')
    const [successModal, setSuccessModal] = useState(false)
    const chiefValuationData = useSelector(state => state.valuaton_Data_basic?.chiefValuationData)
    const selectedRole = useSelector(state => state?.auth?.userInfo?.selected_role ?? state?.auth?.userInfo?.Role ?? state?.auth?.userInfo?.role ?? '11')
    const examinerValuationData = useSelector(state => state.valuaton_Data_basic?.dashboardData)
    const isExaminerRole = String(selectedRole) === '2' || String(selectedRole) === '11'
    const subjectName = basicData?.sub_name || (isExaminerRole
        ? examinerValuationData?.sub_name
        : chiefValuationData?.chief_sub_name) || ''


    console.log("Chief Valuation Data in Modal:", chiefValuationData)
    console.log("Examiner Valuation Data in Modal:", examinerValuationData)
    console.log("Selected Role:", selectedRole)

    const [valuationRemarksMalpractice] = useValuationRemarksMalpracticeMutation();

  console.log("Modal Type:", selectedRole)
  //(selectedRole)

    let reasonOptions

    if (Modal_Type === "1") {
        reasonOptions = [
            'Question Paper Related Issues',
            'Answer Sheet Related Issues',
            'Handwriting not clear',
            'Answer incomplete',
            'Wrong answer format',
            'Missing page numbers',
            'Duplicate sheets',
            'Poor scan quality',
            'Other'
        ]
    } else {
        reasonOptions = [
            'Appeal to the Examiner',
            'Written the abusive/obscene words in the answer sheet',
            'Written the Register Number or Name in the answer sheet',
            'Tampered Answer Sheet',
            'Unusual Marking Patterns',
            'Other'
        ]
    }


    const formSubmit = (e) => {
        e.preventDefault();
        if ((Modal_Type === "1" && !subject.trim()) || !reason || !description.trim()) {
            setErrorModal('Please fill in all required fields.')
            return
        }

        // Here you can handle the form submission, e.g., send data to backend
        const formData = {
            subject: Modal_Type==="1" ? subject : "Malpractice Remark",
            reason,
            description,
            barcode: basicData?.barcode || '',
            sub_code: basicData?.sub_code || '',
            sub_name: subjectName,
            Eva_Id: basicData?.Eva_Id || '',
            Eva_Name: basicData?.Eva_Name || '',
            Camp_id: basicData?.Camp_id || '',
            camp_offcer_id_examiner: basicData?.camp_offcer_id_examiner || '',
            Examiner_type: basicData?.Examiner_type || '',
            Modal_Type: Modal_Type || '',
            Dep_Name: basicData?.Dep_Name || '',

        }


        valuationRemarksMalpractice(formData)
            .unwrap()
            .then(() => {
                setSuccessModal(true)
                setErrorModal('submitted successfully!') // You can replace this with actual success handling
                // After handling submission, you can close the modal

                setReason('')
                setSubject('')
                setDescription('')
                // Optionally, you can also reset success and error states after a delay
                setTimeout(() => {
                    setSuccessModal(false)
                    setErrorModal('')
                    onHide() // Close the modal after submission
                }, 1000)

            })
            .catch((error) => {
                setErrorModal('Failed to submit remarks. Please try again.' + (error?.data?.message || ''))
                setSuccessModal(false)
            })

    }

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            backdrop="static"
            dialogClassName="modal-top-to-bottom"
            style={{ maxWidth: '95%', margin: '0 auto' }}
        >
            <Modal.Header closeButton style={{
                backgroundColor: Modal_Type === "1" ? '#d9d8f4' : '#eac8cb ',
                borderBottom: '2px solid #73a8de',
                padding: '1.25rem'
            }}>
                <Modal.Title style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#2c3e50',
                    width: '100%'
                }}>
                    <Row>
                        <Col xs="2" style={{ borderRight: '2px solid #dee2e6', paddingRight: '1rem' }}>
                            {Modal_Type == "1" ? "Valuation Remarks" : "Malpractice Remarks"}
                        </Col>
                        <Col xs="4" style={{ paddingLeft: '1rem' }}>
                            Dummy Number - {basicData ? basicData.barcode : 'N/A'}
                        </Col>
                        <Col xs="6" style={{ borderRight: '2px solid #dee2e6', paddingRight: '1rem', fontSize: '0.85rem' }}>
                            Subject Code & Name - {basicData ? `${basicData.sub_code} - ${subjectName || 'N/A'}` : 'N/A'}
                        </Col>

                    </Row>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                padding: '1.5rem',
                backgroundColor: '#ffffff'
            }}>
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body style={{ padding: '1.5rem' }}>
                        <Form onSubmit={formSubmit} id="remarks-form">
                           
                                <Row className="mb-4">
                                    <Row className="mb-4">
                                        {errorModal && (
                                            <Col>
                                                <div className={successModal ? 'alert alert-success' : 'alert alert-danger'} role="alert">
                                                    {errorModal}
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                    {Modal_Type === "1" && (
                                    <Col>


                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#495057',
                                                marginBottom: '0.75rem',
                                                fontSize: '0.95rem'
                                            }}>
                                                Remarks Subject <span style={{ color: '#dc3545' }}>*</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter remarks subject"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                style={{
                                                    borderRadius: '6px',
                                                    border: '1px solid #ced4da',
                                                    padding: '0.625rem 0.875rem',
                                                    fontSize: '0.95rem',
                                                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                                }}
                                                className="form-control-focus"
                                            />
                                        </Form.Group>
                                    </Col>
                                     )}
                                </Row>
                           

                            <Row className="mb-4">
                                <Col>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#495057',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.95rem'
                                        }}>
                                            Reason <span style={{ color: '#dc3545' }}>*</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            style={{
                                                borderRadius: '6px',
                                                border: '1px solid #ced4da',
                                                padding: '0.625rem 0.875rem',
                                                fontSize: '0.95rem',
                                                transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">Select a reason...</option>
                                            {reasonOptions.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>



                            <Row>
                                <Col>
                                    <Form.Group>
                                        <Form.Label style={{
                                            fontWeight: '600',
                                            color: '#495057',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.95rem'
                                        }}>
                                            Message <span style={{ color: '#dc3545' }}>*</span>
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            placeholder="Enter detailed description 200  Characters..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            style={{
                                                borderRadius: '6px',
                                                border: '1px solid #ced4da',
                                                padding: '0.625rem 0.875rem',
                                                fontSize: '0.95rem',
                                                resize: 'vertical',
                                                transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Card.Body>
                </Card>
            </Modal.Body>
            <Modal.Footer style={{
                backgroundColor: '#f8f9fa',
                borderTop: '2px solid #dee2e6',
                padding: '1rem 1.5rem',
                gap: '0.75rem'
            }}>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    style={{
                        padding: '0.5rem 1.5rem',
                        fontWeight: '500',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant={successModal ? "success" : "primary"}
                    form="remarks-form"
                    style={{
                        padding: '0.5rem 1.5rem',
                        fontWeight: '500',
                        borderRadius: '6px',
                        backgroundColor: '#0056b3',
                        borderColor: '#0056b3',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {successModal ? 'Success! Remarks Saved' : 'Save Remarks'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default ValuationRemarksModal