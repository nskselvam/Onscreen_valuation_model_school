const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const ExcelJS = require('exceljs');
const { S3Client } = require('@aws-sdk/client-s3');

const uploadDirectory = path.join(os.tmpdir(), `answer-sheet-folders-${process.pid}`);
process.env.ANSWER_SHEET_UPLOAD_DIR = uploadDirectory;
const { createFoldersFromExcel, downloadTemplate } = require('../controller/answerSheetFolderController');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; },
  setHeader() {},
  end() {},
});

const upload = async (rows) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Answer sheets');
  rows.forEach((row) => sheet.addRow(row));
  const res = response();
  await createFoldersFromExcel({ file: { buffer: await workbook.xlsx.writeBuffer() } }, res, (error) => { throw error; });
  return res;
};

test('template contains the required Excel columns and an editable example', async () => {
  const chunks = [];
  const res = { ...response(), write(chunk) { chunks.push(Buffer.from(chunk)); }, end(chunk) { if (chunk) chunks.push(Buffer.from(chunk)); } };
  await downloadTemplate({}, res, (error) => { throw error; });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.concat(chunks));
  assert.deepEqual(workbook.worksheets[0].getRow(1).values.slice(1),
    ['testCode', 'districtCode', 'subjectFolder']);
  assert.deepEqual(workbook.worksheets[0].getRow(2).values.slice(1),
    ['26C12003', '02', 'PHYSICS_01']);
});

test('Excel rows create only folders and reject invalid rows before writing', async () => {
  try {
    const headers = ['testCode', 'districtCode', 'subjectFolder'];
    const subjectPath = path.join(uploadDirectory, '26C12003', '26C12003_02', 'PHYSICS_01');
    const secondSubjectPath = path.join(uploadDirectory, '26C12003', '26C12003_02', 'PHYSICS_02');
    const res = await upload([headers, ['26C12003', '02', 'PHYSICS_01'], ['26C12003', '02', 'PHYSICS_02']]);
    assert.equal(res.statusCode, 201);
    assert.equal(res.data.rowsProcessed, 2);
    await fs.stat(subjectPath);
    await fs.stat(secondSubjectPath);
    assert.deepEqual(await fs.readdir(subjectPath), []);

    await upload([headers, ['26C12003', '02', 'PHYSICS_01']]);
    assert.deepEqual(await fs.readdir(subjectPath), []);

    const invalid = await upload([headers, ['26C12003', '02', 'PHYSICS_03'], ['../outside', '02', 'PHYSICS_04']]);
    assert.equal(invalid.statusCode, 400);
    await assert.rejects(fs.stat(path.join(uploadDirectory, '26C12003', '26C12003_02', 'PHYSICS_03')), { code: 'ENOENT' });
  } finally {
    await fs.rm(uploadDirectory, { recursive: true, force: true });
  }
});

test('S3 upload creates only subject folder markers without overwriting', async () => {
  const previousDirectory = process.env.ANSWER_SHEET_UPLOAD_DIR;
  const previousBucket = process.env.AWS_BUCKET_NAME;
  const previousRegion = process.env.AWS_REGION;
  const previousAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const previousSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const previousSend = S3Client.prototype.send;
  const objects = new Map();
  delete process.env.ANSWER_SHEET_UPLOAD_DIR;
  process.env.AWS_BUCKET_NAME = 'test-bucket';
  process.env.AWS_REGION = 'ap-south-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  S3Client.prototype.send = async (command) => {
    assert.equal(command.input.Bucket, 'test-bucket');
    assert.equal(command.input.IfNoneMatch, '*');
    if (objects.has(command.input.Key)) {
      throw { $metadata: { httpStatusCode: 412 } };
    }
    objects.set(command.input.Key, command.input.Body);
  };

  try {
    const rows = [
      ['testCode', 'districtCode', 'subjectFolder'],
      ['26C12003', '02', 'PHYSICS_01'],
      ['26C12003', '02', 'PHYSICS_02'],
    ];
    const result = await upload(rows);
    assert.equal(result.statusCode, 201);
    assert.equal(result.data.storage, 's3');
    const prefix = 'AnswerSheet_Uploaded/26C12003/26C12003_02/';
    assert.deepEqual([...objects.keys()], [
      `${prefix}PHYSICS_01/`,
      `${prefix}PHYSICS_02/`,
    ]);
    objects.set(`${prefix}PHYSICS_01/`, 'existing data');
    await upload(rows);
    assert.equal(objects.get(`${prefix}PHYSICS_01/`), 'existing data');
    assert.equal(objects.size, 2);
  } finally {
    S3Client.prototype.send = previousSend;
    if (previousDirectory === undefined) delete process.env.ANSWER_SHEET_UPLOAD_DIR;
    else process.env.ANSWER_SHEET_UPLOAD_DIR = previousDirectory;
    for (const [key, value] of Object.entries({
      AWS_BUCKET_NAME: previousBucket,
      AWS_REGION: previousRegion,
      AWS_ACCESS_KEY_ID: previousAccessKey,
      AWS_SECRET_ACCESS_KEY: previousSecretKey,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});