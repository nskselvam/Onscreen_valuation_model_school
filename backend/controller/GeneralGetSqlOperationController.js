const express = require("express");
const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const { Op } = require("sequelize");
const regulationData = db.Regulation_Master;
const centerData = db.Icm_Name_master;
const District_Master = db.District_Master;

const getRegulationData = asyncHandler(async (req, res) => {
  try {
    const data = await regulationData.findAll();
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching regulation data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const getCenterData = asyncHandler(async (req, res) => {
  try {
    const data = await centerData.findAll();
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching center data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Returns all districts ordered by DCODE
const getDistrictData = asyncHandler(async (req, res) => {
  try {
    const data = await District_Master.findAll({
      attributes: ['id', 'DCODE', 'DNAME'],
      order: [['DCODE', 'ASC']],
    });
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching district data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Returns districts whose DCODE is in the provided comma-separated codes string
const getDistrictsByCodes = asyncHandler(async (req, res) => {
  const { codes } = req.query; // e.g. "01,02,03"
  if (!codes) {
    return res.status(400).json({ message: "codes query param is required" });
  }
  const codeList = codes.split(',').map((c) => c.trim()).filter(Boolean);
  try {
    const data = await District_Master.findAll({
      attributes: ['id', 'DCODE', 'DNAME'],
      where: { DCODE: { [Op.in]: codeList } },
      order: [['DCODE', 'ASC']],
    });
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching districts by codes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = {
  getRegulationData,
  getCenterData,
  getDistrictData,
  getDistrictsByCodes,
};