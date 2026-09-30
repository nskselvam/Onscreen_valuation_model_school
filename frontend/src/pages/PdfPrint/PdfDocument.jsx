import React, { useState, useMemo } from 'react'
import DataTableBase from 'react-data-table-component'
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout'
import { Button, Form, InputGroup, Row, Col } from 'react-bootstrap'
import { data } from 'react-router-dom'
import ExaminerMarkModal from '../../components/modals/ExaminerMarkModal'
import * as XLSX from 'xlsx'

const DataTable = DataTableBase.default || DataTableBase

const PdfDocument = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')
    const [coloredLines, setColoredLines] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const allData = [
        { id: 1, fileName: 'document1.pdf', uploadDate: '2024-01-01', status: 'Processed' },
        { id: 2, fileName: 'document2.pdf', uploadDate: '2024-01-02', status: 'Pending'},
        { id: 3, fileName: 'report.xlsx', uploadDate: '2024-01-03', status: 'Processed'},
        { id: 4, fileName: 'data.txt', uploadDate: '2024-01-04', status: 'Pending'},
        { id: 5, fileName: 'presentation.pptx', uploadDate: '2024-01-05', status: 'Processed' },
        { id: 6, fileName: 'budget.xlsx', uploadDate: '2024-01-06', status: 'Pending'},
        { id: 7, fileName: 'invoice.pdf', uploadDate: '2024-01-07', status: 'Processed'},
        { id: 8, fileName: 'notes.txt', uploadDate: '2024-01-08', status: 'Pending'},
        { id: 9, fileName: 'contract.pdf', uploadDate: '2024-01-09', status: 'Processed' },
        { id: 10, fileName: 'analysis.xlsx', uploadDate: '2024-01-10', status: 'Pending'},
        { id: 11, fileName: 'summary.docx', uploadDate: '2024-01-11', status: 'Processed'},
        { id: 12, fileName: 'readme.txt', uploadDate: '2024-01-12', status: 'Pending'},
        { id: 13, fileName: 'proposal.pdf', uploadDate: '2024-01-13', status: 'Processed' },
        { id: 14, fileName: 'schedule.xlsx', uploadDate: '2024-01-14', status: 'Pending'},
        { id: 15, fileName: 'minutes.docx', uploadDate: '2024-01-15', status: 'Processed'},
        { id: 16, fileName: 'changelog.txt', uploadDate: '2024-01-16', status: 'Pending'},
    ]

    const displayReport = (dataid, event) => {
        event.stopPropagation(); // Prevent row click event
        
        // Add the row to colored lines
        setColoredLines(prev => {
            if (!prev.includes(dataid)) {
                return [...prev, dataid]
            }
            return prev
        })
        
        setSelectedId(dataid)
        setShowModal(true)
    }

    const handleRowClick = (row) => {
        // Toggle the row selection
        setColoredLines(prev => {
            if (prev.includes(row.id)) {
                // If already selected, remove it
                return prev.filter(id => id !== row.id)
            } else {
                // If not selected, add it
                return [...prev, row.id]
            }
        })
    }

    const conditionalRowStyles = [
        {
            when: row => coloredLines.includes(row.id),
            style: {
                backgroundColor: '#d4e6ff',
                borderLeft: '4px solid #667eea',
                '&:hover': {
                    backgroundColor: '#c2dbff',
                }
            }
        }
    ]

    const filteredData = useMemo(() => {
        return allData.filter(item => {
            const matchesSearch = 
                item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.uploadDate.includes(searchTerm) ||
                item.status.toLowerCase().includes(searchTerm.toLowerCase())
            
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus

            return matchesSearch && matchesStatus
        })
    }, [searchTerm, filterStatus])

    const exportToExcel = () => {
        // Prepare data for export with serial numbers
        const dataToExport = filteredData.map((item, index) => ({
            'Sl.No': index + 1,
            'Subject Code & Name': item.fileName,
            'Valuation Date': item.uploadDate,
            'Status': item.status
        }))

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        
        // Set column widths
        ws['!cols'] = [
            { wch: 8 },  // Sl.No
            { wch: 40 }, // Subject Code & Name
            { wch: 15 }, // Valuation Date
            { wch: 12 }  // Status
        ]

        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Files')

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0]
        const filename = `Files_Export_${date}.xlsx`

        // Save file
        XLSX.writeFile(wb, filename)
    }

    return (
        <>
            <UploadPageLayout
                mainTopic="Excel and Text Upload System"
                subTopic="Upload your Excel and Text files for processing"
                cardTitle="Excel and Text Upload"
            >
                <Row className="mb-3 g-3">
                    <Col md={8}>
                        <InputGroup>
                            <InputGroup.Text style={{ 
                                backgroundColor: '#667eea', 
                                color: 'white',
                                border: '1px solid #667eea'
                            }}>
                                🔍
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search by filename, date, or status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    borderColor: '#667eea',
                                    fontSize: '14px'
                                }}
                            />
                            {searchTerm && (
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => setSearchTerm('')}
                                    style={{ borderColor: '#667eea' }}
                                >
                                    Clear
                                </Button>
                            )}
                        </InputGroup>
                    </Col>
                    <Col md={4} className="d-flex gap-2">
                        <Button 
                            variant="success" 
                            onClick={exportToExcel}
                            className="w-100"
                            style={{ fontSize: '14px' }}
                        >
                            📥 Export to Excel
                        </Button>
                    </Col>
                    {/* <Col md={4}>
                        <Form.Select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                borderColor: '#667eea',
                                fontSize: '14px'
                            }}
                        >
                            <option value="All">All Status</option>
                            <option value="Processed">Processed</option>
                            <option value="Pending">Pending</option>
                        </Form.Select>
                    </Col> */}
                </Row>

                <div style={{
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                }}>
                    <DataTable

                        columns={[
                            { 
                                name: 'Sl.No', 
                                selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
                                sortable: false,
                                width: '80px',
                                center: true,
                                style: {
                                    borderRight: '1px solid #e0e0e0',
                                    fontWeight: 'bold'
                                }
                            },
                            { 
                                name: 'Subject Code & Name', 
                                selector: row => row.fileName, 
                                sortable: true,
                                grow: 2,
                                style: {
                                    borderRight: '1px solid #e0e0e0',
                                    fontWeight: '500'
                                }
                            },
                            { 
                                name: 'Valuation Date', 
                                selector: row => row.uploadDate, 
                                sortable: true,
                                style: {
                                    borderRight: '1px solid #e0e0e0'
                                }
                            },
                            // { 
                            //     name: 'Status', 
                            //     selector: row => row.status, 
                            //     sortable: true,
                            //     cell: row => (
                            //         <span className={`badge ${
                            //             row.status === 'Processed' ? 'bg-success' : 
                            //             row.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'
                            //         }`}>
                            //             {row.status}
                            //         </span>
                            //     ),
                            //     style: {
                            //         borderRight: '1px solid #e0e0e0'
                            //     }
                            // },
                            { 
                                name: 'View', 
                                cell: (row) => <Button onClick={(e) => displayReport(row.id, e)} variant="primary" size="sm">View</Button>,
                                center: true,
                                width: '120px'
                            },
                        ]}
                        data={filteredData}
                        onRowClicked={handleRowClick}
                        conditionalRowStyles={conditionalRowStyles}
                        pagination
                        paginationPerPage={rowsPerPage}
                        paginationRowsPerPageOptions={[10, 15, 20, 25]}
                        onChangePage={(page) => setCurrentPage(page)}
                        onChangeRowsPerPage={(newPerPage) => {
                            setRowsPerPage(newPerPage)
                            setCurrentPage(1)
                        }}
                        striped
                        highlightOnHover
                        pointerOnHover
                        responsive
                        dense
                        customStyles={{
                            table: {
                                style: {
                                    border: 'none'
                                }
                            },
                            headRow: {
                                style: {
                                    backgroundColor: '#667eea',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    borderBottom: '3px solid #5568d3',
                                    minHeight: '48px'
                                }
                            },
                            headCells: {
                                style: {
                                    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                                    paddingLeft: '16px',
                                    paddingRight: '16px',
                                    '&:last-child': {
                                        borderRight: 'none'
                                    }
                                }
                            },
                            cells: {
                                style: {
                                    borderRight: '1px solid #e0e0e0',
                                    paddingLeft: '16px',
                                    paddingRight: '16px',
                                    fontSize: '13px',
                                    '&:last-child': {
                                        borderRight: 'none'
                                    }
                                }
                            },
                            rows: {
                                style: {
                                    fontSize: '13px',
                                    minHeight: '52px',
                                    borderBottom: '1px solid #e8e8e8',
                                    '&:hover': {
                                        backgroundColor: '#f5f7ff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }
                                },
                                stripedStyle: {
                                    backgroundColor: '#fafbff'
                                }
                            },
                            pagination: {
                                style: {
                                    borderTop: '2px solid #667eea',
                                    fontSize: '13px',
                                    minHeight: '56px',
                                    backgroundColor: '#f8f9fa'
                                },
                                pageButtonsStyle: {
                                    borderRadius: '6px',
                                    height: '32px',
                                    padding: '4px 8px',
                                    margin: '2px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover:not(:disabled)': {
                                        backgroundColor: '#667eea',
                                        color: '#ffffff'
                                    }
                                }
                            }
                        }}
                    />
                </div>



            </UploadPageLayout>
            {showModal && <ExaminerMarkModal show={showModal} onHide={() => setShowModal(false)} selectedId={selectedId} />}
        </>
    )
}

export default PdfDocument
