const express = require('express');
const router = express.Router();
const { upload, uploadImage, uploadCertificate, uploadMultiple } = require('../utils/fileupload');
const { 
  handleS3Upload, 
  handleS3MultipleUpload,
  handleS3ImageUpload,
  handleS3PdfUpload,
  handleS3CertificateUpload,
  handleS3Delete
} = require('../utils/s3UploadMiddleware');
const catchAsync = require('../utils/catchAsync');

/**
 * Example route: Upload single PDF to S3
 * POST /api/upload/pdf
 */
router.post('/pdf', upload.single('file'), handleS3PdfUpload, catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'PDF uploaded successfully to S3',
    data: req.s3Upload
  });
}));

/**
 * Example route: Upload single image to S3
 * POST /api/upload/image
 */
router.post('/image', uploadImage.single('image'), handleS3ImageUpload, catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Image uploaded successfully to S3',
    data: req.s3Upload
  });
}));

/**
 * Example route: Upload certificate to S3
 * POST /api/upload/certificate
 */
router.post('/certificate', uploadCertificate.single('certificate'), handleS3CertificateUpload, catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Certificate uploaded successfully to S3',
    data: req.s3Upload
  });
}));

/**
 * Example route: Upload multiple files (PDFs and images) to S3
 * POST /api/upload/multiple
 */
router.post('/multiple', uploadMultiple.array('files', 10), handleS3MultipleUpload, catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `${req.s3Uploads.length} files uploaded successfully to S3`,
    data: req.s3Uploads
  });
}));

/**
 * Example route: Delete file from S3
 * DELETE /api/upload/delete
 * Body: { "fileKey": "uploads/1234567890-filename.pdf" }
 */
router.delete('/delete', handleS3Delete, catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'File deleted successfully from S3',
    data: req.s3Delete
  });
}));

/**
 * Example route: Get upload status and configuration
 * GET /api/upload/status
 */
router.get('/status', catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      s3Enabled: process.env.USE_S3_UPLOAD === 'true',
      bucketName: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      message: process.env.USE_S3_UPLOAD === 'true' 
        ? 'S3 upload is enabled' 
        : 'S3 upload is disabled, using local storage'
    }
  });
}));

module.exports = router;
