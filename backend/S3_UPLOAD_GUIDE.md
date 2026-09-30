# AWS S3 File Upload Integration

This document explains how to use the AWS S3 file upload functionality in the Model School Admission backend.

## Configuration

### Environment Variables (.env)

The following environment variables are configured for S3 uploads:

```env
# AWS S3 Configuration for File Uploads
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME=your-bucket-name

# S3 Upload Settings
USE_S3_UPLOAD=true
S3_FOLDER_PREFIX=uploads
```

### Credentials

- **Access Key ID**: `YOUR_AWS_ACCESS_KEY_ID`
- **Secret Access Key**: `YOUR_AWS_SECRET_ACCESS_KEY`
- **Bucket Name**: `your-bucket-name`
- **Region**: `ap-south-1` (Asia Pacific - Mumbai)

## Features

✅ Upload single PDF files to S3  
✅ Upload single image files to S3  
✅ Upload certificates (PDF or images) to S3  
✅ Upload multiple files simultaneously  
✅ Delete files from S3  
✅ Generate signed URLs for private files  
✅ Automatic file type validation  
✅ Support for local storage fallback  

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WEBP (.webp)

### Documents
- PDF (.pdf)

## File Size Limits

- **Images**: 10 MB per file
- **PDFs**: 100 MB per file
- **Certificates**: 10 MB per file

## Usage Examples

### 1. Basic Setup in Controller

```javascript
const { uploadToS3, uploadImageToS3, uploadPdfToS3 } = require('../utils/s3Upload');

// Upload a single file
const result = await uploadToS3(req.file, 'certificates');

// Upload an image
const imageResult = await uploadImageToS3(req.file);

// Upload a PDF
const pdfResult = await uploadPdfToS3(req.file);
```

### 2. Using Multer Middleware

```javascript
const { upload, uploadImage, uploadCertificate } = require('../utils/fileupload');

// For PDF uploads
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  // req.file contains the uploaded file
});

// For image uploads
router.post('/upload-image', uploadImage.single('image'), async (req, res) => {
  // req.file contains the uploaded image
});

// For multiple files
router.post('/upload-multiple', uploadMultiple.array('files', 10), async (req, res) => {
  // req.files contains array of uploaded files
});
```

### 3. Complete Route Example

```javascript
const express = require('express');
const router = express.Router();
const { uploadCertificate } = require('../utils/fileupload');
const { uploadCertificateToS3 } = require('../utils/s3Upload');
const catchAsync = require('../utils/catchAsync');

router.post('/upload-certificate', 
  uploadCertificate.single('certificate'),
  catchAsync(async (req, res) => {
    // Upload to S3
    const result = await uploadCertificateToS3(req.file);
    
    res.status(200).json({
      status: 'success',
      message: 'Certificate uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        size: result.size
      }
    });
  })
);

module.exports = router;
```

### 4. Upload Multiple Files

```javascript
const { uploadMultipleToS3 } = require('../utils/s3Upload');

router.post('/upload-documents',
  uploadMultiple.array('documents', 20),
  catchAsync(async (req, res) => {
    const results = await uploadMultipleToS3(req.files, 'documents');
    
    res.status(200).json({
      status: 'success',
      message: `${results.length} files uploaded successfully`,
      data: results
    });
  })
);
```

### 5. Delete File from S3

```javascript
const { deleteFromS3 } = require('../utils/s3Upload');

router.delete('/delete-file',
  catchAsync(async (req, res) => {
    const { fileKey } = req.body;
    
    const result = await deleteFromS3(fileKey);
    
    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully',
      data: result
    });
  })
);
```

### 6. Generate Signed URL (for private files)

```javascript
const { getSignedUrlFromS3 } = require('../utils/s3Upload');

router.get('/get-file-url/:fileKey',
  catchAsync(async (req, res) => {
    const signedUrl = await getSignedUrlFromS3(
      req.params.fileKey, 
      3600 // URL expires in 1 hour
    );
    
    res.status(200).json({
      status: 'success',
      url: signedUrl
    });
  })
);
```

## API Endpoints (Example Router)

Add this line to your `app.js`:

```javascript
const s3UploadRouter = require('./router/s3UploadRouter');
app.use('/api/upload', s3UploadRouter);
```

Available endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/pdf` | Upload single PDF file |
| POST | `/api/upload/image` | Upload single image file |
| POST | `/api/upload/certificate` | Upload certificate (PDF or image) |
| POST | `/api/upload/multiple` | Upload multiple files |
| DELETE | `/api/upload/delete` | Delete file from S3 |
| GET | `/api/upload/status` | Check S3 configuration status |

## Testing with Postman/cURL

### Upload PDF File

```bash
curl -X POST http://localhost:8000/api/upload/pdf \
  -F "file=@/path/to/document.pdf"
```

### Upload Image

```bash
curl -X POST http://localhost:8000/api/upload/image \
  -F "image=@/path/to/image.jpg"
```

### Upload Multiple Files

```bash
curl -X POST http://localhost:8000/api/upload/multiple \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg" \
  -F "files=@/path/to/file3.png"
```

### Delete File

```bash
curl -X DELETE http://localhost:8000/api/upload/delete \
  -H "Content-Type: application/json" \
  -d '{"fileKey": "uploads/1234567890-filename.pdf"}'
```

## Response Format

### Successful Upload

```json
{
  "status": "success",
  "message": "File uploaded successfully to S3",
  "data": {
    "success": true,
    "url": "https://model-school-admission.s3.ap-south-1.amazonaws.com/uploads/1716988800000-document.pdf",
    "key": "uploads/1716988800000-document.pdf",
    "bucket": "model-school-admission",
    "fileName": "1716988800000-document.pdf",
    "originalName": "document.pdf",
    "mimetype": "application/pdf",
    "size": 152487
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Failed to upload file to S3: Invalid credentials"
}
```

## Folder Structure in S3 Bucket

```
model-school-admission/
├── images/           # Image uploads
├── pdfs/             # PDF document uploads
├── certificates/     # Certificate uploads (PDF or images)
└── uploads/          # General uploads
```

## Security Notes

⚠️ **Important Security Considerations:**

1. The current configuration uses AWS credentials directly in `.env` file
2. Consider using IAM roles if running on EC2/ECS
3. Implement proper access control for file deletion
4. Consider making files private and using signed URLs for access
5. Validate file types and sizes on both client and server side
6. Implement rate limiting for upload endpoints

## Switching Between Local and S3 Storage

To switch between local storage and S3 storage, simply change the `.env` variable:

```env
# Use S3 storage
USE_S3_UPLOAD=true

# Use local storage
USE_S3_UPLOAD=false
```

## Troubleshooting

### Issue: "AWS S3 credentials not configured"
**Solution**: Verify that all AWS environment variables are set in `.env` file

### Issue: "Access Denied"
**Solution**: Check that the AWS credentials have proper S3 permissions

### Issue: "File too large"
**Solution**: Increase the file size limit in `fileupload.js` or compress the file

### Issue: Upload fails silently
**Solution**: Check console logs for detailed error messages

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Multer Documentation](https://github.com/expressjs/multer)
