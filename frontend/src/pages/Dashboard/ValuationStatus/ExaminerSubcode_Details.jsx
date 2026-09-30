import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { useGetExaminerSubcodeDetailsQuery , useSubmitExaminerStatusChangeMutation} from '../../../redux-slice/valuationStatusApiSlice';
import ElegantLoader from '../../../components/ElegantLoader';

const DataTable = DataTableBase.default || DataTableBase;

const ExaminerSubcode_Details = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchExaminer, setSearchExaminer] = useState('');
    const [searchCampOfficer, setSearchCampOfficer] = useState('');
    const [searchCampId, setSearchCampId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [valuationType, setValuationType] = useState(1);
    const userCourse = useSelector((state) => state.auth.userInfo.selected_course);
    const userRole = useSelector((state) => state.auth.userInfo.selected_role);
    const user = useSelector((state) => state.auth.userInfo);
    const { data: apiData, isLoading: apiLoading, error } = useGetExaminerSubcodeDetailsQuery({ Valuation_Type: valuationType, course: userCourse, role: userRole,
        Eva_Id: user.username
     });
    const [submitExaminerStatusChange] = useSubmitExaminerStatusChangeMutation();

    const getTodayDate = () => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    };
    // Fetch examiner subcode details
    // const fetchExaminerDetails = async () => {
    //     setIsLoading(true);
    //     try {
    //         const response = await axios.post('/api/valuation-status/examiner-subject-details', {
    //             Valuation_Type: valuationType
    //         });

    //         if (response.data.success) {
    //             setData(response.data.data || []);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching examiner details:', error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    useEffect(() => {
        if (apiData) {
            setData(apiData.data || []);
        }
    }, [apiData]);

   
    // Filter data
    const filteredData = data.filter((item) => {
        const examinerMatch = !searchExaminer ||
            (item.Eva_Id?.toLowerCase() || '').includes(searchExaminer.toLowerCase()) ||
            (item.FACULTY_NAME?.toLowerCase() || '').includes(searchExaminer.toLowerCase()) ||
            (item.subcode?.toLowerCase() || '').includes(searchExaminer.toLowerCase());

        const campOfficerMatch = !searchCampOfficer ||
            (item.Camp_id_Examer?.toLowerCase() || '').includes(searchCampOfficer.toLowerCase()) ||
            (item.Camp_id_Examer_Name?.toLowerCase() || '').includes(searchCampOfficer.toLowerCase());

        const campIdMatch = !searchCampId ||
            (item.Camp_Id?.toLowerCase() || '').includes(searchCampId.toLowerCase());

        return examinerMatch && campOfficerMatch && campIdMatch;
    });

    const handleExaminerStatus = async (row) => {
        // alert(`Examiner ${JSON.stringify(row)} status is currently: ${row.Examiner_Valuation_Status === 'Y' ? 'Active' : 'Inactive'}`);
        setData((prevData) =>
            prevData.map((item) =>
                item.Eva_Id === row.Eva_Id && item.subcode === row.subcode
                    ? { ...item, Examiner_Valuation_Status: item.Examiner_Valuation_Status === 'Y' ? 'N' : 'Y' }
                    : item
            )
        );
        try {
            await submitExaminerStatusChange({
                Eva_Id: row.Eva_Id,
                subcode: row.subcode,
                Valuation_Type: row.Valuation_Type,
                Examiner_Valuation_Status: row.Examiner_Valuation_Status === 'Y' ? 'N' : 'Y'
            }).unwrap();
            toast.success(`Examiner ${row.Eva_Id} status updated successfully`);
        } catch (error) {
            toast.error('Error updating examiner status');
            console.error('Error updating examiner status:', error);
        }
    };

    // Export to Excel
    const handleExportToExcel = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Examiner ID': item.Eva_Id,
            'Examiner Name': item.FACULTY_NAME,
            'Subject Code': item.subcode,
            'Total Count': item.totalCount,
            'Checked Count': item.checkedCount,
            'Today Checked': item.todayCheckedCount,
            'Subject Total': item.subcodeTotalCount,
            'Subject Checked': item.subcodeCheckedCount,
            'Email': item.Email_d,
            'Mobile': item.MobileNumber,
            'Camp Officer ID': item.Camp_id_Examer,
            'Camp Officer Name': item.Camp_id_Examer_Name,
            'Camp Officer Mobile': item.Camp_id_Mobile,
            'Camp Officer Email': item.Camp_id_Email,
            'Percentage': ((parseInt(item.checkedCount) / parseInt(item.totalCount)) * 100).toFixed(2),
            'Subtotal': item.subtotal
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Examiner Details');
        XLSX.writeFile(workbook, `Examiner_Subcode_Details_Type${valuationType}_${new Date().toLocaleDateString()}.xlsx`);
    };

    // Table columns
    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => (currentPage - 1) * perPage + index + 1,
            sortable: false,
            width: '70px',
            style: {
                justifyContent: 'center',
            },
        },
        {
            name: 'Camp  ID & Name',
            selector: (row) => row.Camp_id_Examer,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Camp_id_Examer || '-'} {row.Camp_Id && `(${row.Camp_Id})`}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.Camp_id_Examer_Name || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Camp_id_Mobile && `📱 ${row.Camp_id_Mobile}`}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Camp_id_Email && `✉️ ${row.Camp_id_Email}`}
                    </div>
                </div>
            ),
        },
        {
            name: 'Examiner ID & Name',
            selector: (row) => row.Eva_Id,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Eva_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.FACULTY_NAME || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.MobileNumber && `📱 ${row.MobileNumber}`}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Email_d && `✉️ ${row.Email_d}`}
                    </div>
                </div>
            ),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Course</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Code</div>
                </div>
            ),
            selector: (row) => row.subcode,
            sortable: true,
            width: '100px',
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>OverAll</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Total (Course Wise) </div>
                </div>
            ),
            selector: (row) => parseInt(row.subcodeTotalCount) || 0,
            sortable: true,
            width: '110px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                    {row.subcodeTotalCount}
                </span>
            ),
        },

        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Examiner</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Total Allocated Count</div>
                </div>
            ),
            selector: (row) => parseInt(row.subtotal) || 0,
            sortable: true,
            width: '110px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                    {row.subtotal}
                </span>
            ),
        },

        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Total</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Evaluated ({getTodayDate()})</div>
                </div>
            ),
            selector: (row) => parseInt(row.todayCheckedCount) || 0,
            sortable: true,
            width: '150px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                    {row.todayCheckedCount}
                </span>
            ),
        },

        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Examiner</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>OverAll Evaluated Total</div>
                </div>
            ),
            selector: (row) => parseInt(row.subcodeCheckedCount) || 0,
            sortable: true,
            width: '150px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                    {row.subcodeCheckedCount}
                </span>
            ),
        },

        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Examiner</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Wise Pending</div>
                </div>
            ),
            selector: (row) => parseInt(row.subtotal) === 0 ? 0 : (parseInt(row.subtotal) - parseInt(row.checkedCount)),
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                    {parseInt(row.subtotal) === 0 ? 0 : (row.subtotal - row.checkedCount)}
                </span>
            ),
        },

        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Examiner</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Under Evaluation</div>
                </div>
            ),
            selector: (row) => parseInt(row.totalCount) - parseInt(row.checkedCount),
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                   {parseInt(row.checkedCount) === 0 ? 0 : `${parseInt(row.checkedCount)} ${parseInt(row.totalCount) - parseInt(row.checkedCount) === 0 ? '' : `(${parseInt(row.totalCount) - parseInt(row.checkedCount)} pending)`}`}
                </span>
            ),
        },

        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Over all</div>
                    <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Pending</div>
                </div>
            ),
            selector: (row) => parseInt(row.subcodeTotalCount) - parseInt(row.subcodeCheckedCount),
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <span style={{ fontSize: '15px', fontWeight: '700' }}>
                    {parseInt(row.subcodeTotalCount) - parseInt(row.subcodeCheckedCount)}
                </span>
            ),
        },


        // {
        //     name: (
        //         <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
        //             <div>Evaluation</div>
        //             <div tyle={{ fontSize: '12px', fontWeight: '400' }}>Percentage (%)</div>
        //         </div>
        //     ),
        //     selector: (row) => ((parseInt(row.subcodeCheckedCount) / parseInt(row.subcodeTotalCount)) * 100).toFixed(2),
        //     sortable: true,
        //     width: '120px',
        //     center: true,
        //     cell: (row) => {
        //         const percentage = row.subcodeTotalCount === 0 ? 0 : ((parseInt(row.subcodeCheckedCount) / parseInt(row.subcodeTotalCount)) * 100).toFixed(2);
        //         let bgColor = 'danger';
        //         if (percentage >= 80) {
        //             bgColor = 'success';
        //         } else if (percentage >= 50) {
        //             bgColor = 'warning';
        //         }
        //         return (
        //             <Badge bg={bgColor} style={{ fontSize: '13px', padding: '6px 12px' }}>
        //                 {parseInt(percentage) === 100 ? 'Completed' : `${percentage}%`}
        //             </Badge>
        //         );
        //     },
        // }
        {
            name:'Examiner Status',
            selector: (row) => row.Examiner_Valuation_Status,
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <button
                    style={{
                        backgroundColor: row.Examiner_Valuation_Status === 'Y' ? '#38a169' : row.totalCount - row.checkedCount !== 0 ? '#e53e3e' : '#1371eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: row.Examiner_Valuation_Status === 'Y' ? 'not-allowed' : row.totalCount - row.checkedCount !== 0 ? 'not-allowed' : 'pointer',
                        opacity: row.Examiner_Valuation_Status === 'Y' ? 1 : 0.6,
                    }}
                    onClick={() => handleExaminerStatus(row)}
                    disabled={
                        row.Examiner_Valuation_Status === 'Y' 
                            ? parseInt(userRole) > 0 && parseInt(userRole) <= 2 // Only allow status change if user is admin and status is currently 'Y'
                            : row.totalCount - row.checkedCount !== 0
                    }
                >{row.Examiner_Valuation_Status === 'Y' ? 'Completed' : `${row.totalCount - row.checkedCount !== 0 ? 'Inactive' : 'Active'}`}</button>
            ),

        }
        

    ];

    // Custom styles for DataTable
    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px 8px 0 0',
                minHeight: '52px',
            },
        },
        rows: {
            style: {
                fontSize: '13px',
                minHeight: '60px',
                '&:hover': {
                    backgroundColor: '#f0f4f8',
                    cursor: 'pointer',
                },
            },
            stripedStyle: {
                backgroundColor: '#f8fafc',
            },
        },
        pagination: {
            style: {
                borderTop: '1px solid #e2e8f0',
                minHeight: '56px',
            },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #e2e8f0',
                fontSize: '13px',
                '&:last-child': {
                    borderRight: 'none'
                }
            },
        }
    };

    return (
        <Container fluid className="p-4">
            <ToastContainer position="top-right" autoClose={3000} />
            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
                Examiner Subject Code Details
            </h3>

            {/* Valuation Type Selector and Controls */}
            <Card className="mb-3">
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <div className="d-flex gap-2">
                                {[
                                    { value: 1, label: 'First Valuation', color: '#0066cc' },
                                    { value: 2, label: 'Second Valuation', color: '#28a745' },
                                    { value: 3, label: 'Third Valuation', color: '#fd7e14' },
                                    { value: 4, label: 'Fourth Valuation', color: '#6f42c1' }
                                ].map((type) => (
                                    <Button
                                        key={type.value}
                                        variant={valuationType === type.value ? 'primary' : 'outline-secondary'}
                                        onClick={() => setValuationType(type.value)}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '10px 20px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            border: valuationType === type.value ? `2px solid ${type.color}` : '2px solid #dee2e6',
                                            backgroundColor: valuationType === type.value ? type.color : '#ffffff',
                                            color: valuationType === type.value ? '#ffffff' : '#6c757d',
                                            transition: 'all 0.3s ease',
                                            boxShadow: valuationType === type.value ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {type.label}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                        <Col md={6} className="d-flex align-items-center justify-content-end gap-3">
                            <Button
                                variant="success"
                                size="sm"
                                onClick={handleExportToExcel}
                                disabled={filteredData.length === 0}
                            >
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                Export to Excel
                            </Button>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search Examiner ID / Name / Subcode"
                                value={searchExaminer}
                                onChange={(e) => setSearchExaminer(e.target.value)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search Camp Officer ID / Name"
                                value={searchCampOfficer}
                                onChange={(e) => setSearchCampOfficer(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search Camp ID"
                                value={searchCampId}
                                onChange={(e) => setSearchCampId(e.target.value)}
                            />
                        </Col>
                        <Col md={1} className="d-flex align-items-center">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => { setSearchExaminer(''); setSearchCampOfficer(''); setSearchCampId(''); }}
                                title="Clear all filters"
                            >
                                ✕
                            </Button>
                        </Col>
                    </Row>

                    {apiLoading ? (
                        <ElegantLoader 
                            message="Loading examiner details..." 
                            size="medium"
                            variant="primary"
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                            onChangePage={(page) => setCurrentPage(page)}
                            onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5">
                                    <p>No examiner details found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ExaminerSubcode_Details;
