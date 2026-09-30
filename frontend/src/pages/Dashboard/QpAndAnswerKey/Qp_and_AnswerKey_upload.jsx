import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import { useGetSubjectDataQuery } from '../../../redux-slice/SubjectMasterApiSlice'
import { BASE_URL } from '../../../constraint/constraint'

const QpAndAnswerKeyUpload = () => {
  const [uploadType, setUploadType] = useState('question_paper')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subcode, setSubcode] = useState('')
  const [testcode, setTestcode] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const monthyearInfo = useSelector((state) => state.auth?.monthyearInfo)
  const activeMonthYear = Array.isArray(monthyearInfo)
    ? monthyearInfo.find((item) => item.Month_Year_Status === 'Y')
    : null
  const [examMonth, setExamMonth] = useState(activeMonthYear?.Eva_Month || '')
  const [examYear, setExamYear] = useState(activeMonthYear?.Eva_Year || '')
  const evaMonthYear = examMonth && examYear ? `${examMonth}_${examYear}` : ''
  const { data: subjectResponse, isLoading } = useGetSubjectDataQuery()
  const subjects = (Array.isArray(subjectResponse?.data) ? [...subjectResponse.data] : [])
    .sort((a, b) => String(a.Dep_Name ?? '').localeCompare(String(b.Dep_Name ?? ''), undefined, { numeric: true })
      || String(a.Subcode).localeCompare(String(b.Subcode), undefined, { numeric: true })
      || String(a.testcode).localeCompare(String(b.testcode)))

  const selectSubject = (event) => {
    const id = event.target.value
    const subject = subjects.find((item) => String(item.id) === id)
    setSelectedSubjectId(id)
    setSubcode(subject?.Subcode || '')
    setTestcode(subject?.testcode || '')
  }

  const selectFile = (event) => {
    const selectedFile = event.target.files?.[0]
    setStatus(null)
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf') {
      setStatus({ type: 'danger', message: 'Select a PDF file.' })
      event.target.value = ''
      return
    }
    setFile(selectedFile)
  }

  const upload = async () => {
    if (!evaMonthYear || !subcode || !testcode || !file) {
      setStatus({ type: 'warning', message: 'Select a subject, enter a test code, and choose a PDF file.' })
      return
    }
    setUploading(true)
    setStatus(null)
    const formData = new FormData()
    formData.append('files', file)
    formData.append('subcode', subcode)
    formData.append('testcode', testcode)
    formData.append('Eva_Mon_Year', evaMonthYear)
    formData.append('uploadType', uploadType)
    try {
      const response = await fetch(`${BASE_URL}/api/subject/question_paper_answer_key`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-current-route': window.location.pathname.slice(1) },
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Upload failed')
      setStatus({ type: 'success', message: result.message })
      setFile(null)
      const input = document.querySelector('input[type="file"]')
      if (input) input.value = ''
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <UploadPageLayout mainTopic="Upload Question Paper and Answer Key">
      <Row style={{ margin: 0 }}>
        <Col md={8}>
          <Card className="mt-4">
            <Card.Body>
              <Card.Title>Question Paper / Answer Key Upload</Card.Title>
              {status && <Alert variant={status.type}>{status.message}</Alert>}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject Code</Form.Label>
                    <Form.Select value={selectedSubjectId} onChange={selectSubject} disabled={uploading || isLoading}>
                      <option value="">{isLoading ? 'Loading subjects...' : '-- Select Subject --'}</option>
                      {subjects.map((subject) => <option key={subject.id} value={String(subject.id)}>{subject.Subcode} - {subject.SUBNAME} ({subject.testcode})</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Test Code</Form.Label>
                    <Form.Control value={testcode} onChange={(event) => setTestcode(event.target.value.replace(/\s/g, ''))} disabled={uploading} />
                  </Form.Group>
                </Col>
              </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Exam Month</Form.Label>
                      <Form.Control value={examMonth} onChange={(event) => setExamMonth(event.target.value.replace(/\s/g, ''))} disabled={uploading} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Exam Year</Form.Label>
                      <Form.Control value={examYear} onChange={(event) => setExamYear(event.target.value.replace(/\s/g, ''))} disabled={uploading} />
                    </Form.Group>
                  </Col>
                </Row>
              <Form.Group className="mb-3">
                <Form.Label>Upload Type</Form.Label>
                <Form.Select value={uploadType} onChange={(event) => setUploadType(event.target.value)} disabled={uploading}>
                  <option value="question_paper">Question Paper</option>
                  <option value="answer_key">Answer Key</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Select PDF</Form.Label>
                <Form.Control type="file" accept=".pdf,application/pdf" onChange={selectFile} disabled={uploading} />
                {file && <Form.Text>Selected: {file.name}</Form.Text>}
              </Form.Group>
              <Button variant="primary" onClick={upload} disabled={uploading || !evaMonthYear || !subcode || !testcode || !file}>
                {uploading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Uploading...</> : 'Upload'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </UploadPageLayout>
  )
}

export default QpAndAnswerKeyUpload