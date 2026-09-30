import React, { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap'
import { FiDownload, FiSearch } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import DataTableBase from 'react-data-table-component'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import { useGetThiyagarayaStudentRemarksQuery } from '../../../redux-slice/thiyagarayaReviewApiSlice'

const DataTable = DataTableBase.default || DataTableBase

const AuditingRemarksData = () => {
  const [searchParams] = useSearchParams()
  const userInfo = useSelector((state) => state.auth?.userInfo)
  const [searchText, setSearchText] = useState('')

  const requestPayload = useMemo(() => ({
    Dummy_NO: String(searchParams.get('Dummy_NO') || '').trim(),
    SubjectCode: String(searchParams.get('SubjectCode') || '').trim(),
    Dep_Name: String(searchParams.get('Dep_Name') || userInfo?.Dep_Name_8 || '').trim(),
    valuation_type: String(searchParams.get('valuation_type') || searchParams.get('Valuation_Type') || '01').trim(),
    Examiner_type: '9',
  }), [searchParams, userInfo?.Dep_Name_8])

  const { data, isLoading, isError, error } = useGetThiyagarayaStudentRemarksQuery(
    requestPayload,
    { skip: !requestPayload.Examiner_type || !requestPayload.valuation_type }
  )

  const remarksData = useMemo(() => {
    return Array.isArray(data?.remarks) ? data.remarks : []
  }, [data])

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return remarksData

    return remarksData.filter((row) => (
      String(row.reviewRemarks || '').toLowerCase().includes(query) ||
      String(row.barcode || '').toLowerCase().includes(query) ||
      String(row.subcode || '').toLowerCase().includes(query) ||
      String(row.subname || '').toLowerCase().includes(query) ||
      String(row.evaluatorId || '').toLowerCase().includes(query)
    ))
  }, [remarksData, searchText])

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) return

    const exportRows = filteredData.map((row, index) => ({
      'S.No': index + 1,
      'Evaluator Id': row.evaluatorId || '-',
      'Course Code': row.subcode || '-',
      'Course Name': row.subname || '-',
      'Remark Status': row.reviewRemarks_data || '-',
      Barcode: row.barcode || '-',
      Remarks: row.reviewRemarks || '-',
      Updated: row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditing Remarks')

    const fileName = `auditing_remarks_${requestPayload.Dummy_NO || 'all'}_${requestPayload.SubjectCode || 'all'}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const columns = useMemo(() => [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      width: '70px',
      center: true,
    },
    {
      name: 'Evaluator Id',
      selector: (row) => row.evaluatorId || '-',
      sortable: true,
      minWidth: '130px',
      center: true,
    },
    {
      name: 'Course Code',
      selector: (row) => row.subcode || '-',
      sortable: true,
      minWidth: '130px',
      center: true,
      cell: (row) => <Badge bg="primary">{row.subcode || '-'}</Badge>,
    },
    {
      name: 'Course Name',
      selector: (row) => row.subname || '-',
      sortable: true,
      minWidth: '220px',
      wrap: true,
    },
    {
      name: 'Barcode',
      selector: (row) => row.barcode || '-',
      sortable: true,
      minWidth: '130px',
      center: true,
    },
    {
      name: 'Remark Status',
      selector: (row) => row.reviewRemarks_data || '-',
      sortable: true,
      minWidth: '150px',
      center : true,
    },
    {
      name: 'Remarks',
      selector: (row) => row.reviewRemarks || '-',
      sortable: true,
      minWidth: '220px',
      wrap: true,
      cell: (row) => <span style={{ whiteSpace: 'pre-wrap' }}>{row.reviewRemarks || '-'}</span>,
    },
    {
      name: 'Updated',
      selector: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-',
      sortable: true,
      minWidth: '180px',
      center: true,
      wrap: true,
    },
  ], [])

  return (
    <UploadPageLayout mainTopic="AUDITING REMARKS">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="warning" text="dark" pill>Auditing Only</Badge>
            </div>

            <InputGroup style={{ width: '300px' }}>
              <InputGroup.Text className="bg-light border-end-0">
                <FiSearch size={16} color="#64748b" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by evaluator / barcode / course / remark"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="border-start-0 bg-light"
              />
            </InputGroup>

            <Button
              variant="success"
              onClick={handleDownloadExcel}
              disabled={filteredData.length === 0}
              className="d-flex align-items-center gap-2"
            >
              <FiDownload size={16} />
              Download Excel
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {isLoading && (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
              <div className="mt-2 text-muted">Loading remarks...</div>
            </div>
          )}

          {!isLoading && isError && (
            <Alert variant="danger" className="m-3 mb-0">
              {error?.data?.message || 'Failed to fetch auditing remarks'}
            </Alert>
          )}

          {!isLoading && !isError && (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50]}
              highlightOnHover
              striped
              responsive
              noDataComponent={<div className="py-4 text-center text-muted">No auditing remarks found</div>}
            />
          )}

          <div className="px-3 py-2 bg-light border-top">
            <small className="text-muted">Showing {filteredData.length} of {remarksData.length} auditing remarks</small>
          </div>
        </Card.Body>
      </Card>
    </UploadPageLayout>
  )
}

export default AuditingRemarksData
