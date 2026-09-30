import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Badge, Spinner, Form, Row, Col } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import UserRoleModal from '../../components/modals/UserRoleModal';
import DeleteUserModal from '../../components/modals/DeleteUserModal';
import AssignExaminerModal from '../../components/modals/AssignExaminerModal';
import UserEditModalf from '../../components/modals/UserEditModalf';
import { useGetAllUserDataQuery } from '../../redux-slice/adminOperationApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

const Userrolemaster = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(10);
  const [filterText, setFilterText]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');   // debounced value sent to API

  // Debounce search: wait 400 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(filterText);
      setCurrentPage(1); // reset to first page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [filterText]);

  const { data: userDataFromApi, error, isLoading, isFetching, refetch } = useGetAllUserDataQuery(
    { page: currentPage, limit: perPage, search: searchQuery },
    { refetchOnMountOrArgChange: true }
  );

  const roleMasters = userDataFromApi?.roleMasters || [];

  // Helper function to convert role IDs to role names
  const getRoleNames = (roleIds) => {
    if (!roleIds) return '-';
    const roleMap = {};
    roleMasters.forEach(role => {
      roleMap[String(role.user_role_code)] = role.user_role;
    });
    const ids = roleIds.split(',').map(id => id.trim());
    const names = ids.map(id => roleMap[id] || `Unknown (${id})`);
    return names.join(', ');
  };

  const tableData  = userDataFromApi?.data  || [];
  const totalRows  = userDataFromApi?.total || 0;

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentRow, setCurrentRow] = useState({ id: '', User_Id: '', D_Code: '', User_Name: '', Email_Id: '', Mobile_Number: '', Role: '' });
  const [deleteRow, setDeleteRow] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const handleAdd = () => {
    setModalMode('add');
    setCurrentRow({ id: '', User_Id: '', D_Code: '', User_Name: '', Email_Id: '', Mobile_Number: '', Role: '' });
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

  // Export to Excel
  const handleExportToExcel = () => {
    if (!tableData || tableData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Prepare data for Excel export
    const exportData = tableData.map((row, index) => ({
      'S.No': index + 1,
      'User ID': row.User_Id || '-',
      'Name': row.User_Name || '-',
      'District Code': row.D_Code || '-',
      'Email': row.Email_Id || '-',
      'Mobile Number': row.Mobile_Number || '-',
      'Roles': getRoleNames(row.Role),
      'Status': row.Active_Status || 'Active',
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Master');

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 25 }, // User ID
      { wch: 25 }, // Name
      { wch: 15 }, // District
      { wch: 30 }, // Email
      { wch: 15 }, // Mobile
      { wch: 30 }, // Roles
      { wch: 12 }, // Status
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `User_Master_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
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
      style: {
        justifyContent: 'center',
      },
    },
    {
      name: 'User ID',
      selector: (row) => row.User_Id,
      sortable: true,
      width: '180px',
      wrap: true
    },
    {
      name: 'Name',
      selector: (row) => row.User_Name,
      sortable: true,
      width: '220px',
      wrap: true
    },
    {
      name: 'District',
      selector: (row) => row.D_Code,
      sortable: true,
      width: '140px',
      wrap: true
    },
    {
      name: 'Email',
      selector: (row) => row.Email_Id,
      sortable: true,
      width: '220px',
      wrap: true
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
                  placeholder="Search by User ID, Name, Email, District, or Role..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="text-end">
              <Button
                variant="info"
                onClick={handleExportToExcel}
                className="me-2"
                disabled={!tableData || tableData.length === 0}
              >
                <FaFileExcel className="me-2" />
                Export to Excel
              </Button>
              <Button
                variant="success"
                onClick={handleAdd}
                className="me-2"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add New User
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
              data={tableData}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationRowsPerPageOptions={[10, 20, 30, 50]}
              onChangePage={(page) => setCurrentPage(page)}
              onChangeRowsPerPage={(newPerPage, page) => {
                setPerPage(newPerPage);
                setCurrentPage(page);
              }}
              progressPending={isFetching}
              progressComponent={<Spinner animation="border" variant="primary" className="my-3" />}
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
        roleMasters={roleMasters}
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
        roleMasters={roleMasters}
      />
    </Container>
  );
};

export default Userrolemaster;
