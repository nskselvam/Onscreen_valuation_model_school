const db = require("../db/models");
const { testMaster, jee_marks } = db;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { QueryTypes } = require("sequelize");

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

const getModelSchoolAdministratorDashboard = catchAsync(async (req, res, next) => {
  if (String(req.user?.Role || "") !== "13") {
    return next(new AppError("Model School Administrator access required", 403));
  }

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

module.exports = {
  getDashboardData,
  getModelSchoolAdministratorDashboard,
};
