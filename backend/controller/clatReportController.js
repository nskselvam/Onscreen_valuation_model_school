const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Clat_Master = db.clatMaster;
const Clat_Question = db.clatQuestion;
const Test_Master = db.Test_Master;
const District_Master = db.District_Master;

const withDistrictNames = async (records) => {
  const codes = [...new Set(records.map((record) => record.BATCHNAME).filter(Boolean))];
  const districts = codes.length ? await District_Master.findAll({ where: { DCODE: { [Op.in]: codes } }, attributes: ['DCODE', 'DNAME'], raw: true }) : [];
  const names = new Map(districts.map((district) => [district.DCODE, district.DNAME]));
  return records.map((record) => ({ ...record, District_Name: names.get(record.BATCHNAME) || record.BATCHNAME }));
};

exports.getTestCodesForReport = catchAsync(async (req, res) => {
  const tests = await Test_Master.findAll({ where: { type_of_exam: '012' }, attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'], order: [['testcode', 'DESC']] });
  res.status(200).json({ status: 'success', data: tests });
});

exports.getClatMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  const testMaster = await Test_Master.findOne({ where: { testcode: testCode, type_of_exam: '012' }, attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'] });
  if (!testMaster) return next(new AppError('Test not found', 404));
  const marks = await Clat_Master.findAll({ where: { Test_Code: testCode }, order: [['TOTAL', 'DESC']], raw: true });
  res.status(200).json({ status: 'success', data: { testMaster, marks: await withDistrictNames(marks), count: marks.length } });
});

exports.getClatQbDetailsByTestCode = catchAsync(async (req, res) => {
  const { testCode } = req.params;
  const questions = await Clat_Question.findAll({ where: { Test_Code: testCode }, order: [['BATCHNAME', 'ASC'], ['Qno', 'ASC']], raw: true });
  res.status(200).json({ status: 'success', data: { qbDetails: await withDistrictNames(questions), count: questions.length } });
});
