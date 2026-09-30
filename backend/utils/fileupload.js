const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if S3 upload is enabled
const USE_S3 = process.env.USE_S3_UPLOAD === 'true';

// Storage configuration - Use memory storage for S3, disk storage for local
const storage = USE_S3 
  ? multer.memoryStorage() // Store in memory for S3 upload
  : multer.diskStorage({
      destination: function (req, file, cb) {
        // Store in temp folder - will be moved in controller
        const tempPath = path.join(__dirname, '../uploads/templates/temp');
        
        if (!fs.existsSync(tempPath)) {
          fs.mkdirSync(tempPath, { recursive: true });
        }
        
        cb(null, tempPath);
      },
      filename: function (req, file, cb) {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '_');
        const finalFileName = originalName.toUpperCase();
        
        cb(null, finalFileName);
      }
    });

// Multer upload configuration for PDF files
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 100                    // max 100 files per request
  },
  fileFilter: function (req, file, cb) {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Multer configuration for images (JPEG, PNG, GIF, WEBP)
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
    files: 50                    // max 50 images per request
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed!'), false);
    }
  }
});

// Multer configuration for certificates (PDF and images)
const uploadCertificate = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per certificate
    files: 20                    // max 20 certificates per request
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, PNG) are allowed for certificates!'), false);
    }
  }
});

// Multer configuration for general files (PDF + Images)
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 100                    // max 100 files per request
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'), false);
    }
  }
});

module.exports = upload;
module.exports.upload = upload;
module.exports.uploadImage = uploadImage;
module.exports.uploadCertificate = uploadCertificate;
module.exports.uploadMultiple = uploadMultiple;
module.exports.USE_S3 = USE_S3;