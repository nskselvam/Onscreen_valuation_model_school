import React, { useState } from 'react'
import { Modal, Button, Row, Col, Form, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useUpdateChiefRemarKDataMutation } from '../../redux-slice/valuationApiSlice'
import { useSelector } from 'react-redux'

const ValuationCheifReviewRemarksModal = ({ show, onHide, basicData, Modal_Type }) => {
    const [description, setDescription] = useState('')
    const [errorModal, setErrorModal] = useState('')
    const [successModal, setSuccessModal] = useState(false)
    const [updateChiefRemarKData] = useUpdateChiefRemarKDataMutation()
    const navigate = useNavigate()

    const userInfo = useSelector((state) => state.auth.userInfo);


    const formSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            setErrorModal('Please enter a message.')
            return
        }

        try {
            const payload = {
                evaluator_name: userInfo?.name || 'Unknown Evaluator',
                barcode: basicData.barcode,
                subcode: basicData.sub_code,
                Eva_Id: userInfo?.username,
                Eva_Mon_Year: basicData.Eva_Mon_Year,
                valuation_type: basicData.valuation_type,
                Dep_Name: basicData.Dep_Name,
                Examiner_type: basicData.Examiner_type,
                Examiner_Eva_id: basicData.Examiner_Eva_id,
                Chief_Flg: "N",
                remarks: description
            }

            
          const response = await updateChiefRemarKData(payload).unwrap();
            
            setSuccessModal(true)
            setErrorModal('Submitted successfully!')
            setDescription('')
            
            setTimeout(() => {
                setSuccessModal(false)
                setErrorModal('')
                onHide()
                // Navigate with state to trigger refresh
                navigate("/valuation/chief-valuation-review", { 
                    state: { refreshData: true, timestamp: Date.now() } 
                })
            }, 1000)
        } 
        catch (err) {
            console.error("Error in formSubmit:", err);
            setErrorModal('Failed to submit remarks. Please try again: ' + (err?.data?.message || err.message || ''))
            setSuccessModal(false)
        }
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
                            Subject Code & Name - {basicData ? `${basicData.sub_code} - ${basicData.sub_name}` : 'N/A'}
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
                                {errorModal && (
                                    <Col>
                                        <div className={successModal ? 'alert alert-success' : 'alert alert-danger'} role="alert">
                                            {errorModal}
                                        </div>
                                    </Col>
                                )}
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

export default ValuationCheifReviewRemarksModal