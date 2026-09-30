const router = require("express").Router();
const multer = require('multer');
const path = require('path');

const {
  getDistrictMasterData,
  districtSendData,
  getDistrictSelectedData,
  updateDistrictData,
  getDashboardStatistics,
  getStudentProcessingReport,
  updateCertificateVerifiedStatus
} = require("../controller/masterOperatonController");
const { modalprotect } = require("../middleware/authMiddleware");

// Check if S3 upload is enabled
const USE_S3 = process.env.USE_S3_UPLOAD === 'true';

// Configure multer for document uploads
// Use memory storage for S3, disk storage for local
const storage = USE_S3 
  ? multer.memoryStorage() 
  : multer.diskStorage({
      destination: function (req, file, cb) {
        // Generate folder path: admission_2026/std_11/DD-MM-YYYY/Emis_No
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        const dateFolder = `${day}-${month}-${year}`;
        const emisNo = req.body.Emis_No || 'unknown';
        const uploadPath = path.join(__dirname, '../uploads/admission_2026/std_11', dateFolder, emisNo);
        
        console.log(`📁 Certificate upload path: ${uploadPath}`);
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        const timestamp = Date.now();
        const fieldName = file.fieldname;
        const ext = path.extname(file.originalname);
        const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, fileName);
      }
    });

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed!'));
    }
  }
});

console.log(`📁 Certificate upload storage: ${USE_S3 ? 'AWS S3' : 'Local Disk'}`);

router.get("/get_district_master_data", modalprotect,getDistrictMasterData);
router.post("/district_send_data", modalprotect,districtSendData);
router.get("/get_district_selected_data", modalprotect,getDistrictSelectedData);
router.get("/dashboard_statistics", modalprotect,getDashboardStatistics);
router.get("/student_processing_report", modalprotect,getStudentProcessingReport);
router.put("/update_district_data", modalprotect,upload.fields([
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'communityCertificate', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'otherCertificate', maxCount: 1 }
]), updateDistrictData);

router.put("/update_certificate_verified_status", modalprotect, updateCertificateVerifiedStatus);


module.exports = router;