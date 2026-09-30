import React, { useState } from 'react'
import { useGetReviewMarkDataQuery } from '../../redux-slice/reviewapiSlice'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Table, Container, Spinner, Alert, Button, Badge } from 'react-bootstrap'

const ValuationReviewRight = ({ reviewValuationData, onViewImage,basicData }) => {

    const [expandedRow, setExpandedRow] = useState(null);
    const [verifiedRows, setVerifiedRows] = useState(new Set());
    const navigate = useNavigate();

    const batchname = reviewValuationData?.finalPaperData?.batchname || reviewValuationData?.finalPaperData?.barcode
    const deptname = reviewValuationData?.finalPaperData?.Dep_Name || "01"
    const subcode = reviewValuationData?.finalPaperData?.subcode
    const eva_month_year = reviewValuationData?.finalPaperData?.Eva_Mon_Year || "Nov_2025"
    const userInfo = useSelector(state => state.auth?.userInfo)
    const depName = reviewValuationData?.finalPaperData?.Dep_Name || "01";

    const ExaminerType = useSelector(state => state.auth?.userInfo.selected_role)
     const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);
    //const depNaameFormatted = depName.length == 2 ? depName[1] : '1';
    const depNaameFormatted = Dashboard_Data?.Eva_subject_dashboard;


    console.log("Review Mark Data Params:",basicData);

    const { data: reviewMarkData, isLoading, error } = useGetReviewMarkDataQuery({
        barcode: batchname,
        Eva_Id: userInfo?.username,
        subcode: subcode,
        testcode: reviewValuationData?.finalPaperData?.testcode || basicData?.testcode,
        Dep_Name: deptname,
        Eva_Mon_Year: eva_month_year,
        valuation_type: depNaameFormatted,
        Examiner_type: ExaminerType
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
        navigate("/examiner/review")
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
                    <span className='val_right_text_1'>Name :</span>  {basicData?.Eva_Name || userInfo?.name || '—'} {basicData?.Eva_Id ? `(${basicData.Eva_Id})` : userInfo?.username ? `(${userInfo.username})` : ''}
                    <br />
                    <span className='val_right_text_1'>Course Code & Title :</span>   {basicData?.sub_code  || userInfo?.subcode || '—'} - {basicData?.sub_name}
                    <br />
                    <span className='val_right_text_1'>Dummy Number :</span>    {  basicData?.barcode || '—'}
                    <br />
                </div>

            {expandedRow !== null && marksData[expandedRow] && (
                <div className="mt-3 p-3" style={{ background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0d6efd' }}>
                    <p className="mb-0" style={{ fontSize: '0.95rem', color: '#0d6efd' }}>
                        💡 <strong>View Image:</strong> The answer sheet for this question (Page {marksData[expandedRow].Qbs_Page_No}) is now displayed in the center panel.
                    </p>
                </div>
            )}

            {/* Details Panel */}
            {expandedRow !== null && marksData[expandedRow] && (
                <div className="mt-3 p-4" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h6 className="mb-3">📊 Details - Question {marksData[expandedRow].qbno}{marksData[expandedRow].SUB_SEC || marksData[expandedRow].sub_section || marksData[expandedRow].add_sub_section ? `-${marksData[expandedRow].SUB_SEC || marksData[expandedRow].sub_section || marksData[expandedRow].add_sub_section}` : ''}</h6>
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>Section:</strong> {marksData[expandedRow].section || marksData[expandedRow].sec_id || 'A'}</p>
                            <p><strong>Question No:</strong> {marksData[expandedRow].qbno}{marksData[expandedRow].SUB_SEC || marksData[expandedRow].sub_section || marksData[expandedRow].add_sub_section ? `-${marksData[expandedRow].SUB_SEC || marksData[expandedRow].sub_section || marksData[expandedRow].add_sub_section}` : ''}</p>
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
                    
                  
                </div>
            )}
 
            </div>

            {marksData && marksData.length > 0 ? (
                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Table striped bordered hover responsive className="mb-0">
                        <thead className="table-dark sticky-top">
                            <tr>
                                <th className="text-center" style={{ width: '100px' }}>Section</th>
                                <th className="text-center" style={{ width: '80px' }}>Q.No.</th>
                                <th className="text-center" style={{ width: '100px' }}>Mark</th>
                                {/* <th className="text-center" style={{ width: '100px' }}>Remarks</th> */}
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
                                    <td className="text-center">
                                        {item.qbno}{item.SUB_SEC || item.sub_section || item.add_sub_section ? `-${item.SUB_SEC || item.sub_section || item.add_sub_section}` : ''}
                                    </td>
                                    <td className="text-center">
                                        <span className="badge bg-success fs-6">{item.Marks_Get || item.mark || '0'}</span>
                                    </td>
                                    {/* <td className="text-truncate" style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {item.remarks ? (
                                            <span title={item.remarks}>{item.remarks}</span>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td> */}
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
                
            ) : (
                <Alert variant="info">
                    <Alert.Heading>No Data Found</Alert.Heading>
                    <p>No review marks available for this paper.</p>
                </Alert>
            )}

        </Container>
    )
}

export default ValuationReviewRight
  