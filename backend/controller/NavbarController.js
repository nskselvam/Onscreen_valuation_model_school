const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const NavData = db.navbar_header;

const NavBarHeader = asyncHandler(async (req, res) => {    

   // return
  // Validate userRole parameter
  if (!req.query.userRole) {
    res.status(400);
    throw new Error("userRole query parameter is required");
  }

  
  let flnameRollName = "User_Roll_Admin_" + req.query.userRole;
  let token;
  token = req.cookies.jwt || req.query.token;
  
  if (!token) {
    res.status(401);
    throw new Error("Not authorised, no token");
  }

  let tokendb;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token in NavBarHeader:', decoded);
    if (decoded.userId) {
      tokendb = await db.User_Details.findByPk(decoded.userId);
      if (!tokendb && db.faculties) {
        tokendb = await db.faculties.findByPk(decoded.userId);
      }
    }
    if (!tokendb && decoded.Eva_Id && db.faculties) {
      tokendb = await db.faculties.findOne({ where: { Eva_Id: decoded.Eva_Id } });
    }
    if (!tokendb) {
      return res.status(401).json({ message: "User not found" });
    }
    if (tokendb.token_version !== undefined && decoded.token_version !== undefined && tokendb.token_version !== decoded.token_version) {
      return res.status(401).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(401);
    throw new Error("Not authorised, token failed");
  }
  
  let UserRole = [];
  
  // Parse the User_Roll_Admin field - handle both JSON array and comma-separated string
  if (tokendb[flnameRollName]) {
    try {
      const roleData = String(tokendb[flnameRollName]);
      if (roleData.startsWith('[')) {
        UserRole = JSON.parse(roleData);
      } else {
        UserRole = roleData.split(',');
      }
    } catch (e) {
      console.error(`Error parsing ${flnameRollName}:`, e);
      UserRole = [];
    }
  }

  // Fallback to roll_master if not found on user object
  if (UserRole.length === 0) {
    try {
      const rollMasterEntry = await db.roll_master.findOne({
        where: { rollName: req.query.userRole }
      });
      if (rollMasterEntry && rollMasterEntry.rollDescrption) {
        const roleData = String(rollMasterEntry.rollDescrption);
        if (roleData.startsWith('[')) {
          UserRole = JSON.parse(roleData);
        } else {
          UserRole = roleData.split(',');
        }
      }
    } catch (e) {
      console.error(`Error querying roll_master:`, e);
    }
  }
  

  
  // Convert to integers and filter out invalid values

  const UserRoleIds = UserRole
    .map(role => parseInt(role, 10))
    .filter(id => !isNaN(id) && id > 0);
  
  
  if (UserRoleIds.length === 0) {
    return res.status(404).json({ 
      status: "fail", 
      message: "No valid roles assigned to user" 
    });
  }

  const data = await NavData.findAll({
    where: { id: UserRoleIds },
  });

  
  if (!data || data.length === 0) {
    return res.status(404).json({ 
      status: "fail", 
      message: "No navigation data found for user role" 
    });
  }
  
  res.status(200).json({ status: "success", data });
});
module.exports = {
  NavBarHeader
};