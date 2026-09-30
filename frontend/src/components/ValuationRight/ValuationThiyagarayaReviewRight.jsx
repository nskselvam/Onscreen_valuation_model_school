import React, { useMemo, useState } from 'react'
import { Alert, Badge, Button, Container, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  useGetThiyagarayaReviewRemarkMutation,
  useSaveThiyagarayaReviewRemarkMutation,
  useUpdateThiyagarayaReviewDecisionMutation,
} from '../../redux-slice/thiyagarayaReviewApiSlice'

const ValuationThiyagarayaReviewRight = ({ reviewRow, mainData, isLoading, isError, onViewImage }) => {
  const navigate = useNavigate()
  const [updateThiyagarayaReviewDecision, { isLoading: isDecisionSubmitting }] = useUpdateThiyagarayaReviewDecisionMutation()
  const [getThiyagarayaReviewRemark] = useGetThiyagarayaReviewRemarkMutation()
  const [saveThiyagarayaReviewRemark, { isLoading: isRemarkSaving }] = useSaveThiyagarayaReviewRemarkMutation()
  const [expandedRow, setExpandedRow] = useState(null)
  const [verifiedRows, setVerifiedRows] = useState(new Set())
  const [_selectedRemark, setSelectedRemark] = useState('')
  const [selectedRemarkItem, setSelectedRemarkItem] = useState(null)
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [reviewDecision, setReviewDecision] = useState('')
  const [pendingDecision, setPendingDecision] = useState('')
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const [submittingDecision, setSubmittingDecision] = useState('')
  const [remarkError, setRemarkError] = useState('')

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

  const buildRemarkPayload = (item) => {
    const normalizedDepName = (reviewRow?.Dep_Name || mainData?.filters?.Dep_Name || 'NA').toString().trim() || 'NA'
    const normalizedSecId = Number(item?.sec_id || item?.sectionId || 0)
    const normalizedQbno = Number(item?.qbno || item?.questionNo || 0)
    const normalizedSection = String(item?.section || '').trim() || 'NA'
    const normalizedSubSection = String(item?.sub_section || item?.SUB_SEC || '').trim() || 'NA'
    const normalizedAddSubSection = String(item?.add_sub_section || '').trim() || 'NA'

    return {
      Dep_Name: normalizedDepName,
      Dummy_NO: reviewRow?.Dummy_NO || '',
      SubjectCode: reviewRow?.SubjectCode || '',
      sec_id: normalizedSecId,
      qbno: normalizedQbno,
      section: normalizedSection,
      sub_section: normalizedSubSection,
      add_sub_section: normalizedAddSubSection,
      valuation_type: String(reviewRow?.Valuation_Type ?? 1),
      Examiner_type: '8',
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

  const handleRemarksClick = async (item) => {
    setRemarkError('')
    const remarkText = item?.cmt || item?.Comment || item?.remarks || 'No remarks available'
    setSelectedRemark(String(remarkText))
    setSelectedRemarkItem(item || null)
    setMessageText('')
    setShowRemarksModal(true)

    try {
      const payload = buildRemarkPayload(item)
      const response = await getThiyagarayaReviewRemark(payload).unwrap()
      const oldMessage = response?.data?.reviewRemarks ? String(response.data.reviewRemarks) : ''
      setMessageText(oldMessage)
    } catch (error) {
      setRemarkError(error?.data?.message || 'Failed to load old remark')
    }
  }

  const handleSaveMessage = async () => {
    setRemarkError('')
    const studentMessage = messageText.trim() || 'No message entered'

    try {
      const payload = buildRemarkPayload(selectedRemarkItem || {})

      await saveThiyagarayaReviewRemark({
        ...payload,
        reviewRemarks: studentMessage,
      }).unwrap()

      setSelectedRemark((prev) => `${prev}\n\nStudent Message: ${studentMessage}`)
      setShowRemarksModal(false)
    } catch (error) {
      setRemarkError(error?.data?.message || 'Failed to save remarks')
    }
  }

  const openDecisionConfirm = (decision) => {
    setDecisionError('')
    setPendingDecision(decision)
    setShowDecisionModal(true)
  }

  const handleDecision = async () => {
    if (!pendingDecision) return

    setDecisionError('')
    setSubmittingDecision(pendingDecision)
    const reviewStatus = pendingDecision === 'accepted' ? 1 : 2

    try {
      await updateThiyagarayaReviewDecision({
        Dummy_NO: reviewRow?.Dummy_NO || '',
        SubjectCode: reviewRow?.SubjectCode || '',
        RegisterNo: reviewRow?.RegisterNo || '',
        reviewStatus,
        studentMessage: messageText.trim(),
      }).unwrap()

      setReviewDecision(pendingDecision)
      setShowDecisionModal(false)
      navigate('/examiner/thiyagaraja-review', {
        state: { refreshData: true, timestamp: Date.now() },
      })
    } catch (error) {
      setDecisionError(error?.data?.message || 'Failed to submit review decision')
    } finally {
      setSubmittingDecision('')
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
          <h5 className="text-white fw-bold mb-0 text-center" style={{ letterSpacing: '0.5px' }}>THIYAGARAYA REVIEW PANEL</h5>
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
          <p className="mb-2"><strong>Register No:</strong> {reviewRow?.RegisterNo || '-'}</p>
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

        {/* {selectedRemark && (
          <Alert variant="light" className="mb-3" style={{ border: '1px solid #bcc9db', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}>
            <strong>Remarks:</strong> {selectedRemark}
            <div style={{ marginTop: '6px', whiteSpace: 'pre-wrap', color: '#334155', fontSize: '0.92rem' }}>{selectedRemark}</div>
          </Alert>
        )} */}

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
                <th className="text-center">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {marksData.length === 0 && (
                <tr>
                  <td className="text-center" colSpan={5}>No marks data available</td>
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
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-dark"
                      style={{ minWidth: '78px' }}
                      onClick={() => handleRemarksClick(item)}
                    >
                      Remarks
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
            background: '#ffffff',
            borderRadius: '14px',
            border: '2px solid rgba(11, 22, 47, 0.9)',
            boxShadow: '0 8px 18px rgba(7, 17, 37, 0.28)',
            padding: '12px',
          }}
        >
          <div className="d-flex gap-2">
            <Button
              variant={reviewDecision === 'accepted' ? 'success' : 'outline-success'}
              className="w-100 fw-semibold"
              disabled={isDecisionSubmitting}
              onClick={() => openDecisionConfirm('accepted')}
            >
              {isDecisionSubmitting && submittingDecision === 'accepted' ? 'Submitting...' : 'Satisfied with Valuation'}
            </Button>
            <Button
              variant={reviewDecision === 'rejected' ? 'danger' : 'outline-danger'}
              className="w-100 fw-semibold"
              disabled={isDecisionSubmitting}
              onClick={() => openDecisionConfirm('rejected')}
            >
              {isDecisionSubmitting && submittingDecision === 'rejected' ? 'Submitting...' : 'Not Satisfied with Valuation'}
            </Button>
          </div>
          {decisionError && (
            <Alert variant="danger" className="mt-2 mb-0 py-2" style={{ fontSize: '0.88rem' }}>
              {decisionError}
            </Alert>
          )}
          {reviewDecision && (
            <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#334155', textAlign: 'center' }}>
              Current Decision: <strong>{reviewDecision === 'accepted' ? 'Satisfied with Valuation' : 'Not Satisfied with Valuation'}</strong>
            </div>
          )}
        </div>
      </Container>

      <Modal
        show={showDecisionModal}
        onHide={() => {
          if (isDecisionSubmitting) return
          setShowDecisionModal(false)
          setPendingDecision('')
        }}
        centered
      >
        <Modal.Header closeButton={!isDecisionSubmitting}>
          <Modal.Title>Confirm Decision</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pendingDecision === 'accepted'
            ? 'Are you sure you want to mark this as Satisfied with Valuation?'
            : 'Are you sure you want to mark this as Not Satisfied with Valuation?'}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={isDecisionSubmitting}
            onClick={() => {
              setShowDecisionModal(false)
              setPendingDecision('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant={pendingDecision === 'accepted' ? 'success' : 'danger'}
            disabled={isDecisionSubmitting}
            onClick={handleDecision}
          >
            {isDecisionSubmitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showRemarksModal}
        onHide={() => setShowRemarksModal(false)}
        size="xl"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #d8e0eb', background: 'linear-gradient(135deg, #eef5ff 0%, #e6f0ff 100%)' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#1f2937', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.15rem' }}>Message</span>
              <span style={{ fontSize: '0.86rem', color: '#334155' }}>
                Q.No: <strong>{selectedRemarkItem?.qbno || '-'}</strong>
                {selectedRemarkItem?.SUB_SEC || selectedRemarkItem?.sub_section || selectedRemarkItem?.add_sub_section
                  ? `-${selectedRemarkItem?.SUB_SEC || selectedRemarkItem?.sub_section || selectedRemarkItem?.add_sub_section}`
                  : ''}
                {' | '}Section: <strong>{selectedRemarkItem?.section || selectedRemarkItem?.sec_id || '-'}</strong>
                {' | '}Page: <strong>{selectedRemarkItem?.Qbs_Page_No || selectedRemarkItem?.page_no || selectedRemarkItem?.qbs_page_no || '-'}</strong>
                {' | '}Mark: <strong>{selectedRemarkItem?.Marks_Get || selectedRemarkItem?.mark || '0'}</strong>
              </span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '1.35rem', background: '#f8fbff' }}>
          {/* <div style={{ background: '#ffffff', border: '1px solid #dbe7f7', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>Existing Remarks</div>
            <div style={{ fontSize: '0.92rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
              {selectedRemark || 'No remarks available'}
            </div>
          </div> */}

          <Form.Group controlId="studentMessage">
            <Form.Label style={{ fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Student Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message for this question..."
              style={{ border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', lineHeight: 1.5 }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #d8e0eb', background: '#f8fafc' }}>
          {remarkError && (
            <Alert variant="danger" className="mb-0 me-auto py-1 px-2" style={{ fontSize: '0.82rem' }}>
              {remarkError}
            </Alert>
          )}
          <Button variant="secondary" onClick={() => setShowRemarksModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveMessage} disabled={isRemarkSaving}>
            {isRemarkSaving ? 'Saving...' : 'Save Message'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ValuationThiyagarayaReviewRight
