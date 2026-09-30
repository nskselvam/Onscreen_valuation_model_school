const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Upload file to S3 bucket
 * @param {Object} file - File object from multer
 * @param {String} folder - Folder path in S3 bucket (e.g., 'images', 'pdfs', 'certificates')
 * @returns {Promise<Object>} - Returns S3 upload result with file URL
 */
const uploadToS3 = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Validate AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS S3 credentials not configured in .env file');
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = file.originalname.replace(/\s+/g, '_'); // Use original filename as-is
    const s3Key = `${folder}/${fileName}`;

    // Read file buffer
    const fileBuffer = file.buffer || fs.readFileSync(file.path);

    // Prepare upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Uncomment if you want public access
    };

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    // Execute upload
    const result = await upload.done();

    // Delete local file if it exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Construct file URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    console.log(`✅ File uploaded successfully to S3: ${fileUrl}`);

    return {
      success: true,
      url: fileUrl,
      key: s3Key,
      bucket: process.env.AWS_BUCKET_NAME,
      location: result.Location,
      etag: result.ETag,
      fileName: fileName,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    };

  } catch (error) {
    console.error('❌ S3 Upload Error:', error.message);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3 bucket
 * @param {Array} files - Array of file objects from multer
 * @param {String} folder - Folder path in S3 bucket
 * @returns {Promise<Array>} - Returns array of S3 upload results
 */
const uploadMultipleToS3 = async (files, folder = 'uploads') => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    const uploadPromises = files.map(file => uploadToS3(file, folder));
    const results = await Promise.all(uploadPromises);

    console.log(`✅ ${results.length} files uploaded successfully to S3`);

    return results;

  } catch (error) {
    console.error('❌ Multiple S3 Upload Error:', error.message);
    throw new Error(`Failed to upload multiple files to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3 bucket
 * @param {String} fileKey - S3 object key (file path in bucket)
 * @returns {Promise<Object>} - Returns deletion result
 */
const deleteFromS3 = async (fileKey) => {
  try {
    if (!fileKey) {
      throw new Error('No file key provided for deletion');
    }

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new DeleteObjectCommand(deleteParams);
    const result = await s3Client.send(command);

    console.log(`✅ File deleted successfully from S3: ${fileKey}`);

    return {
      success: true,
      key: fileKey,
      message: 'File deleted successfully'
    };

  } catch (error) {
    console.error('❌ S3 Delete Error:', error.message);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Get signed URL for private S3 objects
 * @param {String} fileKey - S3 object key
 * @param {Number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<String>} - Returns signed URL
 */
const getSignedUrlFromS3 = async (fileKey, expiresIn = 3600) => {
  try {
    if (!fileKey) {
      throw new Error('No file key provided for signed URL');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    console.log(`✅ Signed URL generated for: ${fileKey}`);

    return signedUrl;

  } catch (error) {
    console.error('❌ S3 Signed URL Error:', error.message);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Upload image to S3 (helper function)
 * @param {Object} file - Image file object
 * @returns {Promise<Object>} - Returns upload result
 */
const uploadImageToS3 = async (file) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid image format. Allowed formats: JPEG, JPG, PNG, GIF, WEBP');
  }

  return await uploadToS3(file, 'images');
};

/**
 * Upload PDF to S3 (helper function)
 * @param {Object} file - PDF file object
 * @returns {Promise<Object>} - Returns upload result
 */
const uploadPdfToS3 = async (file) => {
  if (file.mimetype !== 'application/pdf') {
    throw new Error('Invalid file format. Only PDF files are allowed');
  }

  return await uploadToS3(file, 'pdfs');
};

/**
 * Upload certificate to S3 (helper function)
 * @param {Object} file - Certificate file object (PDF or image)
 * @param {String} folder - Optional custom folder path (e.g., 'admission_2026/std_11/DD-MM-YYYY/Emis_No')
 * @returns {Promise<Object>} - Returns upload result
 */
const uploadCertificateToS3 = async (file, folder = 'certificates') => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid certificate format. Allowed formats: PDF, JPEG, JPG, PNG');
  }

  return await uploadToS3(file, folder);
};

module.exports = {
  s3Client,
  uploadToS3,
  uploadMultipleToS3,
  deleteFromS3,
  getSignedUrlFromS3,
  uploadImageToS3,
  uploadPdfToS3,
  uploadCertificateToS3
};
