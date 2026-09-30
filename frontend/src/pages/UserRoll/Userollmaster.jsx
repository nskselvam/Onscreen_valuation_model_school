import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSave, FaUndo, FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa';
import { useGetNavbarDetailsQuery } from '../../redux-slice/adminOperationApiSlice';
import Select from 'react-select';
import './Userollmaster.css';

const Userollmaster = () => {
  const [navbarData, setNavbarData] = useState({ data_header: [], data_complete: [], UserDetails: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMainHeader, setSelectedMainHeader] = useState('');
  const [filteredSubHeaders, setFilteredSubHeaders] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [facultySearchTerm, setFacultySearchTerm] = useState('');
  const [showFacultySelector, setShowFacultySelector] = useState(false);
 
  // Fetch navbar data
  const { data: navbarDataResponse, isLoading: isNavbarLoading, error: navbarError } = useGetNavbarDetailsQuery();


  useEffect(() => {
    if (navbarDataResponse) {
      setNavbarData(navbarDataResponse);
      initializeUserRoles(navbarDataResponse.data_complete);
      
      // Format faculty data for react-select
      if (navbarDataResponse.UserDetails) {
        const options = navbarDataResponse.UserDetails.map(user => ({
          value: user.id,
          label: `${user.Email_Id} - ${user.User_Name}`,
          faculty: user
        }));
        setFacultyOptions(options);
      }
    }
  }, [navbarDataResponse]);

  const fetchNavbarData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/get_all_user_roll_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();
      if (result.success) {
        setNavbarData(result);
        initializeUserRoles(result.data_complete);
      }
    } catch (error) {
      console.error('Error fetching navbar data:', error);
      toast.error('Failed to load navbar data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user roles from existing data
  const initializeUserRoles = (data) => {
    const roles = {};
    data.forEach(item => {
      roles[item.id] = {
        user_Type: item.user_Type || '',
        user_Role: item.user_Role || '',
        Nav_Status: item.Nav_Status || 0
      };
    });
    setUserRoles(roles);
  };

  // Handle main header selection
  const handleMainHeaderChange = (e) => {
    const selectedId = e.target.value;
    setSelectedMainHeader(selectedId);

    if (selectedId) {
      // Filter sub-headers where Nav_Header_2 is not 0
      const subHeaders = navbarData.data_complete.filter(
        item => item.Nav_Header_1 === parseInt(navbarData.data_header.find(h => h.id === parseInt(selectedId))?.Nav_Header_1) &&
                item.Nav_Header_2 !== 0
      );
      setFilteredSubHeaders(subHeaders);
    } else {
      setFilteredSubHeaders([]);
    }
  };

  // Handle role changes
  const handleRoleChange = (id, field, value) => {
    setUserRoles(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const updates = Object.keys(userRoles).map(id => ({
        id: parseInt(id),
        ...userRoles[id]
      }));

      const response = await fetch('/api/admin/update_user_roll_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('User roles updated successfully');
        setHasChanges(false);
        fetchNavbarData();
      } else {
        toast.error('Failed to update user roles');
      }
    } catch (error) {
      console.error('Error saving user roles:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    initializeUserRoles(navbarData.data_complete);
    setHasChanges(false);
    toast.info('Changes reset');
  };
  // Faculty Selection handlers
  const handleToggleFacultySelector = () => {
    setShowFacultySelector(!showFacultySelector);
    if (!showFacultySelector) {
      setFacultySearchTerm('');
    }
  };

  const handleFacultyToggle = (faculty) => {
    const isSelected = selectedFaculties.some(f => f.value === faculty.value);
    if (isSelected) {
      setSelectedFaculties(selectedFaculties.filter(f => f.value !== faculty.value));
    } else {
      setSelectedFaculties([...selectedFaculties, faculty]);
    }
  };

  const handleSelectAll = () => {
    const filtered = getFilteredFaculties();
    const allSelected = filtered.every(f => selectedFaculties.some(sf => sf.value === f.value));
    if (allSelected) {
      // Deselect all filtered
      const filteredIds = filtered.map(f => f.value);
      setSelectedFaculties(selectedFaculties.filter(sf => !filteredIds.includes(sf.value)));
    } else {
      // Select all filtered
      const newSelections = filtered.filter(f => !selectedFaculties.some(sf => sf.value === f.value));
      setSelectedFaculties([...selectedFaculties, ...newSelections]);
    }
  };

  const getFilteredFaculties = () => {
    if (!facultySearchTerm) return facultyOptions;
    return facultyOptions.filter(faculty =>
      faculty.label.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
      faculty.faculty.Email_Id.toLowerCase().includes(facultySearchTerm.toLowerCase())
    );
  };

  const handleApplyFacultiesToAll = () => {
    if (selectedFaculties.length === 0) {
      toast.warning('Please select at least one faculty member');
      return;
    }
    const facultyIds = selectedFaculties.map(f => f.value).join(',');
    filteredSubHeaders.forEach(item => {
      handleRoleChange(item.id, 'user_Role', facultyIds);
    });
    toast.success(`Faculty allocation applied to ${filteredSubHeaders.length} navigation items`);
  };
  return (
    <Container fluid className="user-roll-master p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="page-header">
            <h2 className="page-title">
              <i className="bi bi-person-badge me-2"></i>
              User Roll Master
            </h2>
            <p className="page-subtitle">Manage user roles and permissions for navigation items</p>
          </div>
        </Col>
      </Row>

      {/* Main Header Filter */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <i className="bi bi-funnel me-2"></i>
                  Select Main Header
                </Form.Label>
                <Form.Select
                  value={selectedMainHeader}
                  onChange={handleMainHeaderChange}
                  className="form-select-lg"
                >
                  <option value="">-- Select Main Header --</option>
                  {navbarData.data_header.map(header => (
                    <option key={header.id} value={header.id}>
                      {header.Nav_Main_Header_Name} (Level {header.Nav_Header_1})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaUsers className="me-2" />
                  Faculty Multi-Select for Role Allocation
                </Form.Label>
                <div className="d-flex gap-2">
                  <Button
                    variant={showFacultySelector ? 'primary' : 'outline-primary'}
                    onClick={handleToggleFacultySelector}
                    className="flex-grow-1"
                  >
                    <FaUsers className="me-2" />
                    {showFacultySelector ? 'Hide' : 'Show'} Faculty Selector ({selectedFaculties.length} selected)
                  </Button>
                  {selectedFaculties.length > 0 && filteredSubHeaders.length > 0 && (
                    <Button
                      variant="success"
                      onClick={handleApplyFacultiesToAll}
                      title="Apply selected faculties to all visible navigation items"
                    >
                      <FaSave className="me-2" />
                      Apply to All
                    </Button>
                  )}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Faculty Selector Panel */}
          {showFacultySelector && (
            <Row className="mt-3">
              <Col>
                <Card className="faculty-selector-card">
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        <i className="bi bi-search me-2"></i>
                        Search Faculty
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search by Faculty ID or Name..."
                        value={facultySearchTerm}
                        onChange={(e) => setFacultySearchTerm(e.target.value)}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="fw-bold mb-0">
                        <i className="bi bi-people-fill me-2"></i>
                        Select Faculty Members ({selectedFaculties.length} selected)
                      </Form.Label>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {getFilteredFaculties().every(f => selectedFaculties.some(sf => sf.value === f.value))
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    </div>

                    <div className="faculty-checkbox-container">
                      {getFilteredFaculties().length > 0 ? (
                        getFilteredFaculties().map(faculty => (
                          <Form.Check
                            key={faculty.value}
                            type="checkbox"
                            id={`faculty-${faculty.value}`}
                            label={
                              <div className="faculty-checkbox-label">
                                <strong>{faculty.faculty.Email_Id}</strong> - {faculty.faculty.User_Name}
                                <div className="faculty-details">
                                  <small className="text-muted">
                                    {faculty.faculty.Email_Id && <span><i className="bi bi-envelope me-1"></i>{faculty.faculty.Email_Id}</span>}
                                    {faculty.faculty.Mobile_Number && <span className="ms-2"><i className="bi bi-phone me-1"></i>{faculty.faculty.Mobile_Number}</span>}
                                  </small>
                                </div>
                              </div>
                            }
                            checked={selectedFaculties.some(f => f.value === faculty.value)}
                            onChange={() => handleFacultyToggle(faculty)}
                            className="faculty-checkbox-item"
                          />
                        ))
                      ) : (
                        <Alert variant="info" className="text-center mb-0">
                          <i className="bi bi-search me-2"></i>
                          No faculty found matching your search.
                        </Alert>
                      )}
                    </div>

                    {selectedFaculties.length > 0 && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <h6 className="text-success mb-2">
                          <FaCheckCircle className="me-2" />
                          Selected Faculty ({selectedFaculties.length}):
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedFaculties.map(faculty => (
                            <Badge key={faculty.value} bg="primary" className="p-2">
                              {faculty.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Row className="mt-3">
            <Col className="text-end">
              {hasChanges && (
                <div className="action-buttons">
                  <Button
                    variant="outline-secondary"
                    onClick={handleReset}
                    className="me-2"
                    disabled={isLoading}
                  >
                    <FaUndo className="me-2" />
                    Reset
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    <FaSave className="me-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Sub Headers Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading data...</p>
        </div>
      ) : filteredSubHeaders.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              Sub-Headers Configuration
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 user-roll-table">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>S.No</th>
                    <th style={{ width: '250px' }}>Navigation Name</th>
                    <th style={{ width: '150px' }}>Hierarchy</th>
                    <th style={{ width: '150px' }}>Route Path</th>
                    <th style={{ width: '200px' }}>User Type</th>
                    <th style={{ width: '200px' }}>User Role</th>
                    <th style={{ width: '120px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubHeaders.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="nav-name">
                          <strong>{item.Nav_Main_Header_Name}</strong>
                          <small className="d-block text-muted">
                            {item.Nav_Main_Header_Name_Description}
                          </small>
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge bg="info" className="hierarchy-badge">
                          {item.Nav_Header_1}.{item.Nav_Header_2}.{item.Nav_Header_3}.{item.Nav_Header_4}
                        </Badge>
                      </td>
                      <td>
                        <code className="route-path">{item.route_path || 'N/A'}</code>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={userRoles[item.id]?.user_Type || ''}
                          onChange={(e) => handleRoleChange(item.id, 'user_Type', e.target.value)}
                          placeholder="e.g., 0,1,2,3"
                        />
                        <small className="text-muted">Comma-separated</small>
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary" className="p-2">
                          {item.id}
                        </Badge>
                        <input
                          type="hidden"
                          value={item.id}
                          onChange={(e) => handleRoleChange(item.id, 'user_Role', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="switch"
                          checked={userRoles[item.id]?.Nav_Status === 1}
                          onChange={(e) => handleRoleChange(item.id, 'Nav_Status', e.target.checked ? 1 : 0)}
                          label={
                            <Badge bg={userRoles[item.id]?.Nav_Status === 1 ? 'success' : 'secondary'}>
                              {userRoles[item.id]?.Nav_Status === 1 ? (
                                <><FaCheckCircle className="me-1" />Active</>
                              ) : (
                                <><FaTimesCircle className="me-1" />Inactive</>
                              )}
                            </Badge>
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ) : selectedMainHeader ? (
        <Alert variant="info" className="text-center">
          <i className="bi bi-info-circle me-2"></i>
          No sub-headers found for the selected main header.
        </Alert>
      ) : (
        <Alert variant="secondary" className="text-center">
          <i className="bi bi-arrow-up me-2"></i>
          Please select a main header to view and configure sub-headers.
        </Alert>
      )}

    </Container>
  );
};

export default Userollmaster;