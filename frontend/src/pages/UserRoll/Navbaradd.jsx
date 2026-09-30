import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Modal, InputGroup, Pagination, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaList, FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { 
  useGetNavbarDetailsQuery, 
  useCreateNavbarItemMutation, 
  useUpdateNavbarItemMutation, 
  useDeleteNavbarItemMutation 
} from '../../redux-slice/adminOperationApiSlice';
import './Userollmaster.css';

const Navbaradd = () => {
  const { data: navbarData, isLoading: isFetching, error: fetchError, refetch } = useGetNavbarDetailsQuery();
  const [createNavbarItem, { isLoading: isCreating }] = useCreateNavbarItemMutation();
  const [updateNavbarItem, { isLoading: isUpdating }] = useUpdateNavbarItemMutation();
  const [deleteNavbarItem, { isLoading: isDeleting }] = useDeleteNavbarItemMutation();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    Nav_Main_Header_Name: '',
    Nav_Main_Header_Name_Description: '',
    Nav_Header_1: 0,
    Nav_Header_2: 0,
    Nav_Header_3: 0,
    Nav_Header_4: 0,
    user_Type: 1,
    user_Role: '0',
    Nav_Status: 1,
    Nav_Icons: '',
    route_path: ''
  });

  const navbarItems = navbarData?.data_complete || [];
  const isLoading = isFetching || isCreating || isUpdating || isDeleting;

  // Search and filter logic
  const filteredItems = navbarItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.Nav_Main_Header_Name?.toLowerCase().includes(searchLower) ||
      item.Nav_Main_Header_Name_Description?.toLowerCase().includes(searchLower) ||
      item.route_path?.toLowerCase().includes(searchLower) ||
      item.id?.toString().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (fetchError) {
      toast.error('Failed to load navbar items');
      console.error('Fetch error:', fetchError);
    }
  }, [fetchError]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setCurrentItem(item);
    } else {
      setCurrentItem({
        id: null,
        Nav_Main_Header_Name: '',
        Nav_Main_Header_Name_Description: '',
        Nav_Header_1: 0,
        Nav_Header_2: 0,
        Nav_Header_3: 0,
        Nav_Header_4: 0,
        user_Type: '0',
        user_Role: '0',
        Nav_Status: 0,
        Nav_Icons: '',
        route_path: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem({
      id: null,
      Nav_Main_Header_Name: '',
      Nav_Main_Header_Name_Description: '',
      Nav_Header_1: 0,
      Nav_Header_2: 0,
      Nav_Header_3: 0,
      Nav_Header_4: 0,
      user_Type: '0',
      user_Role: '0',
      Nav_Status: 0,
      Nav_Icons: '',
      route_path: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to integers
    const numericFields = ['Nav_Header_1', 'Nav_Header_2', 'Nav_Header_3', 'Nav_Header_4', 'user_Type', 'Nav_Status'];
    const processedValue = numericFields.includes(name) ? parseInt(value, 10) : value;
    
    setCurrentItem(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentItem.Nav_Main_Header_Name.trim()) {
      toast.error('Navigation name is required');
      return;
    }

    try {
      if (modalMode === 'add') {
        const result = await createNavbarItem(currentItem).unwrap();
        toast.success('Navbar item created successfully');
      } else {
        const result = await updateNavbarItem(currentItem).unwrap();
        toast.success('Navbar item updated successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error saving navbar item:', error);
      toast.error(error?.data?.message || 'Failed to save navbar item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this navbar item?')) {
      return;
    }

    try {
      await deleteNavbarItem({ id }).unwrap();
      toast.success('Navbar item deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting navbar item:', error);
      toast.error(error?.data?.message || 'Failed to delete navbar item');
    }
  };

  return (
    <Container fluid className="user-roll-master p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Action Bar */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, description, route, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                  >
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Group className="d-flex align-items-center">
                <Form.Label className="mb-0 me-2 text-nowrap">Show:</Form.Label>
                <Form.Select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="w-auto"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
                <span className="ms-2 text-muted text-nowrap">per page</span>
              </Form.Group>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="success" 
                onClick={() => handleOpenModal('add')}
                className="shadow-sm"
                size="lg"
              >
                <FaPlus className="me-2" />
                Add New Navbar Item
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Navbar Items Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading navbar items...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Navigation Items List
              <span className="ms-2 badge bg-light text-dark">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length}
              </span>
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 user-roll-table">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>S.No</th>
                    <th style={{ width: '200px' }}>Navigation Name</th>
                    <th style={{ width: '250px' }}>Description</th>
                    <th style={{ width: '120px' }}>Hierarchy</th>
                    <th style={{ width: '150px' }}>Route Path</th>
                    <th style={{ width: '100px' }}>User Type</th>
                    <th style={{ width: '100px' }}>User Role</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '100px' }}>Icon</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center">{indexOfFirstItem + index + 1}</td>
                      <td>
                        <div className="nav-name">
                          <strong>{item.Nav_Main_Header_Name}</strong>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{item.Nav_Main_Header_Name_Description || '-'}</small>
                      </td>
                      <td className="text-center">
                        <Badge bg="info" className="hierarchy-badge">
                          {item.Nav_Header_1}.{item.Nav_Header_2}.{item.Nav_Header_3}.{item.Nav_Header_4}
                        </Badge>
                      </td>
                      <td>
                        <code className="route-path">{item.route_path || 'N/A'}</code>
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary" pill>{item.user_Type}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary" pill>{item.user_Role}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg={
                          item.Nav_Status === 1 ? 'success' : 
                          item.Nav_Status === 2 ? 'secondary' : 'danger'
                        }>
                          {item.Nav_Status === 1 ? (
                            <><FaCheckCircle className="me-1" />Active</>
                          ) : item.Nav_Status === 2 ? (
                            <><FaTimesCircle className="me-1" />Inactive</>
                          ) : (
                            <><FaTimesCircle className="me-1" />Disabled</>
                          )}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {item.Nav_Icons ? (
                          <i className={`bi bi-${item.Nav_Icons}`}></i>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Card.Footer className="bg-light">
              <Row className="align-items-center">
                <Col md={6}>
                  <p className="mb-0 text-muted">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} entries
                  </p>
                </Col>
                <Col md={6}>
                  <Pagination className="mb-0 justify-content-end">
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                    />
                    
                    {/* Page numbers */}
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <Pagination.Item
                            key={pageNumber}
                            active={pageNumber === currentPage}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Pagination.Item>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <Pagination.Ellipsis key={pageNumber} disabled />;
                      }
                      return null;
                    })}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(totalPages)} 
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </Col>
              </Row>
            </Card.Footer>
          )}
        </Card>
      ) : searchTerm ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-search" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
            <h5 className="mt-3 text-muted">No Results Found</h5>
            <p className="text-muted">No navbar items match your search "{searchTerm}"</p>
            <Button variant="outline-primary" onClick={() => setSearchTerm('')} className="mt-2">
              <FaTimes className="me-2" />
              Clear Search
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
            <h5 className="mt-3 text-muted">No Navbar Items Found</h5>
            <p className="text-muted">Click "Add New Navbar Item" to create your first navigation item.</p>
            <Button variant="primary" onClick={() => handleOpenModal('add')} className="mt-2">
              <FaPlus className="me-2" />
              Add New Item
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {modalMode === 'add' ? <><FaPlus className="me-2" />Add New Navbar Item</> : <><FaEdit className="me-2" />Edit Navbar Item</>}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Navigation Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="Nav_Main_Header_Name"
                    value={currentItem.Nav_Main_Header_Name}
                    onChange={handleInputChange}
                    placeholder="Enter navigation name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Route Path</Form.Label>
                  <Form.Control
                    type="text"
                    name="route_path"
                    value={currentItem.route_path}
                    onChange={handleInputChange}
                    placeholder="/path/to/route"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="Nav_Main_Header_Name_Description"
                    value={currentItem.Nav_Main_Header_Name_Description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Level 1</Form.Label>
                  <Form.Control
                    type="number"
                    name="Nav_Header_1"
                    value={currentItem.Nav_Header_1}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Level 2</Form.Label>
                  <Form.Control
                    type="number"
                    name="Nav_Header_2"
                    value={currentItem.Nav_Header_2}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Level 3</Form.Label>
                  <Form.Control
                    type="number"
                    name="Nav_Header_3"
                    value={currentItem.Nav_Header_3}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Level 4</Form.Label>
                  <Form.Control
                    type="number"
                    name="Nav_Header_4"
                    value={currentItem.Nav_Header_4}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>User Type</Form.Label>
                  <Form.Select
                    name="user_Type"
                    value={currentItem.user_Type}
                    onChange={handleInputChange}
                  >
                    <option value={0}>Type 0 (Default)</option>
                    <option value={1}>Type 1</option>
                    <option value={2}>Type 2</option>
                    <option value={3}>Type 3</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>User Role</Form.Label>
                  <Form.Control
                    type="text"
                    name="user_Role"
                    value={currentItem.user_Role}
                    onChange={handleInputChange}
                    placeholder="0,1,2"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Icon</Form.Label>
                  <Form.Control
                    type="text"
                    name="Nav_Icons"
                    value={currentItem.Nav_Icons}
                    onChange={handleInputChange}
                    placeholder="icon-name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="Nav_Status"
                    value={currentItem.Nav_Status}
                    onChange={handleInputChange}
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Inactive</option>
                    <option value={0}>Disabled</option>
                  </Form.Select>
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

export default Navbaradd;