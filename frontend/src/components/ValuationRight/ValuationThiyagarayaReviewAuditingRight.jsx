import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Container, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  useGetThiyagarayaReviewRemarkMutation,
  useSaveThiyagarayaReviewRemarkMutation,
} from '../../redux-slice/thiyagarayaReviewApiSlice'

const ValuationThiyagarayaReviewAuditingRight = ({ reviewRow, mainData, isLoading, isError, onViewImage }) => {
  const navigate = useNavigate()
  console.log('ValuationThiyagarayaReviewAuditingRight props:', { reviewRow, mainData, isLoading, isError })
  const [getThiyagarayaReviewRemark] = useGetThiyagarayaReviewRemarkMutation()
  const [saveThiyagarayaReviewRemark, { isLoading: isRemarkSaving }] = useSaveThiyagarayaReviewRemarkMutation()
  const [expandedRow, setExpandedRow] = useState(null)
  const [verifiedRows, setVerifiedRows] = useState(new Set())
  const [messageText, setMessageText] = useState('')
  const [remarkType, setRemarkType] = useState('General remarks')
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [remarkError, setRemarkError] = useState('')
  const [remarkSaved, setRemarkSaved] = useState(false)
  const redirectTimeoutRef = useRef(null)

  const remarkTypeOptions = useMemo(() => [
    'General remarks',
    'Valuation remarks',
  ], [])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const sourceData = useMemo(() => {
    const nested = mainData?.filters || {}
    return {
      studentValData: Array.isArray(mainData?.studentValData)
        ? mainData.studentValData
        : (Array.isArray(nested?.studentValData) ? nested.studentValData : []),
      totalMarks: mainData?.totalMarks ?? nested?.totalMarks,
    }
  }, [mainData])

  const marksData = useMemo(() => {
    const raw = Array.isArray(sourceData.studentValData) ? sourceData.studentValData : []

    const getSubSectionOrder = (item) => {
      const subSection = String(item?.SUB_SEC || item?.sub_section || item?.add_sub_section || '').trim().toLowerCase()

      if (subSection === 'a') return 1
      if (subSection === 'b') return 2
      if (subSection === 'c') return 3
      if (subSection === 'd') return 4
      return 99
    }

    return raw
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const aSection = String(a.item?.section || a.item?.sec_id || '').trim().toLowerCase()
        const bSection = String(b.item?.section || b.item?.sec_id || '').trim().toLowerCase()

        if (aSection !== bSection) {
          return aSection.localeCompare(bSection, undefined, { numeric: true, sensitivity: 'base' })
        }

        const aQbno = Number(a.item?.qbno ?? a.item?.questionNo ?? Number.MAX_SAFE_INTEGER)
        const bQbno = Number(b.item?.qbno ?? b.item?.questionNo ?? Number.MAX_SAFE_INTEGER)

        if (aQbno !== bQbno) {
          return aQbno - bQbno
        }

        const aSubOrder = getSubSectionOrder(a.item)
        const bSubOrder = getSubSectionOrder(b.item)

        if (aSubOrder !== bSubOrder) {
          return aSubOrder - bSubOrder
        }

        return a.index - b.index
      })
      .map((entry) => entry.item)
  }, [sourceData])

  const totalMarks = useMemo(
    () => Number(sourceData.totalMarks) || marksData.reduce((sum, row) => sum + Number(row.Marks_Get || row.mark || 0), 0),
    [sourceData.totalMarks, marksData]
  )

  const isVerified = (index) => verifiedRows.has(index)

  const buildCommonRemarkPayload = () => {
    const depName = (reviewRow?.Dep_Name || mainData?.filters?.Dep_Name || 'NA').toString().trim() || 'NA'

    return {
      Dep_Name: depName,
      Dummy_NO: reviewRow?.Dummy_NO || '',
      SubjectCode: reviewRow?.SubjectCode || '',
      sec_id: 1,
      qbno: 1,
      section: 'CMN',
      sub_section: 'NA',
      add_sub_section: 'NA',
      reviewRemarks_data: remarkType,
      reviewRemarks: messageText.trim() || 'No message entered',
      valuation_type: String(reviewRow?.Valuation_Type ?? 1),
      Examiner_type: '9',
    }
  }

  const handleViewClick = (index, pageNo) => {
    const normalizedPage = String(pageNo).toUpperCase() === 'NA' ? 1 : Number(pageNo)
    if (!Number.isNaN(normalizedPage) && onViewImage) {
      onViewImage(normalizedPage)
    }

    setVerifiedRows((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })

    setExpandedRow((prev) => (prev === index ? null : index))
  }

  const openCommonRemarksModal = async () => {
    setRemarkError('')
    setRemarkSaved(false)
    setShowRemarksModal(true)

    try {
      const response = await getThiyagarayaReviewRemark(buildCommonRemarkPayload()).unwrap()
      const existingRemark = response?.data?.reviewRemarks ? String(response.data.reviewRemarks) : ''
      const existingRemarkType = response?.data?.reviewRemarks_data
        ? String(response.data.reviewRemarks_data)
        : 'General remarks'
      const normalizedExistingRemarkType = remarkTypeOptions.includes(existingRemarkType)
        ? existingRemarkType
        : 'General remarks'
      setMessageText(existingRemark)
      setRemarkType(normalizedExistingRemarkType)
    } catch (error) {
      const msg = error?.data?.message || ''
      if (msg && !msg.includes('sec_id') && !msg.includes('qbno')) {
        setRemarkError(msg)
      }
    }
  }

  const handleSaveCommonRemark = async () => {
    setRemarkError('')
    setRemarkSaved(false)

    try {
      await saveThiyagarayaReviewRemark(buildCommonRemarkPayload()).unwrap()
      setRemarkSaved(true)

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }

      redirectTimeoutRef.current = setTimeout(() => {
        setShowRemarksModal(false)
        navigate('/examiner/thiyagaraja-auditing', {
          replace: true,
          state: { refreshData: true, timestamp: Date.now() },
        })
      }, 1000)
    } catch (error) {
      setRemarkError(error?.data?.message || 'Failed to save common remark')
    }
  }

  if (isLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-2 mb-0">Loading review marks...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="mb-0">Failed to load review marks data.</Alert>
      </Container>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        background: 'linear-gradient(180deg, #1f4d93 0%, #2f5ca3 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container fluid className="p-3" style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #5ea8f3 0%, #2d72c8 100%)',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '2px solid rgba(11, 22, 47, 0.9)',
            marginBottom: '14px',
            boxShadow: '0 8px 18px rgba(8, 26, 58, 0.35)',
          }}
        >
          <h5 className="text-white fw-bold mb-0 text-center" style={{ letterSpacing: '0.5px' }}> AUDITING REVIEW</h5>
        </div>

        <div
          style={{
            background: '#edf4fc',
            borderRadius: '14px',
            padding: '14px 16px',
            border: '2px solid rgba(11, 22, 47, 0.9)',
            marginBottom: '14px',
            boxShadow: '0 6px 14px rgba(7, 17, 37, 0.22)',
          }}
        >
          <p className="mb-2"><strong>Barcode No:</strong> {reviewRow?.Dummy_NO || '-'}</p>
          <p className="mb-2"><strong>Course code:</strong> {reviewRow?.SubjectCode || '-'}</p>
          <p className="mb-0"><strong>Total Marks:</strong> {totalMarks}</p>
        </div>

        {expandedRow !== null && marksData[expandedRow] && (
          <div className="mb-3 p-3" style={{ background: '#e7f3ff', borderRadius: '10px', border: '1px solid #0d6efd' }}>
            <p className="mb-0" style={{ color: '#0d6efd', fontSize: '0.92rem' }}>
              Showing page {marksData[expandedRow].Qbs_Page_No || marksData[expandedRow].page_no || marksData[expandedRow].qbs_page_no || 1} in center panel.
            </p>
          </div>
        )}

        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '2px solid rgba(11, 22, 47, 0.9)',
            overflow: 'hidden',
            boxShadow: '0 8px 18px rgba(7, 17, 37, 0.28)',
          }}
        >
          <Table striped bordered hover responsive className="mb-0">
            <thead>
              <tr style={{ background: '#eff4fa' }}>
                <th className="text-center">Section</th>
                <th className="text-center">Q.No</th>
                <th className="text-center">Mark</th>
                <th className="text-center">Image</th>
              </tr>
            </thead>
            <tbody>
              {marksData.length === 0 && (
                <tr>
                  <td className="text-center" colSpan={4}>No marks data available</td>
                </tr>
              )}
              {marksData.map((item, index) => (
                <tr key={item.id || `${item.sec_id || 'S'}_${item.qbno || index}_${index}`} style={{ backgroundColor: isVerified(index) ? '#dbf2e6' : 'transparent' }}>
                  <td className="text-center">{item.section || item.sec_id || '-'}</td>
                  <td className="text-center">{item.qbno || item.questionNo || '-'}{item.SUB_SEC || item.sub_section || item.add_sub_section ? `-${item.SUB_SEC || item.sub_section || item.add_sub_section}` : ''}</td>
                  <td className="text-center">
                    <Badge bg="success">{item.Marks_Get || item.mark || '0'}</Badge>
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant={expandedRow === index ? 'success' : 'primary'}
                      style={{ minWidth: '56px' }}
                      onClick={() => handleViewClick(index, item.Qbs_Page_No || item.page_no || item.qbs_page_no || 1)}
                    >
                      {expandedRow === index ? 'Hide' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div
          style={{
            marginTop: '14px',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
            borderRadius: '14px',
            border: '2px solid rgba(11, 22, 47, 0.9)',
            boxShadow: '0 8px 18px rgba(7, 17, 37, 0.28)',
            padding: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: '1px solid #d6e4f7',
            }}
          >
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#102a43', lineHeight: 1.2 }}>
                Final Review Actions
              </div>
              <div style={{ fontSize: '0.8rem', color: '#486581' }}>
                Add or update the common remark for this auditing review.
              </div>
            </div>
            <Button
              variant="outline-primary"
              className="fw-semibold"
              onClick={openCommonRemarksModal}
              style={{
                minWidth: '140px',
                borderRadius: '10px',
                padding: '8px 16px',
                borderWidth: '2px',
              }}
            >
              Remarks
            </Button>
          </div>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="fw-semibold"
                onClick={() => navigate('/examiner/thiyagaraja-auditing')}
                style={{
                  minWidth: '140px',
                  borderRadius: '10px',
                  padding: '8px 16px',
                }}
              >
                Back
              </Button>
            </div>

        </div>
      </Container>

      <Modal
        show={showRemarksModal}
        onHide={() => setShowRemarksModal(false)}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(120deg, #d6e8ff 0%, #eaf3ff 55%, #f4f9ff 100%)',
            borderBottom: '1px solid #c9dcf5',
            padding: '16px 18px',
          }}
        >
          <div>
            <Modal.Title style={{ color: '#102a43', fontWeight: 800, letterSpacing: '0.2px', marginBottom: '2px' }}>
              Common Remark
            </Modal.Title>
            <div style={{ fontSize: '0.84rem', color: '#486581' }}>
              This note is saved for auditing review and can be updated anytime.
            </div>
          </div>
        </Modal.Header>
        <Modal.Body style={{ background: '#f7fbff', padding: '16px 18px' }}>
          <div
            style={{
              border: '1px solid #d5e4f6',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 10px rgba(20, 52, 89, 0.08)',
            }}
          >
            <Form.Group controlId="commonAuditingRemarkModal">
              <Form.Label style={{ fontWeight: 700, color: '#243b53', marginBottom: '8px', fontSize: '0.95rem' }}>
                Remark category
              </Form.Label>
              <Form.Select
                value={remarkType}
                onChange={(e) => setRemarkType(e.target.value)}
                style={{
                  border: '1px solid #bfd3ee',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  padding: '10px 12px',
                  marginBottom: '12px',
                }}
              >
                {remarkTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>

              <Form.Label style={{ fontWeight: 700, color: '#243b53', marginBottom: '8px', fontSize: '0.95rem' }}>
                Enter common remark for this auditing review
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your common remark..."
                style={{
                  border: '1px solid #bfd3ee',
                  borderRadius: '10px',
                  fontSize: '0.96rem',
                  lineHeight: 1.55,
                  padding: '12px 14px',
                  resize: 'vertical',
                  minHeight: '180px',
                }}
              />
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#627d98' }}>
                  Keep the remark concise and actionable.
                </span>
                <span style={{ fontSize: '0.78rem', color: '#829ab1' }}>
                  {messageText.length}/255
                </span>
              </div>
            </Form.Group>
          </div>
          {remarkError && (
            <Alert variant="danger" className="mt-3 mb-0 py-2" style={{ fontSize: '0.88rem', borderRadius: '10px' }}>
              {remarkError}
            </Alert>
          )}
          {remarkSaved && (
            <Alert variant="success" className="mt-3 mb-0 py-2" style={{ fontSize: '0.88rem', borderRadius: '10px' }}>
              Common remark saved successfully.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            background: '#ffffff',
            borderTop: '1px solid #d6e4f7',
            padding: '12px 18px',
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setShowRemarksModal(false)}
            style={{ borderRadius: '10px', minWidth: '90px' }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveCommonRemark}
            disabled={isRemarkSaving}
            style={{ borderRadius: '10px', minWidth: '155px', fontWeight: 700 }}
          >
            {isRemarkSaving ? 'Saving...' : 'Submit Remark'}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )
}

export default ValuationThiyagarayaReviewAuditingRight
