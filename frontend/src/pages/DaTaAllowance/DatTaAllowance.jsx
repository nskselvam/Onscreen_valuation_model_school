import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Button, Form, InputGroup, Modal, Alert } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import {
  useGetAllDataAllowancesQuery,
  useCreateDataAllowanceMutation,
  useUpdateDataAllowanceMutation,
  useDeleteDataAllowanceMutation,
} from '../../redux-slice/dataAllowanceApiSlice';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';

const DataTable = DataTableBase.default || DataTableBase;

const DatTaAllowance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    depcode: '',
    particulars: '',
    remuneration_data: '',
    incidental: '',
    accomodation_cost: '',
    billprovide: '',
    dearnessallowance: '',
    travelallowance: '',
    particulars_name: '',
    remuneration_name: ''
  });

  // RTK Query hooks
  const { data: allowancesData, isLoading, error, refetch } = useGetAllDataAllowancesQuery();
  const [createAllowance, { isLoading: isCreating }] = useCreateDataAllowanceMutation();
  const [updateAllowance, { isLoading: isUpdating }] = useUpdateDataAllowanceMutation();
  const [deleteAllowance, { isLoading: isDeleting }] = useDeleteDataAllowanceMutation();

  // Handle opening modal for create
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      depcode: '',
      particulars: '',
      remuneration_data: '',
      incidental: '',
      accomodation_cost: '',
      billprovide: '',
      dearnessallowance: '',
      travelallowance: '',
      particulars_name: '',
      remuneration_name: ''
    });
    setShowModal(true);
  };

  // Handle opening modal for edit
  const handleEdit = (record) => {
    setModalMode('edit');
    setSelectedRecord(record);
    setFormData({
      depcode: record.depcode || '',
      particulars: record.particulars || '',
      remuneration_data: record.remuneration_data || '',
      incidental: record.incidental || '',
      accomodation_cost: record.accomodation_cost || '',
      billprovide: record.billprovide || '',
      dearnessallowance: record.dearnessallowance || '',
      travelallowance: record.travelallowance || '',
      particulars_name: record.particulars_name || '',
      remuneration_name: record.remuneration_name || ''
    });
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await createAllowance(formData).unwrap();
        alert('Data allowance created successfully!');
      } else {
        await updateAllowance({ id: selectedRecord.id, ...formData }).unwrap();
        alert('Data allowance updated successfully!');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to save:', err);
      alert(`Error: ${err?.data?.message || 'Failed to save data allowance'}`);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    try {
      await deleteAllowance(recordToDelete.id).unwrap();
      alert('Data allowance deleted successfully!');
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert(`Error: ${err?.data?.message || 'Failed to delete data allowance'}`);
    }
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!allowancesData?.data) return [];
    
    return allowancesData.data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.depcode || '').toLowerCase().includes(searchLower) ||
        (item.particulars || '').toLowerCase().includes(searchLower) ||
        (item.particulars_name || '').toLowerCase().includes(searchLower) ||
        (item.remuneration_name || '').toLowerCase().includes(searchLower)
      );
    });
  }, [allowancesData, searchTerm]);

  // DataTable columns
  const columns = [
    {
      name: 'Sl.No',
      selector: (row, index) => index + 1,
      sortable: false,
      width: '80px',
      center: true,
    },
    {
      name: 'Dept Code',
      selector: row => row.depcode,
      sortable: true,
      center: true,
      width: '100px',
    },
    {
      name: 'Particulars',
      selector: row => row.particulars,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Particulars Name',
      selector: row => row.particulars_name,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Remuneration',
      selector: row => row.remuneration_data,
      sortable: true,
      center: true,
      width: '120px',
    },
    {
      name: 'Remuneration Name',
      selector: row => row.remuneration_name,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Incidental',
      selector: row => row.incidental,
      sortable: true,
      center: true,
      width: '100px',
    },
    {
      name: 'Accommodation',
      selector: row => row.accomodation_cost,
      sortable: true,
      center: true,
      width: '130px',
    },
    {
      name: 'Bill Provide',
      selector: row => row.billprovide,
      sortable: true,
      center: true,
      width: '110px',
    },
    {
      name: 'DA',
      selector: row => row.dearnessallowance,
      sortable: true,
      center: true,
      width: '80px',
    },
    {
      name: 'TA',
      selector: row => row.travelallowance,
      sortable: true,
      center: true,
      width: '80px',
    },
    {
      name: 'Actions',
      center: true,
      width: '150px',
      cell: row => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="warning"
            onClick={() => handleEdit(row)}
            title="Edit"
          >
            <FaEdit />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteClick(row)}
            title="Delete"
          >
            <FaTrash />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <UploadPageLayout
      mainTopic="Data Allowance Management"
      subTopic="Manage TA/DA allowances for departments"
      cardTitle="Data Allowance"
    >
      {/* Header with Add Button and Search */}
      <Row className="mb-3 g-3">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text style={{ backgroundColor: '#667eea', color: 'white' }}>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by dept code, particulars, or names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderColor: '#667eea' }}
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                Clear
              </Button>
            )}
          </InputGroup>
        </Col>
        <Col md={4}>
          <Button
            variant="success"
            onClick={handleCreate}
            className="w-100"
            style={{ fontWeight: '600' }}
          >
            <FaPlus className="me-2" />
            Add New Allowance
          </Button>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger">
          Error loading data: {error?.data?.message || error.message}
        </Alert>
      )}

      {/* DataTable */}
      <div style={{
        border: '2px solid #667eea',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
      }}>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 15, 20, 25, 50]}
          striped
          highlightOnHover
          pointerOnHover
          responsive
          progressPending={isLoading}
          customStyles={{
            headRow: {
              style: {
                backgroundColor: '#667eea',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
              }
            },
            rows: {
              style: {
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f7ff',
                  cursor: 'pointer',
                }
              }
            }
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#667eea', color: 'white' }}>
          <Modal.Title>
            {modalMode === 'create' ? 'Create New Allowance' : 'Edit Allowance'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="depcode"
                    value={formData.depcode}
                    onChange={handleInputChange}
                    required
                    maxLength={5}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Particulars</Form.Label>
                  <Form.Control
                    type="text"
                    name="particulars"
                    value={formData.particulars}
                    onChange={handleInputChange}
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Particulars Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="particulars_name"
                    value={formData.particulars_name}
                    onChange={handleInputChange}
                    maxLength={255}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Remuneration Data</Form.Label>
                  <Form.Control
                    type="text"
                    name="remuneration_data"
                    value={formData.remuneration_data}
                    onChange={handleInputChange}
                    maxLength={255}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Remuneration Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="remuneration_name"
                    value={formData.remuneration_name}
                    onChange={handleInputChange}
                    maxLength={255}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Incidental</Form.Label>
                  <Form.Control
                    type="text"
                    name="incidental"
                    value={formData.incidental}
                    onChange={handleInputChange}
                    maxLength={255}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Accommodation Cost</Form.Label>
                  <Form.Control
                    type="text"
                    name="accomodation_cost"
                    value={formData.accomodation_cost}
                    onChange={handleInputChange}
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bill Provide</Form.Label>
                  <Form.Control
                    type="text"
                    name="billprovide"
                    value={formData.billprovide}
                    onChange={handleInputChange}
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Dearness Allowance</Form.Label>
                  <Form.Control
                    type="text"
                    name="dearnessallowance"
                    value={formData.dearnessallowance}
                    onChange={handleInputChange}
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Travel Allowance</Form.Label>
                  <Form.Control
                    type="text"
                    name="travelallowance"
                    value={formData.travelallowance}
                    onChange={handleInputChange}
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isCreating || isUpdating}
              style={{ backgroundColor: '#667eea', border: 'none' }}
            >
              {isCreating || isUpdating ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this allowance record?
          {recordToDelete && (
            <div className="mt-3">
              <strong>Department Code:</strong> {recordToDelete.depcode}<br />
              <strong>Particulars:</strong> {recordToDelete.particulars}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </UploadPageLayout>
  );
};

export default DatTaAllowance;