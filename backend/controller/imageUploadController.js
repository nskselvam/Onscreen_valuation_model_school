const { Test_Master, Img_Master } = require('../db/models');
const db = require("../db/models");
const jwt = require("jsonwebtoken");
const user = db.User_Details;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const path = require('path');
const { sendEmail } = require('../utils/sendmail')
const { uploadMultipleToS3, deleteFromS3 } = require('../utils/s3Upload');

// Configure multer for memory storage (S3 upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only jpg/jpeg images
  const allowedTypes = /jpeg|jpg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG/JPEG images are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 500 * 1024 // 500KB per file
  }
}).array('images', 25); // Maximum 25 files

// Upload images for a test
exports.uploadTestImages = catchAsync(async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Maximum 25 images allowed', 400));
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size too large (max 500KB per file)', 400));
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(new AppError(err.message, 400));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please select at least one image', 400));
    }

    const { testcode, districtCode } = req.body;

    if (!testcode) {
      return next(new AppError('Test code is required', 400));
    }

    if (!districtCode) {
      return next(new AppError('District code is required', 400));
    }

    // Find test master
    const testMaster = await Test_Master.findOne({
      where: { testcode }
    });

    if (!testMaster) {
      return next(new AppError('Test master not found', 404));
    }

    // Check if test is ready for image upload
    if (testMaster.checkflg !== 'Y') {
      return next(new AppError('Test is not active for image upload', 400));
    }

    // Upload files to S3 bucket in Omr_2026_2027/{testcode}/{testcode}_{D_code} folder with original names
    const normalizedDistCode = districtCode.substring(0, 2);
    const s3Folder = `Omr_2026_2027/${testcode}/${testcode}_${normalizedDistCode}`;
    const uploadResults = await uploadMultipleToS3(req.files, s3Folder);

    // Insert/Update records into imgmaster table (overwrite if exists)
    const imgMasterRecords = [];
    for (const result of uploadResults) {
      // Check if this image path already exists for this district and test
      const existingRecord = await Img_Master.findOne({
        where: {
          D_Code: districtCode.substring(0, 2),
          Test_Code: testcode,
          Img_Path: result.originalName
        }
      });

      if (existingRecord) {
        // Update existing record
        await existingRecord.update({
          updatedAt: new Date()
        });
        imgMasterRecords.push(existingRecord);
      } else {
        // Create new record
        const imgRecord = await Img_Master.create({
          D_Code: districtCode.substring(0, 2),
          Test_Code: testcode,
          Img_Path: result.originalName
        });
        imgMasterRecords.push(imgRecord);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully uploaded ${uploadResults.length} image(s) to S3`,
      data: {
        testcode,
        districtCode,
        uploadCount: uploadResults.length,
        totalRecords: imgMasterRecords.length,
        s3Folder: s3Folder,
        files: uploadResults.map(result => ({
          fileName: result.fileName,
          originalName: result.originalName,
          url: result.url,
          key: result.key,
          size: result.size
        }))
      }
    });
  });
});

// Get uploaded images for a test
exports.getTestImages = catchAsync(async (req, res, next) => {
  const { testcode } = req.params;
  const { districtCode } = req.query;

  console.log(`Fetching images for testcode: ${testcode}, district code: ${districtCode}`);

  const testMaster = await Test_Master.findOne({
    where: { testcode }
  });

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  // Build where clause
  const whereClause = { Test_Code: testcode };
  
  // If districtCode is provided, filter by it
  if (districtCode) {
    whereClause.D_Code = districtCode.substring(0, 2);
  }

  // Get images from imgmaster table
  const images = await Img_Master.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });

  // Construct S3 URLs for each image
  const imagesWithUrls = images.map(img => ({
    id: img.id,
    D_Code: img.D_Code,
    Test_Code: img.Test_Code,
    Img_Path: img.Img_Path,
    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/Omr_2026_2027/${img.Test_Code}/${img.Test_Code}_${img.D_Code}/${img.Img_Path}`,
    s3Key: `Omr_2026_2027/${img.Test_Code}/${img.Test_Code}_${img.D_Code}/${img.Img_Path}`,
    createdAt: img.createdAt
  }));

  res.status(200).json({
    status: 'success',
    data: {
      testcode,
      uploadStatus: testMaster.Img_Upload === 'Y' ? 'Uploaded' : 'Not Uploaded',
      imageCount: images.length,
      images: imagesWithUrls
    }
  });
});

// Delete uploaded image
exports.deleteTestImage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find image record
  const imageRecord = await Img_Master.findByPk(id);

  if (!imageRecord) {
    return next(new AppError('Image record not found', 404));
  }

  // Construct S3 key using testcode and district code
  const s3Key = `Omr_2026_2027/${imageRecord.Test_Code}/${imageRecord.Test_Code}_${imageRecord.D_Code}/${imageRecord.Img_Path}`;

  try {
    // Delete from S3
    await deleteFromS3(s3Key);

    // Delete from database
    await imageRecord.destroy();

    // Check if there are any remaining images for this test
    const remainingImages = await Img_Master.count({
      where: { Test_Code: imageRecord.Test_Code }
    });

    // If no images left, update test master Img_Upload to 'N'
    if (remainingImages === 0) {
      await Test_Master.update(
        { Img_Upload: 'N' },
        { where: { testcode: imageRecord.Test_Code } }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully',
      data: {
        deletedId: id,
        testCode: imageRecord.Test_Code,
        remainingImages: remainingImages
      }
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return next(new AppError('Failed to delete image from S3', 500));
  }
});

// Delete all images for a test and district
exports.deleteAllTestImages = catchAsync(async (req, res, next) => {
  const { testcode, districtCode } = req.body;

  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }

  if (!districtCode) {
    return next(new AppError('District code is required', 400));
  }

  const normalizedDistCode = districtCode.substring(0, 2);

  // Find all image records for this test and district
  const imageRecords = await Img_Master.findAll({
    where: {
      Test_Code: testcode,
      D_Code: normalizedDistCode
    }
  });

  if (imageRecords.length === 0) {
    return next(new AppError('No images found for this test and district', 404));
  }

  try {
    let deletedCount = 0;
    let failedCount = 0;

    // Delete each image from S3 and database
    for (const imageRecord of imageRecords) {
      try {
        const s3Key = `Omr_2026_2027/${imageRecord.Test_Code}/${imageRecord.Test_Code}_${imageRecord.D_Code}/${imageRecord.Img_Path}`;
        await deleteFromS3(s3Key);
        await imageRecord.destroy();
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete image ${imageRecord.Img_Path}:`, error);
        failedCount++;
      }
    }

    // Update the district's position in image_upload_districts to 'N'
    const testMaster = await Test_Master.findOne({
      where: { testcode }
    });

    if (testMaster) {
      const testDistricts = testMaster.test_districts ? testMaster.test_districts.split(',') : [];
      const imageUploadDistricts = testMaster.image_upload_districts ? testMaster.image_upload_districts.split(',') : [];
      
      const districtPosition = testDistricts.findIndex(d => d.trim().substring(0, 2) === normalizedDistCode);
      
      if (districtPosition !== -1 && imageUploadDistricts.length > districtPosition) {
        imageUploadDistricts[districtPosition] = 'N';
        await testMaster.update({
          image_upload_districts: imageUploadDistricts.join(',')
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully deleted ${deletedCount} image(s)${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
      data: {
        testcode,
        districtCode: normalizedDistCode,
        deletedCount,
        failedCount
      }
    });
  } catch (error) {
    console.error('Error deleting images:', error);
    return next(new AppError('Failed to delete images', 500));
  }
});

// Confirm and update image upload status
exports.confirmImageUpload = catchAsync(async (req, res, next) => {
  const { testcode, expectedCount, districtCode } = req.body;

  console.log(req.body)


   let token;
   let decoded;

  // Check for token in cookies first, then query params (for file downloads)
  token = req.cookies.jwt || req.query.token;

  console.log(token)


  if(token){

    try {

 decoded = jwt.verify(token, process.env.JWT_SECRET);

      
    } catch (error) {

      return next(new AppError('Some Went Wrong',400))
      
    }
  }

 


  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }

  if (!expectedCount || expectedCount <= 0) {
    return next(new AppError('Expected image count is required', 400));
  }

  if (!districtCode) {
    return next(new AppError('District code is required', 400));
  }

  // Find test master
  const testMaster = await Test_Master.findOne({
    where: { testcode }
  });

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  // Count uploaded images for this test and district
  const uploadedCount = await Img_Master.count({
    where: { 
      Test_Code: testcode,
      D_Code: districtCode.substring(0, 2)
    }
  });

  // Check if uploaded count matches expected count
  if (uploadedCount !== parseInt(expectedCount)) {
    return res.status(400).json({
      status: 'error',
      message: `Image count mismatch. Expected: ${expectedCount}, Uploaded: ${uploadedCount}`,
      data: {
        expectedCount: parseInt(expectedCount),
        uploadedCount: uploadedCount,
        difference: uploadedCount - parseInt(expectedCount)
      }
    });
  }

  // Get test_districts and image_upload_districts
  const testDistricts = testMaster.test_districts ? testMaster.test_districts.split(',') : [];
  const imageUploadDistricts = testMaster.image_upload_districts ? testMaster.image_upload_districts.split(',') : [];

  // Normalize district code to 2 characters for comparison
  const normalizedDistCode = districtCode.substring(0, 2).trim();

  // Find the position of the district code in test_districts (compare first 2 chars)
  const districtPosition = testDistricts.findIndex(d => d.trim().substring(0, 2) === normalizedDistCode);

  if (districtPosition === -1) {
    return res.status(400).json({
      status: 'error',
      message: `District code '${districtCode}' not found in test districts`,
      data: {
        providedDistrictCode: districtCode,
        testDistricts: testDistricts.join(','),
        hint: 'Make sure this district is assigned to the test'
      }
    });
  }

  // Update the corresponding position in image_upload_districts to 'Y'
  if (imageUploadDistricts.length > districtPosition) {
    imageUploadDistricts[districtPosition] = 'Y';
  }

  const body = `The images have been uploaded successfully for Test Code: ${testcode}
A total of  ${uploadedCount} images have been uploaded.`;

  await sendEmail(decoded.Email_Id, `Image Upload for Test Code ${testcode}`, body);

  //return

  // Update test master with new image_upload_districts
  await testMaster.update({
    image_upload_districts: imageUploadDistricts.join(',')
  });

  res.status(200).json({
    status: 'success',
    message: `Image upload confirmed for district ${districtCode}. Status updated in image_upload_districts`,
    data: {
      testcode,
      districtCode,
      uploadedCount,
      image_upload_districts: imageUploadDistricts.join(',')
    }
  });
});

// Get image counts by district for a test code
exports.getImageCountsByDistrict = catchAsync(async (req, res, next) => {
  const { testcode } = req.params;

  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }

  // Get the test master to get districts
  const testMaster = await Test_Master.findOne({
    where: { testcode }
  });

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  // Get all districts for this test
  const testDistricts = testMaster.test_districts ? testMaster.test_districts.split(',').map(d => d.trim().substring(0, 2)) : [];

  // Get image counts for each district
  const districtCounts = await Promise.all(
    testDistricts.map(async (distCode) => {
      const count = await Img_Master.count({
        where: {
          Test_Code: testcode,
          D_Code: distCode
        }
      });
      return {
        districtCode: distCode,
        count: count
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      testcode,
      districtCounts
    }
  });
});
