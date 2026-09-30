import React, { useState, useMemo } from 'react'
import DataTableBase from 'react-data-table-component'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import { useGetReviewDataQuery } from '../../../redux-slice/reviewapiSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Spinner, Alert, Button, Modal, Form, InputGroup, Row, Col, Card, Badge } from 'react-bootstrap'
import { valuationreviewData } from '../../../redux-slice/reviewSlice'
import { useGetSubjectDataQuery } from '../../../redux-slice/SubjectMasterApiSlice'
import * as XLSX from 'xlsx'

const DataTable = DataTableBase.default || DataTableBase


const ExaminerReview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchText, setSearchText] = useState('');

  const location = useLocation();
  const reduxSubCode = useSelector((state) => state.valuaton_Data_basic?.currentSubCode);
  const userInfo = useSelector((state) => state.auth?.userInfo);
  const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);
  const monthyearInfo = useSelector((state) => state.auth?.monthyearInfo);
    const { data: subjectMasterResponse } = useGetSubjectDataQuery();

  const activeRecords = useMemo(() =>
    Array.isArray(monthyearInfo) ? monthyearInfo.filter((m) => m.Month_Year_Status === 'Y') : [],
    [monthyearInfo]
  );
  const activeEvaMonYear = activeRecords[0] ? `${activeRecords[0].Eva_Month}_${activeRecords[0].Eva_Year}` : '';

  // Only use the real department this subject belongs to — no dummy fallback.
  const selectedCouse = Dashboard_Data?.department || userInfo?.selected_course || ""
  const valuationType = Dashboard_Data?.Eva_subject_dashboard || "1"; // Default to "1" if undefined
  const Camp_id = Dashboard_Data?.Camp_id;
  const camp_offcer_id_examiner = Dashboard_Data?.camp_offcer_id_examiner;
  const Examiner_type = userInfo?.selected_role || "2"; // Default to "2" for examiner
  const Max_Papers = Dashboard_Data?.Max_Papers;
  const Sub_Max_Papers = Dashboard_Data?.Sub_Max_Papers;

  const { subCode } = location.state || {};
  // Use Redux persisted subCode as fallback if location.
  // state is not available
  const finalSubCode = subCode || reduxSubCode;
    const testcode = Dashboard_Data?.testcode || location.state?.testcode || '';
    const subjectMasterPeriod = useMemo(() => {
        const subjects = Array.isArray(subjectMasterResponse?.data) ? subjectMasterResponse.data : [];
        const subject = subjects.find((item) => item.Subcode === finalSubCode && item.testcode === testcode)
            || subjects.find((item) => item.Subcode === finalSubCode);
        return String(subject?.Eva_Mon_Year || '').trim();
    }, [subjectMasterResponse, finalSubCode, testcode]);
    const resolvedEvaMonYear = activeEvaMonYear || subjectMasterPeriod;





    const { data: reviewData, isLoading, error } = useGetReviewDataQuery({
        subcode: finalSubCode,
        testcode,
        Eva_Id: userInfo?.username,
        Dep_Name: selectedCouse,
        Eva_Mon_Year: resolvedEvaMonYear,
        valuation_type: valuationType,
        Examiner_type: Examiner_type,
    }, { 
        skip: !finalSubCode || !testcode || !userInfo?.username || !valuationType || !selectedCouse || !resolvedEvaMonYear
    });



   

    // ⚠️ Show warning if subCode is missing
    if (!finalSubCode) {

        return (
            <UploadPageLayout
                mainTopic="Examiner Review"
                subTopic="review the papers which you have already evaluated"
            >
                <Container className="mt-4">
                    <div style={{ padding: '20px', textAlign: 'center', background: '#fee', borderRadius: '8px', margin: '20px' }}>
                        <h3 style={{ color: '#c33' }}>⚠️ Error: SubCode Not Found</h3>
                        <p>Please go back and select a subject code first from the Review option.</p>
                        <Button variant="secondary" onClick={() => window.history.back()}>
                            Go Back
                        </Button>
                    </div>
                </Container>
            </UploadPageLayout>
        );
    }

    const handleViewPaper = (item) => {
 
        // Dispatch the selected paper data to Redux store
        dispatch(valuationreviewData(item));
        // Navigate to the review page with paper data in state
        navigate('/examiner/reviewe/valuationreview', { 
            state: { 
                paperData: item,
                subCode: finalSubCode,
                testcode,
            } 
        });
    };

    // DataTable columns configuration
    const columns = useMemo(() => [
        {
            name: 'Barcode',
            selector: row => row.barcode || row.batchname,
            sortable: true,
            width: '180px',
        },
        {
            name: 'Subject Code',
            selector: row => row.subcode,
            sortable: true,
            width: '140px',
            center: true,
        },
        {
            name: 'Total Marks',
            selector: row => row.total_round || row.total || '0',
            sortable: true,
            width: '130px',
            center: true,
        },
        {
            name: 'Evaluation Date',
            selector: row => row.A_date || row.checkdate || 'N/A',
            sortable: true,
            width: '180px',
        },
        {
            name: 'Status',
            selector: row => row.Checked || 'Pending',
            sortable: true,
            width: '120px',
            center: true,
            cell: row => (
                <span style={{
                    padding: '3px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: row.Checked === 'Yes' ? '#e8f5e9' : '#fff8e1',
                    color: row.Checked === 'Yes' ? '#2e7d32' : '#f57f17',
                    border: `1px solid ${row.Checked === 'Yes' ? '#a5d6a7' : '#ffe082'}`
                }}>
                    {row.Checked === 'Yes' ? 'Checked' : 'Pending'}
                </span>
            )
        },
        {
            name: 'Action',
            width: '130px',
            center: true,
            cell: row => (
                <button
                    onClick={() => handleViewPaper(row)}
                    style={{
                        padding: '6px 14px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                    }}
                >
                    Review
                </button>
            )
        }
    ], []);

    // Filter data based on search text
    const filteredData = useMemo(() => {
        if (!reviewData?.data) return [];
        
        if (!searchText) return reviewData.data;
        
        return reviewData.data.filter(item => {
            const barcode = (item.barcode || item.batchname || '').toString().toLowerCase();
            const subcode = (item.subcode || '').toString().toLowerCase();
            const search = searchText.toLowerCase();
            
            return barcode.includes(search) || subcode.includes(search);
        });
    }, [reviewData?.data, searchText]);

    // Export to Excel function
    const handleExportToExcel = () => {
        if (!reviewData?.data || reviewData.data.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = reviewData.data.map(item => ({
            'Barcode': item.barcode || item.batchname,
            'Subject Code': item.subcode,
            'Total Marks': item.total_round || item.total || '0',
            'Evaluation Date': item.A_date || item.checkdate || 'N/A',
            'Status': item.Checked === 'Yes' ? 'Checked' : 'Pending',
            'Registration Number': item.R_No || 'N/A',
            'Total Round': item.tot_round || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Data');
        XLSX.writeFile(workbook, `Examiner_Review_${finalSubCode}_${new Date().toLocaleDateString()}.xlsx`);
    };


    return (
        <>
            <UploadPageLayout
                mainTopic="Examiner Review"
                subTopic="review the papers which you have already evaluated"
            >
                <div style={{ padding: '10px 24px 16px 24px', backgroundColor: '#f5f5f5', minHeight: '100%' }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333' }}>
                                Examiner Review
                            </h1>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button
                                    onClick={handleExportToExcel}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                    }}
                                >
                                    Export to Excel
                                </button>
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <input
                                        type="text"
                                        placeholder="Search by Barcode or Subject Code..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 40px 10px 16px',
                                            fontSize: '14px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                    {searchText && (
                                        <button
                                            onClick={() => setSearchText('')}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                color: '#999',
                                                padding: '0',
                                                lineHeight: '1'
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '16px',
                                backgroundColor: '#ffebee',
                                color: '#c62828',
                                borderRadius: '4px',
                                border: '1px solid #ef9a9a'
                            }}>
                                Error: Failed to load review data. Please try again.
                            </div>
                        )}

                        {/* DataTable */}
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            progressPending={isLoading}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 30, 50]}
                            highlightOnHover
                            pointerOnHover
                            responsive
                            customStyles={{
                                table: {
                                    style: { backgroundColor: '#ffffff' },
                                },
                                headRow: {
                                    style: {
                                        backgroundColor: '#f5f5f5',
                                        borderBottom: '2px solid #e0e0e0',
                                        minHeight: '52px',
                                    },
                                },
                                headCells: {
                                    style: {
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#333',
                                        paddingLeft: '16px',
                                        paddingRight: '16px',
                                    },
                                },
                                rows: {
                                    style: {
                                        minHeight: '56px',
                                        backgroundColor: '#ffffff',
                                        borderBottom: '1px solid #e0e0e0',
                                        '&:hover': { backgroundColor: '#f9f9f9' },
                                    },
                                },
                                cells: {
                                    style: {
                                        fontSize: '14px',
                                        color: '#555',
                                        paddingLeft: '16px',
                                        paddingRight: '16px',
                                    },
                                },
                                pagination: {
                                    style: {
                                        backgroundColor: '#ffffff',
                                        borderTop: '1px solid #e0e0e0',
                                        minHeight: '56px',
                                    },
                                },
                            }}
                            noDataComponent={
                                <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                    No papers found.
                                </div>
                            }
                            progressComponent={
                                <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                    Loading...
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* Paper Details Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Paper Details {selectedPaper ? `- ${selectedPaper.barcode || selectedPaper.batchname}` : ''}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedPaper && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {[
                                        { label: 'Barcode',           value: selectedPaper.barcode || selectedPaper.batchname || 'N/A' },
                                        { label: 'Subject Code',      value: selectedPaper.subcode || 'N/A' },
                                        { label: 'Total Marks',       value: selectedPaper.total_round || selectedPaper.total || '0', bold: true },
                                        { label: 'Evaluation Date',   value: selectedPaper.A_date || selectedPaper.checkdate || 'N/A' },
                                        { label: 'Registration No.',  value: selectedPaper.R_No || 'N/A' },
                                        { label: 'Total Round',       value: selectedPaper.tot_round || 'N/A' },
                                        { label: 'Status',            value: selectedPaper.Checked === 'Yes' ? 'Checked' : 'Pending', status: true },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{
                                                padding: '12px 16px',
                                                width: '40%',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#555',
                                                backgroundColor: '#f5f5f5'
                                            }}>
                                                {row.label}
                                            </td>
                                            <td style={{
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                fontWeight: row.bold ? '700' : '400',
                                                color: row.bold ? '#333' : '#555'
                                            }}>
                                                {row.status ? (
                                                    <span style={{
                                                        padding: '3px 12px',
                                                        borderRadius: '4px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        backgroundColor: selectedPaper.Checked === 'Yes' ? '#e8f5e9' : '#fff8e1',
                                                        color: selectedPaper.Checked === 'Yes' ? '#2e7d32' : '#f57f17',
                                                        border: `1px solid ${selectedPaper.Checked === 'Yes' ? '#a5d6a7' : '#ffe082'}`
                                                    }}>
                                                        {row.value}
                                                    </span>
                                                ) : row.value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                        {selectedPaper && (
                            <button
                                onClick={() => { setShowModal(false); handleViewPaper(selectedPaper); }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                }}
                            >
                                Open Review
                            </button>
                        )}
                    </Modal.Footer>
                </Modal>

            </UploadPageLayout>
        </>
    )
}

export default ExaminerReview
