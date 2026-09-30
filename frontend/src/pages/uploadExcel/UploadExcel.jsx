import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, Table } from 'react-bootstrap';
import { FaCloudUploadAlt, FaCheckCircle, FaInfoCircle, FaFileExcel } from 'react-icons/fa';
import { useGetAllTypeExamQuery, useUploadExcelMutation } from '../../redux-slice/exceluploadOperationApiSlice';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import './UploadExcel.css';

const UploadExcel = () => {
  const { data, error, isLoading } = useGetAllTypeExamQuery();
  const [uploadExcel, { isLoading: isUploading }] = useUploadExcelMutation();
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fieldOptionsByExam = {
    '001': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' },
      { value: 'medium_qb', label: 'Medium QB' }
    ],
    '002': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' },
      { value: 'medium_qb', label: 'Medium QB' }
    ],
    '003': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' },
      { value: 'medium_qb', label: 'Medium QB' }
    ],
    '005': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ],
    '006': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ],
    '008': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ],
    '009': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ],
    '010': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ],
    '011': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ],
    '012': [
      { value: 'qb', label: 'QB' },
      { value: 'marks', label: 'Marks' }
    ]
  };

  const fieldOptions = fieldOptionsByExam[selectedExamType] || [
    { value: 'qb', label: 'QB' },
    { value: 'marks', label: 'Marks' }
  ];

  const processExcelFile = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Get headers (first row)
        const headers = jsonData[0];
        
        // Get rows (remaining data)
        const rows = jsonData.slice(1).filter(row => row.length > 0);
        
        // Convert to array of objects
        const formattedData = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            // Explicitly preserve 0 values - don't use || operator
            obj[header] = row[index] !== undefined && row[index] !== null ? row[index] : '';
          });
          return obj;
        });
        
        setExcelData({
          headers,
          rows: formattedData,
          totalRows: formattedData.length,
          sheetName: firstSheetName
        });
        
        console.log('Excel Data Processed:', {
          headers,
          rows: formattedData,
          totalRows: formattedData.length
        });
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        alert('Error processing Excel file. Please ensure it is a valid .xlsx or .xls file.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const processTextFile = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          toast.error('The text file is empty');
          setIsProcessing(false);
          return;
        }

        let headers = [];
        let rows = [];

        if (lines[0].includes('|')) {
          const sampleParts = lines[0].replace(/,/g, '').split('|').filter(Boolean);
          headers = sampleParts.map((_, idx) => `field_${idx + 1}`);
          rows = lines.map((line) => {
            const cleanLine = line.replace(/,/g, '');
            const parts = cleanLine.split('|').filter(Boolean);
            const obj = {};
            parts.forEach((p, idx) => {
              obj[`field_${idx + 1}`] = p.trim();
            });
            obj.rawLine = line;
            return obj;
          });
        } else if (lines[0].includes(',')) {
          headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
          rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx] !== undefined ? values[idx] : '';
            });
            return obj;
          });
        } else {
          headers = ['value'];
          rows = lines.map((line) => ({ value: line.trim() }));
        }

        setExcelData({
          headers,
          rows,
          totalRows: rows.length,
          sheetName: file.name
        });
      } catch (err) {
        console.error('Error processing text file:', err);
        alert('Error processing text file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading text file:', error);
      alert('Error reading file. Please try again.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.name.toLowerCase().endsWith('.txt')) {
        processTextFile(file);
      } else {
        processExcelFile(file);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (file.name.toLowerCase().endsWith('.txt')) {
        processTextFile(file);
      } else {
        processExcelFile(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedExamType || !selectedField || !selectedFile || !excelData) {
      toast.error('Please fill all fields and select a valid Excel file');
      return;
    }

    try {
      // Prepare data object to send to backend
      const uploadData = {
        type_of_exam_code: selectedExamType,
        field: selectedField,
        excelData: excelData.rows
      };

      // Log what we're sending
      console.log('Uploading Excel data:', uploadData);

      // Call the mutation
      const result = await uploadExcel(uploadData).unwrap();
      
      // Success
      console.log('Upload successful:', result);
      toast.success(`Excel file uploaded successfully! ${excelData.totalRows} rows processed.`);
      
      // Reset form
      setSelectedExamType('');
      setSelectedField('');
      setSelectedFile(null);
      setExcelData(null);
      
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to upload Excel file. Please try again.';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" className="spinner-custom" />
        <p className="text-muted">Loading exam types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Alert variant="danger" className="error-alert">
          <Alert.Heading>Error</Alert.Heading>
          <p>Failed to load exam types. Please try again later.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="upload-excel-container">
      <Container>
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Upload Excel</h1>
          <p className="page-subtitle">Upload examination data in Excel format</p>
        </div>

        {/* Main Card */}
        <Card className="upload-card">
          <Card.Header className="card-header-custom">
            <h2>
              <FaCloudUploadAlt /> Excel File Upload
            </h2>
            <p>Select exam details and upload your file</p>
          </Card.Header>

          <Card.Body className="upload-form">
            <Form onSubmit={handleSubmit}>
              {/* Exam Type Selection */}
              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">
                  Select Type of Exam
                  <span className="required-field">*</span>
                </Form.Label>
                <Form.Select
                  value={selectedExamType}
                  onChange={(e) => {
                    const nextExamType = e.target.value;
                    setSelectedExamType(nextExamType);
                    setSelectedField('');
                  }}
                  className="select-custom"
                  required
                >
                  <option value="">-- Select Exam Type --</option>
                  {data?.data?.typeExam?.map((exam) => (
                    <option key={exam.id} value={exam.type_of_exam_code}>
                      {exam.type_of_exam_desc} ({exam.type_of_exam_code})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Field Selection */}
              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">
                  Select Field
                  <span className="required-field">*</span>
                </Form.Label>
                <Form.Select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="select-custom"
                  required
                >
                  <option value="">-- Select Field --</option>
                  {fieldOptions.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* File Upload Area */}
              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">
                  Upload Excel File
                  <span className="required-field">*</span>
                </Form.Label>
                <div
                  className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls,.txt,.TXT"
                    onChange={handleFileChange}
                    className="file-input-hidden"
                    required
                  />
                  {selectedFile ? (
                    <div>
                      <div className="file-selected-info">
                        <FaCheckCircle size={20} />
                        <span>{selectedFile.name}</span>
                      </div>
                      <p className="file-size-text">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      {isProcessing && (
                        <div className="mt-2">
                          <Spinner animation="border" size="sm" variant="primary" />
                          <span className="ms-2 text-muted">Processing Excel...</span>
                        </div>
                      )}
                      {excelData && !isProcessing && (
                        <div className="mt-2 text-success">
                          <FaCheckCircle /> {excelData.totalRows} rows processed
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setExcelData(null);
                        }}
                        className="remove-file-btn"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="upload-icon-wrapper">
                        <FaCloudUploadAlt className="upload-icon" />
                      </div>
                      <p className="upload-text-primary">
                        Drag and drop your Excel file here
                      </p>
                      <p className="upload-text-secondary">
                        or click to browse
                      </p>
                      <p className="upload-text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Supported formats: .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>
              </Form.Group>

              {/* Selected Information Display */}
              {selectedExamType && selectedField && (
                <div className="selected-details-card">
                  <h3 className="selected-details-title">
                    <FaInfoCircle /> Selected Details
                  </h3>
                  <Row>
                    <Col md={6} className="mb-3 mb-md-0">
                      <div className="detail-item">
                        <p className="detail-label">Exam Type</p>
                        <p className="detail-value">{selectedExamType}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item">
                        <p className="detail-label">Field</p>
                        <p className="detail-value">{selectedField.toUpperCase()}</p>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Excel Data Preview */}
              {excelData && excelData.rows.length > 0 && (
                <div className="excel-preview-card mt-4">
                  <Card>
                    <Card.Header className="bg-success text-white">
                      <h5 className="mb-0">
                        <FaFileExcel className="me-2" />
                        Excel Data Preview
                      </h5>
                      <small>
                        Sheet: {excelData.sheetName} | Total Rows: {excelData.totalRows}
                      </small>
                    </Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table striped bordered hover responsive>
                        <thead className="table-dark sticky-top">
                          <tr>
                            <th>#</th>
                            {excelData.headers.map((header, index) => (
                              <th key={index}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelData.rows.slice(0, 50).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              <td>{rowIndex + 1}</td>
                              {excelData.headers.map((header, colIndex) => (
                                <td key={colIndex}>{row[header]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      {excelData.totalRows > 50 && (
                        <Alert variant="info" className="mt-3 mb-0">
                          <FaInfoCircle className="me-2" />
                          Showing first 50 rows out of {excelData.totalRows} total rows
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <Alert variant="primary" className="mt-4">
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-3" />
                    <div>
                      <strong>Uploading Excel file to server...</strong>
                      <p className="mb-0 small">Please wait while we process your data.</p>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Button Group */}
              <div className="button-group">
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedExamType('');
                    setSelectedField('');
                    setSelectedFile(null);
                    setExcelData(null);
                  }}
                  className="btn-reset"
                  disabled={isUploading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedExamType || !selectedField || !selectedFile || !excelData || isProcessing || isUploading}
                  className="btn-submit"
                >
                  {isUploading ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Uploading...</span>
                    </>
                  ) : isProcessing ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaCloudUploadAlt />
                      <span>Upload File</span>
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Info Alert */}
        <Alert className="info-alert">
          <div className="info-alert-header">
            <FaInfoCircle /> Important Notes
          </div>
          <ul>
            <li>Ensure your Excel file follows the correct format</li>
            <li>Maximum file size: 10 MB</li>
            <li>Supported formats: .xlsx and .xls</li>
            <li>The file will be processed in your browser - no data is sent until you click Upload</li>
            <li>You can preview up to 50 rows before uploading</li>
          </ul>
        </Alert>
      </Container>
    </div>
  );
};

export default UploadExcel