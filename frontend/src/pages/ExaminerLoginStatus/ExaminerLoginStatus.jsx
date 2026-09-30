import React, { useState } from 'react'
import { useGetExaminerLoginStatusQuery, useResetAllLoginStatusMutation } from '../../redux-slice/examinerApiSlice'
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge, Button, Modal } from 'react-bootstrap'
import userDetails from '../Dashboard/Common/userDetails.json'
import * as XLSX from 'xlsx'
import { FaFileExcel, FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa'
import { toast } from 'react-toastify'

const ExaminerLoginStatus = () => {
  const { data, error, isLoading, refetch } = useGetExaminerLoginStatusQuery()
  const [resetAllLoginStatus, { isLoading: isResetting }] = useResetAllLoginStatusMutation()
  const [showResetModal, setShowResetModal] = useState(false)

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          Error loading login status: {error?.data?.message || error?.message || 'Unknown error'}
        </Alert>
      </Container>
    )
  }

  const loginStats = data?.data || {}
  const users = Array.isArray(loginStats) ? loginStats : (loginStats.users || [])
  const roleMasters = data?.roleMasters || []

  // Create role map from role masters
  const roleMap = {}
  roleMasters.forEach(role => {
    roleMap[String(role.user_role_code)] = role.user_role
  })

  // Calculate statistics from users data if not provided
  const calculateStats = () => {
    if (!Array.isArray(users) || users.length === 0) {
      return {
        totalLoggedIn: 0,
        byDegree: {},
        byRole: {},
        byDegreeAndRole: {}
      }
    }

    const stats = {
      totalLoggedIn: users.length,
      byDegree: {},
      byRole: {},
      byDegreeAndRole: {}
    }

    users.forEach(user => {
      // By Department (using D_Code)
      if (user.D_Code) {
        const department = user.D_Code
        stats.byDegree[department] = (stats.byDegree[department] || 0) + 1
      }

      // By Role
      if (user.Role) {
        const roles = user.Role.split(',');
        roles.forEach(role => {
          const trimmedRole = role.trim();
          if (trimmedRole) {
            stats.byRole[trimmedRole] = (stats.byRole[trimmedRole] || 0) + 1
          }
        });
      }

      // By Department and Role
      if (user.Role && user.D_Code) {
        const department = user.D_Code
        const roles = user.Role.split(',');
        roles.forEach(role => {
          const trimmedRole = role.trim();
          if (trimmedRole && department) {
            const key = `${department}_${trimmedRole}`
            stats.byDegreeAndRole[key] = (stats.byDegreeAndRole[key] || 0) + 1
          }
        });
      }
    })

    return stats
  }

  const loginUserStats = loginStats.loginUserStats || calculateStats()

  // Helper function to get degree name
  const getDegreeName = (depName) => {
    // Return department name or N/A
    return depName || 'N/A'
  }

  // Helper function to get role name
  const getRoleName = (roleId) => {
    return roleMap[String(roleId)] || `Unknown (${roleId})`
  }

  // Handle reset all login status
  const handleResetAllLoginStatus = async () => {
    try {
      const result = await resetAllLoginStatus().unwrap()
      toast.success(`✅ ${result.message} - Reset ${result.data.updatedCount} users`)
      setShowResetModal(false)
      refetch() // Refresh the data
    } catch (err) {
      toast.error(`❌ Failed to reset login status: ${err?.data?.message || err.message || 'Unknown error'}`)
    }
  }

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Prepare summary data
      const summaryData = [
        ['User Login Status Report'],
        ['Generated on:', new Date().toLocaleString()],
        [],
        ['Summary Statistics'],
        ['Total Logged In Users', loginUserStats?.totalLoggedIn || 0],
        [],
        ['By Department'],
        ['Department Name', 'Count'],
        ...Object.entries(loginUserStats?.byDegree || {}).map(([degree, count]) => [
          getDegreeName(degree),
          count
        ]),
        [],
        ['By Role'],
        ['Role Name', 'Count'],
        ...Object.entries(loginUserStats?.byRole || {}).map(([role, count]) => [
          getRoleName(role),
          count
        ]),
        [],
        ['By Department + Role'],
        ['Department', 'Role', 'Count'],
        ...Object.entries(loginUserStats?.byDegreeAndRole || {}).map(([key, count]) => {
          const [degree, role] = key.split('_');
          return [getDegreeName(degree), getRoleName(role), count];
        }),
      ];

      // Prepare detailed user data
      const userDetailsData = [
        [],
        ['Logged In Users Details'],
        ['#', 'Roll Number', 'Name', 'Email', 'District', 'Roles'],
        ...users.map((user, index) => [
          index + 1,
          user.User_Id || user.id || 'N/A',
          user.User_Name || 'N/A',
          user.Email_Id || 'N/A',
          user.D_Code || 'N/A',
          user.Role ? user.Role.split(',').map(r => getRoleName(r.trim())).join(', ') : 'N/A'
        ])
      ];

      // Combine all data
      const worksheetData = [...summaryData, ...userDetailsData];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      ws['!cols'] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 30 },
        { wch: 30 },
        { wch: 15 },
        { wch: 30 },
        { wch: 20 }
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Login Status');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `User_Login_Status_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  }

  return (
    <Container fluid className="px-4 py-3">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-1">User Login Status</h2>
          <p className="text-muted small mb-0">Real-time monitoring of currently logged-in users</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button 
            variant="warning" 
            onClick={() => setShowResetModal(true)}
            className="d-flex align-items-center gap-2"
            disabled={isResetting}
          >
            <FaSignOutAlt /> Reset All Login Status
          </Button>
          <Button 
            variant="success" 
            onClick={exportToExcel}
            className="d-flex align-items-center gap-2"
          >
            <FaFileExcel /> Export to Excel
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4 g-3">
        <Col md={2}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-center mb-3">Total Logged In</h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span>Active Users</span>
                  <Badge bg="primary" className="px-3">{loginUserStats?.totalLoggedIn || 0}</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-center mb-3">By Department</h6>
              <div className="d-flex flex-column gap-2">
                {Object.entries(loginUserStats?.byDegree || {}).length > 0 ? (
                  Object.entries(loginUserStats?.byDegree || {}).map(([degree, count]) => (
                    <div key={degree} className="d-flex justify-content-between align-items-center">
                      <span className="text-truncate" style={{maxWidth: '150px'}} title={getDegreeName(degree)}>{getDegreeName(degree)}</span>
                      <Badge bg="info" className="px-3">{count}</Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-muted text-center">No data</span>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-center mb-3">By Role</h6>
              <div className="d-flex flex-column gap-2">
                {Object.entries(loginUserStats?.byRole || {}).length > 0 ? (
                  Object.entries(loginUserStats?.byRole || {}).map(([role, count]) => (
                    <div key={role} className="d-flex justify-content-between align-items-center">
                      <span className="text-truncate" style={{maxWidth: '150px'}} title={getRoleName(role)}>{getRoleName(role)}</span>
                      <Badge bg="success" className="px-3">{count}</Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-muted text-center">No data</span>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-center mb-3">Department & Role</h6>
              <div className="d-flex flex-column gap-2">
                {Object.entries(loginUserStats?.byDegreeAndRole || {}).length > 0 ? (
                  Object.entries(loginUserStats?.byDegreeAndRole || {}).map(([key, count]) => {
                    const [degree, role] = key.split('_');
                    const degreeName = getDegreeName(degree);
                    const roleName = getRoleName(role);
                    return (
                      <div key={key} className="d-flex justify-content-between align-items-center">
                        <span className="small" style={{maxWidth: '350px'}}>
                          {degreeName} - {roleName}
                        </span>
                        <Badge bg="warning" text="dark" className="px-3">{count}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-muted text-center">No data</span>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Details Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Currently Logged In Users ({users.length})</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {users.length > 0 ? (
            <Table striped hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>District</th>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                    let districtName = user.D_Code || 'N/A';
                    let userRoles = user.Role ? user.Role.split(',').map(r => getRoleName(r.trim())) : ['N/A'];
                    return (
                      <tr key={user.User_Id || user.id || index}>
                        <td>{index + 1}</td>
                        <td><strong>{user.User_Id || user.id || 'N/A'}</strong></td>
                        <td>{user.User_Name || 'N/A'}</td>
                        <td>{user.Email_Id || 'N/A'}</td>
                        <td>
                          <Badge bg="info">{districtName}</Badge>
                        </td>
                        <td>
                          {userRoles.map((role, idx) => (
                            <Badge key={idx} bg="success" className="me-1">{role}</Badge>
                          ))}
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </Table>
          ) : (
            <div className="text-center p-4 text-muted">
              No users currently logged in
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#ff9800', color: 'white' }}>
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Confirm Reset All Login Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning">
            <strong>⚠️ Warning:</strong> This will set Login_Status='N' for <strong>all {loginUserStats?.totalLoggedIn || 0} currently logged-in users</strong>.
          </div>
          <p>This action will:</p>
          <ul>
            <li>Mark all users as logged out (Login_Status = 'N')</li>
            <li>Clean up stuck login statuses from failed logout attempts</li>
            <li>Not affect active user sessions (they can continue working)</li>
            <li>Update the database immediately</li>
          </ul>
          <p className="mb-0"><strong>Are you sure you want to proceed?</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)} disabled={isResetting}>
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={handleResetAllLoginStatus}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Resetting...
              </>
            ) : (
              <>
                <FaSignOutAlt className="me-2" />
                Reset All
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ExaminerLoginStatus