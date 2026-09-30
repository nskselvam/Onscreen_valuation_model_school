import React, { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Spinner, Form, Row, Col } from 'react-bootstrap'
import DataTable from 'react-data-table-component/dist/index.es.js'
import KeyQbs_UploadModal from '../../../components/modals/KeyQbs_UploadModal'
//import { useGetSubjectDataQuery } from '../../../redux-slice/SubjectMasterApiSlice'
import { useGetCommonDataQuery } from '../../../redux-slice/getDataCommonRouterdata'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const Qp_and_answerKey = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [subjectMaster, setSubjectMaster] = useState([])
  const [modalConfig, setModalConfig] = useState({ type: '', row: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data: subjectData, isLoading: subjectLoading, error: subjectError, refetch } = useGetCommonDataQuery(
    { tableId: 'sub_master' }
  );

  // Sync API data with local state
  useEffect(() => {
    if (subjectData) {
      // Check if subjectData has a 'data' property (API response format)
      const subjects = Array.isArray(subjectData) ? subjectData : (subjectData?.data || [])
      setData(subjects)
    }
  }, [subjectData])

  const fetchUploadedFiles = async () => {
    setLoading(true)
    try {
      // Refetch the subject data from API
      const result = await refetch()
      if (result.error) {
        toast.error('Failed to fetch data. Please try again.')
        //console.error('Error fetching files:', result.error.status, result.error.data)
      }
    } catch (error) {
      toast.error('An error occurred while fetching data. Please try again.')
     // console.error('Error fetching files:', error?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (row) => {
    window.open(`/uploads/templates/${row.uploadType === 'question_paper' ? 'question_papers' : 'answer_keys'}/${row.filename}`, '_blank')
  }

  const handleQpStatusClick = (row) => {
    if (row.qb_flg === 'Y') {
      // View QP file in modal
      setModalConfig({
        type: 'question_paper',
        row: row,
        mode: 'view',
        pdfUrl: {
          subcode: row.Subcode,
          Dep_Name: row.Dep_Name,
          Eva_Mon_Year: row.Eva_Mon_Year
        }
      })
    } else {
      // Upload QP - Open modal in upload mode
      setModalConfig({
        type: 'question_paper',
        row: row,
        mode: 'upload',
        pdfUrl: ''
      })
    }
    setShowModal(true)
  }

  const handleKeyStatusClick = (row) => {
    if (row.ans_flg === 'Y') {
      // View Answer Key file in modal
      setModalConfig({
        type: 'answer_key',
        row: row,
        mode: 'view',
        pdfUrl: ''
      })
    } else {
      // Upload Answer Key - Open modal in upload mode
      setModalConfig({
        type: 'answer_key',
        row: row,
        mode: 'upload',
        pdfUrl: ''
      })
    }
    setShowModal(true)
  }

  const handleDelete = (row) => {
    if (window.confirm(`Are you sure you want to delete "${row.SUBNAME}"?`)) {
      setData(data.filter(item => item.id !== row.id))
    }
  }

  // Filter data based on search and type
  const filteredData = data?.filter(item => {
    const matchesSearch = item.Subcode?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.SUBNAME?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.qb_flg?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.ans_flg?.toLowerCase().includes(filterText.toLowerCase())

    // Filter based on selected type
    let matchesType = true
    if (filterType === 'question_paper') {
      matchesType = item.qb_flg === 'N'
    } else if (filterType === 'answer_key') {
      matchesType = item.ans_flg === 'N'
    }
    // If filterType is 'all', matchesType remains true (show all)

    // console.log('Filtering item:', item)
    // console.log('Matches Search:', matchesSearch)
    // console.log('Matches Type:', matchesType)

    return matchesSearch && matchesType
  })

  const columns = [
    {
      name: 'S.No',
      cell: (row, index) => (currentPage - 1) * perPage + index + 1,
      sortable: false,
      width: '70px',
      center: true,
      grow: 0
    },
    {
      name: 'File Name',
      selector: row => row.Subcode,
      sortable: true,
      wrap: true,
      width: '150px'
    },
    {
      name: 'Original Name',
      selector: row => row.SUBNAME,
      sortable: true,
      wrap: true,
      minWidth: '250px',
      style: {
        whiteSpace: 'normal',
        wordBreak: 'break-word'
      }
    },


    {
      name: 'QP Status',
      selector: row => row.uploadType,
      sortable: true,
      width: '150px',
      center: true,

      cell: row => (
        <Badge
          bg={row.qb_flg === 'Y' ? 'primary' : 'danger'}
          style={{ fontSize: '14px', cursor: 'pointer' }}
          onClick={() => handleQpStatusClick(row)}
        >
          {row.qb_flg === 'N' ? 'Upload' : 'View'}
        </Badge>
      )
    },

    {
      name: 'Key Status',
      selector: row => row.uploadType,
      sortable: true,
      width: '150px',
      cell: row => (
        <Badge
          bg={row.ans_flg === 'Y' ? 'primary' : 'danger'}
          style={{ fontSize: '14px', cursor: 'pointer' }}
          onClick={() => handleKeyStatusClick(row)}
        >
          {row.ans_flg === 'N' ? 'Upload' : 'View'}
        </Badge>
      )
    },

    // {
    //   name: 'Key Status',
    //   selector: row => row.uploadType,
    //   sortable: true,
    //   width: '150px',
    //   cell: row => (
    //     <Badge bg={row.uploadType === 'question_paper' ? 'primary' : 'success'}>
    //       {row.uploadType === 'question_paper' ? 'Question Paper' : 'Answer Key'}
    //     </Badge>
    //   )
    // },
    // {
    //   name: 'Key Status',
    //   selector: row => row.uploadType,
    //   sortable: true,
    //   width: '150px',
    //   cell: row => (
    //     <Badge bg={row.uploadType === 'question_paper' ? 'primary' : 'success'}>
    //       {row.uploadType === 'question_paper' ? 'Question Paper' : 'Answer Key'}
    //     </Badge>
    //   )
    // },


    // {
    //   name: 'Size',
    //   selector: row => row.size,
    //   sortable: true,
    //   width: '100px',
    //   center: true
    // },
    // {
    //   name: 'Uploaded By',
    //   selector: row => row.uploadedBy,
    //   sortable: true,
    //   width: '130px'
    // },
    // {
    //   name: 'Uploaded At',
    //   selector: row => row.uploadedAt,
    //   sortable: true,
    //   width: '180px',
    //   cell: row => new Date(row.uploadedAt).toLocaleString()
    // },
    // {
    //   name: 'Status',
    //   selector: row => row.status,
    //   sortable: true,
    //   width: '100px',
    //   center: true,
    //   cell: row => (
    //     <Badge bg={row.status === 'active' ? 'success' : 'secondary'}>
    //       {row.status}
    //     </Badge>
    //   )
    // },
    // {
    //   name: 'Actions',
    //   width: '200px',
    //   center: true,
    //   cell: row => (
    //     <div className="d-flex gap-2">
    //       <Button 
    //         variant="outline-primary" 
    //         size="sm"
    //         onClick={() => handleView(row)}
    //       >
    //         View
    //       </Button>
    //       <Button 
    //         variant="outline-danger" 
    //         size="sm"
    //         onClick={() => handleDelete(row)}
    //       >
    //         Delete
    //       </Button>
    //     </div>
    //   )
    // }
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
      <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
        Question Papers and Answer Keys
      </h3>
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search by filename, original name, or uploader..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="question_paper">Question Papers</option>
                <option value="answer_key">Answer Keys</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button
                variant="primary"
                onClick={fetchUploadedFiles}
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading data...</p>
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
                  <p>No files found</p>
                </div>
              }
            />
          )}
        </Card.Body>
      </Card>

      <KeyQbs_UploadModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        uploadType={modalConfig.type}
        selectedRow={modalConfig.row}
        onUploadSuccess={fetchUploadedFiles}
        mode={modalConfig.mode}
        pdfUrl={modalConfig.pdfUrl}
      />
    </Container>
  )
}

export default Qp_and_answerKey
