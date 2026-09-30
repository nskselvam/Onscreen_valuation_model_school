import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Modal, Table, Button, Form, Spinner } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileInvoiceDollar, FaInfoCircle, FaCheckCircle, FaSearch, FaPrint, FaTrash, FaFileExcel } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { useGetexaminerPaymentDetailsQuery,usePostExaminerPaymentChallanMutation, useDeleteExaminerPaymentMutation } from '../../redux-slice/userDashboardSlice';
import navbarData from '../../hooks/navbar/navbar.json';
const { VITE_Institution_Name, VITE_Institution_No } = import.meta.env;

const DataTable = DataTableBase.default || DataTableBase;
 
const ExaminerPaymentReport = () => {
    const userInfo = useSelector((state) => state.auth.userInfo);
    const Eva_Id = userInfo?.username || '';

    const [filterText, setFilterText] = useState('');
    const [valuationType, setValuationType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [postExaminerPaymentChallan, { isLoading: isPosting }] = usePostExaminerPaymentChallanMutation();
    const [deleteExaminerPayment, { isLoading: isDeleting }] = useDeleteExaminerPaymentMutation();
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, row: null });

    const Institutation_Details = navbarData.find(n => String(n._id) === String(VITE_Institution_No)) || {};

    const { data: paymentData, isLoading, isError, refetch } = useGetexaminerPaymentDetailsQuery({
        Eva_Id,
        Valuation_Type: valuationType || undefined,
        Role: userInfo?.selected_role || undefined,
    });

    useEffect(() => {
        if (Eva_Id) {
            refetch();
        }
    }, [Eva_Id, valuationType]);

    const records = Array.isArray(paymentData) ? paymentData : [];

    const filteredData = records.filter((item) =>
        (item.Evaluation_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Evaluation_Name?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.ChallanNumber?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Camp_Id?.toLowerCase() || '').includes(filterText.toLowerCase())
    );

    const handleViewSubjects = (row) => {
        setSelectedRecord(row);
        setShowModal(true);
    };

    const valuationLabel = (type) => {
        const map = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth' };
        return map[type] ? `${map[type]} Valuation` : `Type ${type}`;
    };

    // const examinerPaymentPrint = (row) => {
    //     // Implement payment printing logic here
    //     toast.info('Payment printing functionality is not implemented yet.');
    // };


      const handlePostExaminerPaymentChallan = async (row) => {
        try {
            // Wrap the stored DB record as paymentRecord
            const result = await postExaminerPaymentChallan({ paymentRecord: row ,
              institution_Name: Institutation_Details.InstitutionName,
              campus_Id: VITE_Institution_No
            }).unwrap();
            
            if (result instanceof Blob) {
                const fileURL = URL.createObjectURL(result);
                window.open(fileURL);
                setTimeout(() => URL.revokeObjectURL(fileURL), 100);
                toast.success('Challan generated successfully!');
            } else {
                toast.error('Error: Response is not a valid PDF');
            }
        } catch (error) {
            console.error("Error posting payment challan:", error);
            let errorMessage = 'Failed to generate payment challan';
            if (error.data?.message) {
                errorMessage = error.data.message;
            } else if (error.data?.error) {
                errorMessage = error.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.error(`Error: ${errorMessage}`);
        }
    };
    const examinerPaymentDelete = (row) => {
        setDeleteConfirm({ show: true, row });
    };

    const confirmDelete = async () => {
        const row = deleteConfirm.row;
        setDeleteConfirm({ show: false, row: null });
        try {
            await deleteExaminerPayment(row.id).unwrap();
            toast.success(`Challan "${row.ChallanNumber}" and ${row.subjects?.length || 0} subject record(s) deleted successfully.`);
            refetch();
        } catch (error) {
            const msg = error.data?.message || error.message || 'Failed to delete payment record';
            toast.error(`Delete failed: ${msg}`);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

    const exportToExcel = () => {
        if (!filteredData.length) {
            toast.warning('No data to export.');
            return;
        }
        const rows = filteredData.map((item, index) => ({
            'S.No':             index + 1,
            'Challan Number':   item.ChallanNumber    || '',
            'Evaluator ID':     item.Evaluation_Id    || '',
            'Evaluator Name':   item.Evaluation_Name  || '',
            'Degree':           item.Degree_Name      || '',
            'Camp ID':          item.Camp_Id          || '',
            'Camp Officer ID':  item.Camp_Officer_Id  || '',
            'Report From':      item.Report_I_Date    || '',
            'Report To':        item.Report_E_Data    || '',
            'Examiner Type':    valuationLabel(item.Examiner_Type),
            'Subject Amount':   item.Subject_Amount   || 0,
            'DA Days':          item.Da_Days          || 0,
            'DA Per Day':       item.Da_Per_Day_Amt   || 0,
            'DA Amount':        item.Da_Amount        || 0,
            'DA Description':   item.Da_Descrption    || '',
            'Additional Amount':item.Additional_Amount|| 0,
            'Total Amount':     item.Total_Amount     || 0,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payment Report');
        XLSX.writeFile(wb, `Examiner_Payment_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success(`Exported ${rows.length} record(s) to Excel.`);
    };

    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => (
                <div style={{ textAlign: 'center' }}>
                    {(currentPage - 1) * perPage + index + 1}
                </div>
            ),
            width: '65px',
        },
        {
            name: 'Challan Number',
            selector: (row) => row.ChallanNumber,
            sortable: true,
            wrap: true,
            width: '230px',
            cell: (row) => (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                    {row.ChallanNumber || '-'}
                </span>
            ),
        },
        {
            name: 'Evaluator',
            selector: (row) => row.Evaluation_Id,
            sortable: true,
            width: '200px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div
                        style={{ fontWeight: 700, color: '#1e40af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleViewSubjects(row)}
                        title="Click to view subject details"
                    >
                        {row.Evaluation_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568' }}>{row.Evaluation_Name || '-'}</div>
                </div>
            ),
        },
        {
            name: 'Period',
            width: '160px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div><strong>From:</strong> {row.Report_I_Date || '-'}</div>
                    <div><strong>To:</strong> {row.Report_E_Data || '-'}</div>
                </div>
            ),
        },
        {
            name: 'Camp',
            width: '140px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: 600, color: '#1e40af' }}>{row.Camp_Id || '-'}</div>
                    <div style={{ color: '#4a5568' }}>Officer: {row.Camp_Officer_Id || '-'}</div>
                </div>
            ),
        },
        // {
        //     name: 'Type',
        //     selector: (row) => row.Examiner_Type,
        //     sortable: true,
        //     width: '130px',
        //     center: true,
        //     cell: (row) => (
        //         <Badge bg="primary" style={{ fontSize: '11px', padding: '5px 10px' }}>
        //             {valuationLabel(row.Examiner_Type)}
        //         </Badge>
        //     ),
        // },
        {
            name: 'Subjects',
            width: '80px',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <Badge bg="info" style={{ fontSize: '12px', padding: '5px 10px', cursor: 'pointer' }}
                        onClick={() => handleViewSubjects(row)}>
                        {row.subjects?.length || 0}
                    </Badge>
                </div>
            ),
        },
        {
            name: 'DA / Additional',
            width: '150px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div>DA: <strong>{formatCurrency(row.Da_Amount)}</strong></div>
                    <div>Add: <strong>{formatCurrency(row.Additional_Amount)}</strong></div>
                </div>
            ),
        },
        {
            name: 'Total Amount',
            selector: (row) => row.Total_Amount,
            sortable: true,
            width: '130px',
            cell: (row) => (
                <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#16a34a', fontSize: '13px' }}>
                        {formatCurrency(row.Total_Amount)}
                    </strong>
                </div>
            ),
        },
        {
            name: 'Action',
            width: '200px',
            cell: (row) => (
                <div className="d-flex gap-1 justify-content-center">
                    <Button size="sm" variant="outline-primary" style={{ fontSize: '11px' }}
                        onClick={() => handlePostExaminerPaymentChallan(row)}>
                        <FaPrint className="me-1" /> Print
                    </Button>
                    <Button size="sm" variant="outline-danger" style={{ fontSize: '11px' }}
                        onClick={() => examinerPaymentDelete(row)}>
                        <FaTrash className="me-1" /> Delete
                    </Button>
                </div>
            ),
        },
    ];

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                minHeight: '48px',
            },
        },
        rows: {
            style: {
                minHeight: '58px',
                fontSize: '12px',
                '&:hover': { backgroundColor: '#f0f4f8', cursor: 'pointer' },
            },
            stripedStyle: { backgroundColor: '#f8fafc' },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #e2e8f0',
                '&:last-child': { borderRight: 'none' },
            },
        },
    };

    return (
        <Container fluid className="p-4">
            <ToastContainer position="bottom-right" autoClose={3000} />

            <Row className="mb-3">
                <Col>
                    <h3 style={{ color: '#2c5282', fontWeight: '600' }}>
                        <FaFileInvoiceDollar className="me-2" />
                        Examiner Payment Report
                    </h3>
                </Col>
            </Row>

            <Card className="mb-3">
                <Card.Body>
                    {/* Filters */}
                    <Row className="mb-3 align-items-center">
                        <Col md={4}>
                            <div className="d-flex gap-2 flex-wrap">
                                {[
                                    { value: '', label: 'All', color: '#6c757d' },
                                    { value: '1', label: 'Chief Examiner', color: '#0066cc' },
                                    { value: '2', label: 'Examiner', color: '#28a745' },
                                    // { value: '3', label: '3rd Valuation', color: '#fd7e14' },
                                    // { value: '4', label: '4th Valuation', color: '#6f42c1' },
                                ].map((type) => (
                                    <Button
                                        key={type.value}
                                        size="sm"
                                        variant={valuationType === type.value ? 'primary' : 'outline-secondary'}
                                        onClick={() => setValuationType(type.value)}
                                        style={{
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            border: valuationType === type.value ? `2px solid ${type.color}` : '2px solid #dee2e6',
                                            backgroundColor: valuationType === type.value ? type.color : '#ffffff',
                                            color: valuationType === type.value ? '#ffffff' : '#6c757d',
                                        }}
                                    >
                                        {type.label}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                        <Col md={4} className="ms-auto">
                            <div className="input-group">
                                <span className="input-group-text"><FaSearch /></span>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by Evaluator, Challan, Camp..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                            </div>
                        </Col>
                        <Col md="auto">
                            <Badge bg="danger" style={{ fontSize: '14px', padding: '8px 14px' }}>
                                Total: {filteredData.length}
                            </Badge>
                        </Col>
                        <Col md="auto">
                            <Button size="sm" variant="success" onClick={exportToExcel}
                                style={{ fontSize: '12px', fontWeight: 600 }}>
                                <FaFileExcel className="me-1" /> Export Excel
                            </Button>
                        </Col>
                    </Row>

                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading payment records...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-5 text-danger">
                            <FaInfoCircle size={36} className="mb-2" />
                            <p>Failed to load payment data. Please try again.</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 50, 100]}
                            onChangePage={(page) => setCurrentPage(page)}
                            onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5 text-muted">
                                    <FaFileInvoiceDollar size={40} className="mb-2" style={{ opacity: 0.4 }} />
                                    <p>No payment records found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Subject Details Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <Modal.Title style={{ fontWeight: 700 }}>
                        <FaFileInvoiceDollar className="me-2" />
                        Subject Details — {selectedRecord?.Evaluation_Id} ({selectedRecord?.Evaluation_Name})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRecord && (
                        <>
                            {/* Summary */}
                            <Row className="mb-3 g-2">
                                {[
                                    { label: 'Challan No', value: selectedRecord.ChallanNumber },
                                    { label: 'Period', value: `${selectedRecord.Report_I_Date} → ${selectedRecord.Report_E_Data}` },
                                    { label: 'Camp ID', value: selectedRecord.Camp_Id },
                                    // { label: 'Valuation', value: valuationLabel() },
                                    { label: 'DA Amount', value: formatCurrency(selectedRecord.Da_Amount) },
                                    { label: 'DA Days', value: selectedRecord.Da_Days || '-' },
                                    { label: 'Additional', value: formatCurrency(selectedRecord.Additional_Amount) },
                                    { label: 'Total Amount', value: formatCurrency(selectedRecord.Total_Amount) },
                                ].map((item, i) => (
                                    <Col xs={6} md={3} key={i}>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px', textAlign: 'center', height: '100%' }}>
                                            <div style={{ fontSize: '11px', color: '#6c757d', fontWeight: 600 }}>{item.label}</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2c5282', marginTop: '4px' }}>{item.value}</div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>

                            {/* Subject Table */}
                            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <Table responsive className="mb-0">
                                    <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                        <tr>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', width: '50px' }}>S.No</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px' }}>Subject Code</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px' }}>Subject Name</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Papers</th>
                                           {selectedRecord.Examiner_Type === '2' && (
                                            <>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Rate/Paper (₹)</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Total (₹)</th>
                                            </>
                                           )}
                                            </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRecord.subjects?.length > 0 ? (
                                            <>
                                                {selectedRecord.subjects.map((sub, idx) => (
                                                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>{idx + 1}</td>
                                                        <td style={{ padding: '12px 15px' }}>
                                                            <Badge bg="primary" style={{ fontSize: '12px', padding: '5px 10px' }}>{sub.Subcode}</Badge>
                                                        </td>
                                                        <td style={{ padding: '12px 15px', fontSize: '13px' }}>{sub.Subname}</td>
                                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 600 }}>{sub.No_Paper}</td>
                                                        {selectedRecord.Examiner_Type === '2' && (
                                                            <>
                                                        <td style={{ padding: '12px 15px', textAlign: 'right' }}>₹ {sub.Paper_Amount}</td>
                                                        <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>
                                                            ₹ {sub.Total?.toLocaleString('en-IN')}
                                                        </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                                    <td colSpan={5} style={{ padding: '12px 15px', fontWeight: 700, textAlign: 'right' }}>
                                                        <FaCheckCircle className="me-2" />{selectedRecord.Examiner_Type === '2' ? 'Grand Total' : ''} 
                                                    </td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                                                        {selectedRecord.Examiner_Type === '2' && formatCurrency(selectedRecord.Total_Amount)}
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4 text-muted">No subject records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={deleteConfirm.show} onHide={() => setDeleteConfirm({ show: false, row: null })} centered>
                <Modal.Header closeButton style={{ background: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
                    <Modal.Title style={{ fontWeight: 700, color: '#856404', fontSize: '16px' }}>
                        ⚠️ Confirm Delete
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteConfirm.row && (
                        <>
                            <p className="mb-2">Are you sure you want to permanently delete this payment record?</p>
                            <div className="p-3 rounded" style={{ background: '#f8f9fa', fontSize: '13px' }}>
                                <div><strong>Challan Number:</strong> {deleteConfirm.row.ChallanNumber || '—'}</div>
                                <div><strong>Evaluator:</strong> {deleteConfirm.row.Evaluation_Id} — {deleteConfirm.row.Evaluation_Name}</div>
                                <div><strong>Degree:</strong> {deleteConfirm.row.Degree_Name}</div>
                                <div><strong>Subject Records:</strong> {deleteConfirm.row.subjects?.length || 0} subcode(s) will also be deleted</div>
                                <div><strong>Total Amount:</strong> ₹{deleteConfirm.row.Total_Amount}</div>
                            </div>
                            <p className="mt-2 mb-0 text-danger" style={{ fontSize: '12px' }}>
                                This action cannot be undone. All associated subject records will be removed.
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setDeleteConfirm({ show: false, row: null })}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ExaminerPaymentReport;
