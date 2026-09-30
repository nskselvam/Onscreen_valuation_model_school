import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Spinner, Form, Row, Col } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import UserRoleModal from '../../../components/modals/UserRoleModal';
import DeleteUserModal from '../../../components/modals/DeleteUserModal';
import AssignExaminerModal from '../../../components/modals/AssignExaminerModal';
//import UserEditModal from '../../../components/modals/userEditModal';
import UserEditModalf from '../../../components/modals/UserEditModalf';
import { useGetAllUserDataQuery } from '../../../redux-slice/adminOperationApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

// Role Master data for mapping role IDs to names
const roleMaster = [
  { id: "0", name: "Admin" },
  { id: "1", name: "Chief Examiner" },
  { id: "2", name: "Examiner" },
  { id: "3", name: "Review" },
  { id: "4", name: "Camp Officer" },
  { id: "5", name: "Camp Officer Assistant" },
  { id: "6", name: "Section Staff" },
  { id: "7", name: "Chief Evaluation Examiner" },
];

// Helper function to convert role IDs to role names
const getRoleNames = (roleIds) => {
  if (!roleIds) return '-';
  const ids = roleIds.split(',').map(id => id.trim());
  const names = ids.map(id => {
    const role = roleMaster.find(r => r.id === id);
    return role ? role.name : id;
  });
  return names.join(', ');
};

const Userrolemaster = () => {

  const { data: userDataFromApi, error, isLoading, refetch } = useGetAllUserDataQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });



  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentRow, setCurrentRow] = useState({ id: '', Eva_Id: '', FACULTY_NAME: '', Email_Id: '', Mobile_Number: '', Role: '' });
  const [deleteRow, setDeleteRow] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Update data when API data is loaded
  useEffect(() => {
    if (userDataFromApi?.data) {
      setData(userDataFromApi.data);
    }
  }, [userDataFromApi]);

  // Filter data based on search
  const filteredData = data.filter(
    (item) =>
      (item.FACULTY_NAME?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.Eva_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.Email_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.Mobile_Number?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (getRoleNames(item.Role)?.toLowerCase() || '').includes(filterText.toLowerCase())
      
  );

  // Handle Add
  const handleAdd = () => {
    setModalMode('add');
    setCurrentRow({ id: '', Eva_Id: '', FACULTY_NAME: '', Email_Id: '', Mobile_Number: '', Role: '' });
    setShowModal(true);
  };

  // Handle Edit
  const handleEdit = (row) => {
    setModalMode('edit');
    setCurrentRow(row);
    setShowEditModal(true);
  };

  // Handle Delete
  const handleDelete = (row) => { 
    setDeleteRow(row);
    setShowDeleteModal(true);
  };

  // Handle Assign Examiner
  const handleAssignExaminer = (row) => {
    setSelectedUser(row);
    setShowAssignModal(true);
  };

  // Handle Assignment Save
  const handleAssignmentSave = (assignmentData) => {
    // Add your API call or data saving logic here
    setShowAssignModal(false);
  };

  // Confirm Delete
  const confirmDelete = (deleteData) => {
    // No manual state update needed - RTK Query will automatically refetch
    // after the mutation completes due to cache invalidation
    setShowDeleteModal(false);
    setDeleteRow(null);
  };

  // Handle Save (Add or Edit)
  const handleSave = () => {
    // No manual state update needed - RTK Query will automatically refetch
    // after the mutation completes due to cache invalidation
    // Modals handle their own closing via onHide()
  };

  // Table columns
  const columns = [
    {
      name: 'S.No',
      cell: (row, index) => (currentPage - 1) * perPage + index + 1,
      sortable: false,
      width: '70px',
      style: {
        justifyContent: 'center',
      },
    },
    {
      name: 'User ID',
      selector: (row) => row.Eva_Id,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Name',
      selector: (row) => row.FACULTY_NAME,
      sortable: true,
      width: '180px',
      wrap: true
    },
    {
      name: 'Email',
      selector: (row) => row.Email_Id,
      sortable: true,
      width: '200px',
      wrap: true
    },
    {
      name: 'Mobile',
      selector: (row) => row.Mobile_Number || '-',
      sortable: true,
      width: '130px',
      style: {
        justifyContent: 'center',
      },
    },
    {
      name: 'Roles',
      selector: (row) => getRoleNames(row.Role),
      sortable: true,
      width: '180px',
      wrap: true,
      cell: (row) => (
        <div style={{ whiteSpace: 'normal', padding: '8px 0' }}>
          {getRoleNames(row.Role)}
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.Active_Status,
      sortable: true,
      width: '80px',
      style: {
        justifyContent: 'center',
      },
      cell: (row) => (
        <Badge
          bg={row.Active_Status === 'Active' || row.Active_Status === null ? 'success' : 'danger'}
          style={{ fontSize: '12px', padding: '5px 10px' }}
        >
          {row.Active_Status || 'Active'}
        </Badge>
      ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            onClick={() => handleEdit(row)}
            variant="primary"
            size="sm"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(row)}
            variant="danger"
            size="sm"
          >
            Delete
          </Button>
          {/* <Button
            onClick={() => handleAssignExaminer(row)}
            variant="info"
            size="sm"
          >
            Assign
          </Button> */}
        </div>
      ),
      ignoreRowClick: true,
      width: '150px',
      style: {
        justifyContent: 'center',
      },
    },
  ];

  // Custom styles for the table
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2c5282',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        borderBottom: '2px solid #1a365d'
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #cbd5e0',
        '&:last-child': {
          borderRight: 'none'
        }
      },
    },
    rows: {
      style: {
        minHeight: '45px',
        borderBottom: '1px solid #e2e8f0',
        '&:hover': {
          backgroundColor: '#f7fafc',
          cursor: 'pointer'
        }
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #e2e8f0',
        '&:last-child': {
          borderRight: 'none'
        }
      },
    }
  };

  return (
    <Container fluid className="p-4">
      <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
        User Role Master
      </h3>
      
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search by Name, User ID, Email, Mobile, or Role..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="text-end">
              <Button
                variant="success"
                onClick={handleAdd}
                className="me-2"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add New Role
              </Button>
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading users...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 30, 50]}
              onChangePage={(page) => setCurrentPage(page)}
              onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
              highlightOnHover
              striped
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="text-center py-5">
                  <p>No users found</p>
                </div>
              }
            />
          )}
        </Card.Body>
      </Card>

      {/* User Role Add/Edit Modal */}
      <UserRoleModal
        show={showModal}
        onHide={() => setShowModal(false)}
        mode={modalMode}
        initialData={currentRow}
        onSave={handleSave}
      />

      {/* Delete User/Role Modal */}
      <DeleteUserModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteRow(null);
        }}
        userData={deleteRow}
        onConfirm={confirmDelete}
      />

      {/* Assign Examiner Modal */}
      <AssignExaminerModal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        userData={selectedUser}
        onAssign={handleAssignmentSave}
      />
      <UserEditModalf
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        mode={modalMode}
        currentRow={currentRow}
        onSave={handleSave}
      />
    </Container>
  );
};

export default Userrolemaster;
