const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const db = require("../db/models");

const studentResultData = db.student_result_data;
const candidateReviewremarks = db.candidateReviewremarks;

const getThiyagarayaReviewData = asyncHandler(async (req, res) => {
  const payload =
    req.body && Object.keys(req.body).length ? req.body : req.query || {};
  const { Dep_Name = "", Eva_Mon_Year = "", username = "" } = payload;

  const where = {
    Valuation_Type: 1,
  };

  if (Dep_Name) {
    where.Dep_Name = String(Dep_Name).trim();
  }

  if (Eva_Mon_Year) {
    where.Eva_Mon_Year = String(Eva_Mon_Year).trim();
  }

  if (username) {
    where.RegisterNo = String(username).trim();
  }

  const reviewData = await studentResultData.findAll({
    where,
    attributes: [
      "RegisterNo",
      "studentname",
      "StudentMobileno",
      "StudentOfficalEmailID",
      "StudentContactNo",
      "StudentPersonalEmailID",
      "Dummy_NO",
      "SubjectCode",
      "Evaluator_Id",
      "Dep_Name",
      "Eva_Mon_Year",
      "Valuation_Type",
      "FACULTY_NAME",
      "Import_Date",
      "reviewStatus",
      "updatedAt",
    ],
    order: [["updatedAt", "DESC"]],
  });

  return res.status(200).json({
    message: "Thiagaraya review data fetched successfully",
    totalCount: reviewData.length,
    reviewData,
  });
});

const getThiyagarayaReviewMainData = asyncHandler(async (req, res) => {
  const payload =
    req.body && Object.keys(req.body).length ? req.body : req.query || {};
  const {
    Dummy_NO = "",
    SubjectCode = "",
    RegisterNo = "",
    Eva_Mon_Year = "",
    Valuation_Type = "",
    Dep_Name = "",
  } = payload;

  // This flow should use first valuation only.
  const normalizedValuationType = "1";

  const totalMarks = await db.import1.findAll({
    where: {
      barcode: Dummy_NO,
      subcode: SubjectCode,
    },
    attributes: ["tot_round"],
  });

  const fl_name = db[`val_data_${Dep_Name}`];

  const studentValData = await fl_name.findAll({
    where: {
      barcode: Dummy_NO,
      subcode: SubjectCode,
      valuation_type: normalizedValuationType,
    },
  });

  const totalPage = await db.import1.findOne({
    where: {
      batchname: Dummy_NO,
      subcode: SubjectCode,
    },
    attributes: ["ImgCnt"],
  });

  return res.status(200).json({
    message: "Thiagaraya review-main route ready. Waiting for data contract.",
    filters: {
      Dummy_NO,
      SubjectCode,
      RegisterNo,
      Eva_Mon_Year,
      Valuation_Type: normalizedValuationType,
      Dep_Name,
      totalMarks: totalMarks.length > 0 ? totalMarks[0].tot_round : null,
      studentValData: studentValData || null,
      totalPage: totalPage ? totalPage.ImgCnt : null,
    },
  });
});

const updateThiyagarayaReviewDecision = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const {
    Dummy_NO = "",
    SubjectCode = "",
    RegisterNo = "",
    reviewStatus = "",
    studentMessage = "",
  } = payload;

  if (!Dummy_NO || !SubjectCode || !reviewStatus) {
    return res.status(400).json({
      message: "Dummy_NO, SubjectCode and reviewStatus are required",
    });
  }

  const where = {
    Dummy_NO: String(Dummy_NO).trim(),
    SubjectCode: String(SubjectCode).trim(),
  };

  if (RegisterNo) {
    where.RegisterNo = String(RegisterNo).trim();
  }

  const updateData = {
    reviewStatus: String(reviewStatus).trim(),
  };

  const [updatedCount] = await studentResultData.update(updateData, { where });

  return res.status(200).json({
    message: "Thiagaraya review decision updated successfully",
    updatedCount,
    filters: where,
    studentMessage: studentMessage ? String(studentMessage).trim() : "",
  });
});

const normalizeRemarkPayload = (payload = {}) => {
  const cleanString = (value, fallback = "NA") => {
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
  };

  const cleanLimitedString = (value, fallback, maxLength) => {
    return cleanString(value, fallback).slice(0, maxLength);
  };

  const {
    Dep_Name = "",
    Dummy_NO = "",
    SubjectCode = "",
    sec_id = "",
    qbno = "",
    section = "",
    sub_section = "",
    add_sub_section = "",
    reviewRemarks = "",
    reviewRemarks_data = "",
    valuation_type = "1",
    Examiner_type = "8",
  } = payload;

  const incomingSecId = Number(sec_id);
  const incomingQbno = Number(qbno);

  return {
    incomingSecId,
    incomingQbno,
    data: {
      Dep_Name: cleanLimitedString(Dep_Name, "NA", 15),
      sec_id: incomingSecId,
      barcode: cleanLimitedString(Dummy_NO, "NA", 20),
      qbno: incomingQbno,
      subcode: cleanLimitedString(SubjectCode, "NA", 25),
      section: cleanLimitedString(section, "NA", 5),
      sub_section: cleanLimitedString(sub_section, "NA", 5),
      add_sub_section: cleanLimitedString(add_sub_section, "NA", 5),
      reviewRemarks: cleanLimitedString(reviewRemarks, "No message entered", 255),
      reviewRemarks_data: cleanLimitedString(reviewRemarks_data, "General remarks", 255),
      valuation_type: cleanString(valuation_type, "1").slice(0, 1),
      Examiner_type: cleanString(Examiner_type, "8").slice(0, 1),
    },
  };
};

const buildCoreRemarkWhere = (normalized) => ({
  sec_id: normalized.data.sec_id,
  barcode: normalized.data.barcode,
  subcode: normalized.data.subcode,
  section: normalized.data.section,
  qbno: normalized.data.qbno,
  valuation_type: normalized.data.valuation_type,
  Examiner_type: normalized.data.Examiner_type,
});

const getThiyagarayaReviewRemark = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const normalized = normalizeRemarkPayload(payload);

  if (
    Number.isNaN(normalized.incomingSecId) ||
    normalized.incomingSecId <= 0 ||
    Number.isNaN(normalized.incomingQbno) ||
    normalized.incomingQbno <= 0
  ) {
    return res.status(400).json({
      message: "sec_id and qbno must be valid positive numbers",
    });
  }

  const coreWhere = buildCoreRemarkWhere(normalized);
  const row = await candidateReviewremarks.findOne({
    where: {
      ...coreWhere,
      [Op.or]: [
        {
          sub_section: normalized.data.sub_section,
          add_sub_section: normalized.data.add_sub_section,
        },
        {
          sub_section: { [Op.in]: [null, "", "NA"] },
          add_sub_section: { [Op.in]: [null, "", "NA"] },
        },
      ],
    },
    order: [["updatedAt", "DESC"]],
  });

  return res.status(200).json({
    message: "Thiagaraya review remark fetched successfully",
    data: row || null,
  });
});

const getThiyagarayaStudentRemarks = asyncHandler(async (req, res) => {
  const payload = req.body && Object.keys(req.body).length ? req.body : req.query || {};
  const valuation_type = String(payload.valuation_type || "").trim();
  const Dep_Name = String(payload.Dep_Name || "").trim();
  const Examiner_type = String(payload.Examiner_type || "").trim();
  const Dummy_NO = String(payload.Dummy_NO || "").trim();
  const SubjectCode = String(payload.SubjectCode || "").trim();

  const where = {};

  if (Examiner_type) {
    where.Examiner_type = Examiner_type;
  }

  if (Dummy_NO) {
    where.barcode = Dummy_NO;
  }

  if (SubjectCode) {
    where.subcode = SubjectCode;
  }

  const data = await candidateReviewremarks.findAll({
    where,
    order: [["updatedAt", "DESC"]],
  });

  const uniqueBarcodes = [
    ...new Set(
      data
        .map((row) => String(row.barcode || "").trim())
        .filter((barcode) => barcode.length > 0)
    ),
  ];

  const evaluatorRows = uniqueBarcodes.length
    ? await studentResultData.findAll({
        where: {
          Dummy_NO: {
            [Op.in]: uniqueBarcodes,
          },
        },
        attributes: ["Dummy_NO", "Evaluator_Id"],
        raw: true,
      })
    : [];

  const evaluatorByDummyNo = new Map();
  evaluatorRows.forEach((row) => {
    const dummyNo = String(row.Dummy_NO || "").trim();
    if (dummyNo && !evaluatorByDummyNo.has(dummyNo)) {
      evaluatorByDummyNo.set(dummyNo, row.Evaluator_Id || null);
    }
  });

  const uniqueSubcodes = [
    ...new Set(
      data
        .map((row) => String(row.subcode || "").trim())
        .filter((subcode) => subcode.length > 0)
    ),
  ];

  const subMasterWhere = {
    Subcode: {
      [Op.in]: uniqueSubcodes,
    },
  };

  if (Dep_Name) {
    subMasterWhere.Dep_Name = Dep_Name;
  }

  const subjectRows = uniqueSubcodes.length
    ? await db.sub_master.findAll({
        where: subMasterWhere,
        attributes: ["Subcode", "SUBNAME"],
        raw: true,
      })
    : [];

  const subjectNameBySubcode = new Map();
  subjectRows.forEach((row) => {
    const subcode = String(row.Subcode || "").trim();
    if (subcode && !subjectNameBySubcode.has(subcode)) {
      subjectNameBySubcode.set(subcode, row.SUBNAME || null);
    }
  });

  const importEvaluatorRows =
    uniqueBarcodes.length && uniqueSubcodes.length
      ? await db.import1.findAll({
          where: {
            barcode: {
              [Op.in]: uniqueBarcodes,
            },
            subcode: {
              [Op.in]: uniqueSubcodes,
            },
          },
          attributes: ["barcode", "subcode", "Evaluator_Id"],
          raw: true,
        })
      : [];

  const importEvaluatorByKey = new Map();
  const importEvaluatorByBarcode = new Map();
  importEvaluatorRows.forEach((row) => {
    const barcode = String(row.barcode || "").trim();
    const subcode = String(row.subcode || "").trim();
    const key = `${barcode}::${subcode}`;

    if (barcode && subcode && !importEvaluatorByKey.has(key)) {
      importEvaluatorByKey.set(key, row.Evaluator_Id || null);
    }

    if (barcode && !importEvaluatorByBarcode.has(barcode)) {
      importEvaluatorByBarcode.set(barcode, row.Evaluator_Id || null);
    }
  });

  // Prefer valuation_type table as requested; fallback to Dep_Name table.
  const valDataModel =
    (valuation_type ? db[`val_data_${valuation_type}`] : null) ||
    (Dep_Name ? db[`val_data_${Dep_Name}`] : null);

  const valDataRows =
    valDataModel && uniqueBarcodes.length && uniqueSubcodes.length
      ? await valDataModel.findAll({
          where: {
            barcode: {
              [Op.in]: uniqueBarcodes,
            },
            subcode: {
              [Op.in]: uniqueSubcodes,
            },
          },
          attributes: [
            "barcode",
            "subcode",
            "sec_id",
            "section",
            "qbno",
            "sub_section",
            "add_sub_section",
            "Marks_Get",
            "page_no",
            "Qbs_Page_No",
          ],
          raw: true,
        })
      : [];

  const normalizePart = (value) => {
    const normalized = String(value ?? "").trim();
    return normalized === "" ? "NA" : normalized;
  };

  const getValDataKey = (item) =>
    [
      normalizePart(item.barcode),
      normalizePart(item.subcode),
      normalizePart(item.sec_id),
      normalizePart(item.section),
      normalizePart(item.qbno),
      normalizePart(item.sub_section),
      normalizePart(item.add_sub_section),
    ].join("::");

  const valDataByKey = new Map();
  valDataRows.forEach((row) => {
    const key = getValDataKey(row);
    if (!valDataByKey.has(key)) {
      valDataByKey.set(key, row);
    }
  });

  const remarksWithEvaluator = data.map((row) => {
    const rowJson = row.toJSON();
    const dummyNo = String(rowJson.barcode || "").trim();
    const subcode = String(rowJson.subcode || "").trim();
    const importKey = `${dummyNo}::${subcode}`;
    const valDataRow = valDataByKey.get(getValDataKey(rowJson));
    const evaluatorId =
      evaluatorByDummyNo.get(dummyNo) ||
      importEvaluatorByKey.get(importKey) ||
      importEvaluatorByBarcode.get(dummyNo) ||
      null;
    const subname = subjectNameBySubcode.get(subcode) || null;

    return {
      ...rowJson,
      subname,
      evaluatorId,
      Marks_Get: valDataRow ? valDataRow.Marks_Get : null,
      page_no: valDataRow ? valDataRow.page_no : null,
      Qbs_Page_No: valDataRow ? valDataRow.Qbs_Page_No : null,
    };
  });

  return res.status(200).json({
    message: "Thiagaraya student remarks fetched successfully",
    remarks: remarksWithEvaluator,
  });
});

const getThiyagarayaCandidateRemarksByDummy = asyncHandler(async (req, res) => {
  const payload =
    req.body && Object.keys(req.body).length ? req.body : req.query || {};


  const Dummy_NO = String(payload.Dummy_NO || "").trim();
  const SubjectCode = String(payload.SubjectCode || "").trim();
  const valuation_type = String(payload.valuation_type || "").trim();
  const Examiner_type = String(payload.Examiner_type || "8").trim();

  if (!Dummy_NO) {
    return res.status(400).json({
      message: "Dummy_NO is required",
    });
  }

  const where = {
    barcode: Dummy_NO,
  };

  if (SubjectCode) {
    where.subcode = SubjectCode;
  }

  const data = await candidateReviewremarks.findAll({
    where,
    order: [["updatedAt", "DESC"]],
  });

  console.log(`Fetched ${data.length} candidate remarks for Dummy_NO: ${Dummy_NO}`);

  return res.status(200).json({
    message: "Candidate remarks fetched successfully",
    data,
  });
});

const saveThiyagarayaReviewRemark = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  if (
    !payload.Dummy_NO ||
    !payload.SubjectCode ||
    !payload.section ||
    !payload.qbno ||
    !payload.reviewRemarks ||
    !payload.sec_id
  ) {
    return res.status(400).json({
      message:
        "Dummy_NO, SubjectCode, sec_id, section, qbno and reviewRemarks are required",
    });
  }

  const normalized = normalizeRemarkPayload(payload);
  const incomingSecId = normalized.incomingSecId;
  const incomingQbno = normalized.incomingQbno;

  if (Number.isNaN(incomingSecId) || incomingSecId <= 0) {
    return res
      .status(400)
      .json({ message: "sec_id must be a valid positive number" });
  }

  if (Number.isNaN(incomingQbno) || incomingQbno <= 0) {
    return res
      .status(400)
      .json({ message: "qbno must be a valid positive number" });
  }

  const coreWhere = buildCoreRemarkWhere(normalized);
  const data = normalized.data;
  const matchWhere = {
    ...coreWhere,
    [Op.or]: [
      {
        sub_section: data.sub_section,
        add_sub_section: data.add_sub_section,
      },
      {
        sub_section: { [Op.in]: [null, "", "NA"] },
        add_sub_section: { [Op.in]: [null, "", "NA"] },
      },
    ],
  };

  const [updatedCount] = await candidateReviewremarks.update(data, {
    where: matchWhere,
  });

  if (updatedCount > 0) {
    const latest = await candidateReviewremarks.findOne({
      where: matchWhere,
      order: [["updatedAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Thiagaraya review remark updated successfully",
      updatedCount,
      data: latest || data,
    });
  }

  const created = await candidateReviewremarks.create(data);

  return res.status(201).json({
    message: "Thiagaraya review remark saved successfully",
    data: created,
  });
});

module.exports = {
  getThiyagarayaReviewData,
  getThiyagarayaReviewMainData,
  updateThiyagarayaReviewDecision,
  getThiyagarayaReviewRemark,
  getThiyagarayaStudentRemarks,
  getThiyagarayaCandidateRemarksByDummy,
  saveThiyagarayaReviewRemark,
};
