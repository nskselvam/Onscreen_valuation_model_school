# Master Data District - S3 Upload Integration Guide

## Overview

The Master_Data_District component now supports uploading student certificates (Birth Certificate, Community Certificate, Aadhar Card, and Other Certificates) directly to AWS S3 bucket.

## 📁 Files Modified

### Backend Files
1. **`backend/controller/masterOperatonController.js`**
   - Added S3 upload functionality using `uploadCertificateToS3`
   - Removed the blocking `return` statement
   - Stores both S3 URL and S3 key in database

2. **`backend/router/masterDataOperationRouter.js`**
   - Updated to use memory storage for S3 uploads
   - Maintains backward compatibility with local storage

3. **`backend/db/migrations/20260519000000-add-s3-keys-to-master-11.js`**
   - Added S3 key columns for tracking uploaded files

### Frontend Files
- **`frontend/src/pages/Dashboard/Master_Dashboard/Master_Data_District.jsx`**
  - No changes required - already implements proper file upload

## 🗄️ Database Schema

New columns added to `master_11` table:

| Column Name | Type | Description |
|------------|------|-------------|
| `birth_certificate_path` | STRING(500) | S3 URL for birth certificate |
| `birth_certificate_key` | STRING(500) | S3 object key for birth certificate |
| `community_certificate_path` | STRING(500) | S3 URL for community certificate |
| `community_certificate_key` | STRING(500) | S3 object key for community certificate |
| `aadhar_card_path` | STRING(500) | S3 URL for aadhar card |
| `aadhar_card_key` | STRING(500) | S3 object key for aadhar card |
| `other_certificate_path` | STRING(500) | S3 URL for other certificate |
| `other_certificate_key` | STRING(500) | S3 object key for other certificate |

## 🚀 How It Works

### Upload Flow

1. **User Action**: User clicks "Edit" button on a student record
2. **Modal Opens**: Edit modal displays with file upload fields
3. **File Selection**: User selects files for upload (PDF, JPG, PNG)
4. **Form Submission**: Files are sent as `multipart/form-data`
5. **Backend Processing**:
   - Multer receives files in memory (buffer)
   - Each file is uploaded to S3 using `uploadCertificateToS3`
   - S3 returns URL and key for each file
   - Database is updated with S3 URLs and keys
6. **Response**: Success message with uploaded document URLs

### API Endpoint

**Endpoint**: `PUT /api/master/update_district_data`

**Request Type**: `multipart/form-data`

**Form Fields**:
```javascript
{
  // Student data fields
  Emis_No: "12345",
  udise_code: "67890",
  name: "Student Name",
  father_name: "Father Name",
  com: 1,
  sex: 1,
  pstm: 2,
  ph: 0,
  candidate_option: 1,
  // ... other fields
  
  // File uploads
  birthCertificate: File,
  communityCertificate: File,
  aadharCard: File,
  otherCertificate: File
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Record and documents updated successfully",
  "updatedRows": 1,
  "uploadedDocuments": {
    "birthCertificate": "https://model-school-admission.s3.ap-south-1.amazonaws.com/certificates/1234567890-birth.pdf",
    "communityCertificate": "https://model-school-admission.s3.ap-south-1.amazonaws.com/certificates/1234567890-community.pdf",
    "aadharCard": "https://model-school-admission.s3.ap-south-1.amazonaws.com/certificates/1234567890-aadhar.pdf",
    "otherCertificate": "https://model-school-admission.s3.ap-south-1.amazonaws.com/certificates/1234567890-other.pdf"
  }
}
```

## 📝 File Requirements

### Accepted File Types
- **PDF**: `.pdf`
- **Images**: `.jpg`, `.jpeg`, `.png`

### File Size Limits
- **Maximum size per file**: 5 MB
- **Total files**: Up to 4 files per submission

### File Naming Convention
Files are uploaded to S3 with the following format:
```
certificates/[timestamp]-[original-filename]
```

Example:
```
certificates/1716988800000-birth_certificate.pdf
```

## 🔧 Configuration

### Environment Variables

Ensure these are set in `.env`:

```env
# S3 Upload Settings
USE_S3_UPLOAD=true
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME=your-bucket-name
S3_FOLDER_PREFIX=uploads
```

### Toggle S3 Upload

To switch between S3 and local storage:

```env
# Use S3 storage
USE_S3_UPLOAD=true

# Use local disk storage
USE_S3_UPLOAD=false
```

## 🧪 Testing the Upload

### Using the Frontend

1. Navigate to Master Data District page
2. Click "Edit" on any student record
3. Scroll to "Upload Documents" section
4. Select files for each certificate type
5. Click "Update Record"
6. Check console for upload confirmation

### Using Postman

```bash
PUT http://localhost:8000/api/master/update_district_data

Headers:
Content-Type: multipart/form-data
Authorization: Bearer <your-token>

Body (form-data):
- Emis_No: 12345
- udise_code: 67890
- name: Test Student
- birthCertificate: [file]
- communityCertificate: [file]
- aadharCard: [file]
- otherCertificate: [file]
```

### Using cURL

```bash
curl -X PUT http://localhost:8000/api/master/update_district_data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "Emis_No=12345" \
  -F "udise_code=67890" \
  -F "name=Test Student" \
  -F "birthCertificate=@/path/to/birth.pdf" \
  -F "communityCertificate=@/path/to/community.pdf" \
  -F "aadharCard=@/path/to/aadhar.pdf" \
  -F "otherCertificate=@/path/to/other.pdf"
```

## 🎯 Frontend Implementation Details

### File Upload State
```javascript
const [uploadedFiles, setUploadedFiles] = useState({
    birthCertificate: null,
    communityCertificate: null,
    aadharCard: null,
    otherCertificate: null
});
```

### File Change Handler
```javascript
const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
        setUploadedFiles(prev => ({
            ...prev,
            [name]: files[0]
        }));
    }
};
```

### Form Submission
```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Append text fields
    Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
    });
    
    // Append files
    if (uploadedFiles.birthCertificate) {
        formDataToSend.append('birthCertificate', uploadedFiles.birthCertificate);
    }
    // ... other files
    
    const response = await updateDistrictData(formDataToSend).unwrap();
};
```

## 🔍 Backend Code Details

### S3 Upload Function
```javascript
const { uploadCertificateToS3 } = require("../utils/s3Upload");

// Upload Birth Certificate
if (files.birthCertificate && files.birthCertificate[0]) {
    const s3Result = await uploadCertificateToS3(files.birthCertificate[0]);
    updateData.birth_certificate_path = s3Result.url;
    updateData.birth_certificate_key = s3Result.key;
    console.log("✅ Birth Certificate uploaded to S3:", s3Result.url);
}
```

### Database Update
```javascript
const [updatedRows] = await db.Master_11.update(
    updateData,
    {
        where: {
            Emis_No: Emis_No,
            udise_code: udise_code
        }
    }
);
```

## 🛡️ Security Features

1. **File Type Validation**: Only PDF and image files allowed
2. **File Size Limits**: Maximum 5MB per file
3. **AWS Credentials**: Securely stored in environment variables
4. **S3 Bucket Access**: Controlled by IAM policies
5. **HTTPS**: All S3 URLs use secure HTTPS protocol

## 📊 S3 Bucket Structure

```
model-school-admission/
└── certificates/
    ├── 1716988800000-birth_certificate.pdf
    ├── 1716988800001-community_certificate.pdf
    ├── 1716988800002-aadhar_card.jpg
    └── 1716988800003-disability_certificate.pdf
```

## 🐛 Troubleshooting

### Issue: Files not uploading
**Solution**: 
- Check if `USE_S3_UPLOAD=true` in `.env`
- Verify AWS credentials are correct
- Check S3 bucket permissions

### Issue: "AWS S3 credentials not configured"
**Solution**: 
- Ensure all AWS environment variables are set
- Restart the backend server after changing `.env`

### Issue: Upload succeeds but database not updated
**Solution**: 
- Check if `Emis_No` and `udise_code` are correct
- Verify the record exists in the database
- Check database migration was run successfully

### Issue: File size error
**Solution**: 
- Ensure files are under 5MB
- Compress large PDFs or images before upload

## 📈 Monitoring & Logs

### Console Logs
The backend logs detailed information about each upload:

```
Updating record: { Emis_No: '12345', udise_code: '67890' }
Uploaded files: { birthCertificate: [...], ... }
✅ Birth Certificate uploaded to S3: https://...
✅ Community Certificate uploaded to S3: https://...
✅ Aadhar Card uploaded to S3: https://...
✅ Other Certificate uploaded to S3: https://...
```

### Error Logs
```
❌ Error updating record: [error details]
```

## 🔄 Rollback Instructions

If you need to revert to local storage:

1. Set in `.env`:
   ```env
   USE_S3_UPLOAD=false
   ```

2. Restart backend server:
   ```bash
   cd backend
   npm start
   ```

3. (Optional) Rollback database migration:
   ```bash
   cd backend/db
   npx sequelize-cli db:migrate:undo
   ```

## ✅ Verification Checklist

- [ ] AWS S3 credentials configured in `.env`
- [ ] Database migration completed successfully
- [ ] Backend server starts without errors
- [ ] S3 upload logs appear in console
- [ ] Files upload successfully through frontend
- [ ] Database records updated with S3 URLs
- [ ] Uploaded files accessible via S3 URLs

## 📞 Support

For issues or questions:
- Check [S3_UPLOAD_GUIDE.md](S3_UPLOAD_GUIDE.md) for general S3 configuration
- Review console logs for error messages
- Verify AWS S3 bucket permissions in AWS Console
