import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { useGetChiefSubcodeDetailsQuery ,useChiefEvaluationUpdateflgMutation} from '../../../redux-slice/valuationStatusApiSlice';
import ElegantLoader from '../../../components/ElegantLoader';

const DataTable = DataTableBase.default || DataTableBase;

const ChiefSubcode_Details = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [valuationType, setValuationType] = useState(1);
       const userRole = useSelector((state) => state.auth.userInfo.selected_role);
       const userCourse = useSelector((state) => state.auth.userInfo.selected_course);
    const { data: apiData, isLoading: apiLoading, error } = useGetChiefSubcodeDetailsQuery({ Valuation_Type: valuationType, course: userCourse, role: userRole  });
    const [chiefEvaluationUpdateflg] = useChiefEvaluationUpdateflgMutation();

    const getTodayDate = () => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        if (apiData) {
            setData(apiData.data || []);
        }
    }, [apiData]);

    // Filter data
    const filteredData = data.filter((item) =>
        (item.Eva_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.FACULTY_NAME?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.subcode?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Camp_id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Chief_Evaluator_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Chief_Valuation_Evaluator_Id?.toLowerCase() || '').includes(filterText.toLowerCase())
    );

    // Export to Excel
    const handleExportToExcel = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return; 
        }

        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Chief Evaluator ID': item.Chief_Valuation_Evaluator_Id || '-',
            'Chief Evaluator Name': item.FACULTY_NAME,
            'Evaluator ID': item.Eva_Id,
            'Evaluator Name': item.Evaluator_Name,
            'Camp ID': item.Camp_id,
            'Subject Code': item.subcode,
            'Total Count': item.totalCount,
            'Checked Count': item.checkedCount,
            'Review Count': item.evaluatorChiefReviewCount,
            'Valuation Count': item.evaluatorChiefValuationCheckedCount,
            'Return Count': item.evaluatorChiefReturnCount,
            'Subject Total': item.subcodeTotalCount,
            'Subject Checked': item.subcodeCheckedCount,
            'Email': item.Email_d,
            'Mobile': item.MobileNumber,
            'Percentage': item.evaluatorChiefValuationCheckedCount ? ((parseInt(item.evaluatorChiefValuationCheckedCount) / parseInt(item.checkedCount)) * 100).toFixed(2) : '0.00'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Chief Details');
        XLSX.writeFile(workbook, `Chief_Subcode_Details_Type${valuationType}_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleExaminerClose = async (row) => {
        setData((prevData) =>
            prevData.map((item) =>
                item.Eva_Id === row.Eva_Id && item.subcode === row.subcode && item.Chief_Valuation_Evaluator_Id === row.Chief_Valuation_Evaluator_Id
                    ? { ...item, Chief_Valuation_Status: item.Chief_Valuation_Status === 'Y' ? 'N' : 'Y' }
                    : item
            )
        );
        try {
            await chiefEvaluationUpdateflg({
                ...row,
                Chief_Valuation_Status: row.Chief_Valuation_Status === 'Y' ? 'N' : 'Y'
            }).unwrap();
            toast.success(`Chief Valuation status for ${row.Eva_Id} updated successfully`);
        } catch (error) {
            toast.error('Error updating chief valuation status');
            console.error('Error updating chief valuation status:', error);
            // Revert the state if API call fails
            setData((prevData) =>
                prevData.map((item) =>
                    item.Eva_Id === row.Eva_Id && item.subcode === row.subcode && item.Chief_Valuation_Evaluator_Id === row.Chief_Valuation_Evaluator_Id
                        ? { ...item, Chief_Valuation_Status: row.Chief_Valuation_Status }
                        : item
                )
            );
        }
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
            name: 'Chief Evaluator ID & Name',
            selector: (row) => row.Eva_Id,
            sortable: true,
            width: '220px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Chief_Valuation_Evaluator_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.FACULTY_NAME || '-'}
                    </div>
                    {row.Camp_id && (
                        <div style={{ color: '#2d6a4f', fontSize: '11px', fontWeight: '600' }}>
                            🏕️ {row.Camp_id}
                        </div>
                    )}
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
            name: 'Evaluator ID & Name',
            selector: (row) => row.Eva_Id,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#7c3aed', fontSize: '13px', marginBottom: '2px' }}>
                        {row.Eva_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.Evaluator_Name || '-'}
                    </div>
                    {row.Evaluator_Mobile && (
                        <div style={{ color: '#718096', fontSize: '11px' }}>
                            📱 {row.Evaluator_Mobile}
                        </div>
                    )}
                </div>
            ),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Subject</div>
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
                    <div>Examiner</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Total Count</div>
                </div>
            ),
            selector: (row) => row.totalCount,
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.totalCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Examiner</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Checked</div>
                </div>
            ),
            selector: (row) => row.checkedCount,
            sortable: true,
            width: '110px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.checkedCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Chief</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Review Count</div>
                </div>
            ),
            selector: (row) => row.evaluatorChiefReviewCount,
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.evaluatorChiefReviewCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Chief</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Valuation</div>
                </div>
            ),
            selector: (row) => row.evaluatorChiefValuationCheckedCount,
            sortable: true,
            width: '110px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.evaluatorChiefValuationCheckedCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Chief Return</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Count</div>
                </div>
            ),
            selector: (row) => row.evaluatorChiefReturnCount,
            sortable: true,
            width: '100px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.evaluatorChiefReturnCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Overall</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Total (Course)</div>
                </div>
            ),
            selector: (row) => row.subcodeTotalCount,
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.subcodeTotalCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Overall</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Checked</div>
                </div>
            ),
            selector: (row) => row.subcodeCheckedCount,
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (row.subcodeCheckedCount || 0),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Overall</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Pending</div>
                </div>
            ),
            selector: (row) => (row.subcodeTotalCount || 0) - (row.subcodeCheckedCount || 0),
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                (parseInt(row.subcodeTotalCount) || 0) - (parseInt(row.subcodeCheckedCount) || 0)
            ),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Evaluation</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Percentage (%)</div>
                </div>
            ),
            selector: (row) => {
                const total = parseInt(row.subcodeTotalCount) || 0;
                const checked = parseInt(row.subcodeCheckedCount) || 0;
                return total === 0 ? 0 : ((checked / total) * 100).toFixed(2);
            },
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => {
                const total = parseInt(row.subcodeTotalCount) || 0;
                const checked = parseInt(row.subcodeCheckedCount) || 0;
                const chiefChecked = parseInt(row.evaluatorChiefValuationCheckedCount) || 0;
                const examinerChecked = parseInt(row.checkedCount) || 0;
                const percentage = (chiefChecked === 0 || examinerChecked === 0) ? 0 : ((chiefChecked / examinerChecked) * 100).toFixed(2);
                let bgColor = 'danger';
                if (percentage >= 10) {
                    bgColor = 'success';
                } else if (percentage >= 0) {
                    bgColor = 'warning';
                }
                if (row.evaluatorChiefReturnCount > 0) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Badge bg="danger" pill style={{ fontSize: '11px', padding: '5px 10px', fontWeight: '600' }}>
                                Returned
                            </Badge>
                            <span style={{ marginTop: '4px', fontSize: '12px', color: '#2d3748' }}>
                                {row.evaluatorChiefReturnCount}
                            </span>
                        </div>
                    );
                
                }else if(percentage < 10 ){
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Badge bg={bgColor} pill style={{ fontSize: '13px', padding: '5px 14px', borderRadius: '50px', fontWeight: '600', cursor: 'default' }}>
                              {percentage}%
                            </Badge>
                            {/* <span style={{ marginTop: '4px', fontSize: '12px', color: '#2d3748' }}>
                                {percentage}%
                            </span> */}
                        </div>
                    );
                }else if(row.Chief_Valuation_Status==='Y'){
                    return (
                        <Button
                            variant="success"
                            size="sm"
                            style={{ fontSize: '13px', padding: '5px 14px', borderRadius: '50px', fontWeight: '400', cursor: 'pointer' }}
                            onClick={() => handleExaminerClose(row)}
                        >
                            Closed ({percentage}%)
                        </Button>
                    );
                }
                return (
                    <Button
                        variant={bgColor}
                            size="sm"
                            style={{ fontSize: '13px', padding: '5px 14px', borderRadius: '50px', fontWeight: '600', cursor: 'default' }}
                            //disabled
                            onClick={() => handleExaminerClose(row)}
                    >
                        {parseInt(percentage) >= 10 && parseInt(row.evaluatorChiefReturnCount) > 0 ? `${percentage}% (Returned)` : `${percentage}%`}
                    </Button>
                );
            },
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
                Chief Evaluator Subject Code Details
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
                            <Form.Control
                                type="text"
                                placeholder="Search by Chief, Examiner, Subject Code..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{ maxWidth: '350px' }}
                            />
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

                    {apiLoading ? (
                        <ElegantLoader 
                            message="Loading chief evaluator details..." 
                            size="medium"
                            variant="success"
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
                                    <p>No chief evaluator details found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ChiefSubcode_Details;