import React, { useState, useEffect, useCallback } from 'react'
import { useGetReviewMarkDataQuery } from '../../redux-slice/reviewapiSlice'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Table, Container, Spinner, Button, Modal } from 'react-bootstrap'
import { useValuationGetMarkExaminerQuery } from '../../redux-slice/valuationApiSlice'
import { useLazyGetMcqPdfQuery } from '../../redux-slice/mcqOperationSlice'
import { BASE_URL } from '../../constraint/constraint'



const ValuationStudentReviewRight = ({ reviewValuationData, onViewImage, basicData, BasicDataFromValuation }) => {


    const [expandedRow, setExpandedRow] = useState(null);
    const [verifiedRows, setVerifiedRows] = useState(new Set());
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.auth?.userInfo)
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAction, setReviewAction] = useState(null); // 1 = Accept, 2 = Not Accept
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMcqModal, setShowMcqModal] = useState(false);
    const [mcqPdfUrl, setMcqPdfUrl] = useState(null);
    const [triggerMcqPdf, { data: mcqPdfBlob, isLoading: mcqPdfLoading, error: mcqPdfError }] = useLazyGetMcqPdfQuery();

    // Create/revoke blob URL when PDF data arrives
    useEffect(() => {
        if (mcqPdfBlob instanceof Blob) {
            const url = URL.createObjectURL(mcqPdfBlob);
            setMcqPdfUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [mcqPdfBlob]);

    // Cleanup blob URL when modal closes
    const handleCloseMcqModal = useCallback(() => {
        setShowMcqModal(false);
        if (mcqPdfUrl) {
            URL.revokeObjectURL(mcqPdfUrl);
            setMcqPdfUrl(null);
        }
    }, [mcqPdfUrl]);

    const valuaton_Data_basic = useSelector(state => state.valuaton_Data_basic.chiefValuationData)
      const valuaton_Data_basic1 = useSelector(state => state.valuaton_Data_basic)


    console.log("Review Valuation Data in Main Right Component:", valuaton_Data_basic1);


    const batchname = reviewValuationData?.finalPaperData?.batchname || reviewValuationData?.finalPaperData?.barcode
    const deptname = userInfo?.selected_course || reviewValuationData?.finalPaperData?.Dep_Name || "01"
    const subcode = reviewValuationData?.finalPaperData?.subcode
    const eva_month_year = BasicDataFromValuation.Eva_Mon_Year || reviewValuationData?.finalPaperData?.Eva_Mon_Year || "Nov_2025"

    const ExaminerType = useSelector(state => state.auth?.userInfo.selected_role)
    const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);

    BasicDataFromValuation.Eva_id = userInfo?.username || reviewValuationData?.finalPaperData?.Evaluator_Id || Dashboard_Data?.Eva_Id || "N/A";

    // For chief review, get valuation_type from chiefBarcodeData since Dashboard_Data is null for chiefs
    const chiefBarcodeData = reviewValuationData?.chiefBarcodeData;
    const depNaameFormatted = chiefBarcodeData?.data?.Chief_Eva_subject_dashboard ||
        Dashboard_Data?.Eva_subject_dashboard ||
        reviewValuationData?.finalPaperData?.Chief_Eva_subject_dashboard ||
        "1";



    // For chief review, fetch marks entered by the original examiner (not the current chief user)
    const originalEvaluatorId = reviewValuationData?.finalPaperData?.Evaluator_Id ||
        chiefBarcodeData?.data?.Evaluator_Id;


    const { data: reviewMarkData, isLoading, error } = useGetReviewMarkDataQuery({
        barcode: batchname,
        Eva_Id: originalEvaluatorId,
        subcode: subcode,
        Dep_Name: deptname,
        Eva_Mon_Year: eva_month_year,
        valuation_type: depNaameFormatted,
        Examiner_type: '2'
    }, { skip: !batchname || !originalEvaluatorId || !subcode });


    const { data: examinerTotalMarksData } = useValuationGetMarkExaminerQuery({
        barcode: batchname,
        Eva_Id: originalEvaluatorId,
        subcode: subcode,
        valuation_type: depNaameFormatted,
    }, { skip: !batchname || !originalEvaluatorId || !subcode });






    const handleViewClick = (index, pageNo) => {
        // Safety check
        if (!marksData || index < 0 || index >= marksData.length) {
            console.error('Invalid index or marksData not available');
            return;
        }
        // console.log(marksData[index], "Clicked mark data for viewing image");
        // alert( `You clicked to view image for Question ${marksData[index].qbno} on Page ${pageNo}`);
        // Mark as verified
        setVerifiedRows(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
        });

        // Call parent callback to update center image
        // Handle NA, null, undefined, or invalid page numbers
        if (onViewImage && pageNo) {
            // Check if pageNo is "NA" or not a valid number
            const pageNumber = String(pageNo).toUpperCase() === 'NA' ? 1 : Number(pageNo);
            // Only call if we have a valid number
            if (!isNaN(pageNumber)) {
                onViewImage(pageNumber);
            }
        }

        if (expandedRow === index) {
            setExpandedRow(null);
        } else {
            setExpandedRow(index);
        }
    };

    const deleteDispatch = () => {
        navigate("/valuation/chief-valuation-review");
    };

    const handleReviewSubmit = async () => {
        if (!reviewAction) return;
        setIsSubmitting(true);
        try {
            const params = new URLSearchParams({
                reviewStatus: reviewAction,
                Dummy_NO: batchname,
                SubjectCode: subcode,
            });
            const response = await fetch(`${BASE_URL}/api/student-review/update-review-status?${params}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to update review status');
            setShowReviewModal(false);
            navigate("/valuation/chief-valuation-review", {
                state: { refreshData: true, timestamp: Date.now() }
            });
        } catch (err) {
            console.error("Error submitting review:", err);
            alert("Failed to submit review: " + (err.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isVerified = (index) => verifiedRows.has(index);

    if (!batchname) {
        return (
            <Container className="mt-4">
                <div style={{
                    background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                    borderRadius: '20px',
                    padding: '40px',
                    border: '4px solid #1a1a1a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    textAlign: 'center'
                }}>
                    <h4 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>⚠️ No Paper Data</h4>
                    <p style={{ color: '#856404', fontSize: '1.05rem', marginBottom: 0 }}>Paper data not available for review.</p>
                </div>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container className="mt-4 text-center">
                <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    borderRadius: '20px',
                    padding: '50px',
                    border: '4px solid #1a1a1a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    <Spinner animation="border" role="status" style={{ width: '60px', height: '60px', color: '#1976d2' }}>
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-4 fw-bold" style={{ fontSize: '1.2rem', color: '#0d47a1' }}>Loading review marks...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        console.error("Review Mark Data Error:", error);
        console.error("Query parameters used:", {
            barcode: batchname,
            Eva_Id: userInfo?.username,
            subcode: subcode,
            Dep_Name: deptname,
            Eva_Mon_Year: eva_month_year,
            valuation_type: depNaameFormatted,
            Examiner_type: ExaminerType
        });
        return (
            <Container className="mt-4">
                <div style={{
                    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                    borderRadius: '20px',
                    padding: '40px',
                    border: '4px solid #1a1a1a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    textAlign: 'center'
                }}>
                    <h4 className="fw-bold mb-3" style={{ color: '#721c24' }}>❌ Error Loading Data</h4>
                    <p style={{ color: '#721c24', fontSize: '1.05rem' }}>Failed to load review marks. Please try again.</p>
                    {error?.data?.message && <p className="mb-0 mt-2 small" style={{ color: '#721c24', opacity: 0.8 }}>{error.data.message}</p>}
                </div>
            </Container>
        );
    }

    const marksData = reviewMarkData?.data || [];
    const allViewed = marksData.length > 0 && verifiedRows.size >= marksData.length;



    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#2c5aa0'
        }}>
            {/* Scrollable Content */}
            <Container fluid className="p-4" style={{
                flex: 1,
                overflowY: 'auto',
                background: '#2c5aa0',
                paddingBottom: '20px'
            }}>

                {/* Header Title */}
                <div style={{
                    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                    borderRadius: '20px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '4px solid #1a1a1a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    <h4 className="text-center text-white fw-bold mb-0" style={{
                        fontSize: '1.5rem',
                        letterSpacing: '1px'
                    }}>
                        STUDENT REVIEW PANEL
                    </h4>
                </div>

                {/* Info Card */}
                <div className="mb-4">
                    <div style={{
                        background: 'linear-gradient(135deg, #e8f4f8 0%, #d4e9f2 100%)',
                        borderRadius: '20px',
                        padding: '24px 28px',
                        border: '4px solid #1a1a1a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <p className="mb-2" style={{ fontSize: '1.05rem', color: '#1a1a1a', lineHeight: '1.8' }}>
                            <strong style={{ fontWeight: '700' }}>Examiner Name :</strong>{' '}
                            {valuaton_Data_basic?.chief_examiner_name || basicData?.Eva_Name || reviewValuationData?.finalPaperData?.FACULTY_NAME || '—'}
                            {' '}({valuaton_Data_basic?.Evaluator_Id || originalEvaluatorId || BasicDataFromValuation?.Eva_id || '—'})
                        </p>
                        <p className="mb-2" style={{ fontSize: '1.05rem', color: '#1a1a1a', lineHeight: '1.8' }}>
                            <strong style={{ fontWeight: '700' }}>Course Code & Title :</strong> {basicData?.sub_code || userInfo?.subcode || '—'} - {basicData?.sub_name}
                        </p>
                        <p className="mb-0" style={{ fontSize: '1.05rem', color: '#1a1a1a', lineHeight: '1.8' }}>
                            <strong style={{ fontWeight: '700' }}>Dummy Number :</strong> {basicData?.barcode || '—'}
                        </p>
                        <p>
                            <strong style={{ fontWeight: '700' }}>Total Marks :</strong> {examinerTotalMarksData?.data?.tot_round ?? examinerTotalMarksData?.data?.total ?? basicData?.total_marks ?? '—'}
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <button
                        style={{
                            background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
                            color: '#ffffff',
                            border: '3px solid #1a1a1a',
                            borderRadius: '15px',
                            padding: '12px 32px',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(111, 66, 193, 0.4)',
                            transition: 'all 0.2s ease',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.02)';
                            e.target.style.boxShadow = '0 6px 16px rgba(111, 66, 193, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(111, 66, 193, 0.4)';
                        }}
                        onClick={() => {
                            setMcqPdfUrl(null);
                            triggerMcqPdf({
                                eva_month_year: eva_month_year,
                                department: deptname,
                                registerno: reviewValuationData?.finalPaperData?.RegisterNo || '',
                                subcode: subcode,
                            });
                            setShowMcqModal(true);
                        }}
                    >
                        📝 MCQ
                    </button>
                </div>


                {/* Details Panel */}


                {marksData && marksData.length > 0 ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        border: '4px solid #1a1a1a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        overflow: 'hidden'
                    }}>
                        <Table striped bordered hover responsive className="mb-0" style={{ marginBottom: '0' }}>
                            <thead style={{
                                background: 'linear-gradient(135deg, #343a40 0%, #212529 100%)',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}>
                                <tr>
                                    <th className="text-center text-white" style={{ width: '100px', fontSize: '1.05rem', fontWeight: '700', padding: '16px 8px' }}>Section</th>
                                    <th className="text-center text-white" style={{ width: '80px', fontSize: '1.05rem', fontWeight: '700', padding: '16px 8px' }}>Q.No.</th>
                                    <th className="text-center text-white" style={{ width: '100px', fontSize: '1.05rem', fontWeight: '700', padding: '16px 8px' }}>Mark</th>
                                    <th className="text-center text-white" style={{ width: '80px', fontSize: '1.05rem', fontWeight: '700', padding: '16px 8px' }}>Image</th>
                                </tr>
                            </thead>
                            <tbody>
                                {marksData.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            height: '60px',
                                            backgroundColor: isVerified(index) ? '#d4edda' : 'transparent',
                                            transition: 'background-color 0.3s ease',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <td className="text-center fw-bold" style={{ padding: '12px 8px', fontSize: '1.05rem' }}>
                                            {isVerified(index) && <span style={{ color: '#28a745', marginRight: '8px', fontSize: '1.2rem' }}>✓</span>}
                                            {item.section || item.sec_id || 'A'}
                                        </td>
                                        <td className="text-center" style={{ padding: '12px 8px', fontSize: '1rem', fontWeight: '600' }}>
                                            {item.qbno}{item.SUB_SEC || item.sub_section || item.add_sub_section ? `-${item.SUB_SEC || item.sub_section || item.add_sub_section}` : ''}
                                        </td>
                                        <td className="text-center" style={{ padding: '12px 8px' }}>
                                            <span className="badge bg-success" style={{ fontSize: '1.1rem', padding: '8px 16px', fontWeight: '700' }}>
                                                {item.Marks_Get || item.mark || '0'}
                                            </span>
                                        </td>
                                        <td className="text-center" style={{ padding: '12px 8px' }}>
                                            <Button
                                                variant={isVerified(index) ? "success" : "primary"}
                                                size="sm"
                                                onClick={() => handleViewClick(index, item.Qbs_Page_No || item.page_no || '1')}
                                                style={{
                                                    fontWeight: '700',
                                                    padding: '8px 20px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.95rem',
                                                    border: '2px solid #1a1a1a',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                {expandedRow === index ? 'Hide' : 'View'}
                                            </Button>
                                        </td>
                                    </tr>

                                ))}
                            </tbody>
                        </Table>
                    </div>

                ) : (
                    <div style={{
                        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                        borderRadius: '20px',
                        padding: '40px',
                        border: '4px solid #1a1a1a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        textAlign: 'center'
                    }}>
                        <h4 className="fw-bold mb-3" style={{ color: '#1a1a1a', fontSize: '1.5rem' }}>
                            📋 No Data Found
                        </h4>
                        <p style={{ color: '#856404', fontSize: '1.1rem', marginBottom: 0 }}>
                            No review marks available for this paper.
                        </p>
                    </div>
                )}
            </Container>

            {/* Accept / Not Accept Confirmation Modal */}
            <Modal show={showReviewModal} onHide={() => !isSubmitting && setShowReviewModal(false)} centered>
                <Modal.Header
                    closeButton
                    style={{
                        backgroundColor: reviewAction === 1 ? '#d4edda' : '#f8d7da',
                        borderBottom: `3px solid ${reviewAction === 1 ? '#28a745' : '#dc3545'}`
                    }}
                >
                    <Modal.Title style={{ color: reviewAction === 1 ? '#155724' : '#721c24', fontWeight: '700' }}>
                        {reviewAction === 1 ? '✓ Confirm Accept' : '✗ Confirm Not Accept'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem', fontSize: '1.1rem' }}>
                    <p style={{ margin: 0, color: '#333', marginBottom: '1rem' }}>
                        Are you sure you want to{' '}
                        <strong style={{ color: reviewAction === 1 ? '#28a745' : '#dc3545', fontSize: '1.15rem' }}>
                            {reviewAction === 1 ? 'ACCEPT' : 'NOT ACCEPT'}
                        </strong>{' '}this paper?
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                        Dummy Number: <strong>{basicData?.barcode || batchname || '—'}</strong>
                    </p>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', padding: '1rem 1.5rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowReviewModal(false)}
                        disabled={isSubmitting}
                        style={{ padding: '0.5rem 2rem', fontWeight: '600', borderRadius: '8px' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={reviewAction === 1 ? 'success' : 'danger'}
                        onClick={handleReviewSubmit}
                        disabled={isSubmitting}
                        style={{ padding: '0.5rem 2rem', fontWeight: '600', borderRadius: '8px' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* MCQ PDF Modal */}
            <Modal show={showMcqModal} onHide={handleCloseMcqModal} centered size="xl" dialogClassName="mcq-pdf-modal">
                <Modal.Header
                    closeButton
                    style={{
                        background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
                        borderBottom: '3px solid #1a1a1a',
                        padding: '16px 24px'
                    }}
                >
                    <Modal.Title style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem' }}>
                        📝 MCQ - {reviewValuationData?.finalPaperData?.RegisterNo}_{subcode}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '0', height: '75vh' }}>
                    {mcqPdfLoading ? (
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100%' }}>
                            <Spinner animation="border" style={{ color: '#6f42c1', width: '50px', height: '50px' }} />
                            <p className="mt-3 fw-bold" style={{ color: '#6f42c1', fontSize: '1.1rem' }}>Loading MCQ PDF...</p>
                        </div>
                    ) : mcqPdfError ? (
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100%' }}>
                            <p style={{ color: '#dc3545', fontWeight: '600', fontSize: '1.2rem' }}>❌ Failed to load MCQ PDF</p>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>
                                {mcqPdfError?.data?.error || mcqPdfError?.error || 'File not found or server error. Please try again.'}
                            </p>
                        </div>
                    ) : mcqPdfUrl ? (
                        <iframe
                            src={mcqPdfUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            title="MCQ PDF Viewer"
                        />
                    ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100%' }}>
                            <p style={{ color: '#856404', fontWeight: '600', fontSize: '1.1rem' }}>📋 No MCQ PDF available.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6', padding: '12px 24px' }}>
                    <span style={{ flex: 1, fontSize: '0.9rem', color: '#666' }}>
                        File: <strong>{reviewValuationData?.finalPaperData?.RegisterNo}_{subcode}.pdf</strong>
                    </span>
                    <Button
                        variant="secondary"
                        onClick={handleCloseMcqModal}
                        style={{ padding: '8px 28px', fontWeight: '600', borderRadius: '8px' }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Fixed Bottom Section - Only for right side */}
            <div style={{
                position: 'sticky',
                bottom: '0',
                width: '100%',
                zIndex: 1000,
                background: '#2c5aa0',
                padding: '15px 20px',
                borderTop: '4px solid #1a1a1a',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.3)'
            }}>
                {/* Action Buttons Row - Accept / Not Accept */}
                <div className="row g-2 mb-2">
                    <div className="col-6">
                        <Button
                            size="lg"
                            disabled={!allViewed}
                            title={!allViewed ? `View all ${marksData.length} question images before accepting` : ''}
                            style={{
                                background: allViewed
                                    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                    : '#adb5bd',
                                border: '3px solid #1a1a1a',
                                color: 'white',
                                fontWeight: '700',
                                padding: '14px 20px',
                                borderRadius: '15px',
                                fontSize: '1rem',
                                boxShadow: allViewed ? '0 4px 12px rgba(40, 167, 69, 0.4)' : 'none',
                                transition: 'all 0.2s ease',
                                width: '100%',
                                cursor: allViewed ? 'pointer' : 'not-allowed',
                                opacity: allViewed ? 1 : 0.65,
                            }}
                            onClick={() => { if (allViewed) { setReviewAction(1); setShowReviewModal(true); } }}
                        >
                            ACCEPT {!allViewed && `(${verifiedRows.size}/${marksData.length})`}
                        </Button>
                    </div>
                    <div className="col-6">
                        <Button
                            size="lg"
                            style={{
                                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                border: '3px solid #1a1a1a',
                                color: 'white',
                                fontWeight: '700',
                                padding: '14px 20px',
                                borderRadius: '15px',
                                fontSize: '1rem',
                                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.4)',
                                transition: 'all 0.2s ease',
                                width: '100%'
                            }}
                            onClick={() => { setReviewAction(2); setShowReviewModal(true); }}
                        >
                            NOT ACCEPT
                        </Button>
                    </div>
                </div>

                {/* Back Button */}
                <div style={{
                    marginBottom: '12px'
                }}>
                    <Button
                        size="lg"
                        onClick={deleteDispatch}
                        style={{
                            background: '#dc3545',
                            border: '3px solid #1a1a1a',
                            color: 'white',
                            fontWeight: '700',
                            padding: '14px 50px',
                            borderRadius: '15px',
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 12px rgba(220, 53, 69, 0.4)',
                            transition: 'all 0.2s ease',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.02)';
                            e.target.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>‹</span> Back
                    </Button>
                </div>

                {/* Dummy Number Bar */}
                {/*    <div style={{
                    background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '3px solid #1a1a1a',
                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.4)'
                }}>
                    <h5 className="mb-0 fw-bold" style={{ 
                        color: '#1a1a1a', 
                        fontSize: '1.3rem',
                        letterSpacing: '0.5px'
                    }}>
                        Dummy Number : {basicData?.barcode || '—'}
                    </h5>
                </div> */}
            </div>
        </div>
    );
}

export default ValuationStudentReviewRight;
