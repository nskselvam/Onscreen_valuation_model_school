const express = require("express");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const db = require("../db/models");
const { Sequelize, Op, NOW } = require("sequelize");
const valid_sections = db.valid_sections;
const valid_question = db.valid_question;
const redisClient = require("../config/redis");
const AppError = require("../utils/appError");
const {
  getCurrentISTDateTime,
  getClientIP,
  calculateTimeDifference,
  parseISTDateTime,
} = require("../utils/formatDateTime");
const { get } = require("http");
const { exit } = require("process");
const redis = require("../config/redis");

const getAssignedSubcodes = (user) => String(user?.examiner_subcode || '')
  .split(',')
  .map((code) => code.trim())
  .filter(Boolean);

const assertExaminerSubcodeAccess = (req, subcode) => {
  const role = String(req.user?.Role || req.user?.role || '');
  if (role !== '11') return;

  const assignedSubcodes = getAssignedSubcodes(req.user);
  if (assignedSubcodes.length === 0 || !assignedSubcodes.includes(String(subcode))) {
    throw new AppError('This examiner is not assigned to the requested subcode', 403);
  }
};

const resolveSubcodeTestcode = async (subcode, requestedTestcode) => {
  const subjects = await db.sub_master.findAll({
    where: { Subcode: String(subcode || '') },
    attributes: ['testcode'],
    raw: true,
  });
  const testcodes = [...new Set(subjects.map((subject) => String(subject.testcode || '').trim()).filter(Boolean))];
  const requested = String(requestedTestcode || '').trim();
  if (requested) return testcodes.includes(requested) ? requested : null;
  return testcodes.length === 1 ? testcodes[0] : null;
};


const subcode_Fetech = asyncHandler(async (req, res) => {
  const { subcode, testcode } = req.query;
  assertExaminerSubcodeAccess(req, subcode);
  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject', 400);
  }
  const subcodeData = await valid_sections.findAll({
    where: { sub_code: subcode, testcode: resolvedTestcode },
    attributes: {
      include: [
        [Sequelize.literal("''"), "Mark"],
        [Sequelize.literal("''"), "barcode"],
        [Sequelize.literal("''"), "eva_id"],
        [Sequelize.literal("''"), "valuation_type"],
        [Sequelize.literal("''"), "Examiner_type"],
        [Sequelize.literal("''"), "Dep_Name"],
        [Sequelize.literal("''"), "page_no"],
        [Sequelize.literal("''"), "Qbs_Page_No"],
        // Add empty string as dummy column
      ],
    },
    order: [
      ["section", "ASC"],
      ["qstn_num", "ASC"],
      ["sub_section", "ASC"],
      ["add_sub_section", "ASC"],
    ],
  });

  if (!subcodeData || subcodeData.length === 0) {
    res.status(404);
    throw new AppError("Subject  not found", 404);
  }

  const validQuestionData = await valid_question.findAll({
    where: { SUBCODE: subcode, testcode: resolvedTestcode },
    order: [
      ["SECTION", "ASC"],
      ["FROM_QST", "ASC"],
      ["SUB_SEC", "ASC"],
    ],
  });


  if (!validQuestionData || validQuestionData.length === 0) {
    res.status(404);
    throw new AppError("Questions not found", 404);
  }

  res
    .status(200)
    .json({ Valid_Section: subcodeData, Valid_Question: validQuestionData });
});

const valuation_Barcode_Fetch = asyncHandler(async (req, res) => {
  let BarcodeStatus = false;

  const {
    subcode,
    testcode,
    valuation_type,
    Eva_Id,
    Eva_Mon_Year,
    Camp_id,
    camp_offcer_id_examiner,
    Examiner_type,
    Max_Papers,
    Sub_Max_Papers,
    Dep_Name
  } = req.query;

  assertExaminerSubcodeAccess(req, subcode);
  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject', 400);
  }




  if (
    !subcode ||
    !valuation_type ||
    !Eva_Id ||
    !Eva_Mon_Year ||
    !Examiner_type ||
    !Camp_id ||
    !camp_offcer_id_examiner ||
    !Max_Papers ||
    !Sub_Max_Papers ||
    (Examiner_type != 2 && Examiner_type != 11)
  ) {
    res.status(201);
    throw new AppError("Missing required query parameters", 201);
  }

  const flname = `import${valuation_type}`;
  const model = db[flname];

  // Combined query to get both total and subject-specific counts
  // const countResults = await db.sequelize.query(
  //   `SELECT 
  //     COUNT(*) as total_count,
  //     COUNT(CASE WHEN "subcode" = :subcode THEN 1 END) as subject_count
  //   FROM "${flname}"
  //   WHERE "Evaluator_Id" = :Eva_Id
  //     AND "Eva_Mon_Year" = :Eva_Mon_Year
  //     AND "E_flg" = 'Y'
  //     AND "Checked" = 'Yes'
  //     AND SUBSTRING("checkdate", 1, 10) = :currentDate`,
  //   {
  //     replacements: {
  //       Eva_Id: Eva_Id,
  //       subcode: subcode,
  //       Eva_Mon_Year: Eva_Mon_Year,
  //       currentDate: getCurrentISTDateTime().substring(0, 10)
  //     },
  //     type: db.sequelize.QueryTypes.SELECT
  //   }
  // );

    const countResults = await db.sequelize.query(
    `SELECT 
      (SELECT COUNT(*) 
       FROM "${flname}"
       WHERE "Evaluator_Id" = :Eva_Id
         AND "Eva_Mon_Year" = :Eva_Mon_Year
         AND "E_flg" = 'Y'
         AND "Checked" = 'Yes'
         AND SUBSTRING("checkdate", 1, 10) = :currentDate) as total_count,
      (SELECT COUNT(*) 
       FROM "${flname}"
       WHERE "Evaluator_Id" = :Eva_Id
         AND "Eva_Mon_Year" = :Eva_Mon_Year
         AND "subcode" = :subcode
         ${flname === 'import1' ? 'AND "testcode" = :testcode' : ''}
         AND "E_flg" = 'Y'
         AND "Checked" = 'Yes') as subject_count`,
    {
      replacements: {
        Eva_Id: Eva_Id,
        subcode: subcode,
        testcode: resolvedTestcode,
        Eva_Mon_Year: Eva_Mon_Year,
        currentDate: getCurrentISTDateTime().substring(0, 10)
      },
      type: db.sequelize.QueryTypes.SELECT
    }
  );

  const barcodeCount = parseInt(countResults[0].total_count);
  const Subject_Max_BarcodeCount = parseInt(countResults[0].subject_count);

  console.log(barcodeCount, Subject_Max_BarcodeCount, "Counts for today");

  let ValuationSessionTime;
  let ValuationSession;
  let Max_Papers_Count = (parseInt(Max_Papers) / 2) - parseInt(barcodeCount);
  if (parseInt(Max_Papers_Count) <= 0) {

    const Degree_Master = await db.master_data.findOne({
      where: { D_Code: Dep_Name }
    });


    ValuationSession = Degree_Master ? Degree_Master.Time_Flg : null;
    ValuationSessionTime = Degree_Master ? Degree_Master.Paper_Time : null;
  }


  if (ValuationSession == "Y") {
    const currentDateTime = getCurrentISTDateTime();
    const currentTime = currentDateTime ? currentDateTime.split(" ")[1] : null;

    // Convert time strings to minutes for proper comparison
    const timeToMinutes = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') {
        return NaN;
      }

      let normalizedTime = timeStr.trim().toLowerCase();

      // Check for am/pm
      const isPM = normalizedTime.includes('pm');
      const isAM = normalizedTime.includes('am');

      // Remove am/pm and trim
      normalizedTime = normalizedTime.replace(/am|pm/g, '').trim();

      // Replace dot with colon (e.g., "3.30" -> "3:30")
      normalizedTime = normalizedTime.replace(/\./g, ':');

      // Split by colon
      const parts = normalizedTime.split(':');
      if (parts.length < 2) {
        return NaN;
      }

      let hours = parseInt(parts[0], 10);
      let minutes = parseInt(parts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) {
        return NaN;
      }

      // Convert to 24-hour format if needed
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }

      const totalMinutes = hours * 60 + minutes;
      return totalMinutes;
    };

    const currentMinutes = timeToMinutes(currentTime);
    const sessionMinutes = timeToMinutes(ValuationSessionTime);


    if (
      !isNaN(currentMinutes) &&
      !isNaN(sessionMinutes) &&
      currentMinutes <= sessionMinutes &&
      barcodeCount <= Math.round(parseInt(Max_Papers) / 2)
    ) {
      res.status(201);
      throw new AppError(
        "You are not allowed to take more papers in this session",
        201
      );
    }
  }

  const barcodeWhere = {
      subcode: subcode,
      Checked: "NO",
      ...(flname === 'import1' ? { testcode: resolvedTestcode } : {}),
      [Op.or]: [
        { Evaluator_Id: Eva_Id, E_flg: "A" },
        // Only image-verified papers (E_flg "N") are eligible; unchecked ("I") or unset records must not reach valuation.
        { E_flg: "N" }
      ],
  };
  const barcodeData = await model.findOne({
    where: barcodeWhere,
    order: [
      Sequelize.literal(
        `CASE WHEN "Evaluator_Id" = '${Eva_Id}' THEN 0 ELSE 1 END`
      ),
      Sequelize.literal("RANDOM()"),
    ],
  });

  if (!barcodeData) {
    return res.status(200).json({
      data: null,
      BarcodeStatus: false,
      message: "No papers are currently available for this subject and test code",
    });
  }

  // Read barcode from the first page image
  const uploadsRoot = path.resolve(__dirname, "..", "uploads");
  const imagePath = path.resolve(
    uploadsRoot,
    barcodeData.Eva_Mon_Year,
    "ImgImp",
    barcodeData.Dep_Name,
    barcodeData.batchname,
    `${barcodeData.batchname}_01_${barcodeData.subcode}.jpg`
  );

  console.log('[Barcode Fetch] Image path for barcode:', imagePath);

  let barcodeReadSuccess = false;
  let scannedBarcodeValue = null;

  if (fs.existsSync(imagePath)) {
    try {
      // Read image and convert to raw RGBA pixel data using sharp
      const { data, info } = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const imageData = {
        data: new Uint8ClampedArray(data.buffer),
        width: info.width,
        height: info.height,
      };

      // Dynamically import zbar-wasm (ESM module) and scan for barcodes
      const { scanImageData } = await import('@undecaf/zbar-wasm');
      const symbols = await scanImageData(imageData);

      if (symbols && symbols.length > 0) {
        barcodeReadSuccess = true;
        scannedBarcodeValue = symbols[0].decode();
        console.log('[Barcode Fetch] Barcode read successfully:', scannedBarcodeValue);
      } else {
        console.log('[Barcode Fetch] No barcode detected in image');
      }
    } catch (err) {
      console.error('[Barcode Fetch] Error reading barcode from image:', err.message);
    }
  } else {
    console.log('[Barcode Fetch] Image file not found:', imagePath);
  }

  if (barcodeReadSuccess && scannedBarcodeValue !== barcodeData.barcode) {
      barcodeReadSuccess = false;
      console.log(`[Barcode Fetch] Barcode mismatch: scanned "${scannedBarcodeValue}" vs expected "${barcodeData.barcode}"`);
  }

  //return
  // If barcode is not readable, update reject_flg to 'Y'
  // if (!barcodeReadSuccess) {
  //   barcodeData.reject_flg = 'Y';
  //   await barcodeData.save();

  //   res.status(201);
  //   throw new AppError("Barcode not readable from image, paper rejected", 201);
  // }

  // Barcode read successfully — assign paper to evaluator
  BarcodeStatus = true;
  barcodeData.E_flg = "A";
  barcodeData.Evaluator_Id = Eva_Id;
  barcodeData.A_date = getCurrentISTDateTime();
  barcodeData.Camp_id = Camp_id;
  barcodeData.reject_flg = barcodeReadSuccess ? 'N' : 'Y'; // Set reject flag based on barcode read success
  barcodeData.camp_offcer_id_examiner = camp_offcer_id_examiner;
  await barcodeData.save();

  res.status(200).json({
    data: barcodeData,
    BarcodeStatus: BarcodeStatus,
    scannedBarcode: scannedBarcodeValue,
  });
  //   const { subcode } = req.query;
  //   const subcodeData = await valid_sections.findAll({
  //     where: { sub_code: subcode },
  //   });
  //   if (!subcodeData || subcodeData.length === 0) {
  //     res.status(404);
  //     throw new AppError("Subject  not found", 404);
  //   }
  //   res.status(200).json({ data: subcodeData });
});

const valuation_Image_Fetch = asyncHandler(async (req, res) => {

  const { batchname, subcode, testcode, Dep_Name, Eva_Mon_Year, Img_Number } = req.query;

  // Ensure all params are present
  if (!batchname || !subcode || !Dep_Name || !Eva_Mon_Year || !Img_Number) {
    res.status(400);
    throw new AppError("Missing required parameters", 400);
  }

  // Whitelist: only safe alphanumeric characters — prevents path traversal
  const safePattern = /^[a-zA-Z0-9_\-]+$/;
  const monthYearPattern = /^[a-zA-Z]{3}_\d{4}$/;
  if (
    !safePattern.test(batchname) ||
    !safePattern.test(subcode) ||
    !safePattern.test(Dep_Name) ||
    !monthYearPattern.test(Eva_Mon_Year)
  ) {
    res.status(400);
    throw new AppError("Invalid parameter format", 400);
  }

  const imgNum = parseInt(Img_Number, 10);
  if (isNaN(imgNum) || imgNum <= 0 || imgNum > 999) {
    res.status(400);
    throw new AppError("Invalid image number", 400);
  }

  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject image', 400);
  }

  const padNum = imgNum.toString().padStart(2, "0");
  const uploadsRoot = path.resolve(__dirname, "..", "uploads");
  const monYear = Eva_Mon_Year;

  const origin = req.headers.origin;
  const corsHeaders = origin ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true"
  } : {};

  // 1. Check local filesystem for exact batch folder
  const batchDir = path.resolve(uploadsRoot, monYear, "ImgImp", Dep_Name, batchname);

  let targetFile = null;
  if (fs.existsSync(batchDir) && batchDir.startsWith(uploadsRoot + path.sep)) {
    const allFiles = fs.readdirSync(batchDir)
      .filter((file) => {
        if (file.startsWith('.') || !/\.(jpg|jpeg|png)$/i.test(file)) return false;
        const filename = path.basename(file, path.extname(file));
        const subjectSuffix = String(subcode).match(/_(\d{2})$/)?.[1] || '';
        return !subjectSuffix || filename.includes(`${resolvedTestcode}${subjectSuffix}`);
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (allFiles.length > 0) {
      targetFile = allFiles.find(f => {
        const nameWithoutExt = path.basename(f, path.extname(f));
        const parts = nameWithoutExt.split('_');
        return parts.includes(padNum) || parts.includes(imgNum.toString());
      }) || allFiles[imgNum - 1];
    }
  }

  if (targetFile) {
    const imagePath = path.join(batchDir, targetFile);
    if (imagePath.startsWith(uploadsRoot + path.sep) && fs.existsSync(imagePath)) {
      res.status(200);
      res.set({
        ...corsHeaders,
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes"
      });
      return res.sendFile(imagePath);
    }
  }

  // 2. S3 Stream Fallback: Stream directly from S3 if local file doesn't exist
  if (process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
    try {
      const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      });

      const prefixesToSearch = [
        `Move_AnswerSheet_Uploaded/${resolvedTestcode}/`,
        `AnswerSheet_Uploaded/${resolvedTestcode}/`,
      ];
      const legacySubcode = String(subcode).replace(/[JN](?:11|12)(?=_)/, '');
      const subjectFolders = [...new Set([subcode, legacySubcode])];

      let s3MatchKey = null;

      for (const prefix of prefixesToSearch) {
        let continuationToken;
        const matchingKeys = [];

        do {
          const listCmd = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          });
          const s3List = await s3.send(listCmd);
          if (s3List.Contents) {
            for (const item of s3List.Contents) {
              const key = item.Key;
              if (/\.(jpg|jpeg|png)$/i.test(key)) {
                const lowerKey = key.toLowerCase();
                const belongsToSubjectBatch = subjectFolders.some((folder) =>
                  lowerKey.includes(`/${folder.toLowerCase()}/${String(batchname).toLowerCase()}/`)
                );
                if (belongsToSubjectBatch) {
                  matchingKeys.push(key);
                }
              }
            }
          }
          continuationToken = s3List.IsTruncated ? s3List.NextContinuationToken : undefined;
        } while (continuationToken && matchingKeys.length === 0);

        if (matchingKeys.length > 0) {
          matchingKeys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
          s3MatchKey = matchingKeys.find(k => {
            const nameWithoutExt = path.basename(k, path.extname(k));
            const parts = nameWithoutExt.split('_');
            return parts.includes(padNum) || parts.includes(imgNum.toString());
          }) || matchingKeys[imgNum - 1];

          if (s3MatchKey) break;
        }
      }

      if (s3MatchKey) {
        console.log('[Image Fetch] Streaming directly from S3 Key:', s3MatchKey);
        const getCmd = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3MatchKey
        });
        const s3Stream = await s3.send(getCmd);
        res.status(200);
        res.set({
          ...corsHeaders,
          "Content-Type": s3Stream.ContentType || "image/jpeg",
          "Cache-Control": "public, max-age=86400, must-revalidate",
          "X-Content-Type-Options": "nosniff",
          "Accept-Ranges": "bytes"
        });
        return s3Stream.Body.pipe(res);
      }
    } catch (s3Err) {
      console.error('[Image Fetch S3 Error]:', s3Err.message);
    }
  }

  console.log('[Image Fetch] File NOT found locally or in S3 for batch:', batchname, 'page:', imgNum);
  res.status(404);
  throw new AppError("Image not found", 404);
});

const valuation_Data_Update = asyncHandler(async (req, res) => {
  const {
    barcode,
    subcode,
    testcode,
    Eva_Id,
    sec_id,
    page_no,
    Qbs_Page_No,
    Dep_Name,
    Marks_Get,
    section,
    sub_section,
    add_sub_section,
    max_marks,
    checkdate,
    qbno,
    Eva_Mon_Year,
    valuation_type,
    Examiner_type,
    BL_Point,
    CO_Point,
    PO_Point,
  } = req.body;

  assertExaminerSubcodeAccess(req, subcode);
  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject', 400);
  }
  console.log('[Valuation Update] Evaluator:', Eva_Id, 'Barcode:', barcode, 'Subcode:', subcode, 'qbno:', qbno, 'Marks_Get:', Marks_Get, 'Dep_Name:', Dep_Name);

  const padDep = String(Dep_Name || '01').padStart(2, '0');
  const flname = db[`val_data_${padDep}`] ? `val_data_${padDep}` : `val_data_01`;

  let val_data = await db[flname].findOne({
    where: {
      barcode: String(barcode),
      subcode: String(subcode),
      testcode: resolvedTestcode,
      sec_id: sec_id,
      eva_id: String(Eva_Id),
      section: String(section),
      qbno: String(qbno),
      valuation_type: String(valuation_type || '1'),
      Examiner_type: String(Examiner_type || '2'),
      Dep_Name: String(Dep_Name),
    },
  });
  const subjectMaster = await db.sub_master.findOne({
    where: { Subcode: String(subcode), testcode: resolvedTestcode },
    attributes: ['testcode'],
  });
  const resolvedTestcodeForSave = subjectMaster?.testcode || val_data?.testcode || resolvedTestcode;

  if (!val_data) {
    val_data = await db[flname].create({
      barcode: String(barcode),
      subcode: String(subcode),
      testcode: resolvedTestcodeForSave,
      sec_id: sec_id,
      eva_id: String(Eva_Id),
      page_no: page_no,
      Qbs_Page_No: Qbs_Page_No,
      section: String(section),
      sub_section: sub_section || '',
      add_sub_section: add_sub_section || '',
      max_marks: String(max_marks),
      Marks_Get: String(Marks_Get),
      checkdate: getCurrentISTDateTime(),
      qbno: String(qbno),
      valuation_type: String(valuation_type || '1'),
      Examiner_type: String(Examiner_type || '2'),
      Dep_Name: String(Dep_Name),
      Eva_Mon_Year: Eva_Mon_Year || 'Aug_2026',
      BL_Point: BL_Point,
      CO_Point: CO_Point,
      PO_Point: PO_Point,
    });
  } else {
    val_data.testcode = resolvedTestcodeForSave;
    val_data.Marks_Get = String(Marks_Get);
    val_data.page_no = page_no;
    val_data.Qbs_Page_No = Qbs_Page_No;
    val_data.section = String(section);
    val_data.sub_section = sub_section || '';
    val_data.add_sub_section = add_sub_section || '';
    val_data.max_marks = String(max_marks);
    val_data.checkdate = getCurrentISTDateTime();
    val_data.qbno = String(qbno);
    await val_data.save();
  }

  res.status(200).json({
    message: "Data updated successfully",
    data: val_data
  });
});

const valuation_Finalize = asyncHandler(async (req, res) => {
  const {
    barcode,
    subcode,
    testcode,
    Eva_Id,
    Dep_Name,
    valuation_type,
    Eva_Mon_Year,
    Examiner_type,
    Final_Marks_Front,
    Regular_Questions,
    AB_Questions,
    Chief_Eva_Id,
    Total_Rounded_Marks_Front,
    Evaluator_Id,
    frontendFilledCount,
    validSectionsPayload,
  } = req.body;

  assertExaminerSubcodeAccess(req, subcode);
  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject', 400);
  }
  console.log(`[Finalize Request] Received for subcode=${subcode}, barcode=${barcode}, Eva_Id=${Eva_Id}, valuation_type=${valuation_type}, Examiner_type=${Examiner_type}, Dep_Name=${Dep_Name}, validSectionsPayload=${JSON.stringify(validSectionsPayload)}`);

  console.log("Finalize Request Received with data:", validSectionsPayload);
  console.log("Payload sections count:", validSectionsPayload?.sections?.length || 0);

  // Validate payload structure
  if (!validSectionsPayload || !validSectionsPayload.sections || !Array.isArray(validSectionsPayload.sections)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payload: sections array is required"
    });
  }

  // Log each section with details
  for (const item of validSectionsPayload.sections) {
    console.log("Processing section:", {
      section: item.section,
      id: item.id,
      hasSection: !!item.section,
      hasId: !!item.id
    });
  }

  // Group sections by section letter
  const sectionGroups = validSectionsPayload.sections.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  console.log("Sections grouped by letter:", Object.keys(sectionGroups).map(key => `${key}: ${sectionGroups[key].length} items`));



  let validSectionError = [];

  const valid_Data = await db.valid_question.findAll({
    where: {
      SUBCODE: subcode,
      testcode: resolvedTestcode,
    },
    order: [['SECTION', 'ASC'], ['FROM_QST', 'ASC']],
    raw: true,
  });

  // Guard: if no valid question configuration exists, do not allow finalization
  if (!valid_Data || valid_Data.length === 0) {
    return res.status(400).json({
      missingMarks: true,
      Mark_Error: true,
      message: `No question configuration found for subject ${subcode}. Cannot finalize without a valid question setup.`
    });
  }

  const padDep = String(Dep_Name || '01').padStart(2, '0');
  let flname_corscheck = db[`val_data_${padDep}`] ? `val_data_${padDep}` : `val_data_01`;
  let section_Data_valuation;

  // ── 3-way count check ────────────────────────────────────────────────────────
  // 1. How many rows valid_sections expects for this subcode
  // 2. How many rows are actually saved in val_data for this barcode/examiner
  // 3. How many marks the frontend says it filled in (sent with the request)
  // All three must match before any DB write is allowed.
  const validSectionsCount = await db.valid_sections.findAll({
    where: { sub_code: subcode, testcode: resolvedTestcode },
  });

  for (const validItem of validSectionsCount) {
    let matchingSections = validSectionsPayload.sections.filter(section => section.id === validItem.id);
    console.log(matchingSections[0].mark, `Checking section ID ${validItem.id} (expected section ${validItem.SECTION}) - found in payload:`, matchingSections.length > 0);

    if (matchingSections.length === 0 || matchingSections[0].mark === '' || matchingSections[0].mark === null) {
      validSectionError.push(`Missing section ${validItem.section} in payload for valid_sections ID ${validItem.id}`);
      return res.status(400).json({
        missingMarks: true,
        Mark_Error: true,
        message: `Section ${validItem.section} is expected for subject ${subcode} but not found in the submitted data. All sections must be included before submitting.`

      });
    }
  }

  // console.log(`[Finalize Check] valid_sections expects ${validSectionsCount.length} sections for subcode ${subcode}.`);
  //return

  // Log field names from validSectionsCount
  // if (validSectionsCount && validSectionsCount.length > 0) {
  //   const firstItem = validSectionsCount[0];
  //   const fieldNames = Object.keys(firstItem.dataValues);
  //   //console.log('Valid Sections Field Names:', fieldNames);
  //   for (const fieldName of fieldNames) {
  //     console.log(`Field: ${fieldName}`);
  //   }

  // }


  const valDataCount = await db[flname_corscheck].count({
    where: {
      barcode: barcode,
      subcode: subcode,
      eva_id: Eva_Id,
      valuation_type: valuation_type,
      Examiner_type: Examiner_type,
      Dep_Name: Dep_Name,
      testcode: resolvedTestcode,
    },
  });



  const feCount = frontendFilledCount !== undefined && frontendFilledCount !== null
    ? parseInt(frontendFilledCount, 10)
    : null;

  console.log(`[Finalize Count Check] subcode=${subcode} barcode=${barcode} — valid_sections=${validSectionsCount.length}, val_data=${valDataCount}, frontend=${feCount ?? 'not sent'}`);

  if (validSectionsCount.length !== valDataCount) {
    return res.status(400).json({
      countMismatch: true,
      Mark_Error: true,
      message: `Marks count mismatch: ${valDataCount} mark(s) saved in database but ${validSectionsCount.length} expected for subject ${subcode}. Please ensure all marks are entered and saved before submitting.`,
      expected: validSectionsCount.length,
      found: valDataCount,
    });
  }

  if (feCount !== null && feCount !== validSectionsCount.length) {
    return res.status(400).json({
      countMismatch: true,
      Mark_Error: true,
      message: `Frontend count mismatch: ${feCount} mark(s) entered on screen but ${validSectionsCount.length} expected for subject ${subcode}. Please ensure all marks are visible and saved before submitting.`,
      expected: validSectionsCount.length,
      found: feCount,
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  for (const validItem of valid_Data) {

    section_Data_valuation = await db[flname_corscheck].findAll({
      where: {
        subcode: validItem.SUBCODE,
        section: validItem.SECTION,
        barcode: barcode,
        eva_id: Eva_Id,
        valuation_type: valuation_type,
        Examiner_type: Examiner_type,
        Dep_Name: Dep_Name,
        testcode: resolvedTestcode,
        qbno: {
          [Op.between]: [validItem.FROM_QST, validItem.TO_QST],
        },
      },
      order: [['section', 'ASC'], ['qbno', 'ASC']],
      raw: true,
    });

    console.log(`Validating Section ${validItem.SECTION} (Subcode ${validItem.SUBCODE}) with questions from ${validItem.FROM_QST} to ${validItem.TO_QST}. Found ${section_Data_valuation.length} marks entries.`);



    if (!section_Data_valuation || section_Data_valuation.length === 0) {
      return res.status(400).json({
        missingMarks: true,
        Mark_Error: true,
        message: `No valuation data found for Section ${validItem.SECTION} (Subcode ${validItem.SUBCODE}). All marks must be entered before submitting.`
      });
    } else {
      if ((validItem.SUB_SEC || '').toUpperCase() === 'AB') {
        for (let i = parseInt(validItem.FROM_QST); i <= parseInt(validItem.TO_QST); i++) {
          // For AB sections, check both sub-section 'a' and 'b' exist and have marks
          const find_a = section_Data_valuation.find(s => parseInt(s.qbno) === i && s.sub_section === 'a');
          const find_b = section_Data_valuation.find(s => parseInt(s.qbno) === i && s.sub_section === 'b');

          if (!find_a || !find_b) {
            return res.status(400).json({
              missingMarks: true,
              Mark_Error: true,
              message: `Mark not entered for Question ${i} (a/b) in Section ${validItem.SECTION}. All marks must be entered before submitting.`
            });
          }

          // Check that Marks_Get is actually filled (not null or empty)
          if (find_a.Marks_Get === null || find_a.Marks_Get === undefined || find_a.Marks_Get === '') {
            return res.status(400).json({
              missingMarks: true,
              Mark_Error: true,
              message: `Mark is missing for Question ${i}a in Section ${validItem.SECTION}. All marks must be entered before submitting.`
            });
          }
          if (find_b.Marks_Get === null || find_b.Marks_Get === undefined || find_b.Marks_Get === '') {
            return res.status(400).json({
              missingMarks: true,
              Mark_Error: true,
              message: `Mark is missing for Question ${i}b in Section ${validItem.SECTION}. All marks must be entered before submitting.`
            });
          }
        }
      } else {
        for (let i = parseInt(validItem.FROM_QST); i <= parseInt(validItem.TO_QST); i++) {
          const find_section_data = section_Data_valuation.find(s => parseInt(s.qbno) === i);
          if (!find_section_data) {
            return res.status(400).json({
              missingMarks: true,
              Mark_Error: true,
              message: `Mark not entered for Question ${i} in Section ${validItem.SECTION}. All marks must be entered before submitting.`
            });
          }

          // Check that Marks_Get is actually filled (not null or empty)
          if (find_section_data.Marks_Get === null || find_section_data.Marks_Get === undefined || find_section_data.Marks_Get === '') {
            return res.status(400).json({
              missingMarks: true,
              Mark_Error: true,
              message: `Mark is missing for Question ${i} in Section ${validItem.SECTION}. All marks must be entered before submitting.`
            });
          }
        }
      }
    }
  }

  //   if (section_Data_valuation.length === 0) {
  //     console.log(`No valid sections found for Subcode ${validItem.SUBCODE}.`);
  //     // res.status(201).json({
  //     //   Error_Remarks: `No valid sections found for Subcode ${validItem.SUBCODE}`
  //     // });
  //     // return;
  //   } else {
  //     if (validItem.SUB_SEC.toUpperCase() == 'AB') {
  //       for (let i = validItem.FROM_QST; i <= validItem.TO_QST; i++) {
  //         for (let ii = 97; ii <= 98; ii++) {
  //           const find_section_data = section_Data_valuation.filter(
  //             (section) =>
  //               section.subcode === validItem.SUBCODE &&
  //               section.section === validItem.SECTION &&
  //               section.qbno === i &&
  //               section.sub_section === String.fromCharCode(ii)
  //           );
  //           //const sum_value = find_section_data.reduce((sum, section) => sum + (parseFloat(section.max_mark) || 0), 0);
  //           const  find_data = find_section_data.find(section => section.Marks_Get == null || section.Marks_Get == '');
  //           if (find_data || find_data == undefined) {
  //             console.log(`Max mark for question ${i}${String.fromCharCode(ii)} is missing or invalid.`);

  //           //  res.status(201).json({
  //           //     Error_Remarks: `Max mark for question ${i}${String.fromCharCode(ii)}: ${sum_value} does NOT match expected MARK_MAX: ${validItem.MARK_MAX}`
  //           //   });
  // //            return;
  //           }
  //         }
  //       }

  //     } else {
  //       for (let i = validItem.FROM_QST; i <= validItem.TO_QST; i++) {
  //         console.log(`Checking question ${i} in section ${validItem.SECTION} for subcode ${validItem.SUBCODE}`);
  //         const find_section_data = section_Data_valuation.filter(
  //           (section) =>
  //             section.subcode === validItem.SUBCODE &&
  //             section.section === validItem.SECTION &&
  //             section.qbno === i
  //         );
  //         console.log(find_section_data, `find_section_data for question ${i}`);
  //         const  find_data = find_section_data.find(section => section.Marks_Get == null || section.Marks_Get == '');
  //         if (find_data || find_data == undefined) {
  //           console.log(`Max mark for question ${i} is missing or invalid.`);
  //           // res.status(201).json({
  //           //   Error_Remarks: `Max mark for question ${i}: ${sum_value} does NOT match expected MARK_MAX: ${validItem.MARK_MAX}`
  //           // });
  //   //        return;
  //         }
  //       }
  //     }
  //   }

  // return res.status(200).json({
  //   message: "Finalization successful",
  // });





  const ClintIP = getClientIP(req);
  const padDepFin = String(Dep_Name || '01').padStart(2, '0');
  const flname = db[`val_data_${padDepFin}`] ? `val_data_${padDepFin}` : `val_data_01`;

  const model = db[flname];
  const val_data = await model.update(
    { valid_qbs: "N" },
    {
      where: {
        barcode: barcode,
        subcode: subcode,
        eva_id: Eva_Id,
        Eva_Mon_Year: Eva_Mon_Year,
        valuation_type: valuation_type,
        Dep_Name: Dep_Name,
        Examiner_type: Examiner_type,
      },
    }
  );

  //Valid_Question_Bank fetch
  const valid_Question = await db.valid_question.findAll({
    where: { SUBCODE: subcode, testcode: resolvedTestcode },
    order: [
      ["SECTION", "ASC"],
      ["FROM_QST", "ASC"],
    ],
  });

  //Mark for finalization fetch
  const val_data_section = await model.findAll({
    where: {
      barcode: barcode,
      subcode: subcode,
      eva_id: Eva_Id,
      Eva_Mon_Year: Eva_Mon_Year,
      valuation_type: valuation_type,
      Dep_Name: Dep_Name,
      Examiner_type: Examiner_type,
    },
    order: [
      ["qbno", "ASC"],
      ["section", "ASC"],
      ["sub_section", "ASC"],
      ["add_sub_section", "ASC"],
    ],
  });



  // Create sections object to hold marks for each section
  const sections = {};
  let sectionKey;
  let sectionKey1;

  for (const question of valid_Question) {
    const matchingMarks = val_data_section.filter(
      (mark) =>
        mark.section === question.SECTION &&
        parseInt(question.FROM_QST) <= parseInt(mark.qbno) &&
        parseInt(mark.qbno) <= parseInt(question.TO_QST)
    );
    if (question.SUB_SEC === "ab") {
      sectionKey = `Section${question.SECTION}a`;
      if (!sections[sectionKey]) {
        sections[sectionKey] = [];
      }

      sectionKey1 = `Section${question.SECTION}b`;
      if (!sections[sectionKey1]) {
        sections[sectionKey1] = [];
      }
    } else {
      sectionKey = `Section${question.SECTION}`;
      if (!sections[sectionKey]) {
        sections[sectionKey] = [];
      }
    }

    // Process matching marks for the current question

    let existingMark;

    matchingMarks.forEach((mark) => {
      if (question.SUB_SEC != "ab") {
        existingMark = sections[sectionKey].find((m) => m.qbno === mark.qbno);
        const markValue =
          mark.Marks_Get == "NA" ? 0 : parseFloat(mark.Marks_Get);
        const markValueForDecimal = mark.Marks_Get == "NA" ? -0.001 : parseFloat(mark.Marks_Get);
        if (existingMark) {
          existingMark.marks += markValue;
          existingMark.dummy_marks += markValue;
          existingMark.decimal_marks += markValueForDecimal;
        } else {
          sections[sectionKey].push({
            qbno: mark.qbno,
            marks: markValue,
            dummy_marks: markValue,
            decimal_marks: markValueForDecimal,
            Qst_Valid: "N",
          });
        }
      } else {
        // For 'ab' sections, implement three-tier mark tracking
        const markValue =
          mark.Marks_Get == "NA" ? 0 : parseFloat(mark.Marks_Get);
        const markValueForDecimal =
          mark.Marks_Get == "NA" ? -0.001 : parseFloat(mark.Marks_Get);
        const markCheckValue =
          mark.Marks_Get == "NA" ? 0 : parseFloat(mark.Marks_Get);
        if (mark.sub_section === "a") {
          existingMark = sections[sectionKey].find((m) => m.qbno === mark.qbno);
          if (existingMark) {
            existingMark.marks += markValue;
            existingMark.dummy_marks += markValue;
            existingMark.decimal_marks += markValueForDecimal;
            existingMark.check_marks += markCheckValue;
          } else {
            sections[sectionKey].push({
              qbno: mark.qbno,
              marks: markValue,
              dummy_marks: markValue,
              decimal_marks: markValueForDecimal,
              check_marks: markCheckValue,
              Qst_Valid: "N",
            });
          }
        } else if (mark.sub_section === "b") {
          existingMark = sections[sectionKey1].find(
            (m) => m.qbno === mark.qbno
          );
          if (existingMark) {
            existingMark.marks += markValue;
            existingMark.dummy_marks += markValue;
            existingMark.decimal_marks += markValueForDecimal;
            existingMark.check_marks += markCheckValue;
          } else {
            sections[sectionKey1].push({
              qbno: mark.qbno,
              marks: markValue,
              dummy_marks: markValue,
              decimal_marks: markValueForDecimal,
              check_marks: markCheckValue,
              Qst_Valid: "N",
            });
          }
        }
      }
    });
  }

  // Store all Object keys

  const allSectionKeys = Object.keys(sections);
  // return

  // Compulsory Questions Handling C_QST
  // Remove unused C_QST_List code block
  let C_QST_List = [];
  valid_Question.forEach((question) => {
    if (question.C_QST) {
      C_QST_List = question.C_QST.split(",");
      let newSection = "Section" + question.SECTION;
      for (let i = 0; i < C_QST_List.length; i++) {
        C_QST_List[i] = C_QST_List[i].trim();
        sections[newSection].forEach((item) => {
          if (C_QST_List.includes(item.qbno.toString())) {
            item.dummy_marks = 99;
          }
        });
      }
    }
  });

  // Sort each section based on dummy_marks in descending order
  // allSectionKeys.forEach((key) => {
  //   sections[key] = sections[key].sort(
  //     (a, b) => parseFloat(b.dummy_marks) - parseFloat(a.dummy_marks)
  //   );
  // });

  allSectionKeys.forEach((key) => {
    sections[key] = sections[key].sort(
      (a, b) => parseFloat(b.decimal_marks) - parseFloat(a.decimal_marks)
    );
  });

  // Element Selection Based on Valid Questions


  let maxMark = 0;

  let Final_Qst = { Sections: [] };
  let Final_Marks = 0;
  let Section_Qst = { Sectionsab: [] };
  valid_Question.forEach((question) => {
    const markMax = parseFloat(question.MARK_MAX) || 0;
    const noQst = parseInt(question.NOQST) || 0;
    maxMark += markMax * noQst;
    if (question.SUB_SEC == "ab") {
      const foundItemA = sections[`Section${question.SECTION}a`];
      const foundItemB = sections[`Section${question.SECTION}b`];
      if (foundItemA && foundItemB) {
        const fromQst = parseInt(question.FROM_QST);
        const toQst = parseInt(question.TO_QST);

        // Loop through each question number in the range
        for (let qNum = fromQst; qNum <= toQst; qNum++) {
          const itemA = foundItemA.find((item) => item.qbno === qNum);
          const itemB = foundItemB.find((item) => item.qbno === qNum);

          // If both items exist, compare them
          if (itemA && itemB) {
            // Check if both marks are 0 and both check_marks are 0
            if (
              itemA.marks === 0 &&
              itemB.marks === 0 &&
              itemA.check_marks === 0 &&
              itemB.check_marks === 0
            ) {
              // Use decimal comparison - if A's decimal is less than B's, choose B
              if (itemA.decimal_marks < itemB.decimal_marks) {
                Section_Qst["Sectionsab"].push({
                  qbno: itemB.qbno,
                  sub_subction: "b",
                });
                Final_Marks += itemB.marks;
                itemB.Qst_Valid = "Y";
              } else {
                // Otherwise choose A
                Section_Qst["Sectionsab"].push({
                  qbno: itemA.qbno,
                  sub_subction: "a",
                });
                itemA.Qst_Valid = "Y";
                Final_Marks += itemA.marks;
              }
            } else if (itemA.marks >= itemB.marks && itemA.check_marks >= 0) {
              // A has higher or equal marks and check_marks is non-negative
              Section_Qst["Sectionsab"].push({
                qbno: itemA.qbno,
                sub_subction: "a",
              });
              itemA.Qst_Valid = "Y";
              Final_Marks += itemA.marks;
            } else if (itemB.check_marks >= 0) {
              // B has higher marks or A's check_marks is negative
              Section_Qst["Sectionsab"].push({
                qbno: itemB.qbno,
                sub_subction: "b",
              });
              Final_Marks += itemB.marks;
              itemB.Qst_Valid = "Y";
            }
          } else if (itemA && itemA.check_marks >= 0) {
            // Only A exists and check_marks is valid
            Section_Qst["Sectionsab"].push({
              qbno: itemA.qbno,
              sub_subction: "a",
            });
            itemA.Qst_Valid = "Y";
            Final_Marks += itemA.marks;
          } else if (itemB && itemB.check_marks >= 0) {
            // Only B exists and check_marks is valid
            Section_Qst["Sectionsab"].push({
              qbno: itemB.qbno,
              sub_subction: "b",
            });
            Final_Marks += itemB.marks;
            itemB.Qst_Valid = "Y";
          }
        }
      }
    } else {
      const foundItem = sections[`Section${question.SECTION}`];
      if (foundItem) {
        const numQuestions = parseInt(question.NOQST);
        const compulsoryQst = question.C_QST ? parseInt(question.C_QST) : null;
        const from = Number(question.FROM_QST || 0);
        const to = Number(question.TO_QST || 0);

        // Filter items to only those in the current question range (FROM_QST to TO_QST)
        const itemsInRange = foundItem.filter(item => {
          const qbn = parseInt(item.qbno);
          return qbn >= from && qbn <= to;
        });

        // Track which questions have been selected
        const selectedQuestions = [];

        // First, if there's a compulsory question, always include it
        if (compulsoryQst !== null) {
          const compulsoryItem = itemsInRange.find(item => item.qbno === compulsoryQst);
          if (compulsoryItem) {
            selectedQuestions.push(compulsoryItem);
            Final_Qst['Sections'].push({
              qbno: compulsoryItem.qbno,
              isCompulsory: true
            });
            Final_Marks += compulsoryItem.marks;
            compulsoryItem.Qst_Valid = 'Y';
          }
        }

        // Then, select the remaining questions based on highest marks from this range only
        // Exclude already selected compulsory questions
        const remainingItems = itemsInRange.filter(item =>
          !selectedQuestions.some(selected => selected.qbno === item.qbno)
        );

        const questionsToSelect = numQuestions - selectedQuestions.length;
        for (let i = 0; i < Math.min(questionsToSelect, remainingItems.length); i++) {
          Final_Qst['Sections'].push({
            qbno: remainingItems[i].qbno,
          });
          Final_Marks += remainingItems[i].marks;
          remainingItems[i].Qst_Valid = 'Y';
        }
      }
    }
  });

  allSectionKeys.forEach((key) => {
  });

  // Update valid_qbs='Y' for regular sections

  const padDepTbl = String(Dep_Name || '01').padStart(2, '0');
  const valid_data_tbl = db[`val_data_${padDepTbl}`] ? `val_data_${padDepTbl}` : `val_data_01`;
  const model_valid_data = db[valid_data_tbl];
  if (Final_Qst.Sections && Final_Qst.Sections.length > 0) {
    const qbnoArray = Final_Qst.Sections.map((item) => item.qbno);

    await model_valid_data.update(
      { valid_qbs: "Y" },
      {
        where: {
          barcode: barcode,
          subcode: subcode,
          testcode: resolvedTestcode,
          eva_id: Eva_Id,
          Eva_Mon_Year: Eva_Mon_Year,
          valuation_type: valuation_type,
          Examiner_type: Examiner_type,
          Dep_Name: Dep_Name,
          qbno: { [Op.in]: qbnoArray },
          Marks_Get: { [Op.ne]: "NA" },
        },
      }
    );
  }

  if (Section_Qst.Sectionsab && Section_Qst.Sectionsab.length > 0) {
    for (const item of Section_Qst.Sectionsab) {
      await model_valid_data.update(
        { valid_qbs: "Y" },
        {
          where: {
            barcode: barcode,
            subcode: subcode,
            testcode: resolvedTestcode,
            eva_id: Eva_Id,
            Eva_Mon_Year: Eva_Mon_Year,
            valuation_type: valuation_type,
            Examiner_type: Examiner_type,
            Dep_Name: Dep_Name,
            qbno: item.qbno,
            sub_section: item.sub_subction,
            Marks_Get: { [Op.ne]: "NA" },
          },
        }
      );
    }
  }


  let totalRoundedMarks = Math.round(Final_Marks);
  if (Total_Rounded_Marks_Front != totalRoundedMarks) {
    res.status(201).json({
      message: "Finalization marks mismatch",
      Final_Marks: Final_Marks,
      Mark_Error: true,
      Regular_Questions: Final_Qst.Sections.length,
      AB_Questions: Section_Qst.Sectionsab.length,
      Total_Rounded_Marks: totalRoundedMarks,
      Total_Mark_Calculated_Front: Total_Rounded_Marks_Front,
    });
    return;
  }

  const flname_import = `import${valuation_type}`;
  const model_import = db[flname_import];
  let import_record;
  if (Examiner_type == 2 || Examiner_type == 11) {
    import_record = await model_import.update(
      {
        Checked: "Yes",
        E_flg: "Y",
        total: Final_Marks,
        tot_round: totalRoundedMarks,
        checkdate: getCurrentISTDateTime(),
        ip: ClintIP,
      },
      {
        where: {
          barcode: barcode,
          subcode: subcode,
          ...(flname_import === 'import1' ? { testcode: resolvedTestcode } : {}),
          Eva_Mon_Year: Eva_Mon_Year,
          Evaluator_Id: Eva_Id,
          Dep_Name: Dep_Name,
        },
      }
    );
  } else if (Examiner_type == 7 || Examiner_type == 1) {


    let FirstValuationMark = await model_import.findOne({
      where: {
        barcode: barcode,
        subcode: subcode,
        ...(flname_import === 'import1' ? { testcode: resolvedTestcode } : {}),
        Eva_Mon_Year: Eva_Mon_Year,
        Evaluator_Id: Evaluator_Id,
        Dep_Name: Dep_Name,
      },
    });


    let MarkPercentage = maxMark * 0.20;
    let MarkDifference = Math.abs(FirstValuationMark.tot_round - Final_Marks);
    let Chief_Flg = FirstValuationMark.Chief_flg;
    let Checked = FirstValuationMark.Checked;
    let E_flg = FirstValuationMark.E_flg;


    //return

    if (MarkDifference > MarkPercentage) {
      Chief_Flg = "E";
      Checked = "NO";
      E_flg = "A";
      const facultyData = await db.faculties.findOne({
        where: { Eva_Id: FirstValuationMark.Evaluator_Id },
      });
      const chiefRemarks = await db.chief_remarks.create({
        evaluator_id: FirstValuationMark.Evaluator_Id,
        evaluator_subject: FirstValuationMark.subcode,
        msg: "Marks differ more than 20%, sent for re-evaluation",
        Barcode: FirstValuationMark.barcode,
        evaluator_name: facultyData ? facultyData.FACULTY_NAME : "Unknown",
      });
    }

    //return
    import_record = await model_import.update(
      {
        Chief_Checked: "Yes",
        Chief_E_flg: "Y",
        Chief_Flg,
        Checked,
        E_flg,
        Chief_total: Final_Marks,
        Chief_tot_round: totalRoundedMarks,
        Chief_checkdate_Valuation: getCurrentISTDateTime(),
        Chief_ip: ClintIP,
      },
      {
        where: {
          barcode: barcode,
          subcode: subcode,
          ...(flname_import === 'import1' ? { testcode: resolvedTestcode } : {}),
          Eva_Mon_Year: Eva_Mon_Year,
          Evaluator_Id: Evaluator_Id,
          Dep_Name: Dep_Name,
        },
      }
    );
  }

  if (!import_record) {
    // res.status(201);
    throw new AppError("Finalization failed during import update", 404);
  }

  res.status(200).json({
    message: "Finalization successful",
    Final_Marks: Final_Marks,
    Regular_Questions: Final_Qst.Sections.length,
    AB_Questions: Section_Qst.Sectionsab.length,
    Total_Rounded_Marks: totalRoundedMarks,
    Mark_Error: false,
    Total_Mark_Calculated_Front: Total_Rounded_Marks_Front,
  });
});

const examminer_valuation_data_get = asyncHandler(async (req, res) => {
  const { subcode, testcode, Eva_Id, valuation_type, barcode, Dep_Name, Examiner_type, evid_ce } = req.body;
  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject', 400);
  }

  const padDep = String(Dep_Name || '01').padStart(2, '0');
  const flname = db[`val_data_${padDep}`] ? `val_data_${padDep}` : `val_data_01`;

  // Build query conditions based on Examiner_type
  const whereConditions = {
    subcode: subcode,
    testcode: resolvedTestcode,
    valuation_type: valuation_type,
    barcode: barcode,
  };

  // Add Examiner_type to query only if it's provided
  if (Examiner_type) {
    whereConditions.Examiner_type = Examiner_type;
  }

  // For Examiner_type = 2 (chief examiner), query by evid_ce (chief examiner ID)
  // For Examiner_type = 1 or undefined (original examiner), query by eva_id
  if (Examiner_type === "2" && evid_ce) {
    whereConditions.evid_ce = evid_ce;
  } else {
    whereConditions.eva_id = Eva_Id;
  }

  const examminer_valuation_data = await db[flname].findAll({
    where: whereConditions,
    order: [
      ["section", "ASC"],
      ["sub_section", "ASC"],
      ["add_sub_section", "ASC"],
    ],
  });


  if (!examminer_valuation_data || examminer_valuation_data.length === 0) {
    return res.status(200).json({ data: [] });
  }

  res.status(200).json({ data: examminer_valuation_data });
});

const examiner_review_data_get = asyncHandler(async (req, res) => {
  const {
    subcode,
    testcode,
    Eva_Id,
    Dep_Name,
    Eva_Mon_Year,
    valuation_type,
    Examiner_type,
  } = req.query;

  const flname_import = `import${valuation_type}`;
  const model_import = db[flname_import];
  const resolvedTestcode = flname_import === 'import1'
    ? await resolveSubcodeTestcode(subcode, testcode)
    : null;
  if (flname_import === 'import1' && !resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject review', 400);
  }
  let import_record = await model_import.findAll({
    where: {
      subcode: subcode,
      ...(flname_import === 'import1' ? { testcode: resolvedTestcode } : {}),
      Eva_Mon_Year: Eva_Mon_Year,
      Evaluator_Id: Eva_Id,
      Dep_Name: Dep_Name,
      Checked: "Yes",
    },
    order: [
      ["checkdate", "DESC"],
      ["subcode", "ASC"],
      ["barcode", "ASC"],
    ],
  });
  res.status(200).json({
    message: "Import record fetched successfully",
    data: import_record,
  });
});

const examiner_review_value_data_get = asyncHandler(async (req, res) => {
  const {
    subcode,
    testcode,
    barcode,
    Dep_Name,
    Eva_Id,
    Eva_Mon_Year,
    valuation_type,
    Examiner_type,
  } = req.query;

  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject review', 400);
  }



  const flname = `val_data_${Dep_Name}`;



  const model = db[flname];


  let valuation_data = await model.findAll({
    where: {
      barcode: barcode,
      subcode: subcode,
      testcode: resolvedTestcode,
      eva_id: Eva_Id,
      Eva_Mon_Year: Eva_Mon_Year,
      valuation_type: valuation_type,
      Examiner_type: Examiner_type,
    },
    order: [
      ["qbno", "ASC"],
      ["section", "ASC"],
      ["sub_section", "ASC"],
      ["add_sub_section", "ASC"],
    ],
  });




  res.status(200).json({
    message: "Examiner review value data fetched successfully",
    data: valuation_data,
  });
});

// Cheif Valuation Barcode Fetch
const chief_valuation_Barcode_Fetch = asyncHandler(async (req, res) => {
  const {
    subcode,
    camp_id,
    camp_office_id,
    Examiner_type,
    valuation_type,
    Eva_Id,
    Eva_Mon_Year,
    RevieWFlag,
    chiefValuationtype,
    Evaluator_Id
  } = req.query;


  const Examiner_Details = await db.faculties.findOne({
    where: {
      Eva_Id: Evaluator_Id,
    },
  });

  let Examiner_Name = Examiner_Details ? Examiner_Details.FACULTY_NAME : "Unknown Examiner";
  const flname = `import${valuation_type}`;
  const model = db[flname];

  let ChifValuationData;

  if (chiefValuationtype == "1") {

    ChifValuationData = await model.findAll({
      where: {
        subcode: subcode,
        Eva_Mon_Year: Eva_Mon_Year,
        Evaluator_Id: Evaluator_Id,
        Checked: "Yes",
        E_flg: "Y",
        Chief_Checked: "NO",
        [Op.or]: [
          { Chief_Flg: "N" },
          { Chief_Flg: "A" },
        ],
      },
      order: [
        ["checkdate", "DESC"],
        ["subcode", "ASC"],
        ["barcode", "ASC"],
      ],
      attributes: [
        "barcode",
        "subcode",
        "Evaluator_Id",
        "Eva_Mon_Year",
        "tot_round",
        "checkdate",
        "Camp_id",
        "camp_offcer_id_examiner",
        "Chief_Flg",
        "Checked",
      ],
    });
  }

  else {
    ChifValuationData = await model.findAll({
      where: {
        subcode: subcode,
        Eva_Mon_Year: Eva_Mon_Year,
        Evaluator_Id: Evaluator_Id,
        Checked: "Yes",
        E_flg: "Y",
        Chief_Checked: "NO",

        [Op.or]: [
          { Chief_Flg: "N" },
          { Chief_Flg: "E" },
          { Chief_Flg: "A" },
        ],
        [Op.and]: [
          { Chief_Checked: "NO" },
          { Chief_E_flg: "N" },
        ]

      },
      order: [
        ["checkdate", "DESC"],
        ["subcode", "ASC"],
        ["barcode", "ASC"],
      ],
      attributes: [
        "barcode",
        "subcode",
        "Evaluator_Id",
        "Eva_Mon_Year",
        "tot_round",
        "checkdate",
        "Camp_id",
        "camp_offcer_id_examiner",
        "Chief_Flg",
        "Checked",
      ],
    });
  }



  res.status(200).json({
    data: ChifValuationData,
    Examiner_Name: Examiner_Name,
  });
});
const valuation_chief_Barcode_Data = asyncHandler(async (req, res) => {
  const {
    barcode,
    subcode,
    Examiner_type,
    valuation_type,
    Eva_Id,
    Eva_Mon_Year,
    Examiner_Id,
    camp_id_chief,
    camp_offcer_id_examiner,
    chief_valuation_Meth,
  } = req.query;


  const ClintIP = getClientIP(req);
  const flname = `import${valuation_type}`;
  const model = db[flname];

  let Chief_E_flg;
  if (chief_valuation_Meth == "R") {
    Chief_E_flg = "N";
    Chief_Valuation_Evaluator_Id = null;
    Chief_Eva_id = Examiner_Id;
  } else if (chief_valuation_Meth == "V") {
    Chief_E_flg = "A";
    Chief_Valuation_Evaluator_Id = Examiner_Id;
    Chief_Eva_id = null;

  }
  else {
    Chief_E_flg = "A";
    Chief_Valuation_Evaluator_Id = Examiner_Id;
    Chief_Eva_id = null;
  }
  let Chief_Valuation_Barcode_Data;
  if (Examiner_type == Examiner_type) {
    Chief_Valuation_Barcode_Data = await model.findOne({
      where: {
        subcode: subcode,
        barcode: barcode,
        Evaluator_Id: Eva_Id,
        Checked: "Yes",
        E_flg: "Y",
        Chief_Flg: "N",
        Chief_Checked: "NO",
        [Op.or]: [{ Chief_Flg: "N" }, { Chief_Flg: "A" }],
      },
    });

    Chief_Valuation_Barcode_Data.update({
      Chief_E_flg: Chief_E_flg,
      Chief_Valuation_Evaluator_Id: Chief_Valuation_Evaluator_Id,
      Chief_A_date: getCurrentISTDateTime(),
      Chief_Evaluator_Id: Chief_Eva_id,
      Chief_ip: ClintIP,

    });
  } else if (Examiner_type == 1) {
    Chief_Valuation_Barcode_Data = await model.findOne({
      where: {
        subcode: subcode,
        barcode: barcode,
        Evaluator_Id: Eva_Id,
        Checked: "Yes",
        E_flg: "Y",
        Chief_Flg: "N",
        Chief_Checked: "NO",
        [Op.or]: [{ Chief_E_flg: "N" }, { Chief_E_flg: "A" }],
      },
    });




    Chief_Valuation_Barcode_Data.update({
      Chief_E_flg: Chief_E_flg,
      Chief_Evaluator_Id: Chief_Eva_id,
    });
  } else {
    res.status(201);
    throw new AppError("Invalid Examiner Type for Chief Valuation", 201);
  }
  res.status(200).json({
    data: Chief_Valuation_Barcode_Data,
  });
});

const valuation_marks_preview_date = asyncHandler(async (req, res) => {
  const { Eva_Id, Dept_Code, Selected_Role } = req.query;

  let RecordId = 1;
  if (!Eva_Id) {
    res.status(400);
    throw new AppError("Evaluator ID is required", 400);
  }

  const Valuation_Date = {
    "Evaluator_Id": Eva_Id,
    "Exam_Month_Year": getCurrentISTDateTime(),
    "checkdates": []
  }

  for (let i = 1; i <= 4; i++) {

    const flname = `import${i}`;
    const model = db[flname];

    let sql;

    if (Selected_Role === "2" || Selected_Role === "11") {
      sql = `SELECT "Evaluator_Id", "subcode", SUBSTRING("checkdate", 1, 10) AS "check_date", COUNT("id") AS "Total_Papers",
SUM(COUNT("id")) OVER (PARTITION BY "Evaluator_Id", SUBSTRING("checkdate", 1, 10)) AS "Date_Total_Papers"
FROM "${flname}"
WHERE "Evaluator_Id" = :Eva_Id AND "Checked" = 'Yes'
GROUP BY "Evaluator_Id", "subcode", SUBSTRING("checkdate", 1, 10)
ORDER BY SUBSTRING("checkdate", 1, 10) ASC;
`;
    } else if (Selected_Role === "1") {

      sql = `SELECT "Chief_Valuation_Evaluator_Id" as "Evaluator_Id", "subcode", SUBSTRING("Chief_checkdate_Valuation", 1, 10) AS "check_date", COUNT("id") AS "Total_Papers",
SUM(COUNT("id")) OVER (PARTITION BY "Chief_Valuation_Evaluator_Id", SUBSTRING("Chief_checkdate_Valuation", 1, 10)) AS "Date_Total_Papers"
FROM "${flname}"
WHERE "Chief_Valuation_Evaluator_Id" = :Eva_Id AND "Chief_Checked" = 'Yes'
GROUP BY "Chief_Valuation_Evaluator_Id", "subcode", SUBSTRING("Chief_checkdate_Valuation", 1, 10)
ORDER BY SUBSTRING("Chief_checkdate_Valuation", 1, 10) ASC;
`;
    } else {
      // Skip if role doesn't match
      continue;
    }

    const checkdates = await db.sequelize.query(sql, {
      replacements: { Eva_Id: Eva_Id },
      type: db.sequelize.QueryTypes.SELECT
    });

    // const checkdates = await model.findAll({
    //   attributes: [
    //     'Evaluator_Id',
    //     'subcode',
    //     [Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10), 'check_date'],
    //     [Sequelize.fn('COUNT', Sequelize.col('id')), 'Total_Papers']
    //   ],
    //   where: {
    //     Evaluator_Id: Eva_Id,
    //     Checked: 'Yes'
    //   },
    //   group: ['Evaluator_Id', 'subcode', Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10)],
    //   order: [[Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10), 'ASC']],
    //   raw: true
    // });



    checkdates.forEach(dateRecord => {
      Valuation_Date.checkdates.push({
        id: RecordId++,
        Evaluator_Id: dateRecord.Evaluator_Id,
        subcode: dateRecord.subcode,
        check_date: dateRecord.check_date,
        Total_Papers: dateRecord.Total_Papers,
        Date_Total_Papers: dateRecord.Date_Total_Papers,
        Valuation_Type: i,
        Dept_Code: Dept_Code
      });
    });

  }


  res.status(200).json({ data: Valuation_Date });

});


const valuation_marks_preview_data_examiner = asyncHandler(async (req, res) => {

  const { Evaluator_Id, check_date, Valuation_Type, Dept_Code, Select_Role, Dep_Name, Reports, Table_Dept_Code } = req.query;


  //return
  // Build where clause based on report type
  // Reports = "1" → Date Wise (filter by Evaluator_Id + check_date)
  // Reports = "2" → Subject Wise (filter by Evaluator_Id + subcode)
  let whereClause

  if (Select_Role === "2") {
    whereClause = {
      Evaluator_Id: Evaluator_Id,
      Checked: 'Yes',
      ...(Reports === '1'
        ? {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10),
              check_date
            )
          ]
        }
        : { subcode: Dept_Code }
      )
    };
  } else if (Select_Role === "1") {
    whereClause = {
      Chief_Valuation_Evaluator_Id: Evaluator_Id,
      Chief_Checked: 'Yes',
      ...(Reports === '1'
        ? {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('SUBSTRING', Sequelize.col('Chief_checkdate_Valuation'), 1, 10),
              check_date
            )
          ]
        }
        : { subcode: Dept_Code }
      )
    };
  }

  // Reports=1 → use Dept_Code directly; Reports=2 → use Table_Dept_Code (actual dept, Dept_Code is subcode)
  const valDataTableCode = Reports === '1' ? Dept_Code : (Table_Dept_Code || Dept_Code);

  // return
  const flname = `import${Valuation_Type}`;
  const model = db[flname];
  const sub_master = db.sub_master;

  // Build attributes based on role
  const attributes = [
    'id',
    'barcode',
    'subcode',
    Select_Role === "1" ? 'Chief_total' : 'total',
    Select_Role === "1" ? 'Chief_tot_round' : 'tot_round',
    [Sequelize.fn('SUBSTRING', Sequelize.col(Select_Role === "1" ? 'Chief_checkdate_Valuation' : 'checkdate'), 1, 10), 'check_date']
  ];

  const valuation_data = await model.findAll({
    attributes: attributes,
    where: whereClause,
    order: [
      ['subcode', 'ASC'],
      ['barcode', 'ASC']
    ],
  });

  if (!valuation_data || valuation_data.length === 0) {
    res.status(404);
    throw new AppError("No valuation data found for the given date", 404);
  }

  // Fetch subject names for all unique subcodes
  const subcodes = [...new Set(valuation_data.map(record => record.subcode))];
  const subjectNames = await sub_master.findAll({
    attributes: ['Subcode', 'SUBNAME'],
    where: {
      Subcode: { [Op.in]: subcodes }
    }
  });

  // Create a map of subcode to subject name
  const subjectNameMap = {};
  subjectNames.forEach(sub => {
    subjectNameMap[sub.Subcode] = sub.SUBNAME;
  });

  // Add subject names to valuation_data and normalize field names
  const enrichedValuationData = valuation_data.map(record => {
    const recordData = record.toJSON();
    return {
      ...recordData,
      subject_name: subjectNameMap[recordData.subcode] || 'Unknown',
      // Normalize total and tot_round fields for consistent frontend usage
      total: recordData.total || recordData.Chief_total || 0,
      tot_round: recordData.tot_round || recordData.Chief_tot_round || 0
    };
  });


  const flnamevaldata = `val_data_${Dep_Name}`;

  const modelvaldata = db[flnamevaldata];

  if (!modelvaldata) {
    res.status(400);
    throw new AppError(`Table val_data_${Dep_Name} not found. Check Dept_Code / Dep_Name value.`, 400);
  }
  const barcodes = valuation_data.map(record => record.barcode);
  const valDataRecords = await modelvaldata.findAll({
    attributes: [
      'id',
      'barcode',
      'eva_id',
      'qbno',
      'section',
      'sub_section',
      'Marks_Get',
      'valid_qbs'
    ],
    where: {
      barcode: { [Op.in]: barcodes },
      eva_id: Evaluator_Id,
      Examiner_type: Select_Role === "2" ? "2" : "1"
    },
    order: [
      ['barcode', 'ASC'],
      ['qbno', 'ASC'],
      ['section', 'ASC'],
      ['sub_section', 'ASC']
    ]
  });

  res.status(200).json({
    data: enrichedValuationData,
    val_data: valDataRecords
  });

});




const evaluator_checkdates = asyncHandler(async (req, res) => {
  const { evaluator_id } = req.body;

  if (!evaluator_id) {
    res.status(400);
    throw new AppError("Evaluator ID is required", 400);
  }

  const import1 = db.import1;

  const checkdates = await import1.findAll({
    attributes: [
      'Evaluator_Id',
      [Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10), 'check_date']
    ],
    where: {
      Evaluator_Id: evaluator_id
    },
    group: ['Evaluator_Id', Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10)],
    order: [[Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10), 'ASC']],
    raw: true
  });

  if (!checkdates || checkdates.length === 0) {
    res.status(404);
    throw new AppError("No check dates found for this evaluator", 404);
  }

  res.status(200).json({
    success: true,
    count: checkdates.length,
    data: checkdates
  });
});

const valuation_Remarks_Malpractice = asyncHandler(async (req, res) => {


  const { subject, reason, description, barcode, sub_code, sub_name, Camp_id, camp_offcer_id_examiner, Examiner_type, Modal_Type, Eva_Id, Eva_Name, Dep_Name } = req.body;

  console.log("Valuation Remarks Malpractice endpoint hit", "request body: ", req.body);

  if (!subject || !reason || !description || !barcode || !sub_code || !sub_name || !Camp_id || !camp_offcer_id_examiner || !Examiner_type || !Modal_Type || !Eva_Id || !Eva_Name || !Dep_Name) {
    res.status(400);
    throw new AppError("All fields are required", 400);
  }

  let flname = `valuation_remarks`;

  // if (Modal_Type == 2) {
  //   console.log("Valuation Remarks Malpractice for Examiner", "request body: ", req.body);
  // } else if (Modal_Type == 1) {



  const malpracticeRecord = await db[flname].create({

    RemarksSubject: subject,
    remarks_reasons: reason,
    msg: description,
    Dummy_Number: barcode,
    evaluator_subject: `${sub_code} - ${sub_name}`,
    evaluator_id: Eva_Id,
    evaluator_name: Eva_Name,
    Campid: Camp_id,
    Campofficerid: camp_offcer_id_examiner,
    Examiner_Type: Examiner_type,
    Remarks_Type: Modal_Type,
    Dep_Name: Dep_Name
  });





  // } else {
  //   res.status(400);
  //   throw new AppError("Invalid Modal Type", 400);
  // }



  res.status(200).json({ message: "Valuation Remarks Malpractice endpoint hit" });
});

const valuation_timing = asyncHandler(async (req, res) => {

  const { evaluator_id } = req.query;

  if (!evaluator_id) {
    res.status(400);
    throw new AppError("Evaluator ID is required", 400);
  }

  let importData = [];

  for (let i = 1; i <= 4; i++) {
    const flname = `import${i}`;
    const model = db[flname];

    const timingData = await model.findAll({
      attributes: [
        'Evaluator_Id',
        'barcode',
        'subcode',
        'tot_round',
        'checkdate',
        'A_date',
        [Sequelize.literal(`'${i}'`), 'valuation_type']
      ],

      where: {
        Evaluator_Id: evaluator_id,

        Checked: 'Yes',
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('SUBSTRING', Sequelize.col('checkdate'), 1, 10),
            getCurrentISTDateTime().substring(0, 10)
          )
        ]
      },

      order: [[Sequelize.literal(`to_timestamp("checkdate", 'DD-MM-YYYY HH12:MIAM')`), 'DESC']],
      raw: true
    });

    // Calculate time difference for each record
    if (timingData && timingData.length > 0) {
      const enrichedTimingData = timingData.map(record => {
        const timeDiff = calculateTimeDifference(record.A_date, record.checkdate);
        return {
          ...record,
          time_taken: timeDiff
        };
      });

      importData.push(...enrichedTimingData);
    }
  }

  res.status(200).json({
    message: "Valuation Timing data fetched successfully",
    count: importData.length,
    data: importData
  });
})

const Chief_Review_Data_Update = asyncHandler(async (req, res) => {
  const { barcode, subcode, Eva_Id, Eva_Mon_Year, valuation_type, Dep_Name, Examiner_type, Examiner_Eva_id, Chief_Flg, remarks, evaluator_name, Evaluator_Id } = req.body;


  if (!barcode || !subcode || !Eva_Id || !Eva_Mon_Year || !valuation_type || !Dep_Name || !Examiner_type || !Examiner_Eva_id || !Chief_Flg) {
    res.status(400);
    throw new AppError("All required fields must be provided", 400);
  }

  let flname = `import${valuation_type}`;

  const model = db[flname];

  const Data_Get = await model.findOne({
    where: {
      barcode: barcode,
      subcode: subcode,
      Eva_Mon_Year: Eva_Mon_Year,
      Evaluator_Id: Examiner_Eva_id,
      Checked: "Yes",
      E_flg: "Y",
    },
  });


  if (!Data_Get) {
    res.status(404);
    throw new AppError("Data not found for the given barcode and subcode", 404);
  }

  if (Chief_Flg == "Y") {
    await Data_Get.update({
      Chief_Flg: "Y",
      Chief_Evaluator_Id: Eva_Id
    });

    res.status(200).json({
      message: "Chief review accepted successfully",
      data: Data_Get
    });
  } else {
    await Data_Get.update({
      Chief_Flg: "E",
      Chief_Evaluator_Id: Eva_Id,
      Checked: "NO",
      E_flg: "A",
    });


    const RemarkExist = await db.chief_remarks.findOne({
      where: {
        Barcode: barcode,
        evaluator_subject: subcode,
        view_status: "N"
      }
    });

    let Remarks_Update;

    if (RemarkExist) {
      Remarks_Update = await RemarkExist.update({
        evaluator_id: Eva_Id,
        evaluator_name: evaluator_name,
        msg: remarks,
        view_status: "N"
      });
    } else {
      Remarks_Update = await db.chief_remarks.create({
        Barcode: barcode,
        evaluator_subject: subcode,
        evaluator_id: Eva_Id,
        evaluator_name: evaluator_name,
        msg: remarks,
        view_status: "N"
      });
    }

    res.status(200).json({
      message: "Chief review rejected, revaluation required",
      data: Data_Get,
      remarks: Remarks_Update
    });
  }
})



const rejectedByChief = asyncHandler(async (req, res) => {
  const { barcode, subcode, eva_id, valuation_type } = req.body;

  if (!barcode || !subcode || !eva_id || !valuation_type) {
    res.status(400);
    throw new AppError("All required fields must be provided", 400);
  }

  let flname = `import${valuation_type}`;
  const model = db[flname];

  const rejectedRecord = await model.findOne({
    where: {
      barcode: barcode,
      subcode: subcode,
      Evaluator_Id: eva_id,
      Checked: "NO",
      E_flg: "A",
      Chief_Flg: "E"
    },
  });

  if (!rejectedRecord) {
    res.status(201).json({
      message: "No record found that was rejected by chief examiner",
      isDataThere: false
    });
    return;

  }

  const Remarks_Get = await db.chief_remarks.findOne({
    where: {
      Barcode: barcode,
      evaluator_subject: subcode,
      view_status: "N"
    }
  });



  res.status(200).json({
    message: "Record found that was rejected by chief examiner",
    data: rejectedRecord,
    remarks: Remarks_Get,
    isDataThere: true
  });

})


const ValuationCheifRemarksGet = asyncHandler(async (req, res) => {
  const { barcode, subcode, eva_id } = req.query;



  if (!barcode || !subcode || !eva_id) {
    res.status(400);
    throw new AppError("All required fields must be provided", 400);
  }

  const Remarks_Get = await db.chief_remarks.findOne({
    where: {
      Barcode: barcode,
      evaluator_subject: subcode,
      view_status: "N",
      evaluator_id: eva_id
    }
  });


  if (!Remarks_Get) {
    res.status(404).json({
      message: "No chief remarks found for the given barcode and subcode",
      data: null
    });
    return;
  }

  res.status(200).json({
    message: "Chief remarks fetched successfully",
    data: Remarks_Get
  });
});

const ValuationpendingUpdate = asyncHandler(async (req, res) => {

  const { barcode, subcode, Eva_Id, Valuation_Type, Examiner_type, Dep_Name } = req.body;

  let flname = `import${Valuation_Type}`;
  let flname_valdata = `val_data_${Dep_Name}`;

  const ValDataUpdated = await db[flname_valdata].findAll({
    where: {
      barcode: barcode,
      subcode: subcode,
      eva_id: Eva_Id,
      valuation_type: Valuation_Type,
      Examiner_type: Examiner_type,
      Dep_Name: Dep_Name
    }
  });

  if (ValDataUpdated.length === 0) {
    const model = db[flname];

    if (Examiner_type == 2) {
      await model.update(
        {
          Checked: "NO",
          E_flg: "N",
        },
        {
          where: {
            barcode: barcode,
            subcode: subcode,
            Evaluator_Id: Eva_Id,
            Checked: "NO",
            E_flg: "A",
          },
        }
      );
    } else if (Examiner_type == 1) {
      await model.update(
        {
          Chief_Checked: "NO",
          Chief_E_flg: "N",
        },
        {
          where: {
            barcode: barcode,
            subcode: subcode,
            Chief_Valuation_Evaluator_Id: eva_id,
            Chief_Checked: "NO",
            Chief_E_flg: "A",
          },
        }
      );
    }
  }

  res.status(200).json({
    message: "Valuation pending update endpoint hit successfully",
    requestBody: req.body
  });

});


const ExaminerTotalMarksGet = asyncHandler(async (req, res) => {
  const { barcode, subcode, Eva_Id, Valuation_Type, valuation_type } = req.query;
  const resolvedValuationType = Valuation_Type || valuation_type;

  let flname = `import${resolvedValuationType}`;
  const model = db[flname];

  if (!model) {
    res.status(400);
    throw new AppError(`Invalid valuation type: ${Valuation_Type}`, 400);
  }

  const record = await model.findOne({
    where: {
      batchname: barcode,
      subcode: subcode,
      Evaluator_Id: Eva_Id,
    },
    attributes: ['total', 'tot_round']
  });

  if (!record) {
    res.status(404).json({
      message: "No record found for the given barcode and subcode",
      data: null
    });
    return;
  }

  res.status(200).json({
    message: "Total marks fetched successfully",
    data: record
  });

})

const valuation_Count_Check = asyncHandler(async (req, res) => {
  const { subcode, testcode, Eva_Id, barcode, Dep_Name, valuation_type, Examiner_type } = req.query;

  if (!subcode || !Eva_Id || !barcode || !Dep_Name || !valuation_type || !Examiner_type) {
    res.status(400);
    throw new AppError('Missing required parameters for count check', 400);
  }

  const resolvedTestcode = await resolveSubcodeTestcode(subcode, testcode);
  if (!resolvedTestcode) {
    res.status(400);
    throw new AppError('A valid testcode is required for this subject', 400);
  }

  const validSectionsCount = await db.valid_sections.count({
    where: { sub_code: subcode, testcode: resolvedTestcode },
  });

  const flname = `val_data_${Dep_Name}`;
  const valDataCount = await db[flname].count({
    where: {
      subcode,
      testcode: resolvedTestcode,
      eva_id: Eva_Id,
      barcode,
      valuation_type,
      Examiner_type,
      Dep_Name,
    },
  });

  console.log(`[Count Check] subcode=${subcode} barcode=${barcode} eva_id=${Eva_Id} — valid_sections=${validSectionsCount}, val_data=${valDataCount}`);

  res.status(200).json({
    valid_sections_count: validSectionsCount,
    val_data_count: valDataCount,
  });
});

module.exports = {
  subcode_Fetech,
  valuation_Barcode_Fetch,
  valuation_Image_Fetch,
  valuation_Data_Update,
  examminer_valuation_data_get,
  valuation_Finalize,
  examiner_review_data_get,
  examiner_review_value_data_get,
  chief_valuation_Barcode_Fetch,
  valuation_chief_Barcode_Data,
  valuation_marks_preview_date,
  valuation_marks_preview_data_examiner,
  evaluator_checkdates,
  valuation_Remarks_Malpractice,
  valuation_timing,
  Chief_Review_Data_Update,
  rejectedByChief,
  ValuationCheifRemarksGet,
  ValuationpendingUpdate,
  ExaminerTotalMarksGet,
  valuation_Count_Check,
};