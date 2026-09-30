'use strict';

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../db/models');

const OUTPUT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../../test2qb/All_Students_Valuation_Report_2026-09-30.xlsx');

const IMPORT_TABLES = ['import1', 'import2', 'import3', 'import4'];
const VALUATION_TABLES = Array.from(
  { length: 20 },
  (_, index) => `val_data_${String(index + 1).padStart(2, '0')}`
);

const parseScore = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
};

const parseCorrectionDate = (value) => {
  const match = String(value || '').match(
    /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i
  );
  if (!match) return null;

  let hour = Number(match[4]);
  const meridiem = match[6].toLowerCase();
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  return new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    hour,
    Number(match[5])
  );
};

const getStatus = (row) => {
  if (row.Checked === 'Yes' && row.E_flg === 'Y') return 'Corrected';
  if (row.E_flg === 'A') return 'Assigned';
  if (row.E_flg === 'N') return 'Ready for valuation';
  if (row.E_flg === 'I') return 'Imported - image check pending';
  return row.E_flg || 'Unknown';
};

const styleWorksheet = (worksheet, freezeColumns = 1) => {
  worksheet.views = [{ state: 'frozen', ySplit: 1, xSplit: freezeColumns }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 28;
  worksheet.columns.forEach((column) => {
    column.width = Math.min(Math.max(String(column.header || '').length + 2, 12), 28);
  });
};

const addObjectSheet = (workbook, name, rows, preferredColumns = []) => {
  const worksheet = workbook.addWorksheet(name);
  const allColumns = [...new Set([
    ...preferredColumns,
    ...rows.flatMap((row) => Object.keys(row))
  ])];

  worksheet.columns = allColumns.map((key) => ({ header: key, key }));
  for (const row of rows) worksheet.addRow(row);
  styleWorksheet(worksheet);
  return worksheet;
};

const loadTableRows = async (tableNames, sourceColumn) => {
  const rows = [];
  for (const tableName of tableNames) {
    const [tableRows] = await db.sequelize.query(
      `SELECT *, '${tableName}' AS "${sourceColumn}" FROM "${tableName}" ORDER BY id`
    );
    rows.push(...tableRows);
  }
  return rows;
};

const main = async () => {
  const [[databaseInfo]] = await db.sequelize.query(
    'SELECT current_database() AS database, current_schema() AS schema'
  );
  const importRows = await loadTableRows(IMPORT_TABLES, 'Source_Table');
  const questionRows = await loadTableRows(VALUATION_TABLES, 'Source_Table');
  const subjectRows = await db.sub_master.findAll({ raw: true });
  const remarkRows = await db.valuation_remarks.findAll({ raw: true });
  const facultyRows = await db.faculties.findAll({
    attributes: ['Eva_Id', 'FACULTY_NAME'],
    raw: true
  });
  const userRows = await db.User_Details.findAll({
    attributes: ['User_Id', 'User_Name'],
    raw: true
  });

  const subjectByExactKey = new Map();
  const subjectByCode = new Map();
  for (const subject of subjectRows) {
    const subcode = String(subject.Subcode || '').trim();
    const testcode = String(subject.testcode || '').trim();
    if (!subjectByCode.has(subcode)) subjectByCode.set(subcode, subject);
    subjectByExactKey.set(`${subcode}|${testcode}`, subject);
  }

  const evaluatorNames = new Map();
  for (const user of userRows) {
    if (user.User_Id) evaluatorNames.set(String(user.User_Id), user.User_Name || '');
  }
  for (const faculty of facultyRows) {
    if (faculty.Eva_Id && !evaluatorNames.has(String(faculty.Eva_Id))) {
      evaluatorNames.set(String(faculty.Eva_Id), faculty.FACULTY_NAME || '');
    }
  }

  const malpracticeNumbers = new Set(
    remarkRows
      .filter((row) => String(row.Remarks_Type) === '2')
      .map((row) => String(row.Dummy_Number || ''))
  );

  const enrichedImports = importRows.map((row) => {
    const testcode = String(row.testcode || '').trim();
    const subject = subjectByExactKey.get(`${row.subcode}|${testcode}`)
      || subjectByCode.get(String(row.subcode || '').trim());
    const correctedAt = parseCorrectionDate(row.checkdate);
    return {
      Dummy_Number: row.barcode,
      Subject_Name: subject?.SUBNAME || '',
      Test_Code: testcode,
      Valuation_Round: String(row.Source_Table).replace('import', ''),
      Valuation_Status: getStatus(row),
      Score: parseScore(row.tot_round ?? row.total),
      Raw_Total: row.total,
      Rounded_Total: row.tot_round,
      Corrected_Date_Time: row.checkdate,
      Corrected_Date: correctedAt ? correctedAt.toLocaleDateString('en-GB') : '',
      Evaluator_Name: evaluatorNames.get(String(row.Evaluator_Id || '')) || '',
      Chief_Evaluator_Name:
        evaluatorNames.get(String(row.Chief_Valuation_Evaluator_Id || row.Chief_Evaluator_Id || '')) || '',
      Malpractice: malpracticeNumbers.has(String(row.barcode || '')) ? 'Yes' : 'No',
      ...row
    };
  });

  const primaryRows = enrichedImports.filter((row) => row.Source_Table === 'import1');
  const subjectKeys = [...new Set(primaryRows.map((row) =>
    `${row.subcode || 'Unknown'} [${row.Test_Code || 'No Test Code'}]`
  ))].sort();
  const totalsByCandidate = new Map();

  for (const row of primaryRows) {
    const candidateKey = String(row.Dummy_Number || row.batchname || row.id);
    if (!totalsByCandidate.has(candidateKey)) {
      totalsByCandidate.set(candidateKey, {
        Dummy_Number: row.Dummy_Number,
        Evaluation_Periods: new Set(),
        Departments: new Set(),
        Imported_Subjects: 0,
        Corrected_Subjects: 0,
        Total_Score: 0,
        Latest_Correction: null,
        Malpractice: 'No',
        subjectScores: {}
      });
    }

    const summary = totalsByCandidate.get(candidateKey);
    summary.Imported_Subjects += 1;
    if (row.Eva_Mon_Year) summary.Evaluation_Periods.add(row.Eva_Mon_Year);
    if (row.Dep_Name) summary.Departments.add(row.Dep_Name);
    if (row.Malpractice === 'Yes') summary.Malpractice = 'Yes';

    const subjectKey = `${row.subcode || 'Unknown'} [${row.Test_Code || 'No Test Code'}]`;
    if (row.Valuation_Status === 'Corrected' && row.Score !== null) {
      summary.Corrected_Subjects += 1;
      summary.Total_Score += row.Score;
      summary.subjectScores[subjectKey] = row.Score;
    } else if (!(subjectKey in summary.subjectScores)) {
      summary.subjectScores[subjectKey] = '';
    }

    const correctionDate = parseCorrectionDate(row.Corrected_Date_Time);
    if (correctionDate && (!summary.Latest_Correction || correctionDate > summary.Latest_Correction)) {
      summary.Latest_Correction = correctionDate;
    }
  }

  const summaryRows = [...totalsByCandidate.values()]
    .map((summary) => ({
      Dummy_Number: summary.Dummy_Number,
      Evaluation_Periods: [...summary.Evaluation_Periods].sort().join(', '),
      Departments: [...summary.Departments].sort().join(', '),
      Imported_Subjects: summary.Imported_Subjects,
      Corrected_Subjects: summary.Corrected_Subjects,
      Pending_Subjects: summary.Imported_Subjects - summary.Corrected_Subjects,
      Total_Score: summary.Total_Score,
      Latest_Correction_Date_Time: summary.Latest_Correction
        ? summary.Latest_Correction.toLocaleString('en-GB')
        : '',
      Malpractice: summary.Malpractice,
      ...Object.fromEntries(subjectKeys.map((key) => [key, summary.subjectScores[key] ?? '']))
    }))
    .sort((left, right) => String(left.Dummy_Number).localeCompare(String(right.Dummy_Number)));

  const enrichedQuestionRows = questionRows.map((row) => {
    const subject = subjectByExactKey.get(`${row.subcode}|${row.testcode || ''}`)
      || subjectByCode.get(String(row.subcode || '').trim());
    return {
      Dummy_Number: row.barcode,
      Subject_Name: subject?.SUBNAME || '',
      Test_Code: row.testcode || '',
      Marks_Numeric: parseScore(row.Marks_Get),
      Evaluator_Name: evaluatorNames.get(String(row.eva_id || '')) || '',
      ...row
    };
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Onscreen Model School';
  workbook.created = new Date();

  const infoSheet = workbook.addWorksheet('Report Info');
  infoSheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 80 }
  ];
  [
    ['Database', databaseInfo.database],
    ['Schema', databaseInfo.schema],
    ['Generated At', new Date().toLocaleString('en-GB')],
    ['Student Identifier', 'Dummy_Number / barcode (candidate names are not stored with valuation records)'],
    ['Students', summaryRows.length],
    ['Subject Result Rows', enrichedImports.length],
    ['Completed Subject Results', enrichedImports.filter((row) => row.Valuation_Status === 'Corrected').length],
    ['Question Mark Rows', enrichedQuestionRows.length],
    ['Remarks Rows', remarkRows.length],
    ['Total Calculation', 'Sum of completed primary valuation (import1) rounded totals for each dummy number']
  ].forEach(([field, value]) => infoSheet.addRow({ field, value }));
  styleWorksheet(infoSheet, 0);

  addObjectSheet(workbook, 'Student Totals', summaryRows, [
    'Dummy_Number', 'Evaluation_Periods', 'Departments', 'Imported_Subjects',
    'Corrected_Subjects', 'Pending_Subjects', 'Total_Score',
    'Latest_Correction_Date_Time', 'Malpractice'
  ]);
  addObjectSheet(workbook, 'Subject Results', enrichedImports, [
    'Dummy_Number', 'Subject_Name', 'subcode', 'Test_Code', 'Valuation_Round',
    'Valuation_Status', 'Score', 'Raw_Total', 'Rounded_Total',
    'Corrected_Date_Time', 'Corrected_Date', 'Evaluator_Id', 'Evaluator_Name',
    'Eva_Mon_Year', 'Dep_Name', 'dcode', 'Malpractice'
  ]);
  addObjectSheet(workbook, 'Question Marks', enrichedQuestionRows, [
    'Dummy_Number', 'Subject_Name', 'subcode', 'Test_Code', 'qbno', 'section',
    'sub_section', 'add_sub_section', 'max_marks', 'Marks_Get', 'Marks_Numeric',
    'checkdate', 'eva_id', 'Evaluator_Name', 'valuation_type', 'Examiner_type',
    'Dep_Name', 'Source_Table'
  ]);
  addObjectSheet(workbook, 'Remarks', remarkRows, [
    'Dummy_Number', 'evaluator_subject', 'Remarks_Type', 'remarks_reasons',
    'msg', 'evaluator_id', 'evaluator_name', 'Examiner_Type', 'Dep_Name',
    'Campid', 'Campofficerid', 'createdAt', 'updatedAt'
  ]);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    database: databaseInfo.database,
    students: summaryRows.length,
    subjectResults: enrichedImports.length,
    completedResults: enrichedImports.filter((row) => row.Valuation_Status === 'Corrected').length,
    questionMarks: enrichedQuestionRows.length,
    remarks: remarkRows.length
  }, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.sequelize.close();
  });