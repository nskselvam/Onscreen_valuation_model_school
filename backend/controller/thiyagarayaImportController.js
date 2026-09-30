const asyncHandler = require("express-async-handler");
const {
  Image_Check,
  getSubjectCode,
  getTableCount,
} = require("./excelTextController");

// Separate controller entry points for Thiagaraya import flow.
const thiyagarayaImportData = asyncHandler(async (req, res) => {
  const {
    excelData = [],
    excelFileName = "",
    uploadFileType = "",
    degreeName = "",
    semMonth = "",
    semYear = "",
  } = req.body || {};

  if (!Array.isArray(excelData) || excelData.length === 0) {
    return res.status(400).json({
      message: "No Excel data received",
      ErrorFlag: true,
      extractedCount: 0,
      invalidCount: 0,
      extractedRows: [],
      invalidRows: [],
    });
  }

  const readField = (row, keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        return row[key];
      }
    }
    return "";
  };

  const extractedRows = [];
  const invalidRows = [];

  excelData.forEach((row, index) => {
    const regId = String(readField(row, ["REG ID", "REG_ID", "RegId", "RegisterNo"]))
      .trim();
    const courseCode = String(readField(row, ["COURSE CODE", "COURSE_CODE", "CourseCode", "SubjectCode"]))
      .trim();
    const dummy = String(readField(row, ["DUMMY", "Dummy", "DUMMY_NO", "Dummy_NO", "Barcode"]))
      .trim();

    if (!regId || !courseCode || !dummy) {
      invalidRows.push({
        rowNumber: index + 1,
        regId,
        courseCode,
        dummy,
        error: "Missing REG ID / COURSE CODE / DUMMY",
      });
      return;
    }

    extractedRows.push({
      rowNumber: index + 1,
      regId,
      courseCode,
      dummy,
      degreeName,
      evaMonYear: `${semMonth}_${semYear}`,
    });
  });

  const duplicateDummySet = new Set();
  const seenDummy = new Set();
  extractedRows.forEach((row) => {
    if (seenDummy.has(row.dummy)) duplicateDummySet.add(row.dummy);
    seenDummy.add(row.dummy);
  });

  console.log("thiyagarayaImportData controller invoked");
  console.log("Extract summary:", {
    excelFileName,
    uploadFileType,
    degreeName,
    semMonth,
    semYear,
    totalRows: excelData.length,
    extractedCount: extractedRows.length,
    invalidCount: invalidRows.length,
    duplicateDummyCount: duplicateDummySet.size,
  });

  return res.status(200).json({
    message: "Thiagaraya import data extracted successfully",
    ErrorFlag: false,
    excelFileName,
    uploadFileType,
    degreeName,
    semMonth,
    semYear,
    totalRows: excelData.length,
    extractedCount: extractedRows.length,
    invalidCount: invalidRows.length,
    duplicateDummyCount: duplicateDummySet.size,
    duplicateDummies: Array.from(duplicateDummySet),
    extractedRows,
    invalidRows,
  });
});

const thiyagarayaImageCheck = asyncHandler(async (req, res, next) => {
});

const thiyagarayaGetSubjectCode = asyncHandler(async (req, res, next) => {
});

const thiyagarayaGetTableCount = asyncHandler(async (req, res, next) => {
});

module.exports = {
  thiyagarayaImportData,
  thiyagarayaImageCheck,
  thiyagarayaGetSubjectCode,
  thiyagarayaGetTableCount,
};
