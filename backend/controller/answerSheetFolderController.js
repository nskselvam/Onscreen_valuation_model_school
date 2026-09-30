const fs = require('fs/promises');
const path = require('path');
const ExcelJS = require('exceljs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const columns = ['testCode', 'districtCode', 'subjectFolder'];
const rootDirectory = process.env.ANSWER_SHEET_UPLOAD_DIR || path.join(__dirname, '..', 'AnswerSheet_Uploaded');

const createS3Objects = async (entries) => {
  const { AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
  if (!AWS_BUCKET_NAME || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    throw new Error('S3 requires AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_REGION.');
  }

  const client = new S3Client({
    region: AWS_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
  });
  const keys = new Set();
  for (const { testCode, districtCode, subjectFolder } of entries) {
    const prefix = `AnswerSheet_Uploaded/${testCode}/${testCode}_${districtCode}/${subjectFolder}`;
    keys.add(`${prefix}/`);
  }

  try {
    for (const key of keys) {
      try {
        await client.send(new PutObjectCommand({
          Bucket: AWS_BUCKET_NAME,
          Key: key,
          Body: '',
          ContentType: 'application/x-directory',
          IfNoneMatch: '*',
        }));
      } catch (error) {
        if (error.$metadata?.httpStatusCode !== 412) throw error;
      }
    }
  } finally {
    client.destroy();
  }
};

const getCellText = (cell) => {
  const value = cell.value;
  if (value && typeof value === 'object') {
    if ('text' in value) return String(value.text).trim();
    if ('result' in value) return String(value.result ?? '').trim();
    return '';
  }
  return String(value ?? '').trim();
};

exports.downloadTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Answer sheets');
    worksheet.columns = columns.map((header) => ({ header, key: header, width: 22, style: { numFmt: '@' } }));
    worksheet.getRow(1).font = { bold: true };
    worksheet.addRow({
      testCode: '26C12003',
      districtCode: '02',
      subjectFolder: 'PHYSICS_01',
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="answer-sheet-folders.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

exports.createFoldersFromExcel = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Upload an .xlsx file in the file field.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(req.file.buffer);
    } catch (error) {
      return res.status(400).json({ message: 'The uploaded file is not a valid .xlsx workbook.' });
    }
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ message: 'The workbook must contain a worksheet.' });
    }

    const headers = new Map();
    worksheet.getRow(1).eachCell((cell, column) => {
      headers.set(getCellText(cell).toLowerCase(), column);
    });
    if (columns.some((column) => !headers.has(column.toLowerCase()))) {
      return res.status(400).json({ message: `Required columns: ${columns.join(', ')}` });
    }

    const entries = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const values = columns.map((column) => getCellText(row.getCell(headers.get(column.toLowerCase()))));
      if (values.every((value) => !value)) continue;
      if (values.some((value) => !/^[A-Za-z0-9_-]+$/.test(value))) {
        return res.status(400).json({ message: `Row ${rowNumber}: all columns must contain only letters, numbers, _ or -.` });
      }
      entries.push(Object.fromEntries(columns.map((column, index) => [column, values[index]])));
    }

    if (!entries.length) {
      return res.status(400).json({ message: 'The worksheet contains no data rows.' });
    }

    const useS3 = Boolean(process.env.AWS_BUCKET_NAME) && !process.env.ANSWER_SHEET_UPLOAD_DIR;
    if (useS3) {
      await createS3Objects(entries);
    } else {
      for (const { testCode, districtCode, subjectFolder } of entries) {
        const subjectPath = path.join(rootDirectory, testCode, `${testCode}_${districtCode}`, subjectFolder);
        await fs.mkdir(subjectPath, { recursive: true });
      }
    }

    res.status(201).json({ message: 'Answer sheet folders created.', rowsProcessed: entries.length, storage: useS3 ? 's3' : 'local' });
  } catch (error) {
    next(error);
  }
};