import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Form, Row, Col, Button } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { useGetChiefRemarksQuery } from '../../redux-slice/valuationStatusApiSlice';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';

const DataTable = DataTableBase.default || DataTableBase;

const ChiefRemarks = () => {
    const userInfo = useSelector((state) => state.auth.userInfo);
    const { data: apiData, error, isLoading } = useGetChiefRemarksQuery({
        Role: userInfo?.selected_role,
        Dep_Name: userInfo?.selected_course,
        Evaluator_Id: userInfo?.username,
    });

    const [data, setData] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    useEffect(() => {
        if (apiData?.data) {
            setData(apiData.data);
        }
    }, [apiData]);

    // Filter data
    const filteredData = data.filter((item) =>
        (item.Barcode?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Subcode?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.subjectName?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Evaluator_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Evaulator_Name?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Chief_Evaluator_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.ChiefEvaluator_Name?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Chief_Remarks?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Dep_Name?.toLowerCase() || '').includes(filterText.toLowerCase())
    );

    // Export to Excel
    const handleExportToExcel = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Barcode': item.Barcode,
            'Subject Code': item.Subcode,
            'Subject Name': item.subjectName,
            'Department': item.Dep_Name,
            'Evaluator ID': item.Evaluator_Id,
            'Evaluator Name': item.Evaulator_Name,
            'Chief Evaluator ID': item.Chief_Evaluator_Id,
            'Chief Evaluator Name': item.ChiefEvaluator_Name,
            'Chief Remarks': item.Chief_Remarks
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Chief Remarks');
        XLSX.writeFile(workbook, `Chief_Remarks_${new Date().toLocaleDateString()}.xlsx`);
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
            name: 'Barcode',
            selector: (row) => row.Barcode,
            sortable: true,
            width: '120px',
            center: true,
            cell: (row) => (
                <div style={{ fontWeight: '600', color: '#1e40af' }}>
                    {row.Barcode || '-'}
                </div>
            ),
        },
        {
            name: 'Subject Details',
            selector: (row) => row.Subcode,
            sortable: true,
            width: '250px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Subcode || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.subjectName || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        Dept: {row.Dep_Name || '-'}
                    </div>
                </div>
            ),
        },
        {
            name: 'Evaluator Details',
            selector: (row) => row.Evaluator_Id,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Evaluator_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.Evaulator_Name || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Evaluator_Mobile && `📱 ${row.Evaluator_Mobile}`}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Evaluator_Email && `✉️ ${row.Evaluator_Email}`}
                    </div>
                    <div style={{ color: '#7c3aed', fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>
                        {row.CampId && `🏢 ${row.CampId}`}
                    </div>
                </div>
            ),
        },
        {
            name: 'Chief Evaluator Details',
            selector: (row) => row.Chief_Evaluator_Id,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Chief_Evaluator_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.ChiefEvaluator_Name || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Chief_Mobile && `📱 ${row.Chief_Mobile}`}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Chief_Email && `✉️ ${row.Chief_Email}`}
                    </div>
                </div>
            ),
        },
        {
            name: 'Chief Remarks',
            selector: (row) => row.Chief_Remarks,
            sortable: true,
            width: '300px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.4', padding: '8px 0' }}>
                    {row.Chief_Remarks || '-'}
                </div>
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
            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
                Chief Examiner Remarks
            </h3>

            <Card className="mb-3">
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={8}>
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search by Barcode, Subject, Evaluator, Chief Evaluator, or Remarks..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </Col>
                        <Col md={4} className="d-flex align-items-center justify-content-end gap-3">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setFilterText('')}
                                title="Clear filter"
                            >
                                ✕ Clear
                            </Button>
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

                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading chief remarks...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-5">
                            <p className="text-danger">Error loading data: {error.message}</p>
                        </div>
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
                                    <p>No chief remarks found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ChiefRemarks;