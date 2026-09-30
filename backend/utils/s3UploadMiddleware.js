const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const { 
  uploadToS3, 
  uploadMultipleToS3, 
  deleteFromS3, 
  uploadImageToS3, 
  uploadPdfToS3,
  uploadCertificateToS3 
} = require('./s3Upload');

/**
 * Middleware to handle single file upload to S3
 * Use this after multer middleware
 */
exports.handleS3Upload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  try {
    // Upload to S3
    const result = await uploadToS3(req.file, process.env.S3_FOLDER_PREFIX || 'uploads');
    
    // Attach result to request object for use in next middleware
    req.s3Upload = result;
    
    next();
  } catch (error) {
    return next(new AppError(`S3 Upload failed: ${error.message}`, 500));
  }
});

/**
 * Middleware to handle multiple files upload to S3
 */
exports.handleS3MultipleUpload = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400));
  }

  try {
    // Upload all files to S3
    const results = await uploadMultipleToS3(req.files, process.env.S3_FOLDER_PREFIX || 'uploads');
    
    // Attach results to request object
    req.s3Uploads = results;
    
    next();
  } catch (error) {
    return next(new AppError(`S3 Multiple Upload failed: ${error.message}`, 500));
  }
});

/**
 * Middleware to handle image upload to S3
 */
exports.handleS3ImageUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image uploaded', 400));
  }

  try {
    const result = await uploadImageToS3(req.file);
    req.s3Upload = result;
    next();
  } catch (error) {
    return next(new AppError(`Image upload failed: ${error.message}`, 500));
  }
});

/**
 * Middleware to handle PDF upload to S3
 */
exports.handleS3PdfUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No PDF uploaded', 400));
  }

  try {
    const result = await uploadPdfToS3(req.file);
    req.s3Upload = result;
    next();
  } catch (error) {
    return next(new AppError(`PDF upload failed: ${error.message}`, 500));
  }
});

/**
 * Middleware to handle certificate upload to S3
 */
exports.handleS3CertificateUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No certificate uploaded', 400));
  }

  try {
    const result = await uploadCertificateToS3(req.file);
    req.s3Upload = result;
    next();
  } catch (error) {
    return next(new AppError(`Certificate upload failed: ${error.message}`, 500));
  }
});

/**
 * Middleware to delete file from S3
 */
exports.handleS3Delete = catchAsync(async (req, res, next) => {
  const { fileKey } = req.body;

  if (!fileKey) {
    return next(new AppError('File key is required for deletion', 400));
  }

  try {
    const result = await deleteFromS3(fileKey);
    req.s3Delete = result;
    next();
  } catch (error) {
    return next(new AppError(`S3 Delete failed: ${error.message}`, 500));
  }
});
