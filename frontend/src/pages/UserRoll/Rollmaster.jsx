import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Modal, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { 
  useGetAllRollMastersQuery,
  useCreateRollMasterMutation,
  useUpdateRollMasterMutation,
  useDeleteRollMasterMutation
} from '../../redux-slice/adminOperationApiSlice';
import './Userollmaster.css';

const Rollmaster = () => {
  const { data: rollMasterData, isLoading: isFetching, refetch } = useGetAllRollMastersQuery();
  const [createRollMaster, { isLoading: isCreating }] = useCreateRollMasterMutation();
  const [updateRollMaster, { isLoading: isUpdating }] = useUpdateRollMasterMutation();
  const [deleteRollMaster, { isLoading: isDeleting }] = useDeleteRollMasterMutation();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState({
    id: null,
    rollName: '',
    rollDescrption: '',
    rollStatus: 1
  });

  const [modalNavHeader1, setModalNavHeader1] = useState('');
  const [modalNavHeader2, setModalNavHeader2] = useState([]);
  const [initialDescriptionItems, setInitialDescriptionItems] = useState([]); // Track items loaded from existing description

  const rollMasters = rollMasterData?.rollMasters || [];
  const navbarHeaders = rollMasterData?.navbarHeaders || [];
  const userRoleMasters = rollMasterData?.userRoleMasters || [];
  const isLoading = isFetching || isCreating || isUpdating || isDeleting;

  // Create role map from userRoleMasters for dynamic role name lookup
  const roleMap = {};
  userRoleMasters.forEach(role => {
    roleMap[String(role.user_role_code)] = role.user_role;
  });

  // Group navbar headers by Nav_Header_1
  // Get all Nav_Header_1 options (main headers with Nav_Header_2 === 0)
  const navHeader1Options = navbarHeaders
    .filter(h => h.Nav_Header_2 === 0)
    .sort((a, b) => a.Nav_Header_1 - b.Nav_Header_1);

  // Get ALL navbar headers (both main headers and sub-headers) for selection
  const allNavbarOptions = navbarHeaders.map(h => ({
    ...h,
    isMainHeader: h.Nav_Header_2 === 0
  }));

  // Remove filter states since we're moving them to modal
  const filteredRollMasters = rollMasters;

  // Get role name based on role ID
  const getRoleName = (rollId) => {
    return roleMap[String(rollId)] || `Unknown Role (${rollId})`;
  };

  // Get navbar header name for a given rollName
  const getNavbarHeaderName = (rollName) => {
    if (rollName === 0) return 'All Navbar Headers';
    const header = navbarHeaders.find(h => h.id === rollName);
    return header ? header.Nav_Header_Name : 'Unknown';
  };

  // Parse navbar header IDs from description
  const parseNavbarHeaders = (description) => {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // New format: [navHeader1, ...navHeader2IDs]
        // Return all except first element (which is navHeader1)
        return parsed.slice(1);
      }
      return [];
    } catch {
      return [];
    }
  };

  // Handle modal filter changes
  const handleModalNavHeader1Change = (e) => {
    const newHeaderId = e.target.value;
    setModalNavHeader1(newHeaderId);
  };

  const handleModalNavHeader2Change = (headerId) => {
    setModalNavHeader2(prev => {
      if (prev.includes(headerId)) {
        return prev.filter(id => id !== headerId);
      } else {
        return [...prev, headerId];
      }
    });
  };

  // Helper function to build rollDescrption from current selections
  const buildRollDescription = () => {
    // Simply return exactly what's selected in the UI
    const currentSelections = modalNavHeader2;
    
    // Remove duplicates and keep unique
    const uniqueItems = [...new Set(currentSelections)];
    
    return JSON.stringify(uniqueItems);
  };

  const handleSelectAll = () => {
    if (modalNavHeader2.length === allNavbarOptions.length) {
      // If all are selected, deselect all
      setModalNavHeader2([]);
    } else {
      // Select all
      setModalNavHeader2(allNavbarOptions.map(h => h.id));
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      try {
        const parsed = JSON.parse(item.rollDescrption || '[]');
        let savedNavHeader1 = '';
        let savedNavHeader2 = [];
        
        // Handle array format: [navHeader1ID, ...navHeader2IDs]
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedNavHeader1 = String(parsed[0]);
          savedNavHeader2 = parsed.slice(1);
          // Store initial items for tracking what gets unchecked
          setInitialDescriptionItems(parsed);
        } else {
          setInitialDescriptionItems([]);
        }
        
        setCurrentItem({
          id: item.id,
          rollName: item.rollName,
          rollDescrption: item.rollDescrption || '',
          rollStatus: item.rollStatus
        });
        
        setModalNavHeader1(savedNavHeader1);
        setModalNavHeader2(savedNavHeader2);
      } catch (error) {
        console.error('Error parsing rollDescrption:', error);
        setCurrentItem({
          id: item.id,
          rollName: item.rollName,
          rollDescrption: item.rollDescrption || '',
          rollStatus: item.rollStatus
        });
        setModalNavHeader1('');
        setModalNavHeader2([]);
        setInitialDescriptionItems([]);
      }
    } else {
      setCurrentItem({
        id: null,
        rollName: '',
        rollDescrption: '',
        rollStatus: 1
      });
      setModalNavHeader1('');
      setModalNavHeader2([]);
      setInitialDescriptionItems([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem({
      id: null,
      rollName: '',
      rollDescrption: '',
      rollStatus: 1
    });
    setModalNavHeader1('');
    setModalNavHeader2([]);
    setInitialDescriptionItems([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'rollStatus' || name === 'rollName' ? parseInt(value, 10) : value;
    setCurrentItem(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentItem.rollName && currentItem.rollName !== 0) {
      toast.error('Roll name is required');
      return;
    }

    if (modalNavHeader2.length === 0) {
      toast.error('Please select at least one navbar item');
      return;
    }

    try {
      // Build the final rollDescrption right before saving to ensure accuracy
      const finalRollDescription = buildRollDescription();
      
      const dataToSave = {
        ...currentItem,
        rollDescrption: finalRollDescription
      };


      if (modalMode === 'add') {
        await createRollMaster(dataToSave).unwrap();
        toast.success('Roll master created successfully');
      } else {
        await updateRollMaster(dataToSave).unwrap();
        toast.success('Roll master updated successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error saving roll master:', error);
      toast.error(error?.data?.message || 'Failed to save roll master');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this roll master?')) {
      return;
    }

    try {
      await deleteRollMaster({ id }).unwrap();
      toast.success('Roll master deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting roll master:', error);
      toast.error(error?.data?.message || 'Failed to delete roll master');
    }
  };

  return (
    <Container fluid className="user-roll-master p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Action Bar */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0 text-muted">
                <i className="bi bi-info-circle me-2"></i>
                Total Roles: <strong>{filteredRollMasters.length}</strong>
              </h6>
            </Col>
            <Col md={6} className="text-end">
              <Button 
                variant="success" 
                onClick={() => handleOpenModal('add')}
                className="shadow-sm"
                size="lg"
              >
                <FaPlus className="me-2" />
                Add New Role
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Roll Masters Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading roll masters...</p>
        </div>
      ) : filteredRollMasters.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Roll Masters List
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 user-roll-table">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '70px' }}>S.No</th>
                    <th style={{ width: '150px' }}>Roll ID</th>
                    <th style={{ width: '200px' }}>Role Name</th>
                    <th style={{ width: '250px' }}>Mapped To</th>
                    <th style={{ width: '350px' }}>Description</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRollMasters.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>
                      <td className="text-center">
                        <Badge bg="primary" pill>{item.rollName}</Badge>
                      </td>
                      <td>
                        <strong>{getRoleName(item.rollName)}</strong>
                      </td>
                      <td>
                        {(() => {
                          const headerIds = parseNavbarHeaders(item.rollDescrption);
                          if (headerIds.length === 0) return <span className="text-muted">No mapping</span>;
                          return (
                            <div>
                              {headerIds.map((id, badgeIndex) => {
                                const header = navbarHeaders.find(h => h.id === id);
                                return header ? (
                                  <Badge key={`${id}-${header.Nav_Main_Header_Name}-${badgeIndex}`} bg="info" className="me-1 mb-1">
                                    {header.Nav_Header_2}.{header.Nav_Header_3}.{header.Nav_Header_4} - {header.Nav_Main_Header_Name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <small className="text-muted">
                          {(() => {
                            const headerIds = parseNavbarHeaders(item.rollDescrption);
                            return headerIds.length > 0 ? `${headerIds.length} header(s) mapped` : '-';
                          })()}
                        </small>
                      </td>
                      <td className="text-center">
                        <Badge bg={item.rollStatus === 1 ? 'success' : 'secondary'}>
                          {item.rollStatus === 1 ? (
                            <><FaCheckCircle className="me-1" />Active</>
                          ) : (
                            <><FaTimesCircle className="me-1" />Inactive</>
                          )}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', item)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No roll masters found matching the filter. Click "Add New Role" to create one.</p>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalMode === 'add' ? 'Add New Roll Master' : 'Edit Roll Master'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll ID <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="rollName"
                    value={currentItem.rollName}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Roll</option>
                    {userRoleMasters.map(role => (
                      <option key={role.user_role_code} value={role.user_role_code}>
                        {role.user_role_code} - {role.user_role}
                      </option>
                    ))}
                  </Form.Select>
                  <small className="text-muted">Select role from user types</small>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="rollStatus"
                    value={currentItem.rollStatus}
                    onChange={handleInputChange}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-danger">Navbar Items * Multiple Selection</Form.Label>
                  
                  <div 
                    style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      border: '1px solid #ced4da', 
                      borderRadius: '0.25rem',
                      padding: '0.5rem',
                      backgroundColor: '#fff'
                    }}
                  >
                    {allNavbarOptions.length === 0 ? (
                      <div className="text-muted text-center py-3">
                        <small>No navbar items available</small>
                      </div>
                    ) : (
                      <>
                        <Form.Check
                          type="checkbox"
                          id="select-all-headers"
                          label={<strong>Select All</strong>}
                          checked={modalNavHeader2.length === allNavbarOptions.length && allNavbarOptions.length > 0}
                          onChange={handleSelectAll}
                          className="mb-2 pb-2"
                          style={{ borderBottom: '1px solid #dee2e6' }}
                        />
                        {allNavbarOptions.map((header, headerIndex) => {
                          return (
                            <Form.Check
                              key={`header-${header.id}-${headerIndex}`}
                              type="checkbox"
                              id={`header-${header.id}-${headerIndex}`}
                              label={
                                <span>
                                  {header.isMainHeader ? (
                                    <>
                                      <Badge bg="primary" className="me-2" style={{fontSize: '0.75em'}}>MAIN L{header.Nav_Header_1}</Badge>
                                      <strong>{header.id} - {header.Nav_Main_Header_Name}</strong>
                                    </>
                                  ) : (
                                    <>
                                      <Badge bg="info" className="me-2" style={{fontSize: '0.7em'}}>L{header.Nav_Header_1}</Badge>
                                      {header.id} - {header.Nav_Header_2}.{header.Nav_Header_3}.{header.Nav_Header_4} - {header.Nav_Main_Header_Name}
                                    </>
                                  )}
                                </span>
                              }
                              checked={modalNavHeader2.includes(header.id)}
                              onChange={() => handleModalNavHeader2Change(header.id)}
                              className="mb-2"
                            />
                          );
                        })}
                      </>
                    )}
                  </div>
                  <small className="text-muted">Select navbar items (includes both main headers and sub-headers from all levels). Unchecking items will remove them from the description.</small>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="rollDescrption"
                    value={currentItem.rollDescrption}
                    onChange={handleInputChange}
                    placeholder="Enter role description"
                    readOnly
                  />
                  <small className="text-muted">Auto-populated with selected navbar headers</small>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              <FaTimes className="me-2" />
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={isLoading}>
              <FaSave className="me-2" />
              {isLoading ? 'Saving...' : modalMode === 'add' ? 'Save' : 'Update'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Rollmaster;