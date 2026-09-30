import React, { useState } from 'react'
import { Modal, Button, Row, Col, Form, Card } from 'react-bootstrap'

const ValuationMalpracticeModal = ({ show, onHide }) => {
    const [subject, setSubject] = useState('')
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')

    const reasonOptions = [
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
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
                padding: '1.25rem'
            }}>
                <Modal.Title style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#2c3e50',
                    width: '100%'
                }}>
                    <Row>
                        <Col xs="7" style={{ borderRight: '2px solid #dee2e6', paddingRight: '1rem' }}>
                            Valuation Remarks
                        </Col>
                        <Col xs="5" style={{ paddingLeft: '1rem' }}>
                            Dummy Number - 1234567890
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
                        <Row className="mb-4">
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
                                        placeholder="Enter detailed description..."
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
                    variant="primary"
                    onClick={onHide}
                    style={{
                        padding: '0.5rem 1.5rem',
                        fontWeight: '500',
                        borderRadius: '6px',
                        backgroundColor: '#0056b3',
                        borderColor: '#0056b3',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Save Remarks
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default ValuationMalpracticeModal