import React, { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Spinner, Form, Row, Col, Modal } from 'react-bootstrap'
import DataTable from 'react-data-table-component/dist/index.es.js'
import { useGetExaminerPasswordDetailsQuery,useSendExaminerPasswordMutation } from '../../redux-slice/examinerApiSlice'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import navbar from '../../hooks/navbar/navbar.json'
import { BASE_URL } from '../../constraint/constraint'
const { VITE_Institution_Name, VITE_Institution_No } = import.meta.env;


const UserPassword = () => {
  const [sendingEmail, setSendingEmail] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const institutionData = navbar.find(item => item._id === parseInt(VITE_Institution_No))
  const institutionDisplayName = institutionData ? institutionData.InstitutionName : VITE_Institution_Name

  const [emailFormData, setEmailFormData] = useState({
    mailSubject: 'APRIL 2025 Terminal Examinations - Phase 2 - Digital Valuation - Appointment Order - Reg.',
    letterDate: new Date().toISOString().split('T')[0],
    referenceNo: `No. COE / Phase 2 / Digital Valuation`,
    InstitutionName: institutionDisplayName
  })

  // Debounce search: wait 400 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(filterText);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filterText]);

  const { data: apiData, isLoading, isFetching, refetch } = useGetExaminerPasswordDetailsQuery({
    InstitutionStatus: VITE_Institution_No,
    PasswordStatus: '1',
    page: currentPage,
    limit: perPage,
    search: searchQuery,
  });
  const [sendExaminerPassword] = useSendExaminerPasswordMutation()
  const [institutionStatus, setInstitutionStatus] = useState(VITE_Institution_No)
  const userInfo = useSelector((state) => state.auth.userInfo);

  const tableData = apiData?.data || [];
  const totalRows = apiData?.total || 0;

  const fetchUsers = () => refetch();

  const handleSendAllEmails = () => {
    // If institutionStatus is not 1, show modal first for email details
    if (institutionStatus !== '1') {
      setShowEmailModal(true)
      return
    }
    
    // Send directly
    processSendRequest()
  }

  const handleMailSubjectChange = (value) => {
    setEmailFormData(prev => ({
      ...prev,
      mailSubject: value
    }))
  }

  const handleLetterDateChange = (value) => {
    setEmailFormData(prev => ({
      ...prev,
      letterDate: value
    }))
  }

  const handleReferenceNoChange = (value) => {
    setEmailFormData(prev => ({
      ...prev,
      referenceNo: value
    }))
  }

  const handleEmailModalSubmit = () => {
    // Validate mail subject and date
    if (!emailFormData.mailSubject.trim()) {
      toast.error('Please enter the mail subject')
      return
    }
    if (!emailFormData.letterDate) {
      toast.error('Please select the letter date')
      return
    }
    if (!emailFormData.referenceNo.trim()) {
      toast.error('Please enter the reference number')
      return
    }
    
    setShowEmailModal(false)
    processSendRequest(emailFormData.mailSubject, emailFormData.letterDate, emailFormData.referenceNo, emailFormData.InstitutionName)
  }

  const processSendRequest = (mailSubject = null, letterDate = null, referenceNo = null, InstitutionName = null) => {
    setSendingEmail(true)
    sendExaminerPassword(
      {
         Dep_Name: userInfo?.selected_course|| '',
         Eva_Mon_Year: userInfo?.eva_month_year || '',
         InstitutionStatus : institutionStatus,
         mailSubject: mailSubject, // Pass mail subject for email
         letterDate: letterDate, // Pass letter date for email
         referenceNo: referenceNo, // Pass reference number for email
         InstitutionName: InstitutionName || institutionDisplayName // Pass institution name for email
      }
    )
      .unwrap()
      .then((response) => {
        toast.success('Emails sent to all users successfully!')
        refetch() // Refresh data after sending
        // Reset form
        setEmailFormData({ 
          mailSubject: 'APRIL 2025 Terminal Examinations - Phase 2 - Digital Valuation - Appointment Order - Reg.',
          letterDate: new Date().toISOString().split('T')[0],
          referenceNo: 'No. COE / APRIL 2025 / Phase 2 / Digital Valuation',
          InstitutionName: institutionDisplayName
        })
      })
      .catch((error) => {
        console.error('Error sending:', error)
        toast.error('Failed to send emails to all users.')
      })
      .finally(() => {
        setSendingEmail(false)
      })
  }

  const handleExportToExcel = async () => {
    // Get current date and time
    const now = new Date()
    const dateTime = now.toLocaleString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
    
    // Fetch all matching records for export (no pagination limit)
    let allData = tableData;
    try {
      const qs = new URLSearchParams({ page: 1, limit: 10000, search: searchQuery, InstitutionStatus: VITE_Institution_No, PasswordStatus: '1' }).toString();
      const res = await fetch(`${BASE_URL}/api/admin/all_user_data?${qs}`, { credentials: 'include' });
      const result = await res.json();
      allData = result.data || tableData;
    } catch (e) {
      allData = tableData;
    }

    // Prepare data for export
    const exportData = allData.map((row, index) => ({
      'S.No': index + 1,
      'Candidate Name': row.User_Name,
      'Email ID': row.Email_Id,
      'Password': row.Temp_Password
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Add combined header with title and date/time in single column
    const headerText = `Password Details\n${dateTime}`
    XLSX.utils.sheet_add_aoa(ws, [[headerText]], { origin: 'A1' })
    
    // Merge cells for header across all columns
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Merge A1 to D1
    ]
    
    // Style the header with text wrapping to show on multiple lines
    if (!ws['A1'].s) ws['A1'].s = {}
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { fgColor: { rgb: '4472C4' } }
    }

    // Set row height for header to accommodate two lines
    ws['!rows'] = [{ hpt: 35 }]

    // Add data starting from row 3
    const dataWithHeader = allData.map((row, index) => ({
      'S.No': index + 1,
      'Candidate Name': row.User_Name,
      'Email ID': row.Email_Id,
      'Password': row.Temp_Password
    }))
    
    XLSX.utils.sheet_add_json(ws, dataWithHeader, { origin: 'A2' })

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 25 }, // Candidate Name
      { wch: 35 }, // Email ID
      { wch: 15 }  // Password
    ]

    // Add page setup with header and footer
    ws['!pageSetup'] = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
    
    // Add print settings with header and footer
    ws['!margins'] = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    }

    // Note: XLSX library has limited support for headers/footers
    // For full print headers with page numbers, you may need to use a library like exceljs
    // Adding custom properties for header/footer
    if (!ws['!header']) ws['!header'] = {}
    ws['!header'] = '&C&"Arial,Bold"&16Password Details'
    
    if (!ws['!footer']) ws['!footer'] = {}
    ws['!footer'] = `&LPrinted: ${dateTime}&CPage &P of &N&R${dateTime}`

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Password Details')

    // Generate filename with current date
    const date = now.toISOString().split('T')[0]
    const filename = `Password_Details_${date}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)
  }

  const getEmailStatusBadge = (status) => {
    const statusColors = {
      'Sent': { bg: 'success', text: 'white' },
      'Pending': { bg: 'warning', text: 'dark' },
      'Failed': { bg: 'danger', text: 'white' },
      'Not sent': { bg: 'secondary', text: 'white' }
    }
    return statusColors[status] || { bg: 'secondary', text: 'white' }
  }

  // Filter data based on search - now handled server-side

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
      name: 'Candidate Name',
      selector: row => row.User_Name,
      sortable: true,
      width: '250px',
      wrap: true
    },
    {
      name: 'Email ID',
      selector: row => row.Email_Id,
      sortable: true,
      width: '280px',
      wrap: true
    },
    {
      name: 'Password',
      selector: row => row.Temp_Password,
      sortable: true,
      width: '150px',
      style: {
        justifyContent: 'center',
      },
      cell: row => (
        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
          {row.Temp_Password}
        </span>
      )
    },
    {
      name: 'Email Status',
      selector: row => {
        // Map Mailer field to email status
        if (row.Mailer === 'Y' || row.Mailer === 'y') return 'Sent';
        if (row.Mailer === 'N' || row.Mailer === 'n') return 'Not sent';
        // Fallback for legacy data
        return row.email_status || row.sms_status || 'Not sent';
      },
      sortable: true,
      width: '140px',
      style: {
        justifyContent: 'center',
      },
      cell: row => {
        // Determine status from Mailer field
        let status;
        if (row.Mailer === 'Y' || row.Mailer === 'y') {
          status = 'Sent';
        } else if (row.Mailer === 'N' || row.Mailer === 'n') {
          status = 'Not sent';
        } else {
          // Fallback for legacy data
          status = row.email_status || row.sms_status || 'Not sent';
        }
        
        const colors = getEmailStatusBadge(status)
        return (
          <Badge 
            bg={colors.bg} 
            text={colors.text}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            {status}
          </Badge>
        )
      }
    }
  ]

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2c5282',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        borderBottom: '2px solid #1a365d'
      }
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #cbd5e0',
        '&:last-child': {
          borderRight: 'none'
        }
      }
    },
    rows: {
      style: {
        minHeight: '60px',
        borderBottom: '1px solid #e2e8f0',
        '&:hover': {
          backgroundColor: '#f7fafc',
          cursor: 'pointer'
        }
      }
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #e2e8f0',
        '&:last-child': {
          borderRight: 'none'
        }
      }
    }
  }

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 style={{ color: '#2c5282', fontWeight: '600', margin: 0 }}>
          Password Details
        </h3>
        <Button
          variant="success"
          size="lg"
          onClick={handleSendAllEmails}
          disabled={sendingEmail || isFetching}
        >
          {sendingEmail ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Sending Emails...
            </>
          ) : (
            <>
              <i className="bi bi-send-fill me-2"></i>
              Send Emails
            </>
          )}
        </Button>
      </div>
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search by Name or Email..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="text-end">
              <div className="d-flex gap-2 justify-content-end">
                <Button
                  variant="info"
                  onClick={handleExportToExcel}
                  disabled={isLoading || totalRows === 0}
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>
                  Export Excel
                </Button>
                <Button
                  variant="primary"
                  onClick={fetchUsers}
                  disabled={isLoading}
                >
                  {isFetching ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                </Button>
              </div>
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
              onChangeRowsPerPage={(newPerPage, page) => { setPerPage(newPerPage); setCurrentPage(page); }}
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

      {/* Email Subject Modal */}
      <Modal 
        show={showEmailModal} 
        onHide={() => setShowEmailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Enter Mail Subject for Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Please enter or modify the email details that will be sent to all examiners.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Reference Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter reference number"
              value={emailFormData.referenceNo}
              onChange={(e) => handleReferenceNoChange(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mail Subject</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter mail subject"
              value={emailFormData.mailSubject}
              onChange={(e) => handleMailSubjectChange(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Letter Date</Form.Label>
            <Form.Control
              type="date"
              value={emailFormData.letterDate}
              onChange={(e) => handleLetterDateChange(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleEmailModalSubmit}>
            <i className="bi bi-send-fill me-2"></i>
            Send Emails
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default UserPassword