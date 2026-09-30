import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Form, Row, Col, Button, Modal, Alert } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { useGetServerTimeQuery, useAddDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation } from '../../redux-slice/generalApiSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';

const DataTable = DataTableBase.default || DataTableBase;

const emptyForm = { D_Code_01: '', Degree_Name_02: '', Flg_03: 'Y', Time_Flg_04: 'N', Paper_Time_05: '' };

const DepartmentMaster = () => {
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

    const { data: apiData, isLoading, error, refetch } = useGetServerTimeQuery();
    const [addDepartment, { isLoading: isAdding }] = useAddDepartmentMutation();
    const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
    const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

    useEffect(() => {
        if (apiData?.data && Array.isArray(apiData.data)) {
            setData(apiData.data);
        }
    }, [apiData]);

    const filteredData = data.filter((item) =>
        (item.D_Code?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (item.Degree_Name?.toLowerCase() || '').includes(searchText.toLowerCase())
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
            D_Code_01: row.D_Code || '',
            Degree_Name_02: row.Degree_Name || '',
            Flg_03: row.Flg || 'Y',
            Time_Flg_04: row.Time_Flg || 'N',
            Paper_Time_05: row.Paper_Time || '',
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
        if (!formData.D_Code_01.trim() || !formData.Degree_Name_02.trim()) {
            setFormError('D Code and Degree Name are required.');
            return;
        }
        setFormError('');
        try {
            if (modalMode === 'add') {
                await addDepartment(formData).unwrap();
                toast.success('Department added successfully!');
            } else {
                await updateDepartment({ id: selectedRow.id, ...formData }).unwrap();
                toast.success('Department updated successfully!');
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
            await deleteDepartment(deleteRow.id).unwrap();
            toast.success('Department deleted successfully!');
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
            'D Code': item.D_Code,
            'Degree Name': item.Degree_Name,
            'Status': item.Flg === 'Y' ? 'Active' : 'Inactive',
            'Time Flag': item.Time_Flg,
            'Paper Time': item.Paper_Time,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments');
        XLSX.writeFile(workbook, `Department_Master_${new Date().toLocaleDateString()}.xlsx`);
    };

    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => <div style={{ textAlign: 'center' }}>{(currentPage - 1) * perPage + index + 1}</div>,
            width: '70px',
        },
        {
            name: 'D Code',
            selector: (row) => row.D_Code,
            sortable: true,
            width: '100px',
            cell: (row) => <div style={{ textAlign: 'center' }}><span style={{ fontSize: '14px', fontWeight: '700' }}>{row.D_Code}</span></div>,
        },
        {
            name: 'Degree Name',
            selector: (row) => row.Degree_Name,
            sortable: true,
            cell: (row) => <span style={{ fontSize: '14px', fontWeight: '600' }}>{row.Degree_Name}</span>,
        },
        {
            name: 'Status',
            selector: (row) => row.Flg,
            sortable: true,
            width: '110px',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: row.Flg === 'Y' ? '#38a169' : '#e53e3e' }}>
                        {row.Flg === 'Y' ? 'Active' : 'Inactive'}
                    </span>
                </div>
            ),
        },
        {
            name: 'Time Flag',
            selector: (row) => row.Time_Flg,
            sortable: true,
            width: '110px',
            cell: (row) => <div style={{ textAlign: 'center' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>{row.Time_Flg === 'Y' ? 'Yes' : 'No'}</span></div>,
        },
        {
            name: 'Paper Time',
            selector: (row) => row.Paper_Time,
            sortable: true,
            width: '120px',
            cell: (row) => <div style={{ textAlign: 'center' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>{row.Paper_Time}</span></div>,
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
            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>Department Master</h3>

            <Card className="mb-3">
                <Card.Body>
                    <Row className="mb-3 align-items-center">
                        <Col md={5}>
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search by D Code or Degree Name"
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
                            <Button variant="primary" size="sm" onClick={handleOpenAdd}
                                style={{ backgroundColor: '#2c5282', borderColor: '#2c5282' }}>
                                + Add Department
                            </Button>
                        </Col>
                    </Row>

                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading departments...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-5 text-danger">Failed to load department data.</div>
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
                                <div className="text-center py-5"><p>No departments found</p></div>
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
                    <p className="mb-1">Are you sure you want to delete this department?</p>
                    {deleteRow && (
                        <p className="mb-0">
                            <strong>{deleteRow.D_Code}</strong> — {deleteRow.Degree_Name}
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : null}
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add / Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff' }}>
                    <Modal.Title>{modalMode === 'add' ? '+ Add Department' : '✏️ Edit Department'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>D Code <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="D_Code_01"
                                        value={formData.D_Code_01}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 01"
                                        disabled={modalMode === 'edit'}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Degree Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Degree_Name_02"
                                        value={formData.Degree_Name_02}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Engineering"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="Flg_03" value={formData.Flg_03} onChange={handleInputChange}>
                                        <option value="Y">Active</option>
                                        <option value="N">Inactive</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Time Flag</Form.Label>
                                    <Form.Select name="Time_Flg_04" value={formData.Time_Flg_04} onChange={handleInputChange}>
                                        <option value="Y">Yes</option>
                                        <option value="N">No</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Paper Time</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Paper_Time_05"
                                        value={formData.Paper_Time_05}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 12.45"
                                    />
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

export default DepartmentMaster;
