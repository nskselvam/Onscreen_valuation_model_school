import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { useGetSubcodeDetailsQuery } from '../../../redux-slice/valuationStatusApiSlice'
import DataTableBase from 'react-data-table-component';
import { useSelector } from 'react-redux';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ElegantLoader from '../../../components/ElegantLoader';

const DataTable = DataTableBase.default || DataTableBase;

const Subcode_Details = () => {
    const [data, setData] = useState([]);
    const [overallResult, setOverallResult] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [valuationType, setValuationType] = useState(1);

    // Get today's date in DD-MM-YYYY format
    const getTodayDate = () => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    };

      const userCourse = useSelector((state) => state.auth.userInfo.selected_course);
  const userRole = useSelector((state) => state.auth.userInfo.selected_role);

    // Fetch subcode details when valuation type changes
    const { data: subcodeDetails, isLoading: isSubcodeLoading } = useGetSubcodeDetailsQuery(
        { Valuation_Type: valuationType ,
            course: userCourse,
            role: userRole
        }
    );

    useEffect(() => {
        if (subcodeDetails?.subcodeList) {
            setData(subcodeDetails.subcodeList);
            setOverallResult(subcodeDetails.overallResult || {});
        }
    }, [subcodeDetails]);


    const filteredData = data.filter(
        (item) =>
            (item.subcode?.toLowerCase() || '').includes(filterText.toLowerCase())
    );

    // Export to Excel function
    const handleExportToExcel = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Subject Code': item.subcode,
            'Subject Name': item.Subject_Name || 'N/A',
            'No of Papers': item.no_Papers || 0,
            'Total Count': item.totalCount,
            'Checked Count': item.checkedCount,
            'Today Checked Count': item.todayCheckedCount,
            'Pending Count': parseInt(item.totalCount) - parseInt(item.checkedCount),
            'Percentage': ((parseInt(item.checkedCount) / parseInt(item.totalCount)) * 100).toFixed(2)
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcode Details');
        XLSX.writeFile(workbook, `Subcode_Details_Type${valuationType}_${new Date().toLocaleDateString()}.xlsx`);
    };

    // Table columns
    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => (currentPage - 1) * perPage + index + 1,
            sortable: false,
            width: '70px',
            center: true
        },
        {
            name: 'Subject Code',
            selector: (row) => `${row.subcode} - ${row.Subject_Name || 'N/A'}`, 
            sortable: true,
            width: '250px',
             wrap : true,
        },
        {
            name: 'No of Papers',
            selector: (row) => row.no_Papers,
            sortable: true,
            width: '100px',
            center: true,
           
               
        },
        {
            name: 'Total Count',
            selector: (row) => row.totalCount,
            sortable: true,
            width: '100px',
            center: true,
            cell: (row) => (
                <Badge bg="primary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {row.totalCount}
                </Badge>
            ),
        },
        {
            name: 'Checked Count',
            selector: (row) => row.checkedCount,
            sortable: true,
            width: '100px',
            center: true,
            cell: (row) => (
                <Badge bg="success" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {row.checkedCount}
                </Badge>
            ),
        },
        {
            name: (
                <>
                    Today Evaluated <span style={{ fontSize: '11px', color: '#e0e5ea' }}>({getTodayDate()})</span>
                </>
            ),
            selector: (row) => row.todayCheckedCount,
            sortable: true,
            width: '180px',
            center: true,
            cell: (row) => (
                <Badge bg="info" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {row.todayCheckedCount}
                </Badge>
            ),
        },
        {
            name: 'Pending Count',
            selector: (row) => parseInt(row.totalCount) - parseInt(row.checkedCount),
            sortable: true,
            width: '130px',
            center: true,
            cell: (row) => (
                <Badge bg="warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {parseInt(row.totalCount) - parseInt(row.checkedCount)}
                </Badge>
            ),
        },
        {
            name: 'Percentage',
            selector: (row) => ((parseInt(row.checkedCount) / parseInt(row.totalCount)) * 100).toFixed(2),
            sortable: true,
            width: '120px',
            center: true,
            cell: (row) => (
                <span style={{ fontWeight: '600', color: '#2c5282' }}>
                    {((parseInt(row.checkedCount) / parseInt(row.totalCount)) * 100).toFixed(2)}%
                </span>
            ),
        },
        {
            name: 'Status',
            width: '250px',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <ButtonGroup>
                        <Button
                            variant={parseInt(row.totalCount) - parseInt(row.checkedCount) === 0 ? 'success' : 'warning'}
                            size="sm"
                        >
                            {parseInt(row.totalCount) - parseInt(row.checkedCount) === 0 ? 'Completed' : 'Pending'}
                        </Button>

                    </ButtonGroup>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        }
    ];

    // Custom styles for the table
    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '13px',
                borderBottom: '2px solid #1a365d'
            },
        },
        headCells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #cbd5e0',
                '&:last-child': {
                    borderRight: 'none'
                }
            },
        },
        rows: {
            style: {
                minHeight: '45px',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '13px',
                '&:hover': {
                    backgroundColor: '#f7fafc',
                    cursor: 'pointer'
                }
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
            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
                Subject Code Valuation Details
            </h3>

            {/* Overall Result Header */}
            <Card className="mb-3" style={{ backgroundColor: '#f0f4f8' }}>
                <Card.Body>
                    <Row className="text-center">
                        <Col md={3}>
                            <div style={{ fontSize: '14px', color: '#2c5282', fontWeight: '600' }}>
                                Total Subjects
                            </div>
                            <div style={{ fontSize: '24px', color: '#2c5282', fontWeight: '700' }}>
                                {overallResult.subjectCount || 0}
                            </div>
                        </Col>
                        <Col md={3}>
                            <div style={{ fontSize: '14px', color: '#2c5282', fontWeight: '600' }}>
                                Total Count
                            </div>
                            <div style={{ fontSize: '24px', color: '#0066cc', fontWeight: '700' }}>
                                {overallResult.totalCount || 0}
                            </div>
                        </Col>
                        <Col md={3}>
                            <div style={{ fontSize: '14px', color: '#2c5282', fontWeight: '600' }}>
                                Checked Count
                            </div>
                            <div style={{ fontSize: '24px', color: '#28a745', fontWeight: '700' }}>
                                {overallResult.checkedCount || 0}
                            </div>
                        </Col>
                        <Col md={3}>
                            <div style={{ fontSize: '14px', color: '#2c5282', fontWeight: '600' }}>
                                Today Checked
                            </div>
                            <div style={{ fontSize: '24px', color: '#17a2b8', fontWeight: '700' }}>
                                {overallResult.todayCheckedCount || 0}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <div className="d-flex gap-2">
                                {[
                                    { value: 1, label: 'First Valuation', icon: 'bi-1-circle', color: '#0066cc' },
                                    { value: 2, label: 'Second Valuation', icon: 'bi-2-circle', color: '#28a745' },
                                    { value: 3, label: 'Third Valuation', icon: 'bi-3-circle', color: '#fd7e14' },
                                    { value: 4, label: 'Fourth Valuation', icon: 'bi-4-circle', color: '#6f42c1' }
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
                                        <i className={`bi ${type.icon} me-2`}></i>
                                        {type.label}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                        <Col md={6} className="d-flex align-items-center justify-content-end gap-3">
                            <Form.Control
                                type="text"
                                placeholder="Search by Subject Code..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{ maxWidth: '300px' }}
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

                    {isSubcodeLoading ? (
                        <ElegantLoader 
                            message="Loading subject code details..." 
                            size="medium"
                            variant="primary"
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 30, 50]}
                            onChangePage={(page) => setCurrentPage(page)}
                            onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5">
                                    <p>No subcode details found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Subcode_Details;
