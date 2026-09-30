import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert, ProgressBar, Badge, ListGroup, Table, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import { FaUpload, FaCheckCircle, FaTimesCircle, FaImages, FaTrash } from 'react-icons/fa';
import { 
  useGetTestMastersForImageUploadQuery,
  useUploadTestImagesMutation,
  useGetTestImagesQuery,
  useDeleteTestImageMutation,
  useDeleteAllTestImagesMutation,
  useConfirmImageUploadMutation
} from '../../redux-slice/imageUploadApiSlice';

const UploadImages = () => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  const distCode = userInfo?.D_Code || '';
  
  const { data: testMasterData, isLoading: isLoadingTests, refetch: refetchTestMasters } = useGetTestMastersForImageUploadQuery(distCode);
  const [uploadImages, { isLoading: isUploading }] = useUploadTestImagesMutation();
  const [deleteImage] = useDeleteTestImageMutation();
  const [deleteAllImages] = useDeleteAllTestImagesMutation();
  const [confirmUpload] = useConfirmImageUploadMutation();

  const [selectedTestCode, setSelectedTestCode] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewTestCode, setViewTestCode] = useState('');
  const [expectedCount, setExpectedCount] = useState('');

  const testMasters = testMasterData?.data || [];

  // Fetch uploaded images when viewTestCode changes
  const { data: imagesData, isLoading: isLoadingImages, refetch: refetchImages } = useGetTestImagesQuery(
    { testcode: viewTestCode, districtCode: distCode },
    { skip: !viewTestCode }
  );

  const uploadedImages = imagesData?.data?.images || [];

  // Check if current district's upload status is confirmed (Y)
  const isDistrictConfirmed = () => {
    if (!viewTestCode || !distCode) return false;
    
    const testMaster = testMasters.find(t => t.testcode === viewTestCode);
    if (!testMaster || !testMaster.test_districts || !testMaster.image_upload_districts) return false;
    
    const testDistricts = testMaster.test_districts.split(',').map(d => d.trim().substring(0, 2));
    const imageStatuses = testMaster.image_upload_districts.split(',').map(s => s.trim());
    const normalizedDistCode = distCode.substring(0, 2);
    
    const districtPosition = testDistricts.findIndex(d => d === normalizedDistCode);
    if (districtPosition === -1) return false;
    
    return imageStatuses[districtPosition] === 'Y';
  };

  const handleTestCodeChange = (e) => {
    setSelectedTestCode(e.target.value);
    // Reset files when changing test code
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length > 25) {
      toast.error('Maximum 25 images allowed');
      e.target.value = '';
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(file => {
      const fileType = file.type.toLowerCase();
      return !fileType.includes('jpeg') && !fileType.includes('jpg');
    });

    if (invalidFiles.length > 0) {
      toast.error('Only JPG/JPEG images are allowed');
      e.target.value = '';
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 500 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each image must be less than 500KB');
      e.target.value = '';
      return;
    }

    setSelectedFiles(files);
  };

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const handleUpload = async () => {
    if (!selectedTestCode) {
      toast.error('Please select a test code');
      return;
    }

    if (!distCode) {
      toast.error('District code not found in your session');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('testcode', selectedTestCode);
      formData.append('districtCode', distCode);
      
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      setUploadProgress(0);
      
      await uploadImages(formData).unwrap();
      
      setUploadProgress(100);
      toast.success(`Successfully uploaded ${selectedFiles.length} image(s)`);
      
      // Reset form and refresh test masters list
      setSelectedTestCode('');
      setSelectedFiles([]);
      document.getElementById('fileInput').value = '';
      refetchTestMasters(); // Refresh the dropdown options
      
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error?.data?.message || 'Failed to upload images');
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async (imageId, imageName) => {
    if (isDistrictConfirmed()) {
      toast.error('Cannot delete images after confirmation. Please contact admin to reset upload status.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete image: ${imageName}?`)) {
      return;
    }

    try {
      await deleteImage(imageId).unwrap();
      toast.success('Image deleted successfully');
      refetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error?.data?.message || 'Failed to delete image');
    }
  };

  const handleDeleteAllImages = async () => {
    if (isDistrictConfirmed()) {
      toast.error('Cannot delete images after confirmation. Please contact admin to reset upload status.');
      return;
    }

    if (!viewTestCode) {
      toast.error('Please select a test code');
      return;
    }

    if (!distCode) {
      toast.error('District code not found in session');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ALL ${uploadedImages.length} image(s) for test code ${viewTestCode}? This action cannot be undone!`)) {
      return;
    }

    try {
      const result = await deleteAllImages({
        testcode: viewTestCode,
        districtCode: distCode
      }).unwrap();

      toast.success(result.message);
      refetchImages();
      setViewTestCode(''); // Reset view
    } catch (error) {
      console.error('Error deleting all images:', error);
      toast.error(error?.data?.message || 'Failed to delete all images');
    }
  };

  const handleConfirmUpload = async () => {
    if (!viewTestCode) {
      toast.error('Please select a test code to view');
      return;
    }

    if (!expectedCount || expectedCount <= 0) {
      toast.error('Please enter expected image count');
      return;
    }

    if (!distCode) {
      toast.error('District code not found in session');
      return;
    }

    try {
      const result = await confirmUpload({
        testcode: viewTestCode,
        expectedCount: parseInt(expectedCount),
        districtCode: distCode
      }).unwrap();

      toast.success(result.message);
      
      // Reload the page after successful confirmation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error confirming upload:', error);
      toast.error(error?.data?.message || 'Failed to confirm upload');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 99999, position: 'fixed', top: '20px', right: '20px' }}
      />
      
      <Container fluid className="p-4">
        {/* Header */}
        <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0">
                <FaImages className="me-2" />
                Upload Test Images
              </h4>
              <p className="text-muted mb-0 mt-2">
                Upload images for tests that are active and ready for image upload
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Upload Form */}
      <Row>
        <Col md={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
              <h5 className="mb-0">
                <FaUpload className="me-2" />
                Image Upload Form
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Test Code Selection */}
              <Form.Group className="mb-4">
                <Form.Label>
                  Select Test Code <span className="text-danger">*</span>
                </Form.Label>
                {isLoadingTests ? (
                  <Form.Select disabled>
                    <option>Loading test codes...</option>
                  </Form.Select>
                ) : testMasters.length === 0 ? (
                  <Alert variant="warning">
                    <FaTimesCircle className="me-2" />
                    No tests available for your district ({distCode})
                  </Alert>
                ) : (
                  <Form.Select
                    value={selectedTestCode}
                    onChange={handleTestCodeChange}
                    required
                  >
                    <option value="">-- Select Test Code --</option>
                    {testMasters.map((test) => (
                      <option key={test.id} value={test.testcode}>
                        {test.testcode} - {test.Test_Name} ({test.testdate})
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>

              {/* File Upload */}
              {selectedTestCode && distCode && (
                <>
                  <Form.Group className="mb-4">
                    <Form.Label>
                      Select Images (JPG only, Max 25 images) <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="file"
                      id="fileInput"
                      accept=".jpg,.jpeg,image/jpeg"
                      multiple
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <Form.Text className="text-muted">
                      <FaCheckCircle className="me-1 text-success" />
                      Only JPG/JPEG images allowed (max 500KB each, up to 25 files)
                    </Form.Text>
                  </Form.Group>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <Card className="mb-4">
                      <Card.Header className="bg-light">
                        <strong>Selected Images ({selectedFiles.length}/25)</strong>
                      </Card.Header>
                      <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {selectedFiles.map((file, index) => (
                          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaImages className="me-2 text-primary" />
                              <strong>{file.name}</strong>
                              <Badge bg="secondary" className="ms-2">{formatFileSize(file.size)}</Badge>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              disabled={isUploading}
                            >
                              <FaTimesCircle />
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                  )}

                  {/* Upload Progress */}
                  {uploadProgress > 0 && (
                    <div className="mb-4">
                      <ProgressBar 
                        now={uploadProgress} 
                        label={`${uploadProgress}%`}
                        variant="success"
                        animated
                      />
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleUpload}
                      disabled={isUploading || selectedFiles.length === 0}
                    >
                      <FaUpload className="me-2" />
                      {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Instructions */}
          <Card className="mt-4 shadow-sm">
            <Card.Header className="bg-info text-white">
              <strong>Upload Instructions</strong>
            </Card.Header>
            <Card.Body>
              <ol className="mb-0">
                <li>Select a test code from the dropdown (only active tests are shown)</li>
                <li>Choose JPG/JPEG images from your computer (max 25 files)</li>
                <li>Each image must be less than 500KB in size</li>
                <li>Review selected images in the list</li>
                <li>Click "Upload" to upload all selected images</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>

        {/* Uploaded Images List */}
        <Col md={8} className="mx-auto mt-4">
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
              <Row className="align-items-center">
                <Col md={8}>
                  <h5 className="mb-0">
                    <FaImages className="me-2" />
                    View Uploaded Images
                  </h5>
                </Col>
                <Col md={4}>
                  <Form.Select
                    size="sm"
                    value={viewTestCode}
                    onChange={(e) => setViewTestCode(e.target.value)}
                    style={{ backgroundColor: 'white' }}
                  >
                    <option value="">-- Select Test Code --</option>
                    {testMasters.map((test) => (
                      <option key={test.id} value={test.testcode}>
                        {test.testcode}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {!viewTestCode ? (
                <Alert variant="info">
                  Please select a test code to view uploaded images
                </Alert>
              ) : isLoadingImages ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading images...</p>
                </div>
              ) : uploadedImages.length === 0 ? (
                <Alert variant="warning">
                  No images uploaded for this test code yet
                </Alert>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Alert variant="success" className="mb-0 flex-grow-1 me-2">
                      <strong>{uploadedImages.length}</strong> image(s) uploaded for test code: <strong>{viewTestCode}</strong>
                      {isDistrictConfirmed() && (
                        <>
                          <br />
                          <Badge bg="success" className="mt-2">
                            <FaCheckCircle className="me-1" />
                            Images Confirmed - Deletion Locked
                          </Badge>
                        </>
                      )}
                    </Alert>
                    {!isDistrictConfirmed() && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteAllImages}
                        disabled={uploadedImages.length === 0}
                      >
                        <FaTrash className="me-2" />
                        Delete All
                      </Button>
                    )}
                  </div>
                  <div className="table-responsive">
                    <Table hover bordered>
                      <thead className="table-light">
                        <tr>
                          <th>S.No</th>
                          <th>District Code</th>
                          <th>Image Name</th>
                          <th>Upload Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedImages.map((img, index) => (
                          <tr key={img.id}>
                            <td>{index + 1}</td>
                            <td><Badge bg="secondary">{img.D_Code}</Badge></td>
                            <td>
                              <a href={img.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                <FaImages className="me-2 text-primary" />
                                {img.Img_Path}
                              </a>
                            </td>
                            <td>{new Date(img.createdAt).toLocaleString()}</td>
                            <td>
                              {!isDistrictConfirmed() ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteImage(img.id, img.Img_Path)}
                                >
                                  <FaTrash className="me-1" />
                                  Delete
                                </Button>
                              ) : (
                                <Badge bg="secondary">
                                  <FaCheckCircle className="me-1" />
                                  Confirmed
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Confirmation Section */}
                  <Card className={`mt-4 border-${isDistrictConfirmed() ? 'info' : 'success'}`}>
                    <Card.Header className={`${isDistrictConfirmed() ? 'bg-info' : 'bg-success'} text-white`}>
                      <h6 className="mb-0">
                        <FaCheckCircle className="me-2" />
                        {isDistrictConfirmed() ? 'Upload Status - Already Confirmed' : 'Confirm Image Upload Status'}
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {isDistrictConfirmed() ? (
                        <Alert variant="info" className="mb-0">
                          <FaCheckCircle className="me-2" />
                          <strong>Images have been confirmed for this test.</strong>
                          <br />
                          To modify or re-upload images, please contact the administrator to reset the upload status.
                        </Alert>
                      ) : (
                        <Row className="align-items-end">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Expected Image Count <span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="number"
                                min="1"
                                value={expectedCount}
                                onChange={(e) => setExpectedCount(e.target.value)}
                                placeholder="Enter expected count"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Uploaded Count</Form.Label>
                              <Form.Control
                                type="text"
                                value={uploadedImages.length}
                                readOnly
                                disabled
                                style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Button
                              variant="success"
                              onClick={handleConfirmUpload}
                              disabled={!expectedCount || uploadedImages.length === 0}
                              className="w-100"
                            >
                              <FaCheckCircle className="me-2" />
                              Confirm & Update Status
                            </Button>
                          </Col>
                        </Row>
                      )}
                      <Alert variant="info" className="mt-3 mb-0">
                        <small>
                          <strong>Note:</strong> Enter the expected image count and click "Confirm & Update Status" to mark this test as image uploaded. 
                          The system will verify if uploaded count matches your expected count before updating.
                        </small>
                      </Alert>
                    </Card.Body>
                  </Card>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default UploadImages;
