import React, { useMemo, useState } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import { useSelector } from 'react-redux'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import {
  useThiyagarayaGetTableCountQuery,
  useThiyagarayaImageCheckMutation,
  useThiyagarayaImportUploadMutation,
} from '../../../redux-slice/thiyagarayaImportApiSlice'

const FILE_TYPE_OPTIONS = [
  { id: '0', name: 'Select File Type' },
  { id: '1', name: 'REVIEW' },
]

const Import_Main_T = () => {
  const monthyearInfo = useSelector((state) => state.auth.monthyearInfo)
  const degreeInfo = useSelector((state) => state.auth.degreeInfo)

  const [uploadFileType, setUploadFileType] = useState('0')
  const [degreeName, setDegreeName] = useState('0')
  const [semMonth, setSemMonth] = useState('0')
  const [semYear, setSemYear] = useState('0')

  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState(null)
  const [excelPreviewCount, setExcelPreviewCount] = useState(0)

  const [statusText, setStatusText] = useState('')
  const [statusVariant, setStatusVariant] = useState('info')
  const [notFoundRows, setNotFoundRows] = useState([])
  const [notFoundCount, setNotFoundCount] = useState(0)

  const [thiyagarayaImportUpload, { isLoading: isUploading }] = useThiyagarayaImportUploadMutation()
  const [thiyagarayaImageCheck, { isLoading: isImageChecking }] = useThiyagarayaImageCheckMutation()
  const { data: tableCountData, refetch: refetchTableCount } = useThiyagarayaGetTableCountQuery()

  const activeRecords = useMemo(
    () => (Array.isArray(monthyearInfo) ? monthyearInfo.filter((m) => m.Month_Year_Status === 'Y') : []),
    [monthyearInfo]
  )

  const degreeOptions = useMemo(
    () => (Array.isArray(degreeInfo) ? degreeInfo.filter((d) => d.Flg === 'Y') : []),
    [degreeInfo]
  )

  const examMonthOptions = useMemo(
    () => [...new Set(activeRecords.map((m) => m.Eva_Month))],
    [activeRecords]
  )

  const examYearOptions = useMemo(
    () => [...new Set(activeRecords.map((m) => m.Eva_Year))],
    [activeRecords]
  )

  const handleExcelChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFile(file)
    setStatusText('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        setExcelData(jsonData)
        setExcelPreviewCount(jsonData.length)
      } catch {
        setExcelData(null)
        setExcelPreviewCount(0)
        setStatusVariant('danger')
        setStatusText('Unable to parse Excel file. Please upload a valid .xlsx or .xls file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (uploadFileType === '0') {
      setStatusVariant('warning')
      setStatusText('Please select file type.')
      return
    }

    if (degreeName === '0') {
      setStatusVariant('warning')
      setStatusText('Please select degree.')
      return
    }

    if (semMonth === '0' || semYear === '0') {
      setStatusVariant('warning')
      setStatusText('Please select exam month and year.')
      return
    }

    if (!excelFile) {
      setStatusVariant('warning')
      setStatusText('Please choose an Excel file to continue.')
      return
    }

    const payload = {
      excelData,
      excelFileName: excelFile?.name,
      uploadFileType,
      degreeName,
      semMonth,
      semYear,
    }

    try {
      setNotFoundRows([])
      setNotFoundCount(0)
      const response = await thiyagarayaImportUpload(payload).unwrap()
      const total = response?.TotalRecordCnt || 0
      const processed = response?.RecrodCnt || 0
      const backendNotFoundRows = Array.isArray(response?.notFoundRows) ? response.notFoundRows : []
      const backendNotFoundCount = Number(response?.notFoundCount) || backendNotFoundRows.length

      setNotFoundRows(backendNotFoundRows)
      setNotFoundCount(backendNotFoundCount)

      if (response?.ErrorFlag) {
        setStatusVariant('warning')
        setStatusText(`Import completed with warnings. Processed ${processed} of ${total} records. Not found: ${backendNotFoundCount}.`)
      } else {
        setStatusVariant('success')
        setStatusText(`Import completed successfully. Processed ${processed} of ${total} records. Not found: ${backendNotFoundCount}.`)
      }

      await thiyagarayaImageCheck().unwrap()
      refetchTableCount()
    } catch (err) {
      setStatusVariant('danger')
      setStatusText(`Import failed: ${err?.data?.message || 'Unknown error'}`)
    }
  }

  const handleDownloadNotFoundRows = () => {
    if (!Array.isArray(notFoundRows) || notFoundRows.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(notFoundRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NotFoundRows')

    const safeMonth = semMonth === '0' ? 'month' : semMonth
    const safeYear = semYear === '0' ? 'year' : semYear
    const fileName = `thiyagaraya_not_found_rows_${safeMonth}_${safeYear}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <UploadPageLayout
      mainTopic="Thiagaraya Import"
      subTopic={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'rgb(13, 224, 9)', fontWeight: '600', gap: '35px' }}>
          <span>Import1 - {tableCountData?.import1 || 0}</span>
          <span>Faculty - {tableCountData?.faculties || 0}</span>
          <span>Sections - {tableCountData?.valid_sections || 0}</span>
          <span>Questions - {tableCountData?.valid_question || 0}</span>
          <span>Subject Master - {tableCountData?.sub_master || 0}</span>
        </div>
      }
      cardTitle="Excel Import"
    >
      <Card className="shadow-sm border-0">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-12 mb-3">
                <Form.Group controlId="uploadFileType">
                  <Form.Label>File Type</Form.Label>
                  <Form.Select value={uploadFileType} onChange={(e) => setUploadFileType(e.target.value)}>
                    {FILE_TYPE_OPTIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-4 mb-3">
                <Form.Group controlId="degreeName">
                  <Form.Label>Degree</Form.Label>
                  <Form.Select value={degreeName} onChange={(e) => setDegreeName(e.target.value)}>
                    <option value="0">Select Degree</option>
                    {degreeOptions.map((item) => (
                      <option key={item.id} value={item.D_Code}>
                        {item.Degree_Name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-4 mb-3">
                <Form.Group controlId="examMonth">
                  <Form.Label>Exam Month</Form.Label>
                  <Form.Select value={semMonth} onChange={(e) => setSemMonth(e.target.value)}>
                    <option value="0">Select Month</option>
                    {examMonthOptions.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-4 mb-3">
                <Form.Group controlId="examYear">
                  <Form.Label>Exam Year</Form.Label>
                  <Form.Select value={semYear} onChange={(e) => setSemYear(e.target.value)}>
                    <option value="0">Select Year</option>
                    {examYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-12 mb-3">
                <Form.Group controlId="excelInput">
                  <Form.Label>Excel File (.xlsx, .xls)</Form.Label>
                  <Form.Control type="file" accept=".xlsx,.xls" onChange={handleExcelChange} />
                  {excelFile && (
                    <Form.Text className="text-muted">
                      Selected: {excelFile.name} | Parsed rows: {excelPreviewCount}
                    </Form.Text>
                  )}
                </Form.Group>
              </div>

            </div>

            <div className="d-flex justify-content-center mt-3">
              <Button type="submit" variant="success" size="lg" disabled={isUploading || isImageChecking}>
                {isUploading ? 'Importing...' : isImageChecking ? 'Verifying Images...' : 'Start Import'}
              </Button>
            </div>

            {notFoundCount > 0 && (
              <div className="d-flex justify-content-center mt-3">
                <Button type="button" variant="outline-primary" onClick={handleDownloadNotFoundRows}>
                  Download Not Found Rows ({notFoundCount})
                </Button>
              </div>
            )}

            {statusText && (
              <Alert variant={statusVariant} className="mt-3 mb-0">
                {statusText}
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>
    </UploadPageLayout>
  )
}

export default Import_Main_T
