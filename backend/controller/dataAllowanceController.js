const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const AppError = require("../middleware/errorController");

// @desc    Get all data allowances
// @route   GET /api/data-allowance
// @access  Private
const getAllDataAllowances = asyncHandler(async (req, res) => {
  const { depcode } = req.query;

  const whereClause = depcode ? { depcode } : {};

  const allowances = await db.datta_allowance.findAll({
    where: whereClause,
    order: [['id', 'DESC']]
  });

  res.status(200).json({
    success: true,
    count: allowances.length,
    data: allowances
  });
});

// @desc    Get single data allowance by ID
// @route   GET /api/data-allowance/:id
// @access  Private
const getDataAllowanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const allowance = await db.datta_allowance.findByPk(id);

  if (!allowance) {
    res.status(404);
    throw new AppError("Data allowance not found", 404);
  }

  res.status(200).json({
    success: true,
    data: allowance
  });
});

// @desc    Create new data allowance
// @route   POST /api/data-allowance
// @access  Private
const createDataAllowance = asyncHandler(async (req, res) => {
  const {
    depcode,
    particulars,
    remuneration_data,
    incidental,
    accomodation_cost,
    billprovide,
    dearnessallowance,
    travelallowance,
    particulars_name,
    remuneration_name
  } = req.body;

  // Validation
  if (!depcode) {
    res.status(400);
    throw new AppError("Department code is required", 400);
  }

  const newAllowance = await db.datta_allowance.create({
    depcode,
    particulars,
    remuneration_data,
    incidental,
    accomodation_cost,
    billprovide,
    dearnessallowance,
    travelallowance,
    particulars_name,
    remuneration_name
  });

  res.status(201).json({
    success: true,
    message: "Data allowance created successfully",
    data: newAllowance
  });
});

// @desc    Update data allowance
// @route   PUT /api/data-allowance/:id
// @access  Private
const updateDataAllowance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    depcode,
    particulars,
    remuneration_data,
    incidental,
    accomodation_cost,
    billprovide,
    dearnessallowance,
    travelallowance,
    particulars_name,
    remuneration_name
  } = req.body;

  const allowance = await db.datta_allowance.findByPk(id);

  if (!allowance) {
    res.status(404);
    throw new AppError("Data allowance not found", 404);
  }

  // Update fields
  const updatedAllowance = await allowance.update({
    depcode: depcode !== undefined ? depcode : allowance.depcode,
    particulars: particulars !== undefined ? particulars : allowance.particulars,
    remuneration_data: remuneration_data !== undefined ? remuneration_data : allowance.remuneration_data,
    incidental: incidental !== undefined ? incidental : allowance.incidental,
    accomodation_cost: accomodation_cost !== undefined ? accomodation_cost : allowance.accomodation_cost,
    billprovide: billprovide !== undefined ? billprovide : allowance.billprovide,
    dearnessallowance: dearnessallowance !== undefined ? dearnessallowance : allowance.dearnessallowance,
    travelallowance: travelallowance !== undefined ? travelallowance : allowance.travelallowance,
    particulars_name: particulars_name !== undefined ? particulars_name : allowance.particulars_name,
    remuneration_name: remuneration_name !== undefined ? remuneration_name : allowance.remuneration_name
  });

  res.status(200).json({
    success: true,
    message: "Data allowance updated successfully",
    data: updatedAllowance
  });
});

// @desc    Delete data allowance
// @route   DELETE /api/data-allowance/:id
// @access  Private
const deleteDataAllowance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const allowance = await db.datta_allowance.findByPk(id);

  if (!allowance) {
    res.status(404);
    throw new AppError("Data allowance not found", 404);
  }

  await allowance.destroy();

  res.status(200).json({
    success: true,
    message: "Data allowance deleted successfully",
    data: { id }
  });
});

// @desc    Get allowances by department code
// @route   GET /api/data-allowance/department/:depcode
// @access  Private
const getDataAllowanceByDepcode = asyncHandler(async (req, res) => {
  const { depcode } = req.params;

  const allowances = await db.datta_allowance.findAll({
    where: { depcode },
    order: [['id', 'DESC']]
  });

  if (!allowances || allowances.length === 0) {
    res.status(404);
    throw new AppError("No allowances found for this department", 404);
  }

  res.status(200).json({
    success: true,
    count: allowances.length,
    data: allowances
  });
});

module.exports = {
  getAllDataAllowances,
  getDataAllowanceById,
  createDataAllowance,
  updateDataAllowance,
  deleteDataAllowance,
  getDataAllowanceByDepcode
};
