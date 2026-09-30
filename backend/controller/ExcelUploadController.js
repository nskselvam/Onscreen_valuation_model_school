const db = require('../db/models');
const asyncHandler = require('express-async-handler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Type_Exam = db.Type_Exam;
const Jee_Qb_Details = db.Jee_Qb_Details;
const Jee_Marks = db.Jee_Marks;
const Test_Master = db.Test_Master;
const Question_Statistics = db.Question_Statistics;
const Neet_Master = db.neetmaster;
const Neet_Question = db.neetQuestion;
const Neet_Medium = db.neetMedium;
const Cuet_Master = db.cuetMaster;
const Cuet_Question = db.cuetQuestion;
const Cuet_Medium = db.cuetMedium;
const Foundation_Master = db.foundationMaster;
const Foundation_Question = db.foundationQuestion;
const Quantitative_Master = db.quantitativeMaster;
const Quantitative_Question = db.quantitativeQuestion;
const CurrentAffairs_Master = db.currentAffairsMaster;
const CurrentAffairs_Question = db.currentAffairsQuestion;
const GeneralAbility_Data = db.generalAbilityData;
const GeneralAbility_Question = db.generalAbilityQuestion;
const Humanities_Data = db.humanitiesData;
const Humanities_Question = db.humanitiesQuestion;
const Spoken_English_Master = db.spokenEnglisMaster;
const Spoken_English_Qb_Details = db.spoken_english_qb_details;
const Clat_Master = db.clatMaster;
const Clat_Question = db.clatQuestion;

// Mapping of exam types and fields to database models
const getModelForExamAndField = (examType, field) => {
  const modelMap = {
    '001': { // JEE
      'qb': Jee_Qb_Details,
      'marks': Jee_Marks,
      'medium_qb': Question_Statistics,
      // Add other fields like 'medium_qb' when their models are created
    },
    '002': { // NEET
      'qb': Neet_Question,
      'marks': Neet_Master,
      'medium_qb': Neet_Medium,
    },
    '003': { // CUET
      'qb': Cuet_Question,
      'marks': Cuet_Master,
      'medium_qb': Cuet_Medium,
    },
    '008': { // FOUNDATION
      'qb': Foundation_Question,
      'marks': Foundation_Master,
    },
    '005': { // QUANTITATIVE APTITUDE
      'marks': Quantitative_Master,
      'qb': Quantitative_Question,
    },
    '006': { // CURRENT AFFAIRS
      'marks': CurrentAffairs_Master,
      'qb': CurrentAffairs_Question,
    },
    '009': { // GENERAL ABILITY
      'marks': GeneralAbility_Data,
      'qb': GeneralAbility_Question,
    },
    '010': { // SPOKEN ENGLISH
      'marks': Spoken_English_Master,
      'qb': Spoken_English_Qb_Details,
    },
    '011': { // HUMANITIES
      'marks': Humanities_Data,
      'qb': Humanities_Question,
    },
    '012': { // CLAT
      'marks': Clat_Master,
      'qb': Clat_Question,
    }
  };

  return modelMap[examType]?.[field] || null;
};

const createUploadHelpers = () => {
  const normalizeHeaderKey = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const pickFirstValue = (row, keys, fallback = '') => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return row[key];
      }
    }

    // Fallback: match noisy headers such as "D_CODE******" by normalized key.
    const normalizedLookup = new Map();
    Object.keys(row).forEach((rowKey) => {
      normalizedLookup.set(normalizeHeaderKey(rowKey), rowKey);
    });

    for (const key of keys) {
      const matchedKey = normalizedLookup.get(normalizeHeaderKey(key));
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
        return row[matchedKey];
      }
    }

    return fallback;
  };

  const normalizeDistrictCode = (value) => {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    const code = String(value).trim();
    if (/^\d$/.test(code)) {
      return `0${code}`;
    }

    return code.slice(0, 2);
  };

  const sanitizeString = (value, maxLength, { trim = true } = {}) => {
    if (value === undefined || value === null) {
      return '';
    }

    const normalized = trim ? String(value).trim() : String(value);
    return maxLength ? normalized.slice(0, maxLength) : normalized;
  };

  const normalizeMediumCode = (value) => {
    const medium = sanitizeString(value, 50).toUpperCase();

    if (!medium) {
      return '';
    }

    if (['ENGLISH', 'ENG', 'E'].includes(medium)) {
      return 'E';
    }

    if (['TAMIL', 'TAM', 'TM', 'T'].includes(medium)) {
      return 'T';
    }

    return sanitizeString(medium, 2);
  };

  const parseNumeric = (value) => {
    if (value === 0 || value === '0') {
      return 0;
    }

    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  };

  const buildJeeInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'BATCHNAME']));
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          Phy_C: parseNumeric(pickFirstValue(row, ['Phy_C', 'PHY_C', 'phy_c'])),
          Phy_W: parseNumeric(pickFirstValue(row, ['Phy_W', 'PHY_W', 'phy_w'])),
          Phy_B: parseNumeric(pickFirstValue(row, ['Phy_B', 'PHY_B', 'phy_b'])),
          Che_C: parseNumeric(pickFirstValue(row, ['Che_C', 'CHE_C', 'che_c'])),
          Che_W: parseNumeric(pickFirstValue(row, ['Che_W', 'CHE_W', 'che_w'])),
          Che_B: parseNumeric(pickFirstValue(row, ['Che_B', 'CHE_B', 'che_b'])),
          Mat_C: parseNumeric(pickFirstValue(row, ['Mat_C', 'MAT_C', 'mat_c'])),
          Mat_W: parseNumeric(pickFirstValue(row, ['Mat_W', 'MAT_W', 'mat_w'])),
          Mat_B: parseNumeric(pickFirstValue(row, ['Mat_B', 'MAT_B', 'mat_b'])),
          Phy_Tot: parseNumeric(pickFirstValue(row, ['Phy_Tot', 'PHY_TOT', 'phy_tot'])),
          che_Tot: parseNumeric(pickFirstValue(row, ['che_Tot', 'Che_Tot', 'CHE_TOT', 'che_tot'])),
          Mat_Tot: parseNumeric(pickFirstValue(row, ['Mat_Tot', 'MAT_TOT', 'mat_tot'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'medium_qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const dCode = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'D_Code', 'dcode', 'BATCHNAME']));
        const medium = normalizeMediumCode(pickFirstValue(row, ['Medium', 'medium', 'MEDIUM']));
        const key = `${qno || ''}_${testCode || ''}_${dCode}_${medium || ''}`;

        uniqueMap.set(key, {
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          Test_Code: sanitizeString(testCode, 25),
          D_CODE: sanitizeString(dCode, 2),
          Medium: medium,
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildNeetInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'BATCHNAME']));
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          CORRECT4: parseNumeric(pickFirstValue(row, ['CORRECT4', 'correct4'])),
          WRONG4: parseNumeric(pickFirstValue(row, ['WRONG4', 'wrong4'])),
          BLANK4: parseNumeric(pickFirstValue(row, ['BLANK4', 'blank4'])),
          TOTAL4: parseNumeric(pickFirstValue(row, ['TOTAL4', 'total4'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'medium_qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const dCode = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'D_Code', 'dcode', 'BATCHNAME']));
        const medium = normalizeMediumCode(pickFirstValue(row, ['Medium', 'medium', 'MEDIUM']));
        const key = `${qno || ''}_${testCode || ''}_${dCode}_${medium || ''}`;

        uniqueMap.set(key, {
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          Test_Code: sanitizeString(testCode, 25),
          D_CODE: sanitizeString(dCode, 2),
          Medium: medium,
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildCuetInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'BATCHNAME']));
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          CORRECT4: parseNumeric(pickFirstValue(row, ['CORRECT4', 'correct4'])),
          WRONG4: parseNumeric(pickFirstValue(row, ['WRONG4', 'wrong4'])),
          BLANK4: parseNumeric(pickFirstValue(row, ['BLANK4', 'blank4'])),
          TOTAL4: parseNumeric(pickFirstValue(row, ['TOTAL4', 'total4'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'medium_qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const dCode = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'D_Code', 'dcode', 'BATCHNAME']));
        const medium = normalizeMediumCode(pickFirstValue(row, ['Medium', 'medium', 'MEDIUM']));
        const key = `${qno || ''}_${testCode || ''}_${dCode}_${medium || ''}`;

        uniqueMap.set(key, {
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          Test_Code: sanitizeString(testCode, 25),
          D_CODE: sanitizeString(dCode, 2),
          Medium: medium,
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildFoundationInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const dCode = normalizeDistrictCode(
          pickFirstValue(row, ['D_CODE', 'd_code', 'D_Code', 'BATCHNAME', 'D_CODE******'])
        );
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE', 'Test_Code******']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno', 'Qno******']);
        const correct = pickFirstValue(row, ['Correct', 'correct', 'Correct******']);
        const wrong = pickFirstValue(row, ['Wrong', 'wrong', 'Wrong******']);
        const blank = pickFirstValue(row, ['Blank', 'blank', 'Blank******']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);

        const key = `${dCode}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          D_CODE: sanitizeString(dCode, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(correct, 10),
          Wrong: sanitizeString(wrong, 10),
          Blank: sanitizeString(blank, 10),
          ImpDate: sanitizeString(impDate, 255),
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildCurrentAffairsInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'BATCHNAME']));
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildQuantitativeInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const dCode = normalizeDistrictCode(
          findValueByAliases(row, ['D_CODE', 'd_code', 'D_Code', 'BATCHNAME', 'D_CODE******'])
        );

        const testCode = findValueByAliases(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE', 'Test_Code******']);
        const qno = findValueByAliases(row, ['Qno', 'QNO', 'qno', 'Qno******']);
        const correct = findValueByAliases(row, ['Correct', 'correct', 'Correct******']);
        const wrong = findValueByAliases(row, ['Wrong', 'wrong', 'Wrong******']);
        const blank = findValueByAliases(row, ['Blank', 'blank', 'Blank******']);

        const key = `${dCode}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(dCode, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(correct, 10),
          Wrong: sanitizeString(wrong, 10),
          Blank: sanitizeString(blank, 10),
          ImpDate: sanitizeString(findValueByAliases(row, ['ImpDate', 'impdate']), 255),
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        // Section columns present only in the new Excel format
        const hasSection1 = pickFirstValue(row, ['CORRECT1', 'correct1']) !== '';
        const hasSection2 = pickFirstValue(row, ['CORRECT2', 'correct2']) !== '';
        const hasSection3 = pickFirstValue(row, ['CORRECT3', 'correct3']) !== '';

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          // Quants section
          CORRECT1: hasSection1 ? parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])) : null,
          WRONG1:   hasSection1 ? parseNumeric(pickFirstValue(row, ['WRONG1',   'wrong1']))   : null,
          BLANK1:   hasSection1 ? parseNumeric(pickFirstValue(row, ['BLANK1',   'blank1']))   : null,
          TOTAL1:   hasSection1 ? parseNumeric(pickFirstValue(row, ['TOTAL1',   'total1']))   : null,
          // Logical Reasoning section
          CORRECT2: hasSection2 ? parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])) : null,
          WRONG2:   hasSection2 ? parseNumeric(pickFirstValue(row, ['WRONG2',   'wrong2']))   : null,
          BLANK2:   hasSection2 ? parseNumeric(pickFirstValue(row, ['BLANK2',   'blank2']))   : null,
          TOTAL2:   hasSection2 ? parseNumeric(pickFirstValue(row, ['TOTAL2',   'total2']))   : null,
          // Current Affairs section
          CORRECT3: hasSection3 ? parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])) : null,
          WRONG3:   hasSection3 ? parseNumeric(pickFirstValue(row, ['WRONG3',   'wrong3']))   : null,
          BLANK3:   hasSection3 ? parseNumeric(pickFirstValue(row, ['BLANK3',   'blank3']))   : null,
          TOTAL3:   hasSection3 ? parseNumeric(pickFirstValue(row, ['TOTAL3',   'total3']))   : null,
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildGeneralAbilityInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['D_CODE', 'd_code', 'BATCHNAME']));
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate'], ''), 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildHumanitiesInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(
          pickFirstValue(row, ['D_CODE', 'd_code', 'D_Code', 'BATCHNAME', 'D_CODE******'])
        );
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE', 'Test_Code******']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno', 'Qno******']);
        const correct = pickFirstValue(row, ['Correct', 'correct', 'Correct******']);
        const wrong = pickFirstValue(row, ['Wrong', 'wrong', 'Wrong******']);
        const blank = pickFirstValue(row, ['Blank', 'blank', 'Blank******']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(correct, 10),
          Wrong: sanitizeString(wrong, 10),
          Blank: sanitizeString(blank, 10),
          ImpDate: sanitizeString(impDate, 255)
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(
          pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE', 'D_CODE******'])
        );
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const impDate = pickFirstValue(row, ['ImpDate', 'impdate']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);

        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          CORRECT4: parseNumeric(pickFirstValue(row, ['CORRECT4', 'correct4'])),
          WRONG4: parseNumeric(pickFirstValue(row, ['WRONG4', 'wrong4'])),
          BLANK4: parseNumeric(pickFirstValue(row, ['BLANK4', 'blank4'])),
          TOTAL4: parseNumeric(pickFirstValue(row, ['TOTAL4', 'total4'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          ImpDate: sanitizeString(impDate, 255),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildClatInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach((row) => {
        const batchName = normalizeDistrictCode(
          pickFirstValue(row, ['BATCHNAME', 'D_CODE', 'd_code'])
        );
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno']);
        const key = `${batchName}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(pickFirstValue(row, ['Correct', 'correct']), 10),
          Wrong: sanitizeString(pickFirstValue(row, ['Wrong', 'wrong']), 10),
          Blank: sanitizeString(pickFirstValue(row, ['Blank', 'blank']), 10),
          ImpDate: sanitizeString(pickFirstValue(row, ['ImpDate', 'impdate']), 255),
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach((row) => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'D_CODE', 'd_code']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          IMG_SHEETNO: sanitizeString(pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']), 50, { trim: false }),
          Candidate_Name: sanitizeString(pickFirstValue(row, ['Candidate_Name', 'candidate_name']), 255),
          ROLLNO: sanitizeString(rollNo, 10),
          Test_Code: sanitizeString(testCode, 15),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          CORRECT4: parseNumeric(pickFirstValue(row, ['CORRECT4', 'correct4'])),
          WRONG4: parseNumeric(pickFirstValue(row, ['WRONG4', 'wrong4'])),
          BLANK4: parseNumeric(pickFirstValue(row, ['BLANK4', 'blank4'])),
          TOTAL4: parseNumeric(pickFirstValue(row, ['TOTAL4', 'total4'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          CORANS: sanitizeString(pickFirstValue(row, ['CORANS', 'corans']), 255, { trim: false }),
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  const buildSpokenEnglishInsertData = (field, excelData) => {
    if (field === 'qb') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const dCode = normalizeDistrictCode(
          pickFirstValue(row, ['D_CODE', 'd_code', 'D_Code', 'BATCHNAME', 'D_CODE******'])
        );
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE', 'Test_Code******']);
        const qno = pickFirstValue(row, ['Qno', 'QNO', 'qno', 'Qno******']);
        const correct = pickFirstValue(row, ['Correct', 'correct', 'Correct******']);
        const wrong = pickFirstValue(row, ['Wrong', 'wrong', 'Wrong******']);
        const blank = pickFirstValue(row, ['Blank', 'blank', 'Blank******']);
        const key = `${dCode}_${testCode || ''}_${qno || ''}`;

        uniqueMap.set(key, {
          D_CODE: sanitizeString(dCode, 10),
          Test_Code: sanitizeString(testCode, 15),
          Qno: sanitizeString(qno, 10),
          Correct: sanitizeString(correct, 10),
          Wrong: sanitizeString(wrong, 10),
          Blank: sanitizeString(blank, 10),
        });
      });

      return Array.from(uniqueMap.values());
    }

    if (field === 'marks') {
      const uniqueMap = new Map();

      excelData.forEach(row => {
        const batchName = normalizeDistrictCode(pickFirstValue(row, ['BATCHNAME', 'd_code', 'D_CODE']));
        const rollNo = pickFirstValue(row, ['ROLLNO', 'Rollno', 'rollno']);
        const testCode = pickFirstValue(row, ['Test_Code', 'Test_code', 'test_code', 'TEST_CODE']);
        const candidateName = pickFirstValue(row, ['Candidate_Name', 'candidate_name']);
        const imgSheetNo = pickFirstValue(row, ['IMG_SHEETNO', 'IMGPATH', 'imgpath']);
        const corans = pickFirstValue(row, ['CORANS', 'corans']);
        const key = `${batchName || ''}_${rollNo || ''}_${testCode || ''}`;

        uniqueMap.set(key, {
          BATCHNAME: sanitizeString(batchName, 2),
          ROLLNO: sanitizeString(rollNo, 10),
          Candidate_Name: sanitizeString(candidateName, 255),
          Test_Code: sanitizeString(testCode, 15),
          IMG_SHEETNO: sanitizeString(imgSheetNo, 50, { trim: false }),
          CORRECT1: parseNumeric(pickFirstValue(row, ['CORRECT1', 'correct1'])),
          WRONG1: parseNumeric(pickFirstValue(row, ['WRONG1', 'wrong1'])),
          BLANK1: parseNumeric(pickFirstValue(row, ['BLANK1', 'blank1'])),
          TOTAL1: parseNumeric(pickFirstValue(row, ['TOTAL1', 'total1'])),
          CORRECT2: parseNumeric(pickFirstValue(row, ['CORRECT2', 'correct2'])),
          WRONG2: parseNumeric(pickFirstValue(row, ['WRONG2', 'wrong2'])),
          BLANK2: parseNumeric(pickFirstValue(row, ['BLANK2', 'blank2'])),
          TOTAL2: parseNumeric(pickFirstValue(row, ['TOTAL2', 'total2'])),
          CORRECT3: parseNumeric(pickFirstValue(row, ['CORRECT3', 'correct3'])),
          WRONG3: parseNumeric(pickFirstValue(row, ['WRONG3', 'wrong3'])),
          BLANK3: parseNumeric(pickFirstValue(row, ['BLANK3', 'blank3'])),
          TOTAL3: parseNumeric(pickFirstValue(row, ['TOTAL3', 'total3'])),
          CORRECT4: parseNumeric(pickFirstValue(row, ['CORRECT4', 'correct4'])),
          WRONG4: parseNumeric(pickFirstValue(row, ['WRONG4', 'wrong4'])),
          BLANK4: parseNumeric(pickFirstValue(row, ['BLANK4', 'blank4'])),
          TOTAL4: parseNumeric(pickFirstValue(row, ['TOTAL4', 'total4'])),
          TOTAL: parseNumeric(pickFirstValue(row, ['TOTAL', 'total'])),
          CORRECT: parseNumeric(pickFirstValue(row, ['CORRECT', 'correct'])),
          WRONG: parseNumeric(pickFirstValue(row, ['WRONG', 'wrong'])),
          BLANK: parseNumeric(pickFirstValue(row, ['BLANK', 'blank'])),
          CORANS: sanitizeString(corans, 255, { trim: false })
        });
      });

      return Array.from(uniqueMap.values());
    }

    return [];
  };

  return {
    buildJeeInsertData,
    buildNeetInsertData,
    buildCuetInsertData,
    buildFoundationInsertData,
    buildQuantitativeInsertData,
    buildCurrentAffairsInsertData,
    buildGeneralAbilityInsertData,
    buildHumanitiesInsertData,
    buildClatInsertData,
    buildSpokenEnglishInsertData,
  };
};

// Upload Excel file and save data to database

const getAllTypeExam = catchAsync(async (req, res, next) => {
  const typeExam = await Type_Exam.findAll();
  res.status(200).json({
    status: 'success',
    data: {
      typeExam
    }
  });
});

const uploadExcel = catchAsync(async (req, res, next) => {
  const { type_of_exam_code, field, excelData } = req.body;
  
  console.log('Received Excel upload request:');
  console.log('- Exam Type:', type_of_exam_code);
  console.log('- Field:', field);
  console.log('- Total Rows:', excelData?.length || 0);
  console.log('- Sample Data:', excelData?.slice(0, 2));

  // Validate required fields
  if (!type_of_exam_code || !field || !excelData || !Array.isArray(excelData)) {
    return next(new AppError('Missing required fields: type_of_exam_code, field, or excelData', 400));
  }

  if (excelData.length === 0) {
    return next(new AppError('Excel data is empty', 400));
  }

  // Get the appropriate model based on exam type and field
  const Model = getModelForExamAndField(type_of_exam_code, field);
  
  if (!Model) {
    return next(new AppError(`No model found for exam type '${type_of_exam_code}' and field '${field}'`, 400));
  }

  try {
    const { buildJeeInsertData, buildNeetInsertData, buildCuetInsertData, buildFoundationInsertData, buildQuantitativeInsertData, buildCurrentAffairsInsertData, buildGeneralAbilityInsertData, buildHumanitiesInsertData, buildClatInsertData, buildSpokenEnglishInsertData } = createUploadHelpers();

    let preparedData = [];
    if (type_of_exam_code === '001') {
      preparedData = buildJeeInsertData(field, excelData);
    } else if (type_of_exam_code === '002') {
      preparedData = buildNeetInsertData(field, excelData);
    } else if (type_of_exam_code === '003') {
      preparedData = buildCuetInsertData(field, excelData);
    } else if (type_of_exam_code === '008') {
      preparedData = buildFoundationInsertData(field, excelData);
    } else if (type_of_exam_code === '005') {
      preparedData = buildQuantitativeInsertData(field, excelData);
    } else if (type_of_exam_code === '006') {
      preparedData = buildCurrentAffairsInsertData(field, excelData);
    } else if (type_of_exam_code === '009') {
      preparedData = buildGeneralAbilityInsertData(field, excelData);
    } else if (type_of_exam_code === '010') {
      preparedData = buildSpokenEnglishInsertData(field, excelData);
    } else if (type_of_exam_code === '011') {
      preparedData = buildHumanitiesInsertData(field, excelData);
    } else if (type_of_exam_code === '012') {
      preparedData = buildClatInsertData(field, excelData);
    } else {
      return next(new AppError(`Unsupported exam type: ${type_of_exam_code}`, 400));
    }

    if (!preparedData.length) {
      return next(new AppError(`Unsupported field type: ${field}`, 400));
    }

    if (type_of_exam_code === '010' && field === 'qb') {
      console.log('Spoken English QB parsed sample:', preparedData.slice(0, 3));
    }

    // Check database for existing records to prevent duplicates
    let finalData = preparedData;
    let skippedExisting = 0;
    
    if (field === 'marks') {
      const normalizeKeyPart = (value) => String(value || '').trim().toUpperCase();
      const makeUniqueKey = (batchName, rollNo, testCode) =>
        `${normalizeKeyPart(batchName)}_${normalizeKeyPart(rollNo)}_${normalizeKeyPart(testCode)}`;

      const testCodes = [
        ...new Set(
          preparedData
            .map((item) => String(item.Test_Code || '').trim())
            .filter(Boolean)
        ),
      ];

      let existingRecords = [];
      const tableName = Model?.getTableName?.();
      const resolvedTableName =
        typeof tableName === 'string' ? tableName : tableName?.tableName;

      if (resolvedTableName && testCodes.length > 0) {
        existingRecords = await db.sequelize.query(
          `
            SELECT "BATCHNAME", "ROLLNO", "Test_Code"
            FROM "${resolvedTableName}"
            WHERE "Test_Code" IN (:testCodes)
          `,
          {
            replacements: { testCodes },
            type: db.Sequelize.QueryTypes.SELECT,
          }
        );
      }

      const existingKeys = new Set(
        existingRecords.map((r) => makeUniqueKey(r.BATCHNAME, r.ROLLNO, r.Test_Code))
      );

      finalData = preparedData.filter((item) => {
        const key = makeUniqueKey(item.BATCHNAME, item.ROLLNO, item.Test_Code);
        return !existingKeys.has(key);
      });
      
      skippedExisting = preparedData.length - finalData.length;
      if (skippedExisting > 0) {
        console.log(`Skipped ${skippedExisting} records that already exist in database`);
      }
      
    } else if (field === 'qb') {
      const qbDistrictField = Model?.rawAttributes?.BATCHNAME
        ? 'BATCHNAME'
        : Model?.rawAttributes?.D_CODE
          ? 'D_CODE'
          : 'BATCHNAME';

      // Get all unique combinations to check
      const checkKeys = preparedData.map(item => ({
        [qbDistrictField]: String(item[qbDistrictField] ?? item.BATCHNAME ?? item.D_CODE ?? ''),
        Test_Code: String(item.Test_Code || ''),
        Qno: String(item.Qno || '')
      }));
      
      // Find existing records in database
      const existingRecords = await Model.findAll({
        where: {
          [db.Sequelize.Op.or]: checkKeys
        },
        attributes: [qbDistrictField, 'Test_Code', 'Qno'],
        raw: true
      });
      
      // Create a Set of existing keys for fast lookup
      const existingKeys = new Set(
        existingRecords.map(r => `${r[qbDistrictField]}_${r.Test_Code}_${r.Qno}`)
      );
      
      // Filter out records that already exist in database
      finalData = preparedData.filter(item => {
        const districtValue = item[qbDistrictField] ?? item.BATCHNAME ?? item.D_CODE ?? '';
        const key = `${districtValue}_${item.Test_Code}_${item.Qno}`;
        return !existingKeys.has(key);
      });
      
      skippedExisting = preparedData.length - finalData.length;
      if (skippedExisting > 0) {
        console.log(`Skipped ${skippedExisting} records that already exist in database`);
      }
    } else if (field === 'medium_qb') {
      // Get all unique combinations to check
      const checkKeys = preparedData.map(item => ({
        Qno: String(item.Qno || ''),
        Test_Code: String(item.Test_Code || ''),
        D_CODE: String(item.D_CODE || ''),
        Medium: String(item.Medium || '')
      }));
      
      // Find existing records in database
      const existingRecords = await Model.findAll({
        where: {
          [db.Sequelize.Op.or]: checkKeys
        },
        attributes: ['Qno', 'Test_Code', 'D_CODE', 'Medium'],
        raw: true
      });
      
      // Create a Set of existing keys for fast lookup
      const existingKeys = new Set(
        existingRecords.map(r => `${r.Qno}_${r.Test_Code}_${r.D_CODE}_${r.Medium}`)
      );
      
      // Filter out records that already exist in database
      finalData = preparedData.filter(item => {
        const key = `${item.Qno}_${item.Test_Code}_${item.D_CODE}_${item.Medium}`;
        return !existingKeys.has(key);
      });
      
      skippedExisting = preparedData.length - finalData.length;
      if (skippedExisting > 0) {
        console.log(`Skipped ${skippedExisting} records that already exist in database`);
      }
    }
    
    // Insert only new records
    let result = [];
    if (finalData.length > 0) {
      result = await Model.bulkCreate(finalData, {
        validate: true,
        returning: true
      });
      console.log(`Successfully inserted ${result.length} new rows into database`);
    } else {
      console.log('No new records to insert - all data already exists in database');
    }

    res.status(200).json({
      status: 'success',
      message: 'Excel data uploaded successfully (duplicates prevented)',
      data: {
        type_of_exam_code,
        field,
        totalRows: excelData.length,
        uniqueRows: preparedData.length,
        duplicatesInFile: excelData.length - preparedData.length,
        duplicatesInDB: skippedExisting,
        insertedRows: result.length,
        summary: `${result.length} new records inserted, ${excelData.length - preparedData.length} duplicates in file removed, ${skippedExisting} already in database`
      }
    });

  } catch (error) {
    console.error('Database insertion error:', error);
    if (error?.name === 'SequelizeValidationError') {
      const validationDetails = error.errors.map((item) => ({
        field: item.path,
        message: item.message,
        value: item.value,
      }));
      console.error('Validation error details:', validationDetails);
      return next(new AppError(`Failed to save data to database: ${validationDetails.map((item) => `${item.field} - ${item.message}`).join(', ')}`, 500));
    }
    return next(new AppError(`Failed to save data to database: ${error.message}`, 500));
  }
});

const normalizeHeaderKey = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .replace(/\*/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
};

const findValueByAliases = (row, aliases = []) => {
  if (!row || typeof row !== 'object') {
    return '';
  }

  const normalizedAliasSet = new Set(aliases.map((alias) => normalizeHeaderKey(alias)));
  const keys = Object.keys(row);

  for (const key of keys) {
    if (normalizedAliasSet.has(normalizeHeaderKey(key))) {
      return row[key];
    }
  }

  return '';
};

const parseNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseNumberOrZero = (value) => {
  const parsed = parseNumberOrNull(value);
  return parsed === null ? 0 : parsed;
};

const normalizeLookupToken = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  const normalizedRaw = String(value).trim();
  if (!normalizedRaw) {
    return '';
  }

  // Handle Excel-formatted numeric identifiers like 1021567233.0 or 1.021567233E+9
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalizedRaw)) {
    const parsed = Number(normalizedRaw);
    if (Number.isFinite(parsed) && Number.isInteger(parsed)) {
      return String(parsed).replace(/^0+/, '') || '0';
    }
  }

  if (/^\d+$/.test(normalizedRaw)) {
    return normalizedRaw.replace(/^0+/, '') || '0';
  }

  return normalizedRaw.toUpperCase();
};

const normalizeCorans = (value, totalQuestions = null) => {
  if (value === undefined || value === null) {
    return '';
  }

  const normalized = String(value)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^BCW]/g, '');

  if (totalQuestions !== null && totalQuestions !== undefined && totalQuestions >= 0) {
    const requiredLength = Math.max(0, Number(totalQuestions) || 0);
    const trimmed = normalized.slice(0, requiredLength);

    if (trimmed.length < requiredLength) {
      return `${trimmed}${'B'.repeat(requiredLength - trimmed.length)}`;
    }

    return trimmed;
  }

  return normalized;
};

const buildStatsFromCorans = (corans) => {
  const stats = { correct: 0, wrong: 0, blank: 0, attend: 0 };

  for (const ch of corans) {
    if (ch === 'C') stats.correct += 1;
    else if (ch === 'W') stats.wrong += 1;
    else if (ch === 'B') stats.blank += 1;
  }

  stats.attend = stats.correct + stats.wrong;
  return stats;
};

const calculateNeetScore = (correct, wrong) => {
  const safeCorrect = Number(correct) || 0;
  const safeWrong = Number(wrong) || 0;
  return (safeCorrect * 4) - safeWrong;
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

const normalizeExamTypeInput = (value) => {
  const normalized = String(value || 'jee').trim().toLowerCase();

  if (normalized === '001' || normalized === 'jee') return 'jee';
  if (normalized === '002' || normalized === 'neet') return 'neet';
  if (normalized === '003' || normalized === 'cuet') return 'cuet';
  if (normalized === '006' || normalized === 'currentaffairs' || normalized === 'current_affairs' || normalized === 'current affairs') return 'currentaffairs';
  if (normalized === '010' || normalized === 'spokenenglish' || normalized === 'spoken_english' || normalized === 'spoken english') return 'spokenenglish';
  if (normalized === '011' || normalized === 'humanities' || normalized === 'humanitiesexam' || normalized === 'humanities exam') return 'humanities';
  return '';
};

const getExamTypeFromTestCode = (testCode) => {
  const normalized = String(testCode || '').trim().toUpperCase();

  if (normalized.length < 3) {
    return '';
  }

  const examMarker = normalized.charAt(2);
  if (examMarker === 'J') return 'jee';
  if (examMarker === 'N') return 'neet';
  if (examMarker === 'C') return 'cuet';
  if (examMarker === 'F') return 'foundation';
  if (examMarker === 'Q') return 'quantitative';
  if (examMarker === 'A') return 'currentaffairs';
  if (examMarker === 'G') return 'generalability';
  if (examMarker === 'H') return 'humanities';
  if (examMarker === 'S') return 'spokenenglish';
  return '';
};

const buildStatisticsRecordLookupMap = (records) => {
  const byRollKey = new Map();
  const byNameKey = new Map();

  for (const record of records) {
    const testCode = String(record.Test_Code || '').trim();
    const rollNo = String(record.ROLLNO || '').trim();
    const candidateName = String(record.Candidate_Name || '').trim();

    const exactRollKey = `${testCode}__${rollNo}`;
    const normalizedRollKey = `${normalizeLookupToken(testCode)}__${normalizeLookupToken(rollNo)}`;
    const exactNameKey = `${testCode}__${candidateName.toUpperCase()}`;
    const normalizedNameKey = `${normalizeLookupToken(testCode)}__${candidateName.toUpperCase()}`;

    if (testCode && rollNo) {
      if (!byRollKey.has(exactRollKey)) {
        byRollKey.set(exactRollKey, record);
      }

      if (!byRollKey.has(normalizedRollKey)) {
        byRollKey.set(normalizedRollKey, record);
      }
    }

    if (testCode && candidateName) {
      if (!byNameKey.has(exactNameKey)) {
        byNameKey.set(exactNameKey, record);
      }

      if (!byNameKey.has(normalizedNameKey)) {
        byNameKey.set(normalizedNameKey, record);
      }
    }
  }

  return { byRollKey, byNameKey };
};

const getStatisticsRecordForRow = (lookupMapsByExam, testCode, emisNumber, studentName) => {
  const examType = getExamTypeFromTestCode(testCode);
  const lookupMap = lookupMapsByExam[examType];

  if (!lookupMap) {
    return null;
  }

  const normalizedTestCode = normalizeLookupToken(testCode);
  const exactRollKey = `${String(testCode || '').trim()}__${String(emisNumber || '').trim()}`;
  const normalizedRollKey = `${normalizedTestCode}__${normalizeLookupToken(emisNumber)}`;
  const normalizedStudentName = String(studentName || '').trim().toUpperCase();
  const exactNameKey = `${String(testCode || '').trim()}__${normalizedStudentName}`;
  const normalizedNameKey = `${normalizedTestCode}__${normalizedStudentName}`;

  return lookupMap.byRollKey.get(exactRollKey)
    || lookupMap.byRollKey.get(normalizedRollKey)
    || lookupMap.byNameKey.get(exactNameKey)
    || lookupMap.byNameKey.get(normalizedNameKey)
    || null;
};

const normalizeStatisticsOption = (value) => String(value || '').trim().toUpperCase();

const buildAcceptedStatisticsAnswers = (correctOptions) => {
  const normalized = normalizeStatisticsOption(correctOptions);

  if (!normalized) {
    return [];
  }

  const splitTokens = normalized
    .replace(/\bOR\b/g, '|')
    .replace(/\bAND\b/g, '|')
    .replace(/[\/,&|]+/g, '|')
    .split('|')
    .map((token) => normalizeStatisticsOption(token))
    .filter(Boolean);

  if (splitTokens.length) {
    return [...new Set(splitTokens)];
  }

  return [normalized];
};

const buildNormalizedTemplateRows = (rows) => {
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const testCode = String(firstNonEmpty(
        findValueByAliases(row, ['TESTCODE', 'TEST CODE', 'Test_Code', 'Test Code', 'Testcode']),
        ''
      )).trim();

      const emisNumber = String(firstNonEmpty(
        findValueByAliases(row, ['Emis NO', 'Emis_id', 'EMIS ID', 'EMIS_ID', 'EMIS Number', 'EMIS', 'Roll No', 'ROLLNO', 'ROLL NO']),
        ''
      )).trim();

      return {
        original: row,
        testCode,
        emisNumber,
      };
    })
    .filter((row) => row.testCode && row.emisNumber);
};

const enrichJeeTemplateRows = async (rows) => {
  const normalizedInputRows = buildNormalizedTemplateRows(rows);

  if (!normalizedInputRows.length) {
    throw new AppError('No valid rows found. Required columns: TESTCODE and EMIS Number.', 400);
  }

  const testCodes = [...new Set(normalizedInputRows.map((row) => row.testCode))];
  const rollNumbers = [...new Set(normalizedInputRows.map((row) => row.emisNumber))];

  const [tests, marks] = await Promise.all([
    Test_Master.findAll({
      where: {
        testcode: {
          [db.Sequelize.Op.in]: testCodes,
        },
        type_of_exam: '001',
      },
      attributes: ['testcode', 'Test_Name', 'testdate', 'no_of_ques'],
      raw: true,
    }),
    Jee_Marks.findAll({
      where: {
        Test_Code: {
          [db.Sequelize.Op.in]: testCodes,
        },
        ROLLNO: {
          [db.Sequelize.Op.in]: rollNumbers,
        },
      },
      attributes: [
        'Test_Code',
        'ROLLNO',
        'Candidate_Name',
        'CORANS',
        'TOTAL',
        'CORRECT',
        'WRONG',
        'BLANK',
        'Phy_C',
        'Phy_W',
        'Phy_B',
        'Phy_Tot',
        'Che_C',
        'Che_W',
        'Che_B',
        'che_Tot',
        'Mat_C',
        'Mat_W',
        'Mat_B',
        'Mat_Tot',
      ],
      raw: true,
    }),
  ]);

  const testMap = new Map(tests.map((test) => [String(test.testcode), test]));
  const markMap = new Map(marks.map((mark) => [`${String(mark.Test_Code)}__${String(mark.ROLLNO)}`, mark]));

  return normalizedInputRows.map((row) => {
    const { original, testCode, emisNumber } = row;
    const test = testMap.get(testCode);
    const mark = markMap.get(`${testCode}__${emisNumber}`);

    const noOfQuestions = parseNumberOrNull(firstNonEmpty(
      findValueByAliases(original, ['No. of Questions', 'No of Questions', 'NO OF QUESTIONS']),
      test?.no_of_ques
    ));

    const physicsQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Physics',
      'No of Questions in Physics',
    ]));
    const chemistryQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Chemistry',
      'No of Questions in Chemistry',
    ]));
    const mathsQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Mathematics',
      'No of Questions in Mathematics',
      'No. of Questions in Maths',
    ]));

    const maxScore = parseNumberOrNull(findValueByAliases(original, ['Max Score', 'MAX SCORE']));
    const physicsMaxScore = parseNumberOrNull(findValueByAliases(original, ['Physics Max Score']));
    const chemistryMaxScore = parseNumberOrNull(findValueByAliases(original, ['Chemistry Max Score']));
    const mathsMaxScore = parseNumberOrNull(findValueByAliases(original, ['Mathematics Max Score', 'Maths Max Score']));

    const corans = normalizeCorans(mark?.CORANS, noOfQuestions);
    const hasCorans = corans.length > 0;
    const overallFromCorans = buildStatsFromCorans(corans);

    let physicsFromCorans = null;
    let chemistryFromCorans = null;
    let mathsFromCorans = null;

    if (hasCorans && physicsQuestionCount !== null && chemistryQuestionCount !== null && mathsQuestionCount !== null) {
      const phyCount = Math.max(0, physicsQuestionCount);
      const cheCount = Math.max(0, chemistryQuestionCount);
      const matCount = Math.max(0, mathsQuestionCount);

      const phyAns = corans.slice(0, phyCount);
      const cheAns = corans.slice(phyCount, phyCount + cheCount);
      const matAns = corans.slice(phyCount + cheCount, phyCount + cheCount + matCount);

      physicsFromCorans = buildStatsFromCorans(phyAns);
      chemistryFromCorans = buildStatsFromCorans(cheAns);
      mathsFromCorans = buildStatsFromCorans(matAns);
    }

    const overallCorrect = hasCorans ? overallFromCorans.correct : parseNumberOrZero(mark?.CORRECT);
    const overallWrong = hasCorans ? overallFromCorans.wrong : parseNumberOrZero(mark?.WRONG);
    const overallBlank = hasCorans ? overallFromCorans.blank : parseNumberOrZero(mark?.BLANK);
    const overallAttend = overallCorrect + overallWrong;
    const overallTotal = parseNumberOrNull(mark?.TOTAL) ?? (
      physicsFromCorans || chemistryFromCorans || botanyFromCorans || zoologyFromCorans
        ? calculateNeetScore(overallCorrect, overallWrong)
        : null
    );

    const physicsCorrect = physicsFromCorans ? physicsFromCorans.correct : parseNumberOrZero(mark?.Phy_C);
    const physicsWrong = physicsFromCorans ? physicsFromCorans.wrong : parseNumberOrZero(mark?.Phy_W);
    const physicsBlank = physicsFromCorans ? physicsFromCorans.blank : parseNumberOrZero(mark?.Phy_B);
    const physicsAttend = physicsCorrect + physicsWrong;

    const chemistryCorrect = chemistryFromCorans ? chemistryFromCorans.correct : parseNumberOrZero(mark?.Che_C);
    const chemistryWrong = chemistryFromCorans ? chemistryFromCorans.wrong : parseNumberOrZero(mark?.Che_W);
    const chemistryBlank = chemistryFromCorans ? chemistryFromCorans.blank : parseNumberOrZero(mark?.Che_B);
    const chemistryAttend = chemistryCorrect + chemistryWrong;

    const mathsCorrect = mathsFromCorans ? mathsFromCorans.correct : parseNumberOrZero(mark?.Mat_C);
    const mathsWrong = mathsFromCorans ? mathsFromCorans.wrong : parseNumberOrZero(mark?.Mat_W);
    const mathsBlank = mathsFromCorans ? mathsFromCorans.blank : parseNumberOrZero(mark?.Mat_B);
    const mathsAttend = mathsCorrect + mathsWrong;

    return {
      TESTCODE: testCode,
      'EMIS Number': emisNumber,
      'Student Name': firstNonEmpty(mark?.Candidate_Name, findValueByAliases(original, ['Student Name', 'Candidate Name']), ''),
      'UDISE Code': firstNonEmpty(findValueByAliases(original, ['UDISE Code'])),
      School: firstNonEmpty(findValueByAliases(original, ['School'])),
      'Q Set ID': firstNonEmpty(findValueByAliases(original, ['Q Set ID', 'QSET ID', 'Q SET'])),
      'Exam Date': firstNonEmpty(findValueByAliases(original, ['Exam Date']), test?.testdate),
      'Exam Name': firstNonEmpty(test?.Test_Name, ''),
      'No. of Questions': noOfQuestions,
      'Overall attend': overallAttend,
      'Overall unattended': overallBlank,
      'Overall Correct': overallCorrect,
      'Overall Wrong': overallWrong,
      'Max Score': maxScore,
      'Overall Total': parseNumberOrNull(mark?.TOTAL),
      'No. of Questions in Physics': physicsQuestionCount,
      'Physics attend': physicsAttend,
      'Physics Blank': physicsBlank,
      'Physics Correct': physicsCorrect,
      'Physics Wrong': physicsWrong,
      'Physics Max Score': physicsMaxScore,
      'Physics Total': parseNumberOrNull(mark?.Phy_Tot),
      'No. of Questions in Chemistry': chemistryQuestionCount,
      'Chemistry attend': chemistryAttend,
      'Chemistry Blank': chemistryBlank,
      'Chemistry Correct': chemistryCorrect,
      'Chemistry Wrong': chemistryWrong,
      'Chemistry Max Score': chemistryMaxScore,
      'Chemistry Total': parseNumberOrNull(mark?.che_Tot),
      'No. of Questions in Mathematics': mathsQuestionCount,
      'Mathematics attend': mathsAttend,
      'Mathematics Blank': mathsBlank,
      'Mathematics Correct': mathsCorrect,
      'Mathematics Wrong': mathsWrong,
      'Mathematics Max Score': mathsMaxScore,
      'Mathematics Total': parseNumberOrNull(mark?.Mat_Tot),
    };
  });
};

const enrichCuetTemplateRows = async (rows) => {
  const normalizedInputRows = buildNormalizedTemplateRows(rows);

  if (!normalizedInputRows.length) {
    throw new AppError('No valid rows found. Required columns: TESTCODE and EMIS Number.', 400);
  }

  const testCodes = [...new Set(normalizedInputRows.map((row) => row.testCode))];
  const rollNumbers = [...new Set(normalizedInputRows.map((row) => row.emisNumber))];

  const [tests, marks] = await Promise.all([
    Test_Master.findAll({
      where: {
        testcode: {
          [db.Sequelize.Op.in]: testCodes,
        },
        type_of_exam: '003',
      },
      attributes: ['testcode', 'Test_Name', 'testdate', 'no_of_ques'],
      raw: true,
    }),
    Cuet_Master.findAll({
      where: {
        Test_Code: {
          [db.Sequelize.Op.in]: testCodes,
        },
        ROLLNO: {
          [db.Sequelize.Op.in]: rollNumbers,
        },
      },
      attributes: [
        'Test_Code',
        'ROLLNO',
        'Candidate_Name',
        'CORANS',
        'TOTAL',
        'CORRECT',
        'WRONG',
        'BLANK',
        'CORRECT2',
        'WRONG2',
        'BLANK2',
        'TOTAL2',
        'CORRECT4',
        'WRONG4',
        'BLANK4',
        'TOTAL4',
      ],
      raw: true,
    }),
  ]);

  const testMap = new Map(tests.map((test) => [String(test.testcode), test]));
  const markMap = new Map(marks.map((mark) => [`${String(mark.Test_Code)}__${String(mark.ROLLNO)}`, mark]));

  return normalizedInputRows.map((row) => {
    const { original, testCode, emisNumber } = row;
    const test = testMap.get(testCode);
    const mark = markMap.get(`${testCode}__${emisNumber}`);

    const noOfQuestions = parseNumberOrNull(firstNonEmpty(
      findValueByAliases(original, ['No. of Questions', 'No of Questions', 'NO OF QUESTIONS']),
      test?.no_of_ques
    ));

    const economicsQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Economics',
      'No of Questions in Economics',
    ]));
    const businessMathsQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Business Maths',
      'No of Questions in Business Maths',
      'No. of Questions in Business Math',
    ]));

    const maxScore = parseNumberOrNull(findValueByAliases(original, ['Max Score', 'MAX SCORE']));
    const economicsMaxScore = parseNumberOrNull(findValueByAliases(original, ['Economics Max Score']));
    const businessMathsMaxScore = parseNumberOrNull(findValueByAliases(original, ['Business Maths Max Score', 'Business Math Max Score']));

    const corans = normalizeCorans(mark?.CORANS, noOfQuestions);
    const hasCorans = corans.length > 0;
    const overallFromCorans = buildStatsFromCorans(corans);

    let economicsFromCorans = null;
    let businessMathsFromCorans = null;

    if (hasCorans && economicsQuestionCount !== null && businessMathsQuestionCount !== null) {
      const economicsCount = Math.max(0, economicsQuestionCount);
      const businessMathsCount = Math.max(0, businessMathsQuestionCount);

      const economicsAns = corans.slice(0, economicsCount);
      const businessMathsAns = corans.slice(economicsCount, economicsCount + businessMathsCount);

      economicsFromCorans = buildStatsFromCorans(economicsAns);
      businessMathsFromCorans = buildStatsFromCorans(businessMathsAns);
    }

    const overallCorrect = hasCorans ? overallFromCorans.correct : parseNumberOrZero(mark?.CORRECT);
    const overallWrong = hasCorans ? overallFromCorans.wrong : parseNumberOrZero(mark?.WRONG);
    const overallBlank = hasCorans ? overallFromCorans.blank : parseNumberOrZero(mark?.BLANK);
    const overallAttend = overallCorrect + overallWrong;

    const economicsCorrect = economicsFromCorans ? economicsFromCorans.correct : parseNumberOrZero(mark?.CORRECT2);
    const economicsWrong = economicsFromCorans ? economicsFromCorans.wrong : parseNumberOrZero(mark?.WRONG2);
    const economicsBlank = economicsFromCorans ? economicsFromCorans.blank : parseNumberOrZero(mark?.BLANK2);
    const economicsAttend = economicsCorrect + economicsWrong;

    const businessMathsCorrect = businessMathsFromCorans ? businessMathsFromCorans.correct : parseNumberOrZero(mark?.CORRECT4);
    const businessMathsWrong = businessMathsFromCorans ? businessMathsFromCorans.wrong : parseNumberOrZero(mark?.WRONG4);
    const businessMathsBlank = businessMathsFromCorans ? businessMathsFromCorans.blank : parseNumberOrZero(mark?.BLANK4);
    const businessMathsAttend = businessMathsCorrect + businessMathsWrong;
    const overallTotal = parseNumberOrNull(mark?.TOTAL) ?? (
      parseNumberOrZero(mark?.TOTAL1) +
      parseNumberOrZero(mark?.TOTAL2) +
      parseNumberOrZero(mark?.TOTAL3) +
      parseNumberOrZero(mark?.TOTAL4)
    );

    return {
      TESTCODE: testCode,
      'EMIS Number': emisNumber,
      'Student Name': firstNonEmpty(mark?.Candidate_Name, findValueByAliases(original, ['Student Name', 'Candidate Name']), ''),
      'UDISE Code': firstNonEmpty(findValueByAliases(original, ['UDISE Code'])),
      School: firstNonEmpty(findValueByAliases(original, ['School'])),
      'Q Set ID': firstNonEmpty(findValueByAliases(original, ['Q Set ID', 'QSET ID', 'Q SET'])),
      'Exam Date': firstNonEmpty(findValueByAliases(original, ['Exam Date']), test?.testdate),
      'Exam Name': firstNonEmpty(test?.Test_Name, ''),
      'No. of Questions': noOfQuestions,
      'Overall attend': overallAttend,
      'Overall unattended': overallBlank,
      'Overall Correct': overallCorrect,
      'Overall Wrong': overallWrong,
      'Max Score': maxScore,
      'Overall Total': overallTotal,
      'No. of Questions in Economics': economicsQuestionCount,
      'Economics attend': economicsAttend,
      'Economics Blank': economicsBlank,
      'Economics Correct': economicsCorrect,
      'Economics Wrong': economicsWrong,
      'Economics Max Score': economicsMaxScore,
      'Economics Total': parseNumberOrNull(mark?.TOTAL2),
      'No. of Questions in Business Maths': businessMathsQuestionCount,
      'Business Maths attend': businessMathsAttend,
      'Business Maths Blank': businessMathsBlank,
      'Business Maths Correct': businessMathsCorrect,
      'Business Maths Wrong': businessMathsWrong,
      'Business Maths Max Score': businessMathsMaxScore,
      'Business Maths Total': parseNumberOrNull(mark?.TOTAL4),
    };
  });
};

const enrichNeetTemplateRows = async (rows) => {
  const normalizedInputRows = buildNormalizedTemplateRows(rows);

  if (!normalizedInputRows.length) {
    throw new AppError('No valid rows found. Required columns: TESTCODE and EMIS Number.', 400);
  }

  const testCodes = [...new Set(normalizedInputRows.map((row) => row.testCode))];

  const [tests, marks] = await Promise.all([
    Test_Master.findAll({
      where: {
        testcode: {
          [db.Sequelize.Op.in]: testCodes,
        },
        type_of_exam: '002',
      },
      attributes: ['testcode', 'Test_Name', 'testdate', 'no_of_ques'],
      raw: true,
    }),
    Neet_Master.findAll({
      where: {
        Test_Code: {
          [db.Sequelize.Op.in]: testCodes,
        },
      },
      attributes: [
        'Test_Code',
        'ROLLNO',
        'Candidate_Name',
        'CORANS',
        'TOTAL',
        'CORRECT',
        'WRONG',
        'BLANK',
        'CORRECT1',
        'WRONG1',
        'BLANK1',
        'TOTAL1',
        'CORRECT2',
        'WRONG2',
        'BLANK2',
        'TOTAL2',
        'CORRECT3',
        'WRONG3',
        'BLANK3',
        'TOTAL3',
        'CORRECT4',
        'WRONG4',
        'BLANK4',
        'TOTAL4',
      ],
      raw: true,
    }),
  ]);

  const testMap = new Map(tests.map((test) => [String(test.testcode), test]));
  const markMap = new Map();

  for (const mark of marks) {
    const testCodeKey = normalizeLookupToken(mark.Test_Code);
    const rollNoKey = normalizeLookupToken(mark.ROLLNO);
    const exactKey = `${String(mark.Test_Code || '')}__${String(mark.ROLLNO || '')}`;
    const normalizedKey = `${testCodeKey}__${rollNoKey}`;

    if (!markMap.has(exactKey)) {
      markMap.set(exactKey, mark);
    }

    if (!markMap.has(normalizedKey)) {
      markMap.set(normalizedKey, mark);
    }
  }

  return normalizedInputRows.map((row) => {
    const { original, testCode, emisNumber } = row;
    const test = testMap.get(testCode);
    const exactMarkKey = `${testCode}__${emisNumber}`;
    const normalizedMarkKey = `${normalizeLookupToken(testCode)}__${normalizeLookupToken(emisNumber)}`;
    const mark = markMap.get(exactMarkKey) || markMap.get(normalizedMarkKey);

    const noOfQuestions = parseNumberOrNull(firstNonEmpty(
      findValueByAliases(original, ['No. of Questions', 'No of Questions', 'NO OF QUESTIONS']),
      test?.no_of_ques
    ));

    const physicsQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Physics',
      'No of Questions in Physics',
    ]));
    const chemistryQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Chemistry',
      'No of Questions in Chemistry',
    ]));
    const botanyQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Botany',
      'No of Questions in Botany',
    ]));
    const zoologyQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in Zoology',
      'No of Questions in Zoology',
    ]));

    const maxScore = parseNumberOrNull(findValueByAliases(original, ['Max Score', 'MAX SCORE']));
    const physicsMaxScore = parseNumberOrNull(findValueByAliases(original, ['Physics Max Score']));
    const chemistryMaxScore = parseNumberOrNull(findValueByAliases(original, ['Chemistry Max Score']));
    const botanyMaxScore = parseNumberOrNull(findValueByAliases(original, ['Botany Max Score']));
    const zoologyMaxScore = parseNumberOrNull(findValueByAliases(original, ['Zoology Max Score', 'Zoology  Max Score']));

    const corans = normalizeCorans(mark?.CORANS, noOfQuestions);
    const hasCorans = corans.length > 0;
    const overallFromCorans = buildStatsFromCorans(corans);

    let physicsFromCorans = null;
    let chemistryFromCorans = null;
    let botanyFromCorans = null;
    let zoologyFromCorans = null;

    if (hasCorans && physicsQuestionCount !== null && chemistryQuestionCount !== null && botanyQuestionCount !== null && zoologyQuestionCount !== null) {
      const phyCount = Math.max(0, physicsQuestionCount);
      const cheCount = Math.max(0, chemistryQuestionCount);
      const botCount = Math.max(0, botanyQuestionCount);
      const zooCount = Math.max(0, zoologyQuestionCount);

      const phyAns = corans.slice(0, phyCount);
      const cheAns = corans.slice(phyCount, phyCount + cheCount);
      const botAns = corans.slice(phyCount + cheCount, phyCount + cheCount + botCount);
      const zooAns = corans.slice(phyCount + cheCount + botCount, phyCount + cheCount + botCount + zooCount);

      physicsFromCorans = buildStatsFromCorans(phyAns);
      chemistryFromCorans = buildStatsFromCorans(cheAns);
      botanyFromCorans = buildStatsFromCorans(botAns);
      zoologyFromCorans = buildStatsFromCorans(zooAns);
    }

    const overallCorrect = hasCorans ? overallFromCorans.correct : parseNumberOrZero(mark?.CORRECT);
    const overallWrong = hasCorans ? overallFromCorans.wrong : parseNumberOrZero(mark?.WRONG);
    const overallBlank = hasCorans ? overallFromCorans.blank : parseNumberOrZero(mark?.BLANK);
    const overallAttend = overallCorrect + overallWrong;

    const physicsCorrect = physicsFromCorans ? physicsFromCorans.correct : parseNumberOrZero(mark?.CORRECT1);
    const physicsWrong = physicsFromCorans ? physicsFromCorans.wrong : parseNumberOrZero(mark?.WRONG1);
    const physicsBlank = physicsFromCorans ? physicsFromCorans.blank : parseNumberOrZero(mark?.BLANK1);
    const physicsAttend = physicsCorrect + physicsWrong;
    const physicsTotal = parseNumberOrNull(mark?.TOTAL1) ?? calculateNeetScore(physicsCorrect, physicsWrong);

    const chemistryCorrect = chemistryFromCorans ? chemistryFromCorans.correct : parseNumberOrZero(mark?.CORRECT2);
    const chemistryWrong = chemistryFromCorans ? chemistryFromCorans.wrong : parseNumberOrZero(mark?.WRONG2);
    const chemistryBlank = chemistryFromCorans ? chemistryFromCorans.blank : parseNumberOrZero(mark?.BLANK2);
    const chemistryAttend = chemistryCorrect + chemistryWrong;
    const chemistryTotal = parseNumberOrNull(mark?.TOTAL2) ?? calculateNeetScore(chemistryCorrect, chemistryWrong);

    const botanyCorrect = botanyFromCorans ? botanyFromCorans.correct : parseNumberOrZero(mark?.CORRECT3);
    const botanyWrong = botanyFromCorans ? botanyFromCorans.wrong : parseNumberOrZero(mark?.WRONG3);
    const botanyBlank = botanyFromCorans ? botanyFromCorans.blank : parseNumberOrZero(mark?.BLANK3);
    const botanyAttend = botanyCorrect + botanyWrong;
    const botanyTotal = parseNumberOrNull(mark?.TOTAL3) ?? calculateNeetScore(botanyCorrect, botanyWrong);

    const zoologyCorrect = zoologyFromCorans ? zoologyFromCorans.correct : parseNumberOrZero(mark?.CORRECT4);
    const zoologyWrong = zoologyFromCorans ? zoologyFromCorans.wrong : parseNumberOrZero(mark?.WRONG4);
    const zoologyBlank = zoologyFromCorans ? zoologyFromCorans.blank : parseNumberOrZero(mark?.BLANK4);
    const zoologyAttend = zoologyCorrect + zoologyWrong;
    const zoologyTotal = parseNumberOrNull(mark?.TOTAL4) ?? calculateNeetScore(zoologyCorrect, zoologyWrong);
    const overallTotal = parseNumberOrNull(mark?.TOTAL) ?? (physicsTotal + chemistryTotal + botanyTotal + zoologyTotal);

    return {
      TESTCODE: testCode,
      'EMIS Number': emisNumber,
      'Student Name': firstNonEmpty(mark?.Candidate_Name, findValueByAliases(original, ['Student Name', 'Candidate Name']), ''),
      'UDISE Code': firstNonEmpty(findValueByAliases(original, ['UDISE Code'])),
      School: firstNonEmpty(findValueByAliases(original, ['School'])),
      'Q Set ID': firstNonEmpty(findValueByAliases(original, ['Q Set ID', 'QSET ID', 'Q SET'])),
      'Exam Date': firstNonEmpty(findValueByAliases(original, ['Exam Date']), test?.testdate),
      'Exam Name': firstNonEmpty(test?.Test_Name, ''),
      'No. of Questions': noOfQuestions,
      'Overall attend': overallAttend,
      'Overall unattended': overallBlank,
      'Overall Correct': overallCorrect,
      'Overall Wrong': overallWrong,
      'Max Score': maxScore,
      'Overall Total': overallTotal,
      'No. of Questions in Physics': physicsQuestionCount,
      'Physics attend': physicsAttend,
      'Physics Blank': physicsBlank,
      'Physics Correct': physicsCorrect,
      'Physics Wrong': physicsWrong,
      'Physics Max Score': physicsMaxScore,
      'Physics Total': physicsTotal,
      'No. of Questions in Chemistry': chemistryQuestionCount,
      'Chemistry attend': chemistryAttend,
      'Chemistry Blank': chemistryBlank,
      'Chemistry Correct': chemistryCorrect,
      'Chemistry Wrong': chemistryWrong,
      'Chemistry Max Score': chemistryMaxScore,
      'Chemistry Total': chemistryTotal,
      'No. of Questions in Botany': botanyQuestionCount,
      'Botany attend': botanyAttend,
      'Botany Blank': botanyBlank,
      'Botany Correct': botanyCorrect,
      'Botany Wrong': botanyWrong,
      'Botany Max Score': botanyMaxScore,
      'Botany Total': botanyTotal,
      'No. of Questions in Zoology': zoologyQuestionCount,
      'Zoology attend': zoologyAttend,
      'Zoology Blank': zoologyBlank,
      'Zoology Correct': zoologyCorrect,
      'Zoology Wrong': zoologyWrong,
      'Zoology Max Score': zoologyMaxScore,
      'Zoology Total': zoologyTotal,
    };
  });
};

const enrichCurrentAffairsTemplateRows = async (rows) => {
  const normalizedInputRows = buildNormalizedTemplateRows(rows);

  if (!normalizedInputRows.length) {
    throw new AppError('No valid rows found. Required columns: TESTCODE and EMIS Number.', 400);
  }

  const testCodes = [...new Set(normalizedInputRows.map((row) => row.testCode))];

  const [tests, marks] = await Promise.all([
    Test_Master.findAll({
      where: {
        testcode: {
          [db.Sequelize.Op.in]: testCodes,
        },
        type_of_exam: '006',
      },
      attributes: ['testcode', 'Test_Name', 'testdate', 'no_of_ques'],
      raw: true,
    }),
    CurrentAffairs_Master.findAll({
      where: {
        Test_Code: {
          [db.Sequelize.Op.in]: testCodes,
        },
      },
      attributes: [
        'Test_Code',
        'ROLLNO',
        'Candidate_Name',
        'CORANS',
        'TOTAL',
        'CORRECT',
        'WRONG',
        'BLANK',
        'CORRECT1',
        'WRONG1',
        'BLANK1',
        'TOTAL1',
        'CORRECT2',
        'WRONG2',
        'BLANK2',
        'TOTAL2',
      ],
      raw: true,
    }),
  ]);

  const testMap = new Map(tests.map((test) => [String(test.testcode), test]));
  const markMap = new Map();

  for (const mark of marks) {
    const testCodeKey = normalizeLookupToken(mark.Test_Code);
    const rollNoKey = normalizeLookupToken(mark.ROLLNO);
    const exactKey = `${String(mark.Test_Code || '')}__${String(mark.ROLLNO || '')}`;
    const normalizedKey = `${testCodeKey}__${rollNoKey}`;

    if (!markMap.has(exactKey)) {
      markMap.set(exactKey, mark);
    }

    if (!markMap.has(normalizedKey)) {
      markMap.set(normalizedKey, mark);
    }
  }

  return normalizedInputRows.map((row) => {
    const { original, testCode, emisNumber } = row;
    const test = testMap.get(testCode);
    const exactMarkKey = `${testCode}__${emisNumber}`;
    const normalizedMarkKey = `${normalizeLookupToken(testCode)}__${normalizeLookupToken(emisNumber)}`;
    const mark = markMap.get(exactMarkKey) || markMap.get(normalizedMarkKey);

    const noOfQuestions = parseNumberOrNull(firstNonEmpty(
      findValueByAliases(original, ['No. of Questions', 'No of Questions', 'NO OF QUESTIONS']),
      test?.no_of_ques
    ));

    const currentsAffairsQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in CURRENTS AFFAIRS',
      'No of Questions in CURRENTS AFFAIRS',
      'No. of Questions in CURRENT AFFAIRS',
      'No of Questions in CURRENT AFFAIRS',
      'No. of Questions in Current Affairs',
      'No of Questions in Current Affairs',
    ]));

    const integratedEnglishQuestionCount = parseNumberOrNull(findValueByAliases(original, [
      'No. of Questions in INTEGRATED ENGLISH',
      'No of Questions in INTEGRATED ENGLISH',
      'No. of Questions in Integrated English',
      'No of Questions in Integrated English',
    ]));

    const maxScore = parseNumberOrNull(findValueByAliases(original, ['Max Score', 'MAX SCORE']));
    const currentsAffairsMaxScore = parseNumberOrNull(findValueByAliases(original, [
      'CURRENTS AFFAIRS Max Score',
      'CURRENT AFFAIRS Max Score',
      'Current Affairs Max Score',
    ]));
    const integratedEnglishMaxScore = parseNumberOrNull(findValueByAliases(original, [
      'INTEGRATED ENGLISH Max Score',
      'Integrated English Max Score',
    ]));

    const corans = normalizeCorans(mark?.CORANS, noOfQuestions);
    const hasCorans = corans.length > 0;
    const overallFromCorans = buildStatsFromCorans(corans);

    let currentsAffairsFromCorans = null;
    let integratedEnglishFromCorans = null;

    if (hasCorans && currentsAffairsQuestionCount !== null && integratedEnglishQuestionCount !== null) {
      const currentsCount = Math.max(0, currentsAffairsQuestionCount);
      const integratedCount = Math.max(0, integratedEnglishQuestionCount);

      const currentsAns = corans.slice(0, currentsCount);
      const integratedAns = corans.slice(currentsCount, currentsCount + integratedCount);

      currentsAffairsFromCorans = buildStatsFromCorans(currentsAns);
      integratedEnglishFromCorans = buildStatsFromCorans(integratedAns);
    }

    const overallCorrect = hasCorans ? overallFromCorans.correct : parseNumberOrZero(mark?.CORRECT);
    const overallWrong = hasCorans ? overallFromCorans.wrong : parseNumberOrZero(mark?.WRONG);
    const overallBlank = hasCorans ? overallFromCorans.blank : parseNumberOrZero(mark?.BLANK);
    const overallAttend = overallCorrect + overallWrong;

    const currentsAffairsCorrect = currentsAffairsFromCorans ? currentsAffairsFromCorans.correct : parseNumberOrZero(mark?.CORRECT1);
    const currentsAffairsWrong = currentsAffairsFromCorans ? currentsAffairsFromCorans.wrong : parseNumberOrZero(mark?.WRONG1);
    const currentsAffairsBlank = currentsAffairsFromCorans ? currentsAffairsFromCorans.blank : parseNumberOrZero(mark?.BLANK1);
    const currentsAffairsAttend = currentsAffairsCorrect + currentsAffairsWrong;
    const currentsAffairsTotal = parseNumberOrNull(mark?.TOTAL1);

    const integratedEnglishCorrect = integratedEnglishFromCorans ? integratedEnglishFromCorans.correct : parseNumberOrZero(mark?.CORRECT2);
    const integratedEnglishWrong = integratedEnglishFromCorans ? integratedEnglishFromCorans.wrong : parseNumberOrZero(mark?.WRONG2);
    const integratedEnglishBlank = integratedEnglishFromCorans ? integratedEnglishFromCorans.blank : parseNumberOrZero(mark?.BLANK2);
    const integratedEnglishAttend = integratedEnglishCorrect + integratedEnglishWrong;
    const integratedEnglishTotal = parseNumberOrNull(mark?.TOTAL2);
    const overallTotal = parseNumberOrNull(mark?.TOTAL) ?? (
      parseNumberOrZero(mark?.TOTAL1) +
      parseNumberOrZero(mark?.TOTAL2)
    );

    return {
      TESTCODE: testCode,
      'EMIS Number': emisNumber,
      'Student Name': firstNonEmpty(mark?.Candidate_Name, findValueByAliases(original, ['Student Name', 'Candidate Name']), ''),
      'UDISE Code': firstNonEmpty(findValueByAliases(original, ['UDISE Code'])),
      School: firstNonEmpty(findValueByAliases(original, ['School'])),
      'Q Set ID': firstNonEmpty(findValueByAliases(original, ['Q Set ID', 'QSET ID', 'Q SET'])),
      'Exam Date': firstNonEmpty(findValueByAliases(original, ['Exam Date']), test?.testdate),
      'Exam Name': firstNonEmpty(test?.Test_Name, ''),
      'No. of Questions': noOfQuestions,
      'Overall attend': overallAttend,
      'Overall unattended': overallBlank,
      'Overall Correct': overallCorrect,
      'Overall Wrong': overallWrong,
      'Max Score': maxScore,
      'Overall Total': overallTotal,
      'No. of Questions in CURRENTS AFFAIRS': currentsAffairsQuestionCount,
      'CURRENTS AFFAIRS attend': currentsAffairsAttend,
      'CURRENTS AFFAIRS Blank': currentsAffairsBlank,
      'CURRENTS AFFAIRS Correct': currentsAffairsCorrect,
      'CURRENTS AFFAIRS Wrong': currentsAffairsWrong,
      'CURRENTS AFFAIRS Max Score': currentsAffairsMaxScore,
      'CURRENTS AFFAIRS Total': currentsAffairsTotal,
      'No. of Questions in INTEGRATED ENGLISH': integratedEnglishQuestionCount,
      'INTEGRATED ENGLISH attend': integratedEnglishAttend,
      'INTEGRATED ENGLISH Blank': integratedEnglishBlank,
      'INTEGRATED ENGLISH Correct': integratedEnglishCorrect,
      'INTEGRATED ENGLISH Wrong': integratedEnglishWrong,
      'INTEGRATED ENGLISH Max Score': integratedEnglishMaxScore,
      'INTEGRATED ENGLISH Total': integratedEnglishTotal,
    };
  });
};

const enrichTemplateRows = catchAsync(async (req, res, next) => {
  const { examType, rows } = req.body;
  const normalizedExamType = normalizeExamTypeInput(examType);

  if (!normalizedExamType) {
    return next(new AppError('Invalid examType. Use JEE, NEET, CUET or CURRENTAFFAIRS.', 400));
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return next(new AppError('rows must be a non-empty array.', 400));
  }

  let enrichedRows = [];
  if (normalizedExamType === 'jee') {
    enrichedRows = await enrichJeeTemplateRows(rows);
  } else if (normalizedExamType === 'neet') {
    enrichedRows = await enrichNeetTemplateRows(rows);
  } else if (normalizedExamType === 'cuet') {
    enrichedRows = await enrichCuetTemplateRows(rows);
  } else if (normalizedExamType === 'currentaffairs') {
    enrichedRows = await enrichCurrentAffairsTemplateRows(rows);
  } else {
    return next(new AppError('This route currently supports JEE, NEET, CUET and CURRENTAFFAIRS.', 400));
  }

  res.status(200).json({
    status: 'success',
    message: `Template rows enriched successfully for ${normalizedExamType.toUpperCase()}.`,
    data: {
      examType: normalizedExamType,
      inputRows: rows.length,
      enrichedRows: enrichedRows.length,
      rows: enrichedRows,
    },
  });
});

const calculateStatisticsRows = catchAsync(async (req, res, next) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return next(new AppError('rows must be a non-empty array.', 400));
  }

  const normalizedRows = rows.map((row) => {
    const testCode = String(firstNonEmpty(
      findValueByAliases(row, ['TESTCODE', 'TEST CODE', 'Test_Code', 'Test Code', 'Testcode']),
      ''
    )).trim();
    const emisNumber = String(firstNonEmpty(
      findValueByAliases(row, ['Emis NO', 'Emis_id', 'EMIS ID', 'EMIS_ID', 'EMIS Number', 'EMIS', 'Roll No', 'ROLLNO', 'ROLL NO']),
      ''
    )).trim();
    const studentName = String(firstNonEmpty(
      findValueByAliases(row, ['student_name', 'Student Name', 'Candidate_Name', 'Candidate Name']),
      ''
    )).trim();

    return {
      original: row,
      testCode,
      emisNumber,
      studentName,
      examType: getExamTypeFromTestCode(testCode),
    };
  });

  const examQueries = [
    {
      examType: 'jee',
      model: Jee_Marks,
    },
    {
      examType: 'neet',
      model: Neet_Master,
    },
    {
      examType: 'cuet',
      model: Cuet_Master,
    },
    {
      examType: 'foundation',
      model: Foundation_Master,
    },
    {
      examType: 'quantitative',
      model: Quantitative_Master,
    },
    {
      examType: 'currentaffairs',
      model: CurrentAffairs_Master,
    },
    {
      examType: 'generalability',
      model: GeneralAbility_Data,
    },
    {
      examType: 'spokenenglish',
      model: Spoken_English_Master,
    },
  ];

  const lookupMapsByExam = {};

  await Promise.all(examQueries.map(async ({ examType, model }) => {
    // Skip if model is not defined
    if (!model) {
      lookupMapsByExam[examType] = new Map();
      return;
    }

    const examRows = normalizedRows.filter((row) => row.examType === examType && row.testCode);

    if (!examRows.length) {
      lookupMapsByExam[examType] = new Map();
      return;
    }

    const testCodes = [...new Set(examRows.map((row) => row.testCode))];
    const records = await model.findAll({
      where: {
        Test_Code: {
          [db.Sequelize.Op.in]: testCodes,
        },
      },
      attributes: ['Test_Code', 'ROLLNO', 'Candidate_Name'],
      raw: true,
    });

    lookupMapsByExam[examType] = buildStatisticsRecordLookupMap(records);
  }));

  const computedRows = normalizedRows.map(({ original: row, testCode, emisNumber, studentName: sourceStudentName }) => {
    const examType = getExamTypeFromTestCode(testCode);
    const matchedRecord = getStatisticsRecordForRow(lookupMapsByExam, testCode, emisNumber, sourceStudentName);
    const resolvedEmisNumber = String(firstNonEmpty(
      matchedRecord?.ROLLNO,
      emisNumber,
      ''
    )).trim();
    const studentName = String(firstNonEmpty(
      matchedRecord?.Candidate_Name,
      sourceStudentName,
      ''
    )).trim();
    const questionSetId = String(firstNonEmpty(
      findValueByAliases(row, ['Question_set_id', 'Question Set Id', 'Question Set ID', 'Q_SET_ID']),
      ''
    )).trim();
    const examName = String(firstNonEmpty(
      findValueByAliases(row, ['Exam Name', 'Exam_Name', 'ExamName']),
      ''
    )).trim();
    const questionFormat = String(firstNonEmpty(
      findValueByAliases(row, ['q_format', 'Q_FORMAT', 'Question Format']),
      ''
    )).trim();
    const formatName = String(firstNonEmpty(
      findValueByAliases(row, ['format_name', 'Format Name', 'FORMAT_NAME']),
      ''
    )).trim();
    const subject = String(firstNonEmpty(
      findValueByAliases(row, ['subject', 'Subject']),
      ''
    )).trim();
    const questionId = String(firstNonEmpty(
      findValueByAliases(row, ['Question_id', 'Question ID', 'QUESTION_ID']),
      ''
    )).trim();
    const sequenceId = String(firstNonEmpty(
      findValueByAliases(row, ['sequence_id', 'Sequence ID', 'SEQUENCE_ID']),
      ''
    )).trim();
    const correctOptionsRaw = firstNonEmpty(
      findValueByAliases(row, ['correct_options', 'Correct Options', 'correct option', 'Correct_Options']),
      ''
    );
    const givenAnswerRaw = firstNonEmpty(
      findValueByAliases(row, ['Given_Answer', 'Given Answer', 'given_answer', 'Given Option', 'Given_Option']),
      ''
    );

    const correctOptions = String(correctOptionsRaw).trim();
    const acceptedAnswers = buildAcceptedStatisticsAnswers(correctOptions);
    const normalizedGiven = normalizeStatisticsOption(givenAnswerRaw);
    const positiveMark = examType === 'cuet' ? 5 : 4;
    const isJeeRow = examType === 'jee' || /\bJEE\b/i.test(examName);
    const parseJeeNumericValue = (value) => {
      const compact = String(value === undefined || value === null ? '' : value)
        .replace(/\s+/g, '')
        .trim();

      if (!compact) {
        return null;
      }

      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(compact)) {
        return null;
      }

      const parsed = Number(compact);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const hasJeeNumericMatch = isJeeRow && (() => {
      const givenNumeric = parseJeeNumericValue(normalizedGiven);

      if (givenNumeric === null) {
        return false;
      }

      return acceptedAnswers.some((answer) => {
        const acceptedNumeric = parseJeeNumericValue(answer);
        return acceptedNumeric !== null && acceptedNumeric === givenNumeric;
      });
    })();

    let correctOrIncorrect = 'Wrong';
    let correctMark = -1;
    let normalizedGivenAnswer = normalizedGiven;

    if (!normalizedGiven) {
      correctOrIncorrect = 'Blank';
      correctMark = 0;
      normalizedGivenAnswer = '';
    } else if (acceptedAnswers.includes(normalizedGiven) || hasJeeNumericMatch) {
      correctOrIncorrect = 'Correct';
      correctMark = positiveMark;
    }

    return {
      TESTCODE: testCode,
      'Emis NO': resolvedEmisNumber,
      student_name: studentName,
      Question_set_id: questionSetId,
      'Exam Name': examName,
      q_format: questionFormat,
      format_name: formatName,
      subject,
      Question_id: questionId,
      sequence_id: sequenceId,
      correct_options: correctOptions,
      Given_Answer: normalizedGivenAnswer,
      Correct_or_Incorrect: correctOrIncorrect,
      correct_Mark: correctMark,
    };
  });

  const summary = computedRows.reduce((accumulator, row) => {
    accumulator.totalRows += 1;
    if (row.Correct_or_Incorrect === 'Correct') accumulator.correct += 1;
    else if (row.Correct_or_Incorrect === 'Wrong') accumulator.wrong += 1;
    else accumulator.blank += 1;
    accumulator.totalMarks += Number(row.correct_Mark) || 0;
    return accumulator;
  }, {
    totalRows: 0,
    correct: 0,
    wrong: 0,
    blank: 0,
    totalMarks: 0,
  });

  res.status(200).json({
    status: 'success',
    message: 'Statistics rows calculated successfully.',
    data: {
      inputRows: rows.length,
      computedRows: computedRows.length,
      summary,
      rows: computedRows,
    },
  });
});

module.exports = {
  getAllTypeExam,
  uploadExcel,
  enrichTemplateRows,
  calculateStatisticsRows,
};