import React, { useState } from 'react'
import { useGetReviewMarkDataQuery } from '../../redux-slice/reviewapiSlice'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Table, Container, Spinner, Alert, Button, Badge, Modal } from 'react-bootstrap'
import ValuationCheifReviewRemarksModal from '../modals/ValuationCheifReviewRemarksModal'
import { useUpdateChiefRemarKDataMutation, useValuationGetMarkExaminerQuery } from '../../redux-slice/valuationApiSlice'



const ValuationChiefReviewMainRight = ({ reviewValuationData, onViewImage, basicData, BasicDataFromValuation }) => {


    const [expandedRow, setExpandedRow] = useState(null);
    const [verifiedRows, setVerifiedRows] = useState(new Set());
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.auth?.userInfo)
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
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
        Eva_Id: originalEvaluatorId,  // Original examiner who did the marking
        subcode: subcode,
        Dep_Name: deptname,
        Eva_Mon_Year: eva_month_year,
        valuation_type: depNaameFormatted,
        Examiner_type: '2'  // '2' for examiner (not '1' chief) - we're fetching examiner's marks
    });


    const { data: examinerTotalMarksData, isLoading: isLoadingExaminerTotalMarks, error: errorExaminerTotalMarks } = useValuationGetMarkExaminerQuery({
        
        
        barcode: batchname,
        Eva_Id: originalEvaluatorId,  // Original examiner who did the marking
        subcode: subcode,
        valuation_type: depNaameFormatted,
        
    });






    const handleViewClick = (index, pageNo) => {
        // Safety check
        if (!marksData || index < 0 || index >= marksData.length) {
            console.error('Invalid index or marksData not available');
            return;
        }
        // console.log(marksData[index], "Clicked mark data for viewing image");
        // alert( `You clicked to view image for Question ${marksData[index].qbno} on Page ${pageNo}`);
        const item = marksData[index];

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
        // Navigate back without special state since no action was taken
        navigate("/valuation/chief-valuation-review")
    }

    const [updateChiefRemarKData, { isLoading: isUpdatingChiefRemark }] = useUpdateChiefRemarKDataMutation();
    const acceptHandler = async () => {

        try {
            const payload = {};

            payload.barcode = batchname;
            payload.subcode = subcode;
            payload.Eva_Id = userInfo?.username;
            payload.Eva_Mon_Year = eva_month_year;
            payload.valuation_type = depNaameFormatted;
            payload.Dep_Name = deptname;
            payload.Examiner_type = ExaminerType;
            payload.Examiner_Eva_id = originalEvaluatorId || reviewValuationData?.finalPaperData?.Evaluator_Id || Dashboard_Data?.Eva_Id || "N/A";
            payload.Chief_Flg = "Y";
            payload.description = "";


            const response = await updateChiefRemarKData(payload).unwrap();

            // Navigate back with state to trigger refresh
            navigate("/valuation/chief-valuation-review", {
                state: { refreshData: true, timestamp: Date.now() }
            });

        } catch (err) {
            console.error("Error in acceptHandler:", err);
            alert("Failed to accept review: " + (err?.data?.message || err.message || "Unknown error"));
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
                        CHIEF REVIEW - EXAMINER VALUATION
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
                            <strong style={{ fontWeight: '700' }}>Examiner Name :</strong> {valuaton_Data_basic?.chief_examiner_name} {`(${valuaton_Data_basic?.Evaluator_Id})`}
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

            <ValuationCheifReviewRemarksModal
                show={showRemarksModal}
                onHide={() => setShowRemarksModal(false)}
                basicData={{
                    ...BasicDataFromValuation,
                    valuation_type: depNaameFormatted,
                    Examiner_Eva_id: originalEvaluatorId
                }}
                Modal_Type="1"
            />

            {/* Accept Confirmation Modal */}
            <Modal show={showAcceptConfirmModal} onHide={() => setShowAcceptConfirmModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#d4edda', borderBottom: '3px solid #28a745' }}>
                    <Modal.Title style={{ color: '#155724', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>✓</span>
                        <span>Confirm Acceptance</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                        <p style={{ margin: 0, color: '#333', marginBottom: '1rem' }}>
                            Are you sure you want to <strong style={{ color: '#28a745', fontSize: '1.15rem' }}>ACCEPT</strong> this valuation?
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                            Dummy Number: <strong>{basicData?.barcode || '—'}</strong>
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', padding: '1rem 1.5rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowAcceptConfirmModal(false)}
                        style={{
                            padding: '0.5rem 2rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(108, 117, 125, 0.2)'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => {
                            setShowAcceptConfirmModal(false);
                            acceptHandler();
                        }}
                        style={{
                            padding: '0.5rem 2rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                        }}
                    >
                        Confirm Accept
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
                {/* Action Buttons Row - Always visible */}
                <div className="row g-2 mb-2">
                    <div className="col-6">
                        <Button
                            size="lg"
                            disabled={verifiedRows.size < marksData.length}
                            style={{
                                background: verifiedRows.size < marksData.length
                                    ? '#6c757d'
                                    : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                border: '3px solid #1a1a1a',
                                color: 'white',
                                fontWeight: '700',
                                padding: '14px 20px',
                                borderRadius: '15px',
                                fontSize: '1rem',
                                boxShadow: verifiedRows.size < marksData.length
                                    ? '0 4px 12px rgba(108, 117, 125, 0.4)'
                                    : '0 4px 12px rgba(40, 167, 69, 0.4)',
                                transition: 'all 0.2s ease',
                                width: '100%',
                                opacity: verifiedRows.size < marksData.length ? 0.6 : 1,
                                cursor: verifiedRows.size < marksData.length ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (verifiedRows.size === marksData.length) {
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (verifiedRows.size === marksData.length) {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                                }
                            }}
                            onClick={() => setShowAcceptConfirmModal(true)}
                        >
                            ACCEPT {verifiedRows.size < marksData.length && `(${verifiedRows.size}/${marksData.length})`}
                        </Button>
                    </div>
                    <div className="col-6">
                        <Button
                            size="lg"
                            style={{
                                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                border: '3px solid #1a1a1a',
                                color: 'white',
                                fontWeight: '700',
                                padding: '14px 20px',
                                borderRadius: '15px',
                                fontSize: '1rem',
                                boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
                                transition: 'all 0.2s ease',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.02)';
                                e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                            }}
                            onClick={() => setShowRemarksModal(true)}
                        >
                            REJECT
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

export default ValuationChiefReviewMainRight;
