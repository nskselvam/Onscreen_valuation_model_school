import React, { useRef } from 'react';
import { Modal, Button, Table, Badge, Row, Col } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaCalendarAlt, FaRupeeSign, FaCheckCircle, FaInfoCircle, FaDownload, FaPrint } from 'react-icons/fa';
import PaymentReportPDF from '../templates/PaymentReportPDF';

const ExaminerPaymentModal = ({ show, onHide, paymentData }) => {
    const printRef = useRef();

    const {
        fromDate,
        toDate,
        bankDetails,
        valuationRecords = [],
        totalAmount = 0,
        evaluatorName,
        evaluatorId
    } = paymentData || {};

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'width=900,height=650');
        windowPrint.document.write(printContent.innerHTML);
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
    };

    const handleDownloadPDF = async () => {
        // You can integrate libraries like html2pdf, jsPDF, or react-pdf here
        // For now, we'll trigger print dialog which allows "Save as PDF"
        handlePrint();
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            size="xl"
            backdrop="static"
            dialogClassName="custom-modal-90w"
        >
            <style>
                {`
                    .custom-modal-90w {
                        max-width: 90% !important;
                    }

                    .payment-modal-custom .modal-content {
                        border: none;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    }

                    .payment-modal-custom .modal-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 16px 16px 0 0;
                        padding: 25px 30px;
                        border: none;
                    }

                    .payment-modal-custom .modal-title {
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-size: 1.5rem;
                    }

                    .payment-modal-custom .modal-body {
                        padding: 0;
                        background: #f8f9fa;
                        max-height: 75vh;
                        overflow-y: auto;
                    }

                    .payment-modal-custom .modal-footer {
                        background: white;
                        border-top: 2px solid #e9ecef;
                        padding: 20px 30px;
                        border-radius: 0 0 16px 16px;
                    }

                    .date-range-badge {
                        background: rgba(255, 255, 255, 0.2);
                        padding: 8px 15px;
                        border-radius: 20px;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        margin-left: 15px;
                        font-size: 0.9rem;
                    }

                    .info-card-modal {
                        background: white;
                        border-radius: 12px;
                        padding: 25px;
                        margin: 25px;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }

                    .info-card-modal h6 {
                        color: #667eea;
                        font-weight: 700;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 1.1rem;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #667eea;
                    }

                    .info-row-modal {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #e9ecef;
                    }

                    .info-row-modal:last-child {
                        border-bottom: none;
                    }

                    .info-label-modal {
                        color: #6c757d;
                        font-weight: 600;
                        font-size: 0.95rem;
                    }

                    .info-value-modal {
                        color: #212529;
                        font-weight: 500;
                        font-size: 0.95rem;
                        text-align: right;
                    }

                    .valuation-table-modal {
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        margin: 25px;
                        margin-top: 15px;
                    }

                    .valuation-table-modal table {
                        margin-bottom: 0;
                    }

                    .valuation-table-modal thead {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }

                    .valuation-table-modal thead th {
                        border: none;
                        padding: 15px;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        letter-spacing: 0.5px;
                    }

                    .valuation-table-modal tbody td {
                        padding: 15px;
                        vertical-align: middle;
                    }

                    .valuation-table-modal tbody tr:hover {
                        background-color: #f8f9fa;
                    }

                    .valuation-table-modal tbody tr {
                        border-bottom: 1px solid #e9ecef;
                    }

                    .total-card-modal {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 12px;
                        padding: 25px;
                        color: white;
                        margin: 25px;
                        margin-top: 15px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    }

                    .total-card-modal h4 {
                        margin: 0;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 1.5rem;
                    }

                    .btn-download-custom {
                        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                        border: none;
                        border-radius: 10px;
                        padding: 12px 25px;
                        font-weight: 600;
                        color: white;
                        transition: all 0.3s ease;
                    }

                    .btn-download-custom:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);
                        background: linear-gradient(135deg, #0d7d72 0%, #2dd365 100%);
                    }

                    .btn-print-custom {
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        border: none;
                        border-radius: 10px;
                        padding: 12px 25px;
                        font-weight: 600;
                        color: white;
                        transition: all 0.3s ease;
                        margin-right: 10px;
                    }

                    .btn-print-custom:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
                        background: linear-gradient(135deg, #e67ce7 0%, #e14054 100%);
                    }

                    .no-data-message {
                        text-align: center;
                        padding: 60px 20px;
                        color: #6c757d;
                        font-size: 1.1rem;
                    }

                    .hidden-print {
                        display: none;
                    }
                `}
            </style>
            <div className="payment-modal-custom">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaFileInvoiceDollar />
                        Payment Report
                        <span className="date-range-badge">
                            <FaCalendarAlt size={14} />
                            {formatDate(fromDate)} - {formatDate(toDate)}
                        </span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Report Header */}
                    <div className="info-card-modal" style={{ marginBottom: '15px' }}>
                        <Row>
                            <Col xs={8}>
                                <h4 style={{ color: '#667eea', fontWeight: '700', margin: '0 0 5px 0' }}>
                                    Onscreen Valuation
                                </h4>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                                    Automated Examination Valuation System
                                </p>
                            </Col>
                            <Col xs={4} style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', color: '#6c757d' }}>
                                    <div><strong>Report No:</strong> REP{new Date().getTime()}</div>
                                    <div><strong>Generated:</strong> {formatDate(new Date())}</div>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* Evaluator Information */}
                    <div className="info-card-modal">
                        <h6>
                            <FaInfoCircle />
                            Evaluator Information
                        </h6>
                        <Row>
                            <Col md={6}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Evaluator ID:</span>
                                    <span className="info-value-modal">{evaluatorId || 'N/A'}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Name:</span>
                                    <span className="info-value-modal">{evaluatorName || bankDetails?.EMPLOYEE_NAME || 'N/A'}</span>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Report Period:</span>
                                    <span className="info-value-modal">{formatDate(fromDate)} to {formatDate(toDate)}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Total Records:</span>
                                    <span className="info-value-modal">{valuationRecords.length}</span>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* Bank Details Section */}
                    <div className="info-card-modal">
                        <h6>
                            <FaInfoCircle />
                            Bank Account Details
                        </h6>
                        <Row>
                            <Col md={6}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Account Holder:</span>
                                    <span className="info-value-modal">{bankDetails?.EMPLOYEE_NAME || 'N/A'}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Account Number:</span>
                                    <span className="info-value-modal">{bankDetails?.BANK_ACCOUNT_NUMBER || 'N/A'}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Account Type:</span>
                                    <span className="info-value-modal">
                                        {bankDetails?.NATUREOFBANK ? bankDetails.NATUREOFBANK.toUpperCase() : 'N/A'}
                                    </span>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Bank Name:</span>
                                    <span className="info-value-modal">{bankDetails?.BANK_NAME || 'N/A'}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">IFSC Code:</span>
                                    <span className="info-value-modal">{bankDetails?.IFSC || 'N/A'}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Branch:</span>
                                    <span className="info-value-modal">{bankDetails?.BRANCH || 'N/A'}</span>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* Valuation Records Table */}
                    <div className="valuation-table-modal">
                        <div style={{ padding: '20px 25px 10px 25px', background: 'white' }}>
                            <h6 style={{ color: '#667eea', fontWeight: '700', margin: 0 }}>
                                Valuation Summary
                            </h6>
                        </div>
                        <Table responsive>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>S.No</th>
                                    <th>Subject Code</th>
                                    <th>Subject Name</th>
                                    <th className="text-center">Papers</th>
                                    <th className="text-end">Rate/Paper</th>
                                    <th className="text-end">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {valuationRecords.length > 0 ? (
                                    valuationRecords.map((record, index) => (
                                        <tr key={index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>
                                                <Badge bg="primary" style={{ fontSize: '0.85rem', padding: '5px 10px' }}>
                                                    {record.subjectCode}
                                                </Badge>
                                            </td>
                                            <td>{record.subjectName}</td>
                                            <td className="text-center">
                                                <strong style={{ fontSize: '1rem' }}>{record.papersEvaluated}</strong>
                                            </td>
                                            <td className="text-end">₹ {formatCurrency(record.ratePerPaper).replace('₹', '').trim()}</td>
                                            <td className="text-end">
                                                <strong style={{ color: '#667eea', fontSize: '1.05rem' }}>
                                                    ₹ {formatCurrency(record.amount).replace('₹', '').trim()}
                                                </strong>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data-message">
                                            <FaInfoCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                            <div>No valuation records found for the selected date range</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Total Amount Card */}
                    {valuationRecords.length > 0 && (
                        <div className="total-card-modal">
                            <h4>
                                <span>
                                    <FaCheckCircle className="me-2" />
                                    Total Payment Amount
                                </span>
                                <span style={{ fontSize: '1.75rem', letterSpacing: '1px' }}>
                                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </h4>
                        </div>
                    )}

                    {/* Signature Section */}
                    {valuationRecords.length > 0 && (
                        <div style={{ margin: '25px', marginTop: '40px', marginBottom: '15px' }}>
                            <Row>
                                <Col xs={6} style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '2px solid #333', marginBottom: '8px', marginTop: '60px', marginLeft: '20%', marginRight: '20%' }}></div>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                                        Evaluator's Signature
                                    </div>
                                </Col>
                                <Col xs={6} style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '2px solid #333', marginBottom: '8px', marginTop: '60px', marginLeft: '20%', marginRight: '20%' }}></div>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                                        Authorized Signature
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {/* Footer Note */}
                    {valuationRecords.length > 0 && (
                        <div style={{ margin: '20px 25px 25px 25px', textAlign: 'center', fontSize: '12px', color: '#6c757d', borderTop: '1px solid #e9ecef', paddingTop: '15px' }}>
                            <p style={{ margin: '0 0 5px 0' }}>
                                <strong>Note:</strong> This is a computer-generated document. No signature is required.
                            </p>
                            <p style={{ margin: 0 }}>
                                © {new Date().getFullYear()} Onscreen Valuation System. All rights reserved.
                            </p>
                        </div>
                    )}

                    {/* Hidden Print Content */}
                    <div ref={printRef} className="hidden-print">
                        <PaymentReportPDF paymentData={paymentData} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onHide} style={{ borderRadius: '10px', padding: '10px 25px', fontWeight: '600' }}>
                        Close
                    </Button>
                    {valuationRecords.length > 0 && (
                        <>
                            <Button className="btn-print-custom" onClick={handlePrint}>
                                <FaPrint className="me-2" />
                                Print Report
                            </Button>
                            <Button className="btn-download-custom" onClick={handleDownloadPDF}>
                                <FaDownload className="me-2" />
                                Download PDF
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </div>
        </Modal>
    );
};

export default ExaminerPaymentModal;
