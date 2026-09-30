import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Modal, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { 
  useGetAllDistrictsQuery,
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  useDeleteDistrictMutation
} from '../../redux-slice/districtMasterApiSlice';

const DistrictMaster = () => {
  const { data: districtData, isLoading: isFetching, refetch } = useGetAllDistrictsQuery({});
  const [createDistrict, { isLoading: isCreating }] = useCreateDistrictMutation();
  const [updateDistrict, { isLoading: isUpdating }] = useUpdateDistrictMutation();
  const [deleteDistrict, { isLoading: isDeleting }] = useDeleteDistrictMutation();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState({
    id: null,
    DCODE: '',
    DNAME: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const districts = districtData?.data || [];
  const isLoading = isFetching || isCreating || isUpdating || isDeleting;

  // Filter districts based on search
  const filteredDistricts = districts.filter(item => 
    item.DCODE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.DNAME?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setCurrentItem(item);
    } else {
      setCurrentItem({
        id: null,
        DCODE: '',
        DNAME: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem({
      id: null,
      DCODE: '',
      DNAME: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentItem.DCODE || currentItem.DCODE.trim() === '') {
      toast.error('District code is required');
      return;
    }
    if (!currentItem.DNAME || currentItem.DNAME.trim() === '') {
      toast.error('District name is required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await createDistrict(currentItem).unwrap();
        toast.success('District created successfully');
      } else {
        await updateDistrict(currentItem).unwrap();
        toast.success('District updated successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error saving district:', error);
      toast.error(error?.data?.message || 'Failed to save district');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this district?')) {
      return;
    }

    try {
      await deleteDistrict(id).unwrap();
      toast.success('District deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting district:', error);
      toast.error(error?.data?.message || 'Failed to delete district');
    }
  };

  return (
    <Container fluid className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <h4 className="mb-0">
                <i className="bi bi-geo-alt me-2"></i>
                District Master Management
              </h4>
            </Col>
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Search by district code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="success" 
                onClick={() => handleOpenModal('add')}
                className="shadow-sm"
              >
                <FaPlus className="me-2" />
                Add New District
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Districts Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading districts...</p>
        </div>
      ) : filteredDistricts.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Districts List ({filteredDistricts.length})
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>S.No</th>
                    <th>District Code</th>
                    <th>District Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDistricts.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td><Badge bg="primary">{item.DCODE}</Badge></td>
                      <td><strong>{item.DNAME}</strong></td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleOpenModal('edit', item)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No districts found</p>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
          <Modal.Title>
            {modalMode === 'add' ? 'Add New District' : 'Edit District'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>District Code <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="DCODE"
                value={currentItem.DCODE}
                onChange={handleInputChange}
                placeholder="Enter district code (e.g., 01, 02)"
                maxLength={15}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>District Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="DNAME"
                value={currentItem.DNAME}
                onChange={handleInputChange}
                placeholder="Enter district name"
                maxLength={100}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              <FaTimes className="me-2" />
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              <FaSave className="me-2" />
              {modalMode === 'add' ? 'Create' : 'Update'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DistrictMaster;
