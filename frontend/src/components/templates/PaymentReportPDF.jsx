import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const PaymentReportPDF = ({ paymentData }) => {
    const {
        fromDate,
        toDate,
        bankDetails,
        valuationRecords = [],
        totalAmount = 0,
        evaluatorName,
        evaluatorId,
        generatedDate = new Date()
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
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div id="payment-report-pdf" style={{ background: 'white', padding: '40px' }}>
            <style>
                {`
                    @media print {
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                        
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                        
                        #payment-report-pdf {
                            padding: 0 !important;
                        }
                        
                        .no-print {
                            display: none !important;
                        }
                    }

                    .pdf-container {
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white;
                        font-family: 'Arial', sans-serif;
                        color: #333;
                    }

                    .pdf-header {
                        border-bottom: 4px solid #667eea;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }

                    .pdf-logo {
                        font-size: 28px;
                        font-weight: 700;
                        color: #667eea;
                        margin: 0;
                    }

                    .pdf-subtitle {
                        color: #6c757d;
                        font-size: 14px;
                        margin: 5px 0 0 0;
                    }

                    .pdf-title {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        text-align: center;
                    }

                    .pdf-title h2 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 700;
                        letter-spacing: 1px;
                    }

                    .pdf-title p {
                        margin: 5px 0 0 0;
                        font-size: 14px;
                        opacity: 0.9;
                    }

                    .info-section {
                        background: #f8f9fa;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 25px;
                    }

                    .info-section h5 {
                        color: #667eea;
                        font-size: 16px;
                        font-weight: 700;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #667eea;
                    }

                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px dashed #dee2e6;
                    }

                    .info-row:last-child {
                        border-bottom: none;
                    }

                    .info-label {
                        font-weight: 600;
                        color: #495057;
                        font-size: 13px;
                    }

                    .info-value {
                        font-weight: 500;
                        color: #212529;
                        font-size: 13px;
                        text-align: right;
                    }

                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 25px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    .data-table thead {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }

                    .data-table thead th {
                        padding: 12px 10px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border: none;
                    }

                    .data-table tbody td {
                        padding: 10px;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 13px;
                    }

                    .data-table tbody tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }

                    .amount-cell {
                        font-weight: 600;
                        color: #667eea;
                    }

                    .total-section {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 25px;
                        margin-bottom: 30px;
                    }

                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 20px;
                        font-weight: 700;
                    }

                    .total-amount {
                        font-size: 28px;
                        letter-spacing: 1px;
                    }

                    .pdf-footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e9ecef;
                        text-align: center;
                        color: #6c757d;
                        font-size: 12px;
                    }

                    .signature-section {
                        margin-top: 60px;
                        display: flex;
                        justify-content: space-between;
                    }

                    .signature-box {
                        text-align: center;
                        width: 45%;
                    }

                    .signature-line {
                        border-top: 2px solid #333;
                        margin-bottom: 8px;
                        margin-top: 60px;
                    }

                    .signature-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #495057;
                    }

                    .badge-custom {
                        background: #667eea;
                        color: white;
                        padding: 4px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    .text-center-custom {
                        text-align: center;
                    }

                    .text-right-custom {
                        text-align: right;
                    }

                    .no-data {
                        text-align: center;
                        padding: 40px;
                        color: #6c757d;
                        font-style: italic;
                    }
                `}
            </style>

            <Container className="pdf-container">
                {/* Header */}
                <div className="pdf-header">
                    <Row>
                        <Col xs={8}>
                            <h1 className="pdf-logo">Onscreen Valuation</h1>
                            <p className="pdf-subtitle">Automated Examination Valuation System</p>
                        </Col>
                        <Col xs={4} style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                <div><strong>Report No:</strong> {`REP${new Date().getTime()}`}</div>
                                <div><strong>Generated:</strong> {formatDate(generatedDate)}</div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Title Section */}
                <div className="pdf-title">
                    <h2>Payment Report</h2>
                    <p>Period: {formatDate(fromDate)} to {formatDate(toDate)}</p>
                </div>

                {/* Evaluator Information */}
                <div className="info-section">
                    <h5>Evaluator Information</h5>
                    <Row>
                        <Col xs={6}>
                            <div className="info-row">
                                <span className="info-label">Evaluator ID:</span>
                                <span className="info-value">{evaluatorId || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Name:</span>
                                <span className="info-value">{evaluatorName || bankDetails?.EMPLOYEE_NAME || 'N/A'}</span>
                            </div>
                        </Col>
                        <Col xs={6}>
                            <div className="info-row">
                                <span className="info-label">Report Period:</span>
                                <span className="info-value">{formatDate(fromDate)} to {formatDate(toDate)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Total Records:</span>
                                <span className="info-value">{valuationRecords.length}</span>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Bank Details */}
                <div className="info-section">
                    <h5>Bank Account Details</h5>
                    <Row>
                        <Col xs={6}>
                            <div className="info-row">
                                <span className="info-label">Account Holder:</span>
                                <span className="info-value">{bankDetails?.EMPLOYEE_NAME || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Account Number:</span>
                                <span className="info-value">{bankDetails?.BANK_ACCOUNT_NUMBER || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Account Type:</span>
                                <span className="info-value">
                                    {bankDetails?.NATUREOFBANK ? bankDetails.NATUREOFBANK.toUpperCase() : 'N/A'}
                                </span>
                            </div>
                        </Col>
                        <Col xs={6}>
                            <div className="info-row">
                                <span className="info-label">Bank Name:</span>
                                <span className="info-value">{bankDetails?.BANK_NAME || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">IFSC Code:</span>
                                <span className="info-value">{bankDetails?.IFSC || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Branch:</span>
                                <span className="info-value">{bankDetails?.BRANCH || 'N/A'}</span>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Valuation Records Table */}
                <div style={{ marginBottom: '25px' }}>
                    <h5 style={{ color: '#667eea', marginBottom: '15px', fontWeight: '700' }}>
                        Valuation Summary
                    </h5>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>S.No</th>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th className="text-center-custom">Papers</th>
                                <th className="text-right-custom">Rate/Paper</th>
                                <th className="text-right-custom">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {valuationRecords.length > 0 ? (
                                valuationRecords.map((record, index) => (
                                    <tr key={index}>
                                        <td className="text-center-custom">{index + 1}</td>
                                        <td>
                                            <span className="badge-custom">{record.subjectCode}</span>
                                        </td>
                                        <td>{record.subjectName}</td>
                                        <td className="text-center-custom">
                                            <strong>{record.papersEvaluated}</strong>
                                        </td>
                                        <td className="text-right-custom">₹ {formatCurrency(record.ratePerPaper)}</td>
                                        <td className="text-right-custom amount-cell">
                                            ₹ {formatCurrency(record.amount)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        No valuation records found for the selected period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Total Amount */}
                {valuationRecords.length > 0 && (
                    <div className="total-section">
                        <div className="total-row">
                            <span>Total Payment Amount:</span>
                            <span className="total-amount">
                                ₹ {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Signature Section */}
                <div className="signature-section">
                    <div className="signature-box">
                        <div className="signature-line"></div>
                        <div className="signature-label">Evaluator's Signature</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-line"></div>
                        <div className="signature-label">Authorized Signature</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pdf-footer">
                    <p style={{ margin: '0 0 5px 0' }}>
                        <strong>Note:</strong> This is a computer-generated document. No signature is required.
                    </p>
                    <p style={{ margin: '0' }}>
                        © {new Date().getFullYear()} Onscreen Valuation System. All rights reserved.
                    </p>
                </div>
            </Container>
        </div>
    );
};

export default PaymentReportPDF;
