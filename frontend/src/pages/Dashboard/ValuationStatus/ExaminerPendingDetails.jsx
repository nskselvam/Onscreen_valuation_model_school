import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import ElegantLoader from '../../../components/ElegantLoader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTableBase from 'react-data-table-component';
import * as XLSX from 'xlsx';
import { useGetValuationPendingDetailsQuery,usePendingPaperClearMutation ,usePendingReleaseChiefMutation} from '../../../redux-slice/valuationStatusApiSlice';
import PendingDetailsModal from './PendingDetailsModal';
import { useSelector } from 'react-redux';

const DataTable = DataTableBase.default || DataTableBase;

const ExaminerPendingDetails = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [valuationType, setValuationType] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [clearSelectedRows, setClearSelectedRows] = useState(false);
    const Dep_Name = useSelector((state) => state.auth.userInfo?.selected_course|| ''); // Get department name from Redux store
    const userRole = useSelector((state) => state.auth.userInfo?.role || ''); // Get user role from Redux store


    const [pendingClear] = usePendingPaperClearMutation();
    const [pendingReleaseChief] = usePendingReleaseChiefMutation();
    const { data: pendingDetailsData, isLoading: isPendingDetailsLoading, refetch } = useGetValuationPendingDetailsQuery({ Valuation_Type: valuationType });

    
    const getTodayDate = () => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Fetch pending details
    // const fetchPendingDetails = async () => {
    //     setIsLoading(true);
    //     try {
    //         const response = await axios.post('/api/valuation-status/pending-details', {
    //             Valuation_Type: valuationType
    //         });

    //         if (response.data.data) {
    //             setData(response.data.data || []);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching pending details:', error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    useEffect(() => {
        if (pendingDetailsData) {
            setData(pendingDetailsData.data || []);
            setSelectedRows([]);
            setClearSelectedRows((value) => !value);
        }
    }, [pendingDetailsData]);
    // Filter data
    const filteredData = Array.isArray(data) ? data.filter((item) =>
        (item.Evaluator_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.FACULTY_NAME?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.subcode?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.barcode?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Camp_id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.camp_offcer_id_examiner?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Camp_Officer_Name?.toLowerCase() || '').includes(filterText.toLowerCase())
    ) : [];

    // Handle row click to show modal
    const handleShowDetails = (row) => {
       if (valuationType === 5  ) {
        pendingReleaseChief({ 
            PendingDataDetails: [row],
            Valuation_Type: valuationType,
            Dep_Name: Dep_Name,
        }).unwrap().then((response) => {
            if (response.success) {
                toast.success('Pending details released successfully');
                refetch();
            } else {
                toast.error('Failed to release pending details');
            }
        }).catch((error) => {
            console.error('Error releasing pending details:', error);
            toast.error('An error occurred while releasing pending details');
        });
       } else  {
        setSelectedRow(row);
        setShowModal(true);
       }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRow(null);
    };

    // Export to Excel
    const handleExportToExcel = () => {
        if (filteredData.length === 0) {
            toast.warning('No data to export');
            return;
        }

        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Barcode': item.barcode,
            'Subject Code': item.subcode,
            'Evaluator ID': item.Evaluator_Id,
            'Evaluator Name': item.FACULTY_NAME,
            'Email': item.Email_Id,
            'Mobile': item.Mobile_Number,
            'Camp ID': item.Camp_id,
            'Camp Officer ID': item.camp_offcer_id_examiner,
            'Camp Officer Name': item.Camp_Officer_Name,
            'Camp Officer Mobile': item.Camp_Officer_Mobile,
            'Camp Officer Email': item.Camp_Officer_Email,
            'Department': item.Dep_Name,
            'Assigned Date': item.A_date
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Details');
        XLSX.writeFile(workbook, `Examiner_Pending_Details_Type${valuationType}_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handlePendingClear = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Select at least one pending paper to clear');
            return;
        }

        if (!window.confirm(`Clear ${selectedRows.length} selected pending paper${selectedRows.length === 1 ? '' : 's'}? Papers assigned less than 5 hours ago will be skipped.`)) {
            return;
        }

        try {
            const response = await pendingClear({
                PendingDataDetails: selectedRows,
                Valuation_Type: valuationType,
                Dep_Name: Dep_Name,
            }).unwrap();

            const { clearedCount = 0, tooRecentCount = 0, notFoundCount = 0 } = response.data || {};
            if (clearedCount > 0) toast.success(`${clearedCount} pending paper${clearedCount === 1 ? '' : 's'} cleared`);
            if (tooRecentCount > 0) toast.info(`${tooRecentCount} paper${tooRecentCount === 1 ? '' : 's'} skipped because assignment is less than 5 hours old`);
            if (notFoundCount > 0) toast.warning(`${notFoundCount} paper${notFoundCount === 1 ? '' : 's'} no longer pending`);
            setSelectedRows([]);
            setClearSelectedRows((value) => !value);
            refetch();
        } catch (error) {
            console.error('Error clearing pending details:', error);
            toast.error(error?.data?.message || 'An error occurred while clearing pending details');
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
            name: 'Camp ID & Officer Details',
            selector: (row) => row.Camp_id,
            sortable: true,
            width: '220px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Camp_id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        Officer: {row.camp_offcer_id_examiner || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.Camp_Officer_Name || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Camp_Officer_Mobile && `📱 ${row.Camp_Officer_Mobile}`}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Camp_Officer_Email && `✉️ ${row.Camp_Officer_Email}`}
                    </div>
                </div>
            ),
        },
        {
            name: valuationType == '5' ? 'Chief Valuation ID & Name' : 'Examiner ID & Name',
            selector: (row) => row.Evaluator_Id || row.Chief_Valuation_Evaluator_Id,
            sortable: true,
            width: '220px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        { valuationType == '5' ? row.Chief_Valuation_Evaluator_Id || '-' : row.Evaluator_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.FACULTY_NAME || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Mobile_Number && `📱 ${row.Mobile_Number}`}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        {row.Email_Id && `✉️ ${row.Email_Id}`}
                    </div>
                </div>
            ),
        },
        {
            name: 'Barcode',
            selector: (row) => row.barcode,
            sortable: true,
            width: '120px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <Badge bg="dark" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {row.barcode || '-'}
                </Badge>
            ),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Subject</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Code & Name</div>
                </div>
            ),
            selector: (row) => row.subcode,
            sortable: true,
            width: '250px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '13px', marginBottom: '4px' }}>
                        {row.subcode || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500', fontSize: '12px' }}>
                        {row.Subject_Name || '-'}
                    </div>
                </div>
            ),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Department</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Name</div>
                </div>
            ),
            selector: (row) => row.Dep_Name,
            sortable: true,
            width: '100px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <Badge bg="secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {row.Dep_Name || '-'}
                </Badge>
            ),
        },
        {
            name: (
                <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                    <div>Assigned</div>
                    <div style={{ fontSize: '12px', fontWeight: '400' }}>Date & Time</div>
                </div>
            ),
            selector: (row) => row.A_date,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500' }}>
                    {row.A_date || '-'}
                </div>
            ),
        },
        {
            name: 'Status',
            selector: (row) => 'Pending',
            sortable: false,
            width: '110px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <Badge
                    bg="danger"
                    style={{ fontSize: '13px', padding: '6px 12px', cursor: 'pointer' }}
                    onClick={() => handleShowDetails(row)}
                >
                    Pending
                </Badge>
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
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
            <Row className="mb-3">
                <Col md={6}>
                    <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
                        Examiner Pending Details
                    </h3>
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
                                    { value: 4, label: 'Fourth Valuation', color: '#6f42c1' },
                                    { value: 5, label: 'Chief Valuation', color: '#6f42c1' }

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
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c5282' }}>
                                Total Pending: <Badge bg="danger" style={{ fontSize: '15px', padding: '8px 15px', marginLeft: '8px' }}>
                                    {filteredData.length}
                                </Badge>
                            </div>
                            <Form.Control
                                type="text"
                                placeholder="Search by Examiner, Barcode, Subject..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{ maxWidth: '350px' }}
                            />
                            <Button
                                variant="warning"
                                size="sm"
                                onClick={handlePendingClear}
                                disabled={selectedRows.length === 0}
                            >
                                Clear Selected ({selectedRows.length})
                            </Button>
                        </Col>



                    </Row>

                    {isLoading ? (
                        <ElegantLoader 
                            message="Loading pending details..." 
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
                            selectableRows
                            selectableRowsHighlight
                            clearSelectedRows={clearSelectedRows}
                            onSelectedRowsChange={({ selectedRows: rows }) => setSelectedRows(rows)}
                            noDataComponent={
                                <div className="text-center py-5">
                                    <p>No pending details found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Details Modal */}
            <PendingDetailsModal
                show={showModal}
                onHide={handleCloseModal}
                rowData={{ ...selectedRow, valuationType: valuationType }}
                valuationType={valuationType}
                refetch={refetch}
            />
        </Container>
    );
};

export default ExaminerPendingDetails;