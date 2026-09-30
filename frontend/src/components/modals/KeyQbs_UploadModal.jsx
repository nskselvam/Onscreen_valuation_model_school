import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap'
import { BASE_URL } from '../../constraint/constraint'

const KeyQbs_UploadModal = ({ show, handleClose, uploadType, selectedRow, onUploadSuccess, mode = 'upload', pdfUrl = '' }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pdfBlobUrl, setPdfBlobUrl] = useState('')
  const [loadingPdf, setLoadingPdf] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file || null)
    setError('')
    setSuccess('')
  }


  // Fetch PDF when in view mode
  useEffect(() => {
    if (mode === 'view' && show && selectedRow) {
      fetchPdfFile()
    }

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [mode, show, selectedRow])

  const fetchPdfFile = async () => {
    setLoadingPdf(true)
    setError('')
    
    try {
      const endpoint = uploadType === 'answer_key' ? '/api/subject/answer_key' : '/api/subject/question_paper';
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          subcode: selectedRow.Subcode,
          Dep_Name: selectedRow.Dep_Name,
          Eva_Mon_Year: selectedRow.Eva_Mon_Year,
          uploadType: uploadType
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      
      // Verify it's a PDF
      if (blob.type !== 'application/pdf') {
        throw new Error('Invalid file type received. Expected PDF.')
      }
      
      const blobUrl = URL.createObjectURL(blob)
      setPdfBlobUrl(blobUrl)
    } catch (err) {
      console.error('Error fetching PDF:', err)
      setError(`Failed to load PDF file: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingPdf(false)
    }
  }

  

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('files', selectedFile)
      formData.append('uploadType', uploadType)
      
      // If selectedRow is provided, add row-specific data
      if (selectedRow) {
        formData.append('subcode', selectedRow.Subcode)
        formData.append('Eva_Mon_Year', selectedRow.Eva_Mon_Year)
        formData.append('testcode', selectedRow.testcode || '')
      }

      const response = await fetch(`${BASE_URL}/api/subject/question_paper_answer_key`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Successfully uploaded file')
        setSelectedFile(null)
        
        // Call the success callback to refresh the list
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess()
          }
          handleClose()
          setSuccess('')
        }, 1500)
      } else {
        setError(data.message || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleModalClose = () => {
    setSelectedFile(null)
    setError('')
    setSuccess('')
    handleClose()
  }

  return (
    <Modal 
      show={show} 
      onHide={handleModalClose} 
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header 
        closeButton 
        style={{
          backgroundColor: '#2c5282',
          color: '#ffffff',
          padding: '20px 24px',
          borderBottom: '3px solid #1a365d'
        }}
      >
        <Modal.Title style={{ fontSize: '22px', fontWeight: '600' }}>
          <i className={mode === 'view' ? 'bi bi-eye me-2' : 'bi bi-upload me-2'}></i>
          {mode === 'view' ? 'View' : 'Upload'} {uploadType === 'question_paper' ? 'Question Paper' : 'Answer Key'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: mode === 'view' ? '0' : '30px', backgroundColor: mode === 'view' ? '#2d3748' : '#f8f9fa' }}>
        {mode === 'view' ? (
          // PDF Viewer Mode
          <div style={{ minHeight: '600px', backgroundColor: '#2d3748' }}>
            {selectedRow && (
              <div style={{ 
                padding: '15px 30px', 
                backgroundColor: '#1a202c',
                color: '#ffffff',
                borderBottom: '2px solid #4a5568'
              }}>
                <div style={{ fontSize: '15px', fontWeight: '500' }}>
                  <i className="bi bi-file-pdf-fill me-2" style={{ color: '#f56565' }}></i>
                  {selectedRow.Subcode || selectedRow.originalName || selectedRow.filename}
                </div>
              </div>
            )}
            {loadingPdf ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '600px',
                color: '#ffffff'
              }}>
                <div className="text-center">
                  <Spinner animation="border" variant="light" className="mb-3" />
                  <div>Loading PDF...</div>
                </div>
              </div>
            ) : error ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '600px',
                color: '#ffffff',
                padding: '20px'
              }}>
                <Alert variant="danger" style={{ width: '100%', maxWidth: '500px' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </Alert>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none'
                }}
                title="PDF Viewer"
              />
            ) : null}
          </div>
        ) : (
          // Upload Form Mode
          <>
            {error && (
              <Alert 
                variant="danger" 
                dismissible 
                onClose={() => setError('')}
                style={{ 
                  borderRadius: '8px', 
                  border: '1px solid #f5c6cb',
                  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.1)'
                }}
              >
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                variant="success"
                style={{ 
                  borderRadius: '8px', 
                  border: '1px solid #c3e6cb',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.1)'
                }}
              >
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
              </Alert>
            )}
            
            {selectedRow && (
              <Alert 
                variant="info"
                style={{ 
                  borderRadius: '8px', 
                  border: '1px solid #b8daff',
                  backgroundColor: '#e7f3ff',
                  padding: '15px',
                  marginBottom: '25px',
                  boxShadow: '0 2px 4px rgba(0, 123, 255, 0.1)'
                }}
              >
                <div style={{ fontSize: '14px', color: '#004085' }}>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Uploading for: <strong>{selectedRow.originalName || selectedRow.filename}</strong>
                </div>
              </Alert>
            )}

            <Form>
          <Form.Group className="mb-4">
            <Form.Label style={{ 
              fontWeight: '600', 
              fontSize: '15px', 
              color: '#2c5282',
              marginBottom: '12px',
              display: 'block'
            }}>
              <i className="bi bi-file-earmark-pdf me-2"></i>
              Select PDF File
            </Form.Label>
            <Form.Control
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{
                padding: '12px',
                border: '2px dashed #cbd5e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.target.style.borderColor = '#2c5282'
                  e.target.style.backgroundColor = '#f7fafc'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#cbd5e0'
                e.target.style.backgroundColor = '#ffffff'
              }}
            />
            <Form.Text style={{ 
              fontSize: '13px', 
              color: '#718096',
              display: 'block',
              marginTop: '8px'
            }}>
              <i className="bi bi-info-circle me-1"></i>
              Select a single PDF file (Max 10MB)
            </Form.Text>
          </Form.Group>

          {selectedFile && (
            <div 
              className="mb-3"
              style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ 
                fontWeight: '600', 
                fontSize: '15px', 
                color: '#2c5282',
                marginBottom: '15px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '10px'
              }}>
                <i className="bi bi-file-earmark-check me-2"></i>
                Selected File
              </div>
              <div
                style={{
                  padding: '12px 15px',
                  backgroundColor: '#f7fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px'
                }}
              >
                <span style={{ color: '#2d3748', fontWeight: '500' }}>
                  <i className="bi bi-file-pdf-fill me-2" style={{ color: '#dc3545' }}></i>
                  {selectedFile.name}
                </span>
                <span style={{ 
                  color: '#718096', 
                  fontSize: '13px',
                  backgroundColor: '#e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '4px'
                }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}
            </Form>
          </>
        )}
      </Modal.Body>
      
      {mode === 'upload' && (
        <Modal.Footer style={{ 
          padding: '20px 30px',
          backgroundColor: '#ffffff',
          borderTop: '2px solid #e2e8f0'
        }}>
          <Button 
            variant="outline-secondary" 
            onClick={handleModalClose} 
            disabled={uploading}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '14px',
              border: '2px solid #cbd5e0',
              transition: 'all 0.3s ease'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              backgroundColor: '#2c5282',
              border: 'none',
              boxShadow: '0 2px 4px rgba(44, 82, 130, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload me-2"></i>
                Upload File
              </>
            )}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  )
}

export default KeyQbs_UploadModal