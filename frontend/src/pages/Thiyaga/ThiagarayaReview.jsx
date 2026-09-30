import React, { useMemo, useState } from 'react'
import { Badge, Button, Card, Form, InputGroup } from 'react-bootstrap'
import { FiSearch } from 'react-icons/fi'
import DataTableBase from 'react-data-table-component'
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetThiyagarayaReviewDataQuery } from '../../redux-slice/thiyagarayaReviewApiSlice'

const DataTable = DataTableBase.default || DataTableBase

const ThiagarayaReview = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const userInfo = useSelector((state) => state.auth?.userInfo)


  const Dep_Name = userInfo?.selected_course || ''
  const username = userInfo?.username || ''
  const { data, isLoading, isError } = useGetThiyagarayaReviewDataQuery(
    {
      username,
      ...(Dep_Name ? { Dep_Name } : {}),
    },
    { skip: !username && !Dep_Name }
  )

  const reviewData = useMemo(() => (Array.isArray(data?.reviewData) ? data.reviewData : []), [data])

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return reviewData

    const lower = searchText.toLowerCase().trim()
    return reviewData.filter((row) =>
      String(row.RegisterNo || '').toLowerCase().includes(lower) ||
      String(row.Dummy_NO || '').toLowerCase().includes(lower) ||
      String(row.SubjectCode || '').toLowerCase().includes(lower) ||
      String(row.Evaluator_Id || '').toLowerCase().includes(lower) ||
      String(row.studentname || '').toLowerCase().includes(lower)
    )
  }, [reviewData, searchText])

  const columns = useMemo(
    () => [
      {
        name: 'S.No',
        selector: (row, index) => index + 1,
        width: '70px',
      },
      {
        name: 'Register No',
        selector: (row) => row.RegisterNo || '-',
        sortable: true,
        minWidth: '140px',
      },
      {
        name: 'Course Code',
        selector: (row) => row.SubjectCode || '-',
        sortable: true,
        minWidth: '130px',
      },
  
      {
        name: 'Month / Year',
        selector: (row) => row.Eva_Mon_Year || '-',
        sortable: true,
        minWidth: '130px',
      },
      {
        name: 'Val Type',
        selector: (row) => row.Valuation_Type || '-',
        sortable: true,
        minWidth: '110px',
        cell: (row) => <Badge bg="primary">Val-{row.Valuation_Type || '-'}</Badge>,
      },
      {
        name: 'Review',
        minWidth: '140px',
        center: true,
        cell: (row) => {
          const status = Number(row.reviewStatus)

          if (status === 1) {
            return <Badge bg="success">Completed</Badge>
          }

          if (status === 2) {
            return <Badge bg="danger">Rejected</Badge>
          }

          return (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                sessionStorage.setItem('thiyagarayaReviewData', JSON.stringify(row))
                navigate('/thiyagaraya/valuation-review-main', { state: { reviewData: row } })
              }}
            >
              Review
            </Button>
          )
        },
      },
    ],
    [navigate, userInfo]
  )

  return (
    <UploadPageLayout
      mainTopic="THIAGARAJA STUDENT PAPER REVIEW"
    >
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="mb-0 fw-semibold text-dark">THIAGARAJA STUDENT REVIEW</h5>
              
            </div>

            <InputGroup style={{ width: '260px' }}>
              <InputGroup.Text className="bg-light border-end-0">
                <FiSearch size={16} color="#64748b" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search review data..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="border-start-0 bg-light"
                style={{ fontSize: '13px' }}
              />
            </InputGroup>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            progressPending={isLoading}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 50]}
            highlightOnHover
            striped
            responsive
            noDataComponent={<div className="py-5 text-center text-muted">{isError ? 'Failed to load review data' : 'No review data found'}</div>}
          />
          <div className="px-3 py-2 bg-light border-top">
            <small className="text-muted">Showing {filteredData.length} of {reviewData.length} records</small>
          </div>
        </Card.Body>
      </Card>
    </UploadPageLayout>
  )
}

export default ThiagarayaReview
