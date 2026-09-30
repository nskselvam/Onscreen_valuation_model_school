import React, { useState, useEffect, useMemo } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner, Alert, ButtonGroup, InputGroup, Pagination } from 'react-bootstrap'
import { FaCalendarAlt, FaSearch, FaDownload, FaCheckCircle, FaTimesCircle, FaUser, FaClock, FaFilter } from 'react-icons/fa'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useGetUserAttendanceLogsQuery, useGetUserAttendanceSummaryQuery } from '../../../redux-slice/generalApiSlice'
import '../../../style/AttendanceSheet.css'

const AttendanceSheet = () => {
  // Date setup - Initialize with proper dates
  const [startDate, setStartDate] = useState(() => new Date())
  const [endDate, setEndDate] = useState(() => new Date())
  const [searchUser, setSearchUser] = useState('')
  const [viewMode, setViewMode] = useState('daily') // 'daily' or 'summary'
  const [selectedUser, setSelectedUser] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Memoize formatted dates to prevent unnecessary re-renders
  const formattedStartDate = useMemo(() => {
    if (!startDate) return ''
    const d = new Date(startDate)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [startDate])

  const formattedEndDate = useMemo(() => {
    if (!endDate) return ''
    const d = new Date(endDate)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [endDate])

  // Fetch data
  const { data: logsData, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useGetUserAttendanceLogsQuery(
    { startDate: formattedStartDate, endDate: formattedEndDate, userName: searchUser },
    { skip: viewMode !== 'daily' }
  )

  const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useGetUserAttendanceSummaryQuery(
    { startDate: formattedStartDate, endDate: formattedEndDate },
    { skip: viewMode !== 'summary' }
  )

  console.log('Attendance Logs Data:', logsData)
  console.log('Attendance Summary Data:', summaryData)

  // Debug logging
  useEffect(() => {
    if (logsData) {
      if (logsData.data && logsData.data.length > 0) {
      }
    }
  }, [logsData]);

  useEffect(() => {
    if (summaryData) {
      if (summaryData.data && summaryData.data.length > 0) {
      }
    }
  }, [summaryData]);

  // Handle search
  const handleSearch = () => {
    if (viewMode === 'daily') {
      refetchLogs()
    } else {
      refetchSummary()
    }
  }

  // Reset filters
  const handleReset = () => {
    const today = new Date()
    setStartDate(today)
    setEndDate(today)
    setSearchUser('')
    setSelectedUser('')
  }

  // Export to CSV
  const handleExport = () => {
    if (viewMode === 'daily' && logsData?.data) {
      const csv = convertToCSV(logsData.data)
      downloadCSV(csv, `attendance_${startDate}_${endDate}.csv`)
    } else if (viewMode === 'summary' && summaryData?.data) {
      const csv = convertSummaryToCSV(summaryData.data, summaryData.dateRange)
      downloadCSV(csv, `attendance_summary_${startDate}_${endDate}.csv`)
    }
  }

  // Format date as dd-mm-YYYY for CSV
  const formatDateForCSV = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const convertToCSV = (data) => {
    const headers = ['User Details (ID | Name | Mobile | Email)', 'Date', 'Status', 'Login Time', 'Last Activity', 'Total Activities']
    const rows = data.map(item => [
      `${item.userName} | ${item.name || 'N/A'} | ${item.mobile || 'N/A'} | ${item.email || 'N/A'}`,
      formatDateForCSV(item.date),
      item.status,
      new Date(item.loginTime).toLocaleString(),
      new Date(item.lastActivity).toLocaleString(),
      item.activities.length
    ])
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const convertSummaryToCSV = (data, dateRange) => {
    const formattedDateRange = dateRange.map(date => formatDateForCSV(date))
    const headers = ['User Details (ID | Name | Mobile | Email)', 'Total Present Days', ...formattedDateRange]
    const rows = data.map(user => {
      const row = [`${user.userName} | ${user.name || 'N/A'} | ${user.mobile || 'N/A'} | ${user.email || 'N/A'}`, user.totalDays]
      dateRange.forEach(date => {
        row.push(user.dates[date]?.status === 'Present' ? 'P' : 'A')
      })
      return row
    })
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    if (viewMode === 'daily' && logsData?.data) {
      return [...new Set(logsData.data.map(item => item.userName))].sort()
    } else if (viewMode === 'summary' && summaryData?.data) {
      return summaryData.data.map(user => user.userName).sort()
    }
    return []
  }, [logsData, summaryData, viewMode])

  // Filter data by selected user
  const filteredData = useMemo(() => {
    if (viewMode === 'daily' && logsData?.data) {
      return selectedUser 
        ? logsData.data.filter(item => item.userName === selectedUser)
        : logsData.data
    } else if (viewMode === 'summary' && summaryData?.data) {
      return selectedUser
        ? summaryData.data.filter(user => user.userName === selectedUser)
        : summaryData.data
    }
    return []
  }, [logsData, summaryData, selectedUser, viewMode])

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, searchUser, selectedUser, viewMode])

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(i)
    }
    return items
  }

  return (
    <Container fluid className="attendance-sheet-container">
      {/* Filters Card */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaCalendarAlt className="me-1" /> Start Date
                </Form.Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => date && setStartDate(date)}
                  maxDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  wrapperClassName="date-picker-wrapper"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select start date"
                  autoComplete="off"
                  popperClassName="date-picker-popper"
                  popperPlacement="top-start"
                  withPortal={false}
                  popperModifiers={[
                    {
                      name: 'preventOverflow',
                      options: {
                        rootBoundary: 'viewport',
                        tether: false,
                        altAxis: true
                      }
                    }
                  ]}
                />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaCalendarAlt className="me-1" /> End Date
                </Form.Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => date && setEndDate(date)}
                  minDate={startDate}
                  maxDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  wrapperClassName="date-picker-wrapper"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select end date"
                  autoComplete="off"
                  popperClassName="date-picker-popper"
                  popperPlacement="top-start"
                  withPortal={false}
                  popperModifiers={[
                    {
                      name: 'preventOverflow',
                      options: {
                        rootBoundary: 'viewport',
                        tether: false,
                        altAxis: true
                      }
                    }
                  ]}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaUser className="me-1" /> Search User
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter username..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    disabled={viewMode === 'summary'}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={4}>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={handleSearch} className="flex-grow-1">
                  <FaSearch className="me-1" /> Search
                </Button>
                <Button variant="outline-secondary" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">View Mode</Form.Label>
                <ButtonGroup className="w-100">
                  <Button
                    variant={viewMode === 'daily' ? 'primary' : 'outline-primary'}
                    onClick={() => setViewMode('daily')}
                  >
                    Daily View
                  </Button>
                  <Button
                    variant={viewMode === 'summary' ? 'primary' : 'outline-primary'}
                    onClick={() => setViewMode('summary')}
                  >
                    Summary View
                  </Button>
                </ButtonGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaFilter className="me-1" /> Filter by User
                </Form.Label>
                <Form.Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Card */}
      <Card className="shadow-sm mt-5">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {viewMode === 'daily' ? 'Daily Attendance Records' : 'Attendance Summary'}
          </h5>
          <Button variant="success" size="sm" onClick={handleExport} disabled={!filteredData.length}>
            <FaDownload className="me-1" /> Export CSV
          </Button>
        </Card.Header>
        <Card.Body>
          {(logsLoading || summaryLoading) && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading attendance data...</p>
            </div>
          )}

          {(logsError || summaryError) && (
            <Alert variant="danger">
              <Alert.Heading>Error Loading Data</Alert.Heading>
              <p>{logsError?.data?.message || summaryError?.data?.message || 'Failed to load attendance data'}</p>
            </Alert>
          )}

          {!logsLoading && !summaryLoading && filteredData.length === 0 && (
            <Alert variant="info">
              <FaTimesCircle className="me-2" />
              No attendance records found for the selected criteria.
            </Alert>
          )}

          {/* Daily View Table */}
          {viewMode === 'daily' && filteredData.length > 0 && (
            <>
            <div className="table-responsive table-container daily-table-container">
              <Table striped bordered hover className="attendance-table">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th><FaUser className="me-1" /> User Details</th>
                    <th><FaCalendarAlt className="me-1" /> Date</th>
                    <th>Status</th>
                    <th><FaClock className="me-1" /> Login Time</th>
                    <th><FaClock className="me-1" /> Last Activity</th>
                    <th>Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={`${item.userName}_${item.date}`}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        <div className="user-details-cell">
                          <div className="fw-semibold text-primary">{item.userName}</div>
                          <div className="text-muted small">{item.name || 'N/A'}</div>
                          <div className="text-muted small">{item.mobile || 'N/A'}</div>
                          <div className="text-muted small">{item.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={item.status === 'Present' ? 'success' : 'danger'}>
                          {item.status === 'Present' ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                          {item.status}
                        </Badge>
                      </td>
                      <td>{new Date(item.loginTime).toLocaleTimeString()}</td>
                      <td>{new Date(item.lastActivity).toLocaleTimeString()}</td>
                      <td>
                        <Badge bg="info">{item.activities.length}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="pagination-container d-flex justify-content-between align-items-center mt-3">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="d-flex align-items-center gap-3">
                  <Form.Select 
                    size="sm" 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </Form.Select>
                  <Pagination className="mb-0">
                    <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                    {currentPage > 3 && <Pagination.Ellipsis disabled />}
                    {getPaginationItems().map(page => (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    {currentPage < totalPages - 2 && <Pagination.Ellipsis disabled />}
                    <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              </div>
            )}
            </>
          )}

          {/* Summary View Table */}
          {viewMode === 'summary' && summaryData?.data && filteredData.length > 0 && (
            <>
            <div className="table-responsive table-container summary-table-container">
              <Table striped bordered hover size="sm" className="attendance-summary-table">
                <thead className="table-primary">
                  <tr>
                    <th className="sticky-col-index">#</th>
                    <th className="sticky-col-user"><FaUser className="me-1" /> User Details</th>
                    <th className="sticky-col-total">Total Present</th>
                    {summaryData.dateRange.map(date => (
                      <th key={date} className="text-center date-column">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((user, index) => (
                    <tr key={user.userName}>
                      <td className="sticky-col-index">{startIndex + index + 1}</td>
                      <td className="sticky-col-user">
                        <div className="user-details-cell">
                          <div className="fw-semibold text-primary">{user.userName}</div>
                          <div className="text-muted small">{user.name || 'N/A'}</div>
                          <div className="text-muted small">{user.mobile || 'N/A'}</div>
                          <div className="text-muted small">{user.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="sticky-col-total">
                        <Badge bg="primary">{user.totalDays}</Badge>
                      </td>
                      {summaryData.dateRange.map(date => {
                        const dayData = user.dates[date]
                        return (
                          <td key={date} className="text-center">
                            {dayData?.status === 'Present' ? (
                              <FaCheckCircle className="text-success" title="Present" />
                            ) : (
                              <FaTimesCircle className="text-danger" title="Absent" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="pagination-container d-flex justify-content-between align-items-center mt-3">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="d-flex align-items-center gap-3">
                  <Form.Select 
                    size="sm" 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </Form.Select>
                  <Pagination className="mb-0">
                    <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                    {currentPage > 3 && <Pagination.Ellipsis disabled />}
                    {getPaginationItems().map(page => (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    {currentPage < totalPages - 2 && <Pagination.Ellipsis disabled />}
                    <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              </div>
            )}
            </>
          )}

          {/* Stats Footer */}
          {filteredData.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <Row>
                <Col md={4}>
                  <div className="stat-item">
                    <span className="stat-label">Total Records:</span>
                    <span className="stat-value">{filteredData.length}</span>
                  </div>
                </Col>
                {viewMode === 'daily' && (
                  <>
                    <Col md={4}>
                      <div className="stat-item">
                        <span className="stat-label">Present:</span>
                        <span className="stat-value text-success">
                          {filteredData.filter(item => item.status === 'Present').length}
                        </span>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="stat-item">
                        <span className="stat-label">Date Range:</span>
                        <span className="stat-value">
                          {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </Col>
                  </>
                )}
                {viewMode === 'summary' && (
                  <>
                    <Col md={4}>
                      <div className="stat-item">
                        <span className="stat-label">Total Days:</span>
                        <span className="stat-value">{summaryData?.dateRange?.length || 0}</span>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="stat-item">
                        <span className="stat-label">Users:</span>
                        <span className="stat-value">{uniqueUsers.length}</span>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

export default AttendanceSheet