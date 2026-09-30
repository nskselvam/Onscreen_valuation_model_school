import React, { useState } from 'react'
import { useGetReviewMarkDataQuery } from '../../redux-slice/reviewapiSlice'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Table, Container, Spinner, Alert, Button, Badge } from 'react-bootstrap'


const ValuationChiefReviewRight = ({reviewValuationData, onViewImage, basicData}) => {
 
    const [expandedRow, setExpandedRow] = useState(null);
    const [verifiedRows, setVerifiedRows] = useState(new Set());
    const navigate = useNavigate();

    const batchname = reviewValuationData?.finalPaperData?.batchname || reviewValuationData?.finalPaperData?.barcode
    const deptname = reviewValuationData?.finalPaperData?.Dep_Name || reviewValuationData?.finalPaperData?.department || "01"
    const subcode = reviewValuationData?.finalPaperData?.subcode
    const eva_month_year = reviewValuationData?.finalPaperData?.Eva_Mon_Year || "May_2026"
    const evaluatorId = reviewValuationData?.finalPaperData?.Evaluator_Id // The examiner who did the valuation
    
    // For CHIEF REVIEW, we need to fetch marks entered by the EXAMINER
    // Examiners use Examiner_type="2", Chiefs use "1"
    // So for chief review, we query with Examiner_type="2" to get examiner's marks
    const examinerType = "2"; // Always "2" for getting examiner's original valuation marks
    const valuationType = reviewValuationData?.finalPaperData?.Chief_Eva_subject_dashboard || "1"
    const userInfo = useSelector(state => state.auth?.userInfo)

    const { data: reviewMarkData, isLoading, error } = useGetReviewMarkDataQuery({
        barcode: batchname,
        Eva_Id: evaluatorId, // Use examiner's ID, not chief's ID
        subcode: subcode,
        Dep_Name: deptname,
        Eva_Mon_Year: eva_month_year,
        valuation_type: valuationType,
        Examiner_type: examinerType
    }, { skip: !batchname || !subcode || !evaluatorId });

    const handleViewClick = (index, pageNo) => {
        // Safety check
        if (!marksData || index < 0 || index >= marksData.length) {
            console.error('Invalid index or marksData not available');
            return;
        }
        
        const item = marksData[index];
        
        // Mark as verified
        setVerifiedRows(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
        });
        
        // Call parent callback to update center image
        if (onViewImage && pageNo) {
            onViewImage(Number(pageNo));
        }
        
        if (expandedRow === index) {
            setExpandedRow(null);
        } else {
            setExpandedRow(index);
        }
    };

    const deleteDispatch = () => {
        navigate("/valuation/chief-valuation-review")
    }

    const isVerified = (index) => verifiedRows.has(index);

    if (!batchname) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">
                    <Alert.Heading>No Paper Data</Alert.Heading>
                    <p>Paper data not available for review.</p>
                </Alert>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading review marks...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    <Alert.Heading>Error Loading Data</Alert.Heading>
                    <p>Failed to load review marks. Please try again.</p>
                </Alert>
            </Container>
        );
    }

    const marksData = reviewMarkData?.data || [];

    return (
        <Container fluid className="p-3" style={{ height: '100vh', overflowY: 'auto', background: '#f8f9fa' }}>
            <div className="mb-4">
                <div className='val_right_design_3'>
                    <span className='val_right_text_1'>Examiner Name:</span> {evaluatorId || '—'}
                    <br />
                    <span className='val_right_text_1'>Course Code & Title:</span> {subcode || '—'}
                    <br />
                    <span className='val_right_text_1'>Dummy Number:</span> {batchname || '—'}
                    <br />
                    <span className='val_right_text_1'>Evaluation Month:</span> {eva_month_year || '—'}
                </div>

                <div className="d-flex justify-content-end mt-3">
                    <Button 
                        variant="outline-secondary" 
                        size="md"
                        onClick={deleteDispatch}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '500',
                            padding: '0.5rem 1.25rem',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateX(-3px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateX(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>←</span> Back
                    </Button>
                </div>
            </div>

            {marksData && marksData.length > 0 ? (
                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Table striped bordered hover responsive className="mb-0">
                        <thead className="table-dark sticky-top">
                            <tr>
                                <th className="text-center" style={{ width: '100px' }}>Section</th>
                                <th className="text-center" style={{ width: '80px' }}>Q.No.</th>
                                <th className="text-center" style={{ width: '100px' }}>Mark</th>
                                <th className="text-center" style={{ width: '80px' }}>Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marksData.map((item, index) => (
                                <tr 
                                    key={item.id} 
                                    style={{ 
                                        height: '50px',
                                        backgroundColor: isVerified(index) ? '#d4edda' : 'transparent',
                                        transition: 'background-color 0.3s ease'
                                    }}
                                >
                                    <td className="text-center fw-bold">
                                        {isVerified(index) && <span style={{ color: '#28a745', marginRight: '5px' }}>✓</span>}
                                        {item.section || item.sec_id || 'A'}
                                    </td>
                                    <td className="text-center">{item.qbno}</td>
                                    <td className="text-center">
                                        <span className="badge bg-success fs-6">{item.Marks_Get || item.mark || '0'}</span>
                                    </td>
                                    <td className="text-center">
                                        <Button 
                                            variant={isVerified(index) ? "success" : "outline-primary"}
                                            size="sm"
                                            onClick={() => handleViewClick(index, item.Qbs_Page_No || item.page_no || '1')}
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
                <Alert variant="info">
                    <Alert.Heading>No Marks Data Available</Alert.Heading>
                    <p>No valuation marks found for this paper.</p>
                    <hr />
                    <div style={{ fontSize: '0.9rem' }}>
                        <p className="mb-2"><strong>Paper Details:</strong></p>
                        <ul>
                            <li>Barcode: <code>{batchname}</code></li>
                            <li>Subject: <code>{subcode}</code></li>
                            <li>Evaluator ID: <code>{evaluatorId}</code></li>
                            <li>Department: <code>{deptname}</code></li>
                        </ul>
                        <p className="mb-0 text-muted">
                            This could mean the examiner hasn't valued this paper yet, or the marks are stored with different parameters.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Details Panel */}
            {expandedRow !== null && marksData[expandedRow] && (
                <div className="mt-4 p-4" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h6 className="mb-3">📊 Details - Question {marksData[expandedRow].qbno}</h6>
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>Section:</strong> {marksData[expandedRow].section || marksData[expandedRow].sec_id || 'A'}</p>
                            <p><strong>Question No:</strong> {marksData[expandedRow].qbno}</p>
                            <p><strong>Mark Given:</strong> <span className="badge bg-success">{marksData[expandedRow].Marks_Get || marksData[expandedRow].mark || '0'}</span></p>
                            <p><strong>Max Mark:</strong> {marksData[expandedRow].max_marks || marksData[expandedRow].full_mark || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                            <p><strong>Page No:</strong> <Badge bg="primary">{marksData[expandedRow].Qbs_Page_No || marksData[expandedRow].page_no || 'N/A'}</Badge></p>
                            <p><strong>Status:</strong> <Badge bg={marksData[expandedRow].status === 'approved' ? 'success' : 'warning'}>{marksData[expandedRow].status || 'Reviewed'}</Badge></p>
                            <p><strong>Check Date:</strong> {marksData[expandedRow].checkdate || 'N/A'}</p>
                        </div>
                    </div>
                    {marksData[expandedRow].cmt && (
                        <div className="mt-3">
                            <p><strong>Comments:</strong></p>
                            <p style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '0.95rem' }}>
                                {marksData[expandedRow].cmt}
                            </p>
                        </div>
                    )}
                    
                    <div className="mt-3 p-3" style={{ background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0d6efd' }}>
                        <p className="mb-0" style={{ fontSize: '0.95rem', color: '#0d6efd' }}>
                            💡 <strong>View Image:</strong> The answer sheet for this question (Page {marksData[expandedRow].Qbs_Page_No || marksData[expandedRow].page_no || 'N/A'}) is now displayed in the center panel.
                        </p>
                    </div>
                </div>
            )}
        </Container>
    )
}

export default ValuationChiefReviewRight
