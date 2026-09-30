import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { 
  useGetAllTypeExamsQuery,
  useGetNextSerialNumberQuery,
  useCreateTypeExamMutation,
  useUpdateTypeExamMutation,
  useDeleteTypeExamMutation
} from '../../redux-slice/typeExamApiSlice';

const TypeExamMaster = () => {
  const { data: typeExamData, isLoading: isFetching, refetch } = useGetAllTypeExamsQuery({});
  const { data: nextSerialData } = useGetNextSerialNumberQuery();
  const [createTypeExam, { isLoading: isCreating }] = useCreateTypeExamMutation();
  const [updateTypeExam, { isLoading: isUpdating }] = useUpdateTypeExamMutation();
  const [deleteTypeExam, { isLoading: isDeleting }] = useDeleteTypeExamMutation();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState({
    id: null,
    type_of_exam_code: '',
    type_of_exam_desc: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const typeExams = typeExamData?.data || [];
  const isLoading = isFetching || isCreating || isUpdating || isDeleting;

  // Filter type exams based on search
  const filteredTypeExams = typeExams.filter(item => 
    item.type_of_exam_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type_of_exam_desc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setCurrentItem(item);
    } else {
      setCurrentItem({
        id: null,
        type_of_exam_code: nextSerialData?.data?.nextSerial || '',
        type_of_exam_desc: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem({
      id: null,
      type_of_exam_code: '',
      type_of_exam_desc: ''
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
    if (!currentItem.type_of_exam_code) {
      toast.error('Type of exam code is required');
      return;
    }
    if (!currentItem.type_of_exam_desc) {
      toast.error('Type of exam description is required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await createTypeExam(currentItem).unwrap();
        toast.success('Type of exam created successfully');
      } else {
        await updateTypeExam(currentItem).unwrap();
        toast.success('Type of exam updated successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error saving type of exam:', error);
      toast.error(error?.data?.message || 'Failed to save type of exam');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this type of exam?')) {
      return;
    }

    try {
      await deleteTypeExam(id).unwrap();
      toast.success('Type of exam deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting type of exam:', error);
      toast.error(error?.data?.message || 'Failed to delete type of exam');
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
                <i className="bi bi-list-check me-2"></i>
                Type of Exam Master
              </h4>
            </Col>
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Search by code or description..."
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
                Add New Type
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Type Exams Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading type of exams...</p>
        </div>
      ) : filteredTypeExams.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Type of Exam List ({filteredTypeExams.length})
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>S.No</th>
                    <th style={{ width: '150px' }}>Code</th>
                    <th>Description</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypeExams.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td><Badge bg="primary">{item.type_of_exam_code}</Badge></td>
                      <td>{item.type_of_exam_desc}</td>
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
            <p className="mt-3 text-muted">No type of exams found</p>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
          <Modal.Title>
            {modalMode === 'add' ? 'Add New Type of Exam' : 'Edit Type of Exam'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Type of Exam Code <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="type_of_exam_code"
                value={currentItem.type_of_exam_code}
                onChange={handleInputChange}
                maxLength={15}
                required
                readOnly={modalMode === 'add'}
                style={modalMode === 'add' ? { backgroundColor: '#e9ecef' } : {}}
              />
              {modalMode === 'add' && (
                <Form.Text className="text-muted">
                  Auto-generated serial number
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="type_of_exam_desc"
                value={currentItem.type_of_exam_desc}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="Enter exam type description"
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

export default TypeExamMaster;
