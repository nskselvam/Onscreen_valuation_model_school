import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Form, Row, Col, Button, Modal, Alert } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { useGetMonthYearDataQuery, useAddMonthYearMutation, useUpdateMonthYearMutation, useDeleteMonthYearMutation } from '../../redux-slice/generalApiSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';

const DataTable = DataTableBase.default || DataTableBase;

const emptyForm = {
    Eva_Month_01: '',
    Eva_Year_02: '',
    Eva_Month_Des_03: '',
    Eva_Year_Desc_04: '',
    Month_Year_Status_05: 'Y',
};

const MonthYearMaster = () => {
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [selectedRow, setSelectedRow] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [formError, setFormError] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);

    const { data: apiData, isLoading, error, refetch } = useGetMonthYearDataQuery();
    const [addMonthYear, { isLoading: isAdding }] = useAddMonthYearMutation();
    const [updateMonthYear, { isLoading: isUpdating }] = useUpdateMonthYearMutation();
    const [deleteMonthYear, { isLoading: isDeleting }] = useDeleteMonthYearMutation();

    useEffect(() => {
        if (apiData?.data && Array.isArray(apiData.data)) {
            setData(apiData.data);
        }
    }, [apiData]);

    const filteredData = data.filter((item) =>
        (item.Eva_Month?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (item.Eva_Year?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (item.Eva_Month_Des?.toLowerCase() || '').includes(searchText.toLowerCase())
    );

    const handleOpenAdd = () => {
        setFormData(emptyForm);
        setFormError('');
        setModalMode('add');
        setSelectedRow(null);
        setShowModal(true);
    };

    const handleOpenEdit = (row) => {
        setFormData({
            Eva_Month_01: row.Eva_Month || '',
            Eva_Year_02: row.Eva_Year || '',
            Eva_Month_Des_03: row.Eva_Month_Des || '',
            Eva_Year_Desc_04: row.Eva_Year_Desc || '',
            Month_Year_Status_05: row.Month_Year_Status || 'Y',
        });
        setFormError('');
        setModalMode('edit');
        setSelectedRow(row);
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.Eva_Month_01.trim() || !formData.Eva_Year_02.trim()) {
            setFormError('Eva Month and Eva Year are required.');
            return;
        }
        setFormError('');
        try {
            if (modalMode === 'add') {
                await addMonthYear(formData).unwrap();
                toast.success('Month Year added successfully!');
            } else {
                await updateMonthYear({ id: selectedRow.id, ...formData }).unwrap();
                toast.success('Month Year updated successfully!');
            }
            setShowModal(false);
            refetch();
        } catch (err) {
            setFormError(err?.data?.message || 'Operation failed. Please try again.');
        }
    };

    const handleOpenDelete = (row) => {
        setDeleteRow(row);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            await deleteMonthYear(deleteRow.id).unwrap();
            toast.success('Month Year deleted successfully!');
            setShowDeleteModal(false);
            setDeleteRow(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Delete failed. Please try again.');
        }
    };

    const handleExportToExcel = () => {
        if (filteredData.length === 0) return;
        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Eva Month': item.Eva_Month,
            'Eva Year': item.Eva_Year,
            'Month Description': item.Eva_Month_Des,
            'Year Description': item.Eva_Year_Desc,
            'Status': item.Month_Year_Status === 'Y' ? 'Active' : 'Inactive',
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MonthYear');
        XLSX.writeFile(workbook, `Month_Year_Master_${new Date().toLocaleDateString()}.xlsx`);
    };

    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => <div style={{ textAlign: 'center' }}>{(currentPage - 1) * perPage + index + 1}</div>,
            width: '70px',
        },
        {
            name: 'Eva Month',
            selector: (row) => row.Eva_Month,
            sortable: true,
            width: '120px',
            cell: (row) => <div style={{ textAlign: 'center' }}><span style={{ fontSize: '14px', fontWeight: '700' }}>{row.Eva_Month}</span></div>,
        },
        {
            name: 'Eva Year',
            selector: (row) => row.Eva_Year,
            sortable: true,
            width: '110px',
            cell: (row) => <div style={{ textAlign: 'center' }}><span style={{ fontSize: '14px', fontWeight: '700' }}>{row.Eva_Year}</span></div>,
        },
        {
            name: 'Month Description',
            selector: (row) => row.Eva_Month_Des,
            sortable: true,
            cell: (row) => <span style={{ fontSize: '14px', fontWeight: '600' }}>{row.Eva_Month_Des}</span>,
        },
        {
            name: 'Year Description',
            selector: (row) => row.Eva_Year_Desc,
            sortable: true,
            cell: (row) => <span style={{ fontSize: '14px', fontWeight: '600' }}>{row.Eva_Year_Desc}</span>,
        },
        {
            name: 'Status',
            selector: (row) => row.Month_Year_Status,
            sortable: true,
            width: '110px',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: row.Month_Year_Status === 'Y' ? '#38a169' : '#e53e3e' }}>
                        {row.Month_Year_Status === 'Y' ? 'Active' : 'Inactive'}
                    </span>
                </div>
            ),
        },
        {
            name: 'Action',
            width: '160px',
            cell: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => handleOpenEdit(row)}
                        style={{
                            backgroundColor: '#2c5282',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '5px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        ✏️ Edit
                    </button>
                    <button
                        onClick={() => handleOpenDelete(row)}
                        style={{
                            backgroundColor: '#c53030',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '5px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        🗑️ Delete
                    </button>
                </div>
            ),
        },
    ];

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
        headCells: { style: { color: '#ffffff' } },
        rows: {
            style: {
                fontSize: '13px',
                minHeight: '52px',
                '&:hover': { backgroundColor: '#f0f4f8', cursor: 'pointer' },
            },
            stripedStyle: { backgroundColor: '#f8fafc' },
        },
        pagination: { style: { borderTop: '1px solid #e2e8f0', minHeight: '56px' } },
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
            <ToastContainer position="top-right" autoClose={3000} />
            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>Month Year Master</h3>

            <Card className="mb-3">
                <Card.Body>
                    <Row className="mb-3 align-items-center">
                        <Col md={5}>
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search by Month, Year or Description"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </Col>
                        <Col md={7} className="d-flex justify-content-end gap-2">
                            {searchText && (
                                <Button variant="outline-secondary" size="sm" onClick={() => setSearchText('')}>✕ Clear</Button>
                            )}
                            <Button variant="success" size="sm" onClick={handleExportToExcel} disabled={filteredData.length === 0}>
                                <i className="bi bi-file-earmark-excel me-1"></i> Export
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleOpenAdd}
                                style={{ backgroundColor: '#2c5282', borderColor: '#2c5282' }}
                            >
                                + Add Month Year
                            </Button>
                        </Col>
                    </Row>

                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading month year data...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-5 text-danger">Failed to load month year data.</div>
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
                                <div className="text-center py-5"><p>No month year records found</p></div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
                <Modal.Header closeButton style={{ backgroundColor: '#c53030', color: '#fff' }}>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-3">
                    <p className="mb-1">Are you sure you want to delete this record?</p>
                    {deleteRow && (
                        <p className="mb-0">
                            <strong>{deleteRow.Eva_Month}</strong> — {deleteRow.Eva_Year}
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : null}
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add / Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff' }}>
                    <Modal.Title>{modalMode === 'add' ? '+ Add Month Year' : '✏️ Edit Month Year'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Eva Month <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Eva_Month_01"
                                        value={formData.Eva_Month_01}
                                        onChange={handleInputChange}
                                        placeholder="e.g. May"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Eva Year <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Eva_Year_02"
                                        value={formData.Eva_Year_02}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 2026"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Month Description</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Eva_Month_Des_03"
                                        value={formData.Eva_Month_Des_03}
                                        onChange={handleInputChange}
                                        placeholder="e.g. May 2026"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Year Description</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Eva_Year_Desc_04"
                                        value={formData.Eva_Year_Desc_04}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Academic Year 2025-26"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="Month_Year_Status_05" value={formData.Month_Year_Status_05} onChange={handleInputChange}>
                                        <option value="Y">Active</option>
                                        <option value="N">Inactive</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isAdding || isUpdating}
                        style={{ backgroundColor: '#2c5282', borderColor: '#2c5282' }}
                    >
                        {isAdding || isUpdating ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : null}
                        {modalMode === 'add' ? 'Add' : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MonthYearMaster;
