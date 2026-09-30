const asyncHandler = require('express-async-handler');
const AppError = require('../utils/appError');
const db = require('../db/models');

const getAllMonthYears = asyncHandler(async (req, res) => {
  const data = await db.month_year_master.findAll({
    order: [['Eva_Year', 'ASC'], ['Eva_Month', 'ASC']]
  });
  res.status(200).json({ success: true, data });
});

const monthYearRegister = asyncHandler(async (req, res) => {
  const {
    Eva_Month_01: Eva_Month,
    Eva_Year_02: Eva_Year,
    Eva_Month_Des_03: Eva_Month_Des,
    Eva_Year_Desc_04: Eva_Year_Desc,
    Month_Year_Status_05: Month_Year_Status
  } = req.body;

  if (req.method === 'POST') {
    const existing = await db.month_year_master.findOne({
      where: { Eva_Month, Eva_Year }
    });
    if (existing) {
      res.status(400);
      throw new AppError('Month Year record already exists', 400);
    }
    const record = await db.month_year_master.create({
      Eva_Month,
      Eva_Year,
      Eva_Month_Des,
      Eva_Year_Desc,
      Month_Year_Status
    });
    return res.status(201).json({ success: true, message: 'Created successfully', data: record });
  }

  if (req.method === 'PUT') {
    await db.month_year_master.update(
      { Eva_Month, Eva_Year, Eva_Month_Des, Eva_Year_Desc, Month_Year_Status },
      { where: { id: req.params.id } }
    );
    return res.status(200).json({ success: true, message: 'Updated successfully' });
  }
});

const deleteMonthYear = asyncHandler(async (req, res) => {
  await db.month_year_master.destroy({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: 'Deleted successfully' });
});

module.exports = { getAllMonthYears, monthYearRegister, deleteMonthYear };
