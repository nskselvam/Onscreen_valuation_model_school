const db = require("../db/models");
const { testMaster, jee_marks } = db;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { QueryTypes } = require("sequelize");
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const S3_CACHE_TTL_MS = 5 * 60 * 1000;
const ANSWER_SHEET_ROOTS = ["Move_AnswerSheet_Uploaded", "AnswerSheet_Uploaded"];
let uploadInventoryCache = { data: null, expiresAt: 0, promise: null };

const getDashboardData = catchAsync(async (req, res, next) => {
  const { district, type_exam } = req.query;

  if (!district || !type_exam) {
    return next(new AppError("Both district and type_exam are required", 400));
  }
  if (district == "All") {
    {
      const marksData = await jee_marks.findAll({});
    }
  } else {
    const marksData = await jee_marks.findAll({
      where: {
        BATCHNAME: district,
      },
    });
  }
  if (marksData.length === 0) {
    return next(
      new AppError(
        "No data found for the specified district and type of exam",
        404,
      ),
    );
  }

  res.status(200).json({
    status: "success",
    data: marksData,
  });
});

const normalizeSubject = (subcode) => String(subcode || "")
  .replace(/[JN](?:11|12)(?=_)/, "")
  .replace(/^_+/, "");

const toNumber = (value) => Number(value || 0);

const requireModelSchoolAdministrator = (req) => {
  if (String(req.user?.Role || "") !== "13") {
    throw new AppError("Model School Administrator access required", 403);
  }
};

const normalizeUploadSubject = (subcode) => {
  const value = String(subcode || "").trim().toUpperCase();
  if (value.startsWith("PHYSICS")) return "PHYSICS_01";
  if (value.startsWith("CHEMISTRY")) return "CHEMISTRY_02";
  if (value.startsWith("MATH")) return "MATHS_03";
  if (value.startsWith("BIOLOGY")) return "BIOLOGY_04";
  return value;
};

const getStudentMarkSubject = (subcode) => {
  const value = String(subcode || "").trim().toUpperCase();
  if (value.startsWith("PHYSICS")) return "Physics";
  if (value.startsWith("CHEMISTRY")) return "Chemistry";
  if (value.startsWith("MATH")) return "Maths";
  if (value.startsWith("BIOLOGY")) return "Biology";
  return null;
};

const mapWithConcurrency = async (items, concurrency, handler) => {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await handler(items[currentIndex]);
    }
  });
  await Promise.all(workers);
  return results;
};

const listS3Objects = async (s3, bucket, prefix, delimiter) => {
  const objects = [];
  const prefixes = [];
  let continuationToken;
  do {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: delimiter,
      ContinuationToken: continuationToken,
    }));
    objects.push(...(response.Contents || []));
    prefixes.push(...(response.CommonPrefixes || []).map((entry) => entry.Prefix));
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return { objects, prefixes };
};

const createDistrictAccumulator = (district, districtName = "") => ({
  district,
  district_name: districtName,
  testcodes: new Set(),
  roll_numbers: new Set(),
  s3_papers: 0,
  s3_images: 0,
  imported_papers: 0,
  not_imported: 0,
  image_complete: 0,
  image_incomplete: 0,
  ready: 0,
  opened: 0,
  completed: 0,
  image_pending: 0,
  database_without_s3: 0,
  last_upload_at: null,
  details: new Map(),
});

const buildUploadInventory = async () => {
  if (!process.env.AWS_BUCKET_NAME) {
    throw new AppError("AWS S3 bucket is not configured", 500);
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  });

  try {
    const [importRows, districtRows, databaseTestcodes, discoveredByRoot] = await Promise.all([
      db.import1.findAll({
        attributes: [
          "id", "batchname", "subcode", "testcode", "dcode", "Dep_Name",
          "ImgCnt", "E_flg", "Checked", "Evaluator_Id", "updatedAt",
        ],
        raw: true,
      }),
      db.District_Master.findAll({ attributes: ["DCODE", "DNAME"], raw: true }),
      db.sequelize.query(`
        SELECT DISTINCT TRIM("testcode") AS testcode
        FROM "import1"
        WHERE COALESCE(TRIM("testcode"), '') <> ''
      `, { type: QueryTypes.SELECT }),
      Promise.all(ANSWER_SHEET_ROOTS.map((root) =>
        listS3Objects(s3, process.env.AWS_BUCKET_NAME, `${root}/`, "/")
      )),
    ]);

    const districtNames = new Map(districtRows.map((row) => [
      String(row.DCODE || "").padStart(2, "0"),
      row.DNAME || "",
    ]));
    const s3Testcodes = discoveredByRoot.flatMap(({ prefixes }, rootIndex) =>
      prefixes.map((prefix) => prefix.slice(`${ANSWER_SHEET_ROOTS[rootIndex]}/`.length).replace(/\/$/, ""))
    );
    const testcodes = [...new Set([
      ...databaseTestcodes.map((row) => row.testcode),
      ...s3Testcodes,
    ].filter(Boolean))].sort();

    const logicalImages = new Map();
    const scanTargets = testcodes.flatMap((testcode) =>
      ANSWER_SHEET_ROOTS.map((root) => ({ root, testcode }))
    );
    await mapWithConcurrency(scanTargets, 4, async ({ root, testcode }) => {
      const prefix = `${root}/${testcode}/`;
      const { objects } = await listS3Objects(s3, process.env.AWS_BUCKET_NAME, prefix);
      for (const object of objects) {
        if (!object.Key || !/\.(jpg|jpeg|png)$/i.test(object.Key)) continue;
        const [districtFolder, subjectFolder, batchname, ...fileParts] = object.Key.slice(prefix.length).split("/");
        if (!districtFolder || !subjectFolder || !batchname || fileParts.length === 0) continue;
        const expectedDistrictPrefix = `${testcode}_`;
        if (!districtFolder.startsWith(expectedDistrictPrefix)) continue;
        const district = districtFolder.slice(expectedDistrictPrefix.length);
        const subject = normalizeUploadSubject(subjectFolder);
        const fileName = fileParts.join("/");
        const logicalFileKey = `${testcode}\u0000${district}\u0000${subject}\u0000${batchname}\u0000${fileName}`;
        const existing = logicalImages.get(logicalFileKey);
        if (existing) {
          existing.roots.add(root);
        }
        if (!existing || root === ANSWER_SHEET_ROOTS[0]) {
          logicalImages.set(logicalFileKey, {
            testcode,
            district,
            subject,
            batchname,
            roots: existing?.roots || new Set([root]),
            lastModified: object.LastModified || null,
          });
        }
      }
    });

    const s3Papers = new Map();
    for (const image of logicalImages.values()) {
      const paperKey = `${image.testcode}\u0000${image.district}\u0000${image.subject}\u0000${image.batchname}`;
      if (!s3Papers.has(paperKey)) s3Papers.set(paperKey, { ...image, roots: new Set(), imageCount: 0 });
      const paper = s3Papers.get(paperKey);
      paper.imageCount += 1;
      image.roots.forEach((root) => paper.roots.add(root));
      if (image.lastModified && (!paper.lastModified || image.lastModified > paper.lastModified)) {
        paper.lastModified = image.lastModified;
      }
    }

    const importByPaper = new Map();
    for (const row of importRows) {
      const key = `${String(row.testcode || "").trim()}\u0000${String(row.dcode || "").padStart(2, "0")}\u0000${normalizeUploadSubject(row.subcode)}\u0000${row.batchname}`;
      importByPaper.set(key, row);
    }

    const districts = new Map();
    const paperData = [];
    const getDistrict = (district) => {
      const code = String(district || "Unknown").padStart(2, "0");
      if (!districts.has(code)) {
        districts.set(code, createDistrictAccumulator(code, districtNames.get(code) || ""));
      }
      return districts.get(code);
    };
    const seenImportIds = new Set();

    for (const [paperKey, paper] of s3Papers) {
      const district = getDistrict(paper.district);
      const importRow = importByPaper.get(paperKey);
      district.testcodes.add(paper.testcode);
      district.roll_numbers.add(paper.batchname);
      district.s3_papers += 1;
      district.s3_images += paper.imageCount;
      if (paper.lastModified && (!district.last_upload_at || paper.lastModified > district.last_upload_at)) {
        district.last_upload_at = paper.lastModified;
      }

      const detailKey = `${paper.testcode}\u0000${paper.subject}`;
      if (!district.details.has(detailKey)) {
        district.details.set(detailKey, {
          testcode: paper.testcode,
          subject: paper.subject,
          roll_numbers: new Set(),
          s3_papers: 0,
          s3_images: 0,
          imported_papers: 0,
          not_imported: 0,
          image_complete: 0,
          image_incomplete: 0,
          ready: 0,
          opened: 0,
          completed: 0,
          image_pending: 0,
        });
      }
      const detail = district.details.get(detailKey);
      detail.roll_numbers.add(paper.batchname);
      detail.s3_papers += 1;
      detail.s3_images += paper.imageCount;

      if (!importRow) {
        district.not_imported += 1;
        detail.not_imported += 1;
        paperData.push({
          district: paper.district,
          district_name: district.district_name,
          testcode: paper.testcode,
          subject: paper.subject,
          roll_number: paper.batchname,
          answer_sheet_uploaded: paper.roots.has(ANSWER_SHEET_ROOTS[1]),
          move_answer_sheet_uploaded: paper.roots.has(ANSWER_SHEET_ROOTS[0]),
          s3_images: paper.imageCount,
          expected_images: null,
          image_difference: null,
          imported: false,
          evaluator_id: null,
          processing_status: "Not imported",
          next_action: "Import TXT data",
          last_upload_at: paper.lastModified,
        });
        continue;
      }

      seenImportIds.add(importRow.id);
      district.imported_papers += 1;
      detail.imported_papers += 1;
      const expectedImages = toNumber(importRow.ImgCnt);
      const complete = paper.imageCount >= expectedImages && paper.imageCount > 0;
      district[complete ? "image_complete" : "image_incomplete"] += 1;
      detail[complete ? "image_complete" : "image_incomplete"] += 1;
      if (importRow.Checked === "Yes" && importRow.E_flg === "Y") {
        district.completed += 1;
        detail.completed += 1;
      } else if (importRow.E_flg === "A") {
        district.opened += 1;
        detail.opened += 1;
      } else if (importRow.E_flg === "N") {
        district.ready += 1;
        detail.ready += 1;
      } else if (importRow.E_flg === "I") {
        district.image_pending += 1;
        detail.image_pending += 1;
      }
      const processingStatus = importRow.Checked === "Yes" && importRow.E_flg === "Y"
        ? "Completed"
        : !complete
          ? "Images incomplete"
          : importRow.E_flg === "A"
            ? "Opened"
            : importRow.E_flg === "N"
              ? "Ready"
              : importRow.E_flg === "I"
                ? "Image pending"
                : "Imported";
      const nextAction = processingStatus === "Completed"
        ? "No action"
        : processingStatus === "Images incomplete"
          ? "Complete image upload"
          : processingStatus === "Opened"
            ? "Monitor evaluator"
            : processingStatus === "Ready"
              ? "Ready for valuation"
              : processingStatus === "Image pending"
                ? "Run image check"
                : "Review paper";
      paperData.push({
        district: paper.district,
        district_name: district.district_name,
        testcode: paper.testcode,
        subject: paper.subject,
        roll_number: paper.batchname,
        answer_sheet_uploaded: paper.roots.has(ANSWER_SHEET_ROOTS[1]),
        move_answer_sheet_uploaded: paper.roots.has(ANSWER_SHEET_ROOTS[0]),
        s3_images: paper.imageCount,
        expected_images: expectedImages,
        image_difference: paper.imageCount - expectedImages,
        imported: true,
        import_id: importRow.id,
        evaluator_id: importRow.Evaluator_Id || null,
        processing_status: processingStatus,
        next_action: nextAction,
        last_upload_at: paper.lastModified,
      });
    }

    for (const row of importRows) {
      if (seenImportIds.has(row.id) || !row.dcode) continue;
      const district = getDistrict(row.dcode);
      district.database_without_s3 += 1;
      district.testcodes.add(String(row.testcode || "Unassigned").trim());
      paperData.push({
        district: String(row.dcode).padStart(2, "0"),
        district_name: district.district_name,
        testcode: String(row.testcode || "Unassigned").trim(),
        subject: normalizeUploadSubject(row.subcode),
        roll_number: row.batchname,
        answer_sheet_uploaded: false,
        move_answer_sheet_uploaded: false,
        s3_images: 0,
        expected_images: toNumber(row.ImgCnt),
        image_difference: -toNumber(row.ImgCnt),
        imported: true,
        import_id: row.id,
        evaluator_id: row.Evaluator_Id || null,
        processing_status: "Missing in S3",
        next_action: "Upload answer-sheet images",
        last_upload_at: null,
      });
    }

    const configuredDistricts = districtRows.map((row) => String(row.DCODE || "").padStart(2, "0"));
    configuredDistricts.forEach((district) => getDistrict(district));

    const districtData = [...districts.values()].map((district) => ({
      ...district,
      testcodes: [...district.testcodes].filter(Boolean).sort(),
      roll_numbers: district.roll_numbers.size,
      upload_status: district.s3_papers === 0
        ? "Not uploaded"
        : district.not_imported > 0 || district.image_incomplete > 0 || district.database_without_s3 > 0
          ? "Needs attention"
          : "Ready",
      details: [...district.details.values()].map((detail) => ({
        ...detail,
        roll_numbers: detail.roll_numbers.size,
      })).sort((left, right) => `${left.testcode}${left.subject}`.localeCompare(`${right.testcode}${right.subject}`)),
    })).sort((left, right) => left.district.localeCompare(right.district));

    const uploadedDistrictCodes = new Set(districtData.filter((row) => row.s3_papers > 0).map((row) => row.district));
    const uniqueRollNumbers = new Set([...s3Papers.values()].map((paper) => paper.batchname));
    const rollNumberUploads = new Set([...s3Papers.values()].map((paper) => `${paper.testcode}\u0000${paper.district}\u0000${paper.batchname}`));
    const summary = {
      configured_districts: new Set(configuredDistricts).size,
      uploaded_districts: uploadedDistrictCodes.size,
      districts_not_uploaded: new Set(configuredDistricts.filter((code) => !uploadedDistrictCodes.has(code))).size,
      testcodes: testcodes.length,
      roll_numbers: uniqueRollNumbers.size,
      roll_number_uploads: rollNumberUploads.size,
      s3_papers: s3Papers.size,
      s3_images: logicalImages.size,
      imported_papers: districtData.reduce((sum, row) => sum + row.imported_papers, 0),
      not_imported: districtData.reduce((sum, row) => sum + row.not_imported, 0),
      ready: districtData.reduce((sum, row) => sum + row.ready, 0),
      opened: districtData.reduce((sum, row) => sum + row.opened, 0),
      completed: districtData.reduce((sum, row) => sum + row.completed, 0),
      image_incomplete: districtData.reduce((sum, row) => sum + row.image_incomplete, 0),
      database_without_s3: districtData.reduce((sum, row) => sum + row.database_without_s3, 0),
    };

    return {
      status: "success",
      generated_at: new Date().toISOString(),
      cache_ttl_seconds: S3_CACHE_TTL_MS / 1000,
      summary,
      districts: districtData,
      papers: paperData.sort((left, right) =>
        `${left.processing_status}|${left.district}|${left.testcode}|${left.roll_number}`
          .localeCompare(`${right.processing_status}|${right.district}|${right.testcode}|${right.roll_number}`)
      ),
    };
  } finally {
    s3.destroy();
  }
};

const getModelSchoolUploadInventory = catchAsync(async (req, res, next) => {
  requireModelSchoolAdministrator(req);
  const forceRefresh = String(req.query.refresh || "").toLowerCase() === "true";
  const now = Date.now();

  if (!forceRefresh && uploadInventoryCache.data && uploadInventoryCache.expiresAt > now) {
    return res.status(200).json({ ...uploadInventoryCache.data, cached: true });
  }
  if (!uploadInventoryCache.promise) {
    uploadInventoryCache.promise = buildUploadInventory()
      .then((data) => {
        uploadInventoryCache = {
          data,
          expiresAt: Date.now() + S3_CACHE_TTL_MS,
          promise: null,
        };
        return data;
      })
      .catch((error) => {
        uploadInventoryCache.promise = null;
        throw error;
      });
  }
  const data = await uploadInventoryCache.promise;
  res.status(200).json({ ...data, cached: false });
});

const getModelSchoolAdministratorDashboard = catchAsync(async (req, res, next) => {
  requireModelSchoolAdministrator(req);

  const [statusRows, districtSubjectRows, s3Rows, districtRows, recentOpenPapers, dailyRows] = await Promise.all([
    db.sequelize.query(`
      SELECT
        COALESCE(NULLIF(TRIM("testcode"), ''), 'Unassigned') AS testcode,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "Checked" = 'Yes' AND "E_flg" = 'Y')::int AS valuated,
        COUNT(*) FILTER (WHERE NOT ("Checked" = 'Yes' AND "E_flg" = 'Y'))::int AS pending,
        COUNT(*) FILTER (WHERE "E_flg" = 'A' AND COALESCE("Checked", 'NO') <> 'Yes')::int AS opened_not_finished,
        COUNT(*) FILTER (WHERE "E_flg" = 'N')::int AS ready,
        COUNT(*) FILTER (WHERE "E_flg" = 'I')::int AS image_pending,
        COUNT(*) FILTER (WHERE "reject_flg" = 'Y')::int AS rejected,
        COALESCE(SUM(COALESCE(NULLIF("ImgCnt", ''), '0')::int), 0)::int AS expected_images
      FROM "import1"
      GROUP BY 1
      ORDER BY 1
    `, { type: QueryTypes.SELECT }),
    db.sequelize.query(`
      SELECT
        COALESCE(NULLIF(TRIM(i."testcode"), ''), 'Unassigned') AS testcode,
        COALESCE(NULLIF(TRIM(i."dcode"), ''), 'Unknown') AS district,
        i."subcode" AS subcode,
        COALESCE(MAX(s."SUBNAME"), i."subcode") AS subject_name,
        COUNT(*)::int AS paper_count,
        COALESCE(SUM(COALESCE(NULLIF(i."ImgCnt", ''), '0')::int), 0)::int AS expected_image_count,
        COUNT(*) FILTER (WHERE i."Checked" = 'Yes' AND i."E_flg" = 'Y')::int AS valuated,
        COUNT(*) FILTER (WHERE i."E_flg" = 'A' AND COALESCE(i."Checked", 'NO') <> 'Yes')::int AS opened_not_finished,
        COUNT(*) FILTER (WHERE i."E_flg" = 'N')::int AS ready,
        COUNT(*) FILTER (WHERE i."E_flg" = 'I')::int AS image_pending
      FROM "import1" i
      LEFT JOIN "sub_master" s
        ON s."Subcode" = i."subcode"
       AND TRIM(COALESCE(s."testcode", '')) = TRIM(COALESCE(i."testcode", ''))
      GROUP BY 1, 2, i."subcode"
      ORDER BY 1, 2, i."subcode"
    `, { type: QueryTypes.SELECT }),
    db.sequelize.query(`
      SELECT
        TRIM(COALESCE("Test_Code", 'Unassigned')) AS testcode,
        COALESCE(NULLIF(TRIM("D_Code"), ''), 'Unknown') AS district,
        COUNT(*)::int AS indexed_images,
        MAX("updatedAt") AS last_indexed_at
      FROM "imgmaster"
      GROUP BY 1, 2
    `, { type: QueryTypes.SELECT }),
    db.District_Master.findAll({ attributes: ["DCODE", "DNAME"], raw: true }),
    db.sequelize.query(`
      SELECT
        "barcode", "testcode", "dcode", "subcode", "Evaluator_Id",
        "A_date", "ImgCnt", "Eva_Mon_Year"
      FROM "import1"
      WHERE "E_flg" = 'A' AND COALESCE("Checked", 'NO') <> 'Yes'
      ORDER BY "updatedAt" DESC
      LIMIT 100
    `, { type: QueryTypes.SELECT }),
    db.sequelize.query(`
      SELECT SUBSTRING("checkdate", 1, 10) AS correction_date, COUNT(*)::int AS valuated
      FROM "import1"
      WHERE "Checked" = 'Yes' AND "E_flg" = 'Y' AND COALESCE("checkdate", '') <> ''
      GROUP BY 1
      ORDER BY MIN("updatedAt") DESC
      LIMIT 14
    `, { type: QueryTypes.SELECT })
  ]);

  const districtNames = new Map(
    districtRows.map((district) => [String(district.DCODE || "").padStart(2, "0"), district.DNAME])
  );
  const s3ByLocation = new Map(
    s3Rows.map((row) => [`${row.testcode}|${row.district}`, row])
  );
  const districtSubject = districtSubjectRows.map((row) => {
    const s3 = s3ByLocation.get(`${row.testcode}|${row.district}`);
    return {
      ...row,
      subject: normalizeSubject(row.subcode),
      district_name: districtNames.get(String(row.district).padStart(2, "0")) || "",
      s3_indexed_images: toNumber(s3?.indexed_images),
      s3_last_indexed_at: s3?.last_indexed_at || null
    };
  });

  const summary = statusRows.reduce((totals, row) => ({
    total: totals.total + toNumber(row.total),
    valuated: totals.valuated + toNumber(row.valuated),
    pending: totals.pending + toNumber(row.pending),
    opened_not_finished: totals.opened_not_finished + toNumber(row.opened_not_finished),
    ready: totals.ready + toNumber(row.ready),
    image_pending: totals.image_pending + toNumber(row.image_pending),
    rejected: totals.rejected + toNumber(row.rejected),
    expected_images: totals.expected_images + toNumber(row.expected_images)
  }), {
    total: 0,
    valuated: 0,
    pending: 0,
    opened_not_finished: 0,
    ready: 0,
    image_pending: 0,
    rejected: 0,
    expected_images: 0
  });

  summary.completion_percentage = summary.total
    ? Number(((summary.valuated / summary.total) * 100).toFixed(1))
    : 0;
  summary.s3_indexed_images = s3Rows.reduce(
    (total, row) => total + toNumber(row.indexed_images),
    0
  );

  res.status(200).json({
    status: "success",
    generated_at: new Date().toISOString(),
    summary,
    testcodes: statusRows.map((row) => ({
      ...row,
      completion_percentage: toNumber(row.total)
        ? Number(((toNumber(row.valuated) / toNumber(row.total)) * 100).toFixed(1))
        : 0
    })),
    district_subject: districtSubject,
    daily_activity: dailyRows.reverse(),
    open_papers: recentOpenPapers.map((row) => ({
      ...row,
      subject: normalizeSubject(row.subcode),
      district_name: districtNames.get(String(row.dcode || "").padStart(2, "0")) || ""
    })),
    definitions: {
      valuated: "Correction completed and finalized",
      pending: "All papers not yet finalized",
      opened_not_finished: "Assigned to an evaluator but not finalized",
      ready: "Images verified and waiting for an evaluator",
      image_pending: "Imported but image verification is pending",
      expected_images: "Expected answer-sheet images recorded during import",
      s3_indexed_images: "Images recorded by the S3 upload service"
    }
  });
});

const getModelSchoolStudentMarks = catchAsync(async (req, res, next) => {
  requireModelSchoolAdministrator(req);

  const testcode = String(req.query.testcode || "").trim();
  const district = String(req.query.district || "").trim();
  if (!testcode) {
    return next(new AppError("Testcode is required", 400));
  }

  const [subjectRows, districtRows, markRows] = await Promise.all([
    db.sub_master.findAll({
      where: { testcode },
      attributes: ["Subcode"],
      raw: true,
    }),
    db.import1.findAll({
      where: { testcode },
      attributes: ["dcode"],
      group: ["dcode"],
      order: [["dcode", "ASC"]],
      raw: true,
    }),
    db.import1.findAll({
      where: { testcode, ...(district ? { dcode: district } : {}) },
      attributes: ["batchname", "dcode", "subcode", "total", "tot_round", "Checked"],
      order: [["batchname", "ASC"], ["subcode", "ASC"]],
      raw: true,
    }),
  ]);

  const subjectSet = new Set([
    ...subjectRows.map((row) => getStudentMarkSubject(row.Subcode)),
    ...markRows.map((row) => getStudentMarkSubject(row.subcode)),
  ].filter(Boolean));
  const subjects = ["Physics", "Chemistry", "Maths", "Biology"].filter((subject) => subjectSet.has(subject));
  const rows = markRows
    .map((row) => ({ ...row, subject: getStudentMarkSubject(row.subcode) }))
    .filter((row) => row.batchname && row.subject);

  res.status(200).json({
    status: "success",
    testcode,
    district,
    districts: districtRows.map((row) => String(row.dcode || "").trim()).filter(Boolean),
    subjects,
    rows,
  });
});

module.exports = {
  getDashboardData,
  getModelSchoolAdministratorDashboard,
  getModelSchoolUploadInventory,
  getModelSchoolStudentMarks,
};
