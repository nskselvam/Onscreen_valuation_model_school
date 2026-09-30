import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import ConfirmModal from '../../../components/modals/ConfirmModal'
import { useCommongetDataQuery, useCommonUpdateDataMutation, useCommonipAddDataMutation } from '../../../redux-slice/ipConfigapiSlice'
import DataTableBase from 'react-data-table-component'
import { Form, Button, Row, Col, Alert, Modal } from 'react-bootstrap'

const DataTable = DataTableBase.default || DataTableBase

const IpConfig = () => {
  const { data: initialData, isLoading, isSuccess, isError, error, refetch } = useCommongetDataQuery();
  const [updateData, { isLoading: isUpdating, data: updateResponse, isSuccess: updateSuccess, isError: updateError }] = useCommonUpdateDataMutation();
  const [addIpData, { isLoading: isAdding }] = useCommonipAddDataMutation();
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState({ id: null, currentStatus: null });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({ Ip_Address: '', To_Ip: '', block_name: '', campus: '', floor: '' });
  const [formErrors, setFormErrors] = useState({});
  const messageTimeoutRef = useRef(null);

  // Initialize and sync table data with initial data
  useEffect(() => {
    if (initialData?.data) {
      setTableData(initialData.data);
    }
  }, [initialData]);

  // Handle successful updates and refetch data
  useEffect(() => {
    if (updateSuccess && updateResponse) {
      // Clear the updating state immediately
      setUpdatingId(null);
      
      // Show success message
      setSuccessMessage('Updated successfully!');
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);

      // Refetch the latest data to ensure sync
      refetch();
    }
  }, [updateSuccess, updateResponse, refetch]);

  // Handle update errors
  useEffect(() => {
    if (updateError) {
      setUpdatingId(null);
      const errorMsg = updateError?.data?.message || 'Failed to update record';
      setErrorMessage(errorMsg);
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setErrorMessage(''), 3000);
    }
  }, [updateError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Clear deletingIds when modal closes
  useEffect(() => {
    if (!showDeleteModal && !showUpdateModal) {
      setDeletingIds([]);
    }
  }, [showDeleteModal, showUpdateModal]);

  // Handle add error - handled directly in handleAddIp

  // Filter data based on search term
  const filteredData = useMemo(() => {
    return tableData?.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) || [];
  }, [tableData, searchTerm]);

  // Define table columns
  const columns = [
    {
      name: 'ID',
      selector: row => row.id,
      sortable: true,
      width: '80px'
    },
    {
      name: 'IP Address',
      selector: row => row.Ip_Address,
      sortable: true
    },
    {
      name: 'Block Name',
      selector: row => row.block_name,
      sortable: true
    },
    {
      name: 'Active',
      selector: row => row.vflg ? 'Yes' : 'No',
      sortable: true,
      width: '100px'
    },
    {
      name: 'Campus',
      selector: row => row.campus,
      sortable: true
    },
    {
      name: 'Floor',
      selector: row => row.floor,
      sortable: true
    },
    {
      name: 'Status',
      cell: row => (
        <Button 
          variant={row.vflg === 'Y' ? 'success' : 'danger'} 
          size="sm"
          onClick={() => handleStatusUpdate(row.id, row.vflg)}
          disabled={updatingId === row.id || isUpdating}
        >
          {updatingId === row.id ? 'Updating...' : (row.vflg === 'Y' ? 'Active' : 'Inactive')}
        </Button>
      ),
      width: '120px',
      ignoreRowClick: true
    },
    {
      name: 'Action',
      cell: row => (
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => {
            setDeletingIds([row.id]);
            setShowDeleteModal(true);
          }}
          disabled={updatingId === row.id}
        >
          Delete
        </Button>
      ),
      width: '100px',
      ignoreRowClick: true
    }
  ];

  const handleDeleteMultiple = useCallback(() => {
    if (selectedRows.length === 0) {
      alert('Please select rows to delete');
      return;
    }
    const ids = selectedRows.map(row => row.id);
    setDeletingIds(ids);
    setShowDeleteModal(true);
  }, [selectedRows]);

  const handleConfirmDelete = useCallback(async () => {
    setUpdatingId('deleting');
    try {
      await updateData({
        ids: deletingIds
      }).unwrap();
      // Remove deleted rows from table data immediately
      setTableData(prev => prev.filter(row => !deletingIds.includes(row.id)));
      setSelectedRows([]);
      setShowDeleteModal(false);
      setDeletingIds([]);
      setSuccessMessage('Records deleted successfully!');
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
      setErrorMessage(err?.data?.message || 'Failed to delete records');
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setUpdatingId(null);
      setDeletingIds([]);
    }
  }, [deletingIds, updateData]);

  const handleStatusUpdate = useCallback((id, currentStatus) => {
    // Show confirmation modal instead of updating immediately
    setPendingStatusUpdate({ id, currentStatus });
    setShowUpdateModal(true);
  }, []);

  const handleConfirmStatusUpdate = useCallback(async () => {
    const { id, currentStatus } = pendingStatusUpdate;
    const newStatus = currentStatus === 'Y' ? 'N' : 'Y';
    
    // Optimistic update - update UI immediately
    setTableData(prev =>
      prev.map(row =>
        row.id === id ? { ...row, vflg: newStatus } : row
      )
    );
    
    setUpdatingId(id);
    setShowUpdateModal(false);
    
    try {
      await updateData({
        id: id,
        vflg: newStatus
      }).unwrap();
      
      // Success - data is already updated in UI via useEffect refetch
    } catch (err) {
      console.error('Status update failed:', err);
      // Revert on error
      setTableData(prev =>
        prev.map(row =>
          row.id === id ? { ...row, vflg: currentStatus } : row
        )
      );
      setErrorMessage(err?.data?.message || 'Failed to update status');
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setErrorMessage(''), 3000);
    }
  }, [pendingStatusUpdate, updateData]);

  // Validation function
  const validateIpForm = () => {
    const errors = {};
    
    // IP Address validation
    if (!formData.Ip_Address.trim()) {
      errors.Ip_Address = 'IP Address is required';
    } else {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formData.Ip_Address)) {
        errors.Ip_Address = 'Invalid IP format (e.g., 192.168.1.1)';
      } else {
        const octets = formData.Ip_Address.split('.').map(Number);
        if (octets.some(octet => octet > 255 || octet < 0)) {
          errors.Ip_Address = 'Each octet must be between 0-255';
        }
      }
    }

    // To IP (last octet) validation
    if (!String(formData.To_Ip).trim()) {
      errors.To_Ip = 'To IP is required';
    } else {
      const toOctet = Number(formData.To_Ip);
      if (isNaN(toOctet) || toOctet < 0 || toOctet > 255 || !Number.isInteger(toOctet)) {
        errors.To_Ip = 'To IP must be a number between 0 and 255';
      } else if (formData.Ip_Address && /^(\d{1,3}\.){3}\d{1,3}$/.test(formData.Ip_Address)) {
        const fromLastOctet = Number(formData.Ip_Address.split('.')[3]);
        if (toOctet < fromLastOctet) {
          errors.To_Ip = 'To IP must be ≥ last octet of From IP (' + fromLastOctet + ')';
        }
      }
    }

    // Block Name validation
    if (!formData.block_name.trim()) {
      errors.block_name = 'Block Name is required';
    } else if (formData.block_name.length < 2) {
      errors.block_name = 'Block Name must be at least 2 characters';
    }

    // Campus validation
    if (!formData.campus.trim()) {
      errors.campus = 'Campus is required';
    } else if (formData.campus.length < 2) {
      errors.campus = 'Campus must be at least 2 characters';
    }

    // Floor validation
    if (!formData.floor) {
      errors.floor = 'Floor is required';
    } else if (isNaN(formData.floor) || formData.floor < 0) {
      errors.floor = 'Floor must be a valid number';
    }

    return errors;
  };

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  const handleAddIp = useCallback(async () => {
    const errors = validateIpForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await addIpData({
        Ip_Address: formData.Ip_Address.trim(),
        To_Ip: parseInt(formData.To_Ip),
        block_name: formData.block_name.trim(),
        campus: formData.campus.trim(),
        floor: parseInt(formData.floor)
      }).unwrap();

      const msg = response?.message || 'IP(s) added successfully!';
      setSuccessMessage(msg);
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 5000);

      setShowAddModal(false);
      setFormData({ Ip_Address: '', To_Ip: '', block_name: '', campus: '', floor: '' });
      setFormErrors({});
      refetch();
    } catch (err) {
      console.error('Add IP failed:', err);
      const errMsg = err?.data?.message || err?.error || 'Failed to add IP. Please try again.';
      setErrorMessage(errMsg);
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setErrorMessage(''), 5000);
    }
  }, [formData, addIpData, refetch]);



  return (
    <UploadPageLayout
      mainTopic="IP Configuration"
      subTopic="Configure your IP settings"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      {isLoading && <div className="text-center py-4">Loading...</div>}
      {isError && (
        <Alert variant="danger">
          Error: {error?.data?.message || 'Failed to fetch data'}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
          {errorMessage}
        </Alert>
      )}
      {isSuccess && tableData?.length > 0 && (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by IP, Block, Campus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end gap-2">
              <Button 
                variant="danger" 
                onClick={handleDeleteMultiple}
                disabled={selectedRows.length === 0}
              >
                Delete Multiple ({selectedRows.length})
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                Add New IP
              </Button>
            </Col>
          </Row>

          <DataTable
            columns={columns}
            data={filteredData}
            selectableRows
            onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 30, 50]}
            highlightOnHover
            striped
            responsive
            progressPending={isLoading}
            noDataComponent={<div className="p-4">No data available</div>}
          />

          <ConfirmModal
            show={showDeleteModal}
            title="Delete IP Configuration"
            message={`Are you sure you want to delete ${deletingIds.length} selected record(s)? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteModal(false)}
            confirmText="Delete"
            cancelText="Cancel"
            confirmVariant="danger"
            isLoading={updatingId === 'deleting'}
          />

          <ConfirmModal
            show={showUpdateModal}
            title="Update Status"
            message={`Change IP status from ${pendingStatusUpdate.currentStatus === 'Y' ? 'Active' : 'Inactive'} to ${pendingStatusUpdate.currentStatus === 'Y' ? 'Inactive' : 'Active'}?`}
            onConfirm={handleConfirmStatusUpdate}
            onCancel={() => setShowUpdateModal(false)}
            confirmText="Update"
            cancelText="Cancel"
            confirmVariant="warning"
            isLoading={updatingId === pendingStatusUpdate.id}
          />

          <Modal
            show={showAddModal}
            onHide={() => {
              setShowAddModal(false);
              setFormData({ Ip_Address: '', To_Ip: '', block_name: '', campus: '', floor: '' });
              setFormErrors({});
            }}
            centered
            backdrop="static"
            size="lg"
          >
            <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff', padding: '16px 24px' }}>
              <Modal.Title style={{ fontWeight: '600', fontSize: '18px' }}>
                🌐 Add New IP Address
              </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: '28px 32px' }}>
              <Form>
                {/* Row 1: IP Address + Block Name */}
                <Row className="mb-4">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>
                        From IP Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="Ip_Address"
                        placeholder="e.g., 192.168.1.1"
                        value={formData.Ip_Address}
                        onChange={handleFormChange}
                        isInvalid={!!formErrors.Ip_Address}
                        style={{ borderRadius: '6px', padding: '10px 14px' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.Ip_Address}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                                    <Col md={2}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>
                        To IP  <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="To_Ip"
                        placeholder="e.g., 1"
                        value={formData.To_Ip}
                        onChange={handleFormChange}
                        isInvalid={!!formErrors.To_Ip}
                        style={{ borderRadius: '6px', padding: '10px 14px' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.To_Ip}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>
                        Block Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="block_name"
                        placeholder="e.g., Block A"
                        value={formData.block_name}
                        onChange={handleFormChange}
                        isInvalid={!!formErrors.block_name}
                        style={{ borderRadius: '6px', padding: '10px 14px' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.block_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row 2: Campus + Floor */}
                <Row className="mb-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>
                        Campus <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="campus"
                        placeholder="e.g., Main Campus"
                        value={formData.campus}
                        onChange={handleFormChange}
                        isInvalid={!!formErrors.campus}
                        style={{ borderRadius: '6px', padding: '10px 14px' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.campus}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>
                        Floor <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="floor"
                        placeholder="e.g., 1"
                        value={formData.floor}
                        onChange={handleFormChange}
                        isInvalid={!!formErrors.floor}
                        min="0"
                        style={{ borderRadius: '6px', padding: '10px 14px' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.floor}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Modal.Body>

            <Modal.Footer style={{ backgroundColor: '#f7fafc', padding: '16px 32px', borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ Ip_Address: '', To_Ip: '', block_name: '', campus: '', floor: '' });
                  setFormErrors({});
                }}
                style={{ minWidth: '110px', borderRadius: '6px' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddIp}
                disabled={isAdding}
                style={{ minWidth: '130px', borderRadius: '6px', backgroundColor: '#2c5282', borderColor: '#2c5282' }}
              >
                {isAdding ? '⏳ Adding...' : '✅ Add IP'}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
      </div>
    </UploadPageLayout>
  )
}

export default IpConfig