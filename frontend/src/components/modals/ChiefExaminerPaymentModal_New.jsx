import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Table, Badge, Row, Col } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaCalendarAlt, FaRupeeSign, FaCheckCircle, FaInfoCircle, FaDownload, FaPrint } from 'react-icons/fa';
import { toast, ToastContainer, } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import PaymentReportPDF from '../templates/PaymentReportPDF';
import { useGetChiefEvaluatorDetailsSubjectCountQuery, usePostExaminerPaymentChallanMutation, useChiefEvaluatorPaymentUpdateMutation } from '../../redux-slice/userDashboardSlice'
import { useSelector } from 'react-redux';




const ChiefExaminerPaymentModal = ({ show, onHide, paymentData }) => {

    const navigate = useNavigate();

    const [postExaminerPaymentChallan, { isLoading: isPosting }] = usePostExaminerPaymentChallanMutation();
    const [updateChiefEvaluatorPayment, { isLoading: isUpdating }] = useChiefEvaluatorPaymentUpdateMutation();
    const [daAmount, setDaAmount] = React.useState(0);
    const [taAmount, setTaAmount] = React.useState(0);
    const [maxSubcodeCnt, setMaxSubcodeCnt] = React.useState(0);

    const monthyearInfo = useSelector((state) => state.auth.monthyearInfo);
    const ExamYearMonth = useSelector((state) => {
        const activeMonthYear = Array.isArray(monthyearInfo)
            ? monthyearInfo.find((m) => m.Month_Year_Status === 'Y')
            : null;
        return activeMonthYear
            ? `${activeMonthYear.Eva_Month}_${activeMonthYear.Eva_Year}`
            : state.auth.userInfo?.eva_month_year;
    });


    //console.log("Subject Count Data:", subjectCountData?.importfinal) ;
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

    const printRef = useRef();
    const { data: subjectCountData, isLoading, isError } = useGetChiefEvaluatorDetailsSubjectCountQuery(
        {
            "Eva_Id": paymentData?.evaluatorId || "",
            "frmdate": formatDate(paymentData?.fromDate),
            "todate": formatDate(paymentData?.toDate),
            "examiner_type": paymentData?.examinerType || "",
            "Camp_Id": paymentData?.campId || "",
            "campOfficerId": paymentData?.campOfficerId || ""
        },
        { skip: !show || !paymentData?.evaluatorId }
    );
    useEffect(() => {
        const workingDays = subjectCountData?.importfinal?.[0]?.overall_working_days || 0;
        const daPerDay = parseInt(paymentData?.daAmount) || 0;
        const additionalAmt = parseInt(paymentData?.additionalAmount) || 0;

        setDaAmount(daPerDay * (subjectCountData?.subcodeSummary?.sumSubcodeDay || 0));
        setTaAmount(additionalAmt);

    }, [paymentData?.daAmount, subjectCountData?.importfinal, paymentData?.additionalAmount]);

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

        alert('Download PDF functionality is not implemented yet. This will be available in a future update.');

        // You can integrate libraries like html2pdf, jsPDF, or react-pdf here
        // For now, we'll trigger print dialog which allows "Save as PDF"
        // handlePrint();
    };


    //Payment Update Logic

    const handlePostExaminerPaymentChallan = async (data) => {

        try {
            const result = await updateChiefEvaluatorPayment(data).unwrap();
            toast.success(result?.message || 'Payment generated successfully');
            setTimeout(() => { show && onHide(); }, 2000); // Close modal after toast is visible
            navigate('/Evaluator/examiner-payment-report');
        } catch (error) {
            console.error("Error posting payment challan:", error);
            const errorMessage =
                error?.data?.message ||
                error?.data?.error ||
                error?.message ||
                'Failed to generate payment challan';
            toast.error(`Error: ${errorMessage}`);
        }
        // Check if result is a Blob

    }

    //Pdf Generation Logic

    // const handlePostExaminerPaymentChallan = async (data) => {
    //     try {
    //         console.log("Sending payment challan request with data:", data);
    //         const result = await postExaminerPaymentChallan(data).unwrap();
    //         console.log("Response type:", typeof result);
    //         console.log("Response:", result);

    //         // Check if result is a Blob
    //         if (result instanceof Blob) {
    //             console.log("Blob size:", result.size, "bytes");
    //             console.log("Blob type:", result.type);

    //             const fileURL = URL.createObjectURL(result);
    //             window.open(fileURL);
    //             setTimeout(() => URL.revokeObjectURL(fileURL), 100);
    //         } else {
    //             console.error("Response is not a Blob:", result);
    //             alert("Error: Response is not a valid PDF");
    //         }
    //     } catch (error) {
    //         console.error("Error posting payment challan:", error);
    //         console.error("Error status:", error.status);
    //         console.error("Error data:", error.data);
    //         console.error("Error originalStatus:", error.originalStatus);

    //         // Extract error message
    //         let errorMessage = 'Failed to generate payment challan';
    //         if (error.data) {
    //             if (typeof error.data === 'string') {
    //                 errorMessage = error.data;
    //             } else if (error.data.message) {
    //                 errorMessage = error.data.message;
    //             } else if (error.data.error) {
    //                 errorMessage = error.data.error;
    //             }
    //         } else if (error.message) {
    //             errorMessage = error.message;
    //         }

    //         alert(`Error: ${errorMessage}\n\nCheck console for details.`);
    //     }
    // };


    //       const PrintPdf = async () => {
    //     try {
    //       console.log("Generating PDF for:", papers);

    //       const pdfData = {
    //         papers: papers,
    //         evaluatorId: selectedId.Evaluator_Id,
    //         evaluatorName: userInfo?.name,
    //         checkDate: selectedId.check_date
    //       };

    //       const blob = await generatePdf(pdfData).unwrap();

    //       const fileURL = URL.createObjectURL(blob);
    //       window.open(fileURL);

    //       // Cleanup the object URL after a delay
    //       setTimeout(() => URL.revokeObjectURL(fileURL), 100);
    //     } catch (error) {
    //       console.error("Error generating PDF:", error);
    //       alert(`Failed to generate PDF: ${error.message || error.data?.message || 'Unknown error'}`);
    //     }
    //   };




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
                        padding: 15px;
                        margin: 15px;
                        margin-bottom: 10px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }

                    .info-card-modal h6 {
                        color: #667eea;
                        font-weight: 700;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 1.1rem;
                        padding-bottom: 8px;
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
                        margin: 15px;
                        margin-top: 10px;
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
                        padding: 15px;
                        color: white;
                        margin: 15px;
                        margin-top: 10px;
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
                <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaFileInvoiceDollar />
                        Payment Report Report Chief
                        <span className="date-range-badge">
                            <FaCalendarAlt size={14} />
                            {formatDate(fromDate)} - {formatDate(toDate)}
                        </span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Report Header */}
                    {/* <div className="info-card-modal" style={{ marginBottom: '15px' }}>
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
                    </div> */}

                    {/* Evaluator Information */}
                    <div className="info-card-modal">
                        <h6>
                            <FaInfoCircle />
                            Evaluator Information
                        </h6>
                        <Row>
                            <Col md={4}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Evaluator ID:</span>
                                    <span className="info-value-modal">{evaluatorId || 'N/A'}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Evaluator Name:</span>
                                    <span className="info-value-modal">{evaluatorName || bankDetails?.EMPLOYEE_NAME || 'N/A'}</span>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Report Period:</span>
                                    <span className="info-value-modal">{formatDate(fromDate)} to {formatDate(toDate)}</span>
                                </div>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Total Days:</span>
                                    <span className="info-value-modal">{subjectCountData?.importfinal?.[0]?.overall_working_days || 'N/A'}</span>
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Camp & Officer Id:</span>
                                    <span className="info-value-modal">{` ${paymentData?.campId} - ${paymentData?.campOfficerId}`}</span>
                                </div>
                                {/* <div className="info-row-modal">
                                    <span className="info-label-modal">Total Records:</span>
                                    <span className="info-value-modal">{valuationRecords.length}</span>
                                </div> */}
                            </Col>
                        </Row>
                    </div>

                    {/* Examiner Type & Travelling Details Section */}
                    {paymentData?.examinerTypeSelection === 2 && (
                        <div className="info-card-modal" style={{ background: 'linear-gradient(135deg, #f9fbe7 0%, #f0f4c3 100%)', border: '2px solid #aed581' }}>
                            <h6 style={{ color: '#558b2f' }}>
                                <FaInfoCircle />
                                Examiner Type & Travelling Details
                            </h6>
                            <Row>
                                <Col md={6}>
                                    <div className="info-row-modal">
                                        <span className="info-label-modal">Examiner Type:</span>
                                        <span className="info-value-modal">
                                            <Badge bg={paymentData?.examinerTypeSelection === 2 ? 'success' : 'primary'}>
                                                {paymentData?.examinerTypeSelection === 2 ? 'External Examiner' : 'Internal Examiner'}
                                            </Badge>
                                        </span>
                                    </div>
                                    {paymentData?.travellingFrom && (
                                        <div className="info-row-modal">
                                            <span className="info-label-modal">Travelling From:</span>
                                            <span className="info-value-modal">{paymentData?.travellingFrom}</span>
                                        </div>
                                    )}
                                    {paymentData?.travellingTo && (
                                        <div className="info-row-modal">
                                            <span className="info-label-modal">Travelling To:</span>
                                            <span className="info-value-modal">{paymentData?.travellingTo}</span>
                                        </div>
                                    )}
                                </Col>
                                <Col md={6}>
                                    {paymentData?.department && (
                                        <div className="info-row-modal">
                                            <span className="info-label-modal">Department:</span>
                                            <span className="info-value-modal">{paymentData?.department}</span>
                                        </div>
                                    )}
                                    {paymentData?.institutionName && (
                                        <div className="info-row-modal">
                                            <span className="info-label-modal">Institution Name:</span>
                                            <span className="info-value-modal">{paymentData?.institutionName}</span>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </div>
                    )}

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
                        <div style={{ padding: '12px 15px 8px 15px', background: 'white' }}>
                            <h6 style={{ color: '#667eea', fontWeight: '700', margin: 0 }}>
                                Valuation Summary
                            </h6>
                        </div>

                        <Row style={{ padding: '15px', paddingTop: '10px' }}>
                            <Col md={12}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">Evaluated by Examiner - (10%):</span>
                                    <span className="info-value-modal">{subjectCountData?.subcodeSummary?.Examiner_10_Percent || 0}</span>
                                </div>
                            </Col>
                        </Row>

                        <Row style={{ padding: '15px', paddingTop: '10px' }}>
                            <Col md={12}>
                                <div className="info-row-modal">
                                    <span className="info-label-modal">{`Highest Paper Evaluated (${subjectCountData?.subcodeSummary?.MaxSubcodeExaminerNamePrint || 'N/A'}) - ${subjectCountData?.subcodeSummary?.MaxSubcodeEvaluatorId || 'N/A'}`}</span>
                                    <span className="info-value-modal">{subjectCountData?.subcodeSummary?.Examiner_Highest_Paper_Amount || 0}</span>
                                </div>
                            </Col>
                        </Row>

                    </div>

                    <div className="total-card-modal">
                        <h4>
                            <span>
                                <FaCheckCircle className="me-2" />
                                Total Payment Amount
                            </span>
                            <span style={{ fontSize: '1.75rem', letterSpacing: '1px' }}>
                                ₹ {((subjectCountData?.Total_Amount || 0) + (daAmount || 0) + (taAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </h4>
                        {daAmount && (
                            <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                                display: 'flex',
                                gap: '15px',
                                flexWrap: 'wrap'
                            }}>
                                <Badge
                                    bg="light"
                                    text="dark"
                                    style={{
                                        fontSize: '0.85rem',
                                        padding: '8px 15px',
                                        fontWeight: '600',
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    DA Amount: ({paymentData?.daAmount} X {subjectCountData?.subcodeSummary?.sumSubcodeDay || 0}) =  ₹ {parseFloat(daAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Badge>
                                {taAmount && (
                                    <Badge
                                        bg="light"
                                        text="dark"
                                        style={{
                                            fontSize: '0.85rem',
                                            padding: '8px 15px',
                                            fontWeight: '600',
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        Additional Amount: ₹ {parseFloat(taAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Signature Section */}
                    {/* {valuationRecords.length > 0 && (
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
                    )} */}

                    {/* Footer Note */}
                    {/* {valuationRecords.length > 0 && (
                        <div style={{ margin: '20px 25px 25px 25px', textAlign: 'center', fontSize: '12px', color: '#6c757d', borderTop: '1px solid #e9ecef', paddingTop: '15px' }}>
                            <p style={{ margin: '0 0 5px 0' }}>
                                <strong>Note:</strong> This is a computer-generated document. No signature is required.
                            </p>
                            <p style={{ margin: 0 }}>
                                © {new Date().getFullYear()} Onscreen Valuation System. All rights reserved.
                            </p>
                        </div>
                    )} */}

                    {/* Hidden Print Content */}
                    {/* <div ref={printRef} className="hidden-print">
                        <PaymentReportPDF paymentData={paymentData} />
                    </div> */}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onHide} style={{ borderRadius: '10px', padding: '10px 25px', fontWeight: '600' }}>
                        Close
                    </Button>
                    {/* {subjectCountData.length > 0 && ( */}
                    <>
                        {/* <Button className="btn-print-custom" onClick={handlePrint}>
                                <FaPrint className="me-2" />
                                Print Report
                            </Button> */}
                        <Button className="btn-download-custom" onClick={() => handlePostExaminerPaymentChallan({
                            data: paymentData,
                            subjectCountData,
                            daAmount,
                            taAmount,
                            working_days: subjectCountData?.importfinal?.[0]?.overall_working_days,
                            daTotal: daAmount,
                            Total_Amount: subjectCountData?.subcodeSummary?.Total_Amount,
                            paymentGenerated: subjectCountData?.paymentGenerated,
                            sumSubcodeDay: subjectCountData?.subcodeSummary?.sumSubcodeDay || 0,
                            sumSubcodeCnt: subjectCountData?.subcodeSummary?.sumSubcodeCnt || 0,
                            sumChiefSubcodeCnt: subjectCountData?.subcodeSummary?.sumChiefSubcodeCnt || 0,
                            MaxSubcodeCnt: subjectCountData?.subcodeSummary?.MaxSubcodeCnt || 0,
                            MaxSubcodeEvaluatorId: subjectCountData?.subcodeSummary?.MaxSubcodeEvaluatorId || 'N/A',
                            MaxSubcode: subjectCountData?.subcodeSummary?.MaxSubcode || 'N/A',
                            MaxSubcodeExaminerNamePrint: subjectCountData?.subcodeSummary?.MaxSubcodeExaminerNamePrint || 'N/A',
                            MaxSubcodeAmt: subjectCountData?.subcodeSummary?.MaxSubcodeAmt || 0,
                            MinsubcodeAmt: subjectCountData?.subcodeSummary?.MinsubcodeAmt || 0,
                            Examiner_10_Percent: subjectCountData?.subcodeSummary?.Examiner_10_Percent || 0,
                            Examiner_Highest_Paper_Amount: subjectCountData?.subcodeSummary?.Examiner_Highest_Paper_Amount || 0,
                            ExamYearMonth: ExamYearMonth


                        })} disabled={isUpdating || !subjectCountData || !subjectCountData?.paymentGenerated}>
                            {isUpdating ? 'Generating...' : <><FaDownload className="me-2" />Payment Generate</>}
                        </Button>
                    </>
                    {/* )} */}
                </Modal.Footer>
            </div>
        </Modal>
    );
};

export default ChiefExaminerPaymentModal;
