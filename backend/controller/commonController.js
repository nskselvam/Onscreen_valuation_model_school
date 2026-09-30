const express = require("express");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/appError");
const db = require("../db/models");
const { Op } = require("sequelize");
const master_data = db.master_data;
const user_role_masters = db.user_role_masters;
const valid_ips = db.valid_ips;
const User_Logs = db.User_Logs;
const faculties = db.User_Details;

const {
  formatToIST,
  getCurrentISTDateTime,
  getClientIP,
} = require("../utils/formatDateTime");
const valid_ip = require("../db/models/valid_ip");

const generalMasterData = asyncHandler(async (req, res) => {
  const clientIP = getClientIP(req);

  const ipRecord = await valid_ips.findOne({ where: { Ip_Address: clientIP, vflg: "Y" } });
  if (!ipRecord) {
    return res
      .status(403)
      .json({
        message: "Access denied: IP address not authorized",
        valid_ip: clientIP,
        ipvalid: false,
      });
  }

  const data = await master_data.findAll({
    order: [['D_Code', 'ASC']]
  });

  const Month_Year_Data = await db.month_year_master.findAll({
    where : { Month_Year_Status: 'Y' },
    order: [['Eva_Year', 'ASC'], ['Eva_Month', 'ASC']]
  });
  res.status(200).json({
    data,
    Month_Year_Data,
    valid_ip: clientIP,
  });
});

const master_Data = asyncHandler(async (req, res) => {
  const { tableName } = req.body;

  const model = db[tableName];
  let masterData;
  if (req.params.id) {
    if (req.method === "GET" && req.params.id) {
      masterData = await model.findByPk(req.params.id);
    } else if (req.method === "DELETE" && req.params.id) {
      masterData = await model.destroy({ where: { id: req.params.id } });
    }
  } else if (req.method === "GET") {
    masterData = await model.findAll({ order: [[req.body.order1, "ASC"]] });
  }
  if (!masterData) {
    res.status(404);
    throw new AppError("Master data not found", 404);
  }

  res
    .status(200)
    .json({ message: "Master data fetched successfully", data: masterData });
});

const master_Data_Register = asyncHandler(async (req, res) => {
  const {
    D_Code_01: D_Code,
    Degree_Name_02: Degree_Name,
    Flg_03: Flg,
    Time_Flg_04: Time_Flg,
    Paper_Time_05: Paper_Time,
  } = req.body;

  let master_data_update;
  const existingData = await master_data.findOne({ where: { D_Code } });
  if (existingData && req.method == "POST") {
    res.status(400);
    throw new AppError("Master data already exists", 400);
  } else if (req.method == "POST") {
    master_data_update = await master_data.create({
      D_Code,
      Degree_Name,
      Flg,
      Time_Flg,
      Paper_Time,
    });
  } else if (req.method == "PUT") {
    master_data_update = await master_data.update(
      {
        D_Code,
        Degree_Name,
        Flg,
        Time_Flg,
        Paper_Time,
      },
      { where: { id: req.params.id } }
    );
  }
  res.status(200).json({
    message: "Master data for registration fetched successfully",
    registerData: master_data_update,
  });
});

const master_Role_Register = asyncHandler(async (req, res) => {
  const { user_role_code, user_role } = req.body;

  const existingRole = await user_role_masters.findOne({
    where: { user_role_code },
  });
  if (existingRole && req.method == "POST") {
    res.status(400);
    throw new AppError("Role already exists with this code", 400);
  } else if (req.method == "POST") {
    await user_role_masters.create({
      user_role_code,
      user_role,
    });
  } else if (req.method == "PUT") {
    await user_role_masters.update(
      {
        user_role_code,
        user_role,
      },
      { where: { id: req.params.id } }
    );
  }

  res.status(200).json({
    message: "Master role registration endpoint",
  });
});

// Helper function to validate IP address format
const isValidIP = (ip) => {
  const ipPattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(ip);
};

const valid_Ip_Register = asyncHandler(async (req, res) => {
  const { ip_from, ip_to, block_name, vflg, campus, floor } = req.body;


  // Validate IP address format
  if (!isValidIP(ip_from) || !isValidIP(ip_to)) {
    res.status(400);
    throw new AppError("Invalid From or To IP address format", 400);
  }

  const fromSegments = ip_from.split(".").map(Number);
  const toSegments = ip_to.split(".").map(Number);

  for (let i = 0; i < 4; i++) {
    if (fromSegments[i] > toSegments[i]) {
      res.status(400);
      throw new AppError(
        "From IP address should be less than or equal to To IP address",
        400
      );
    }
  }

  const sip = fromSegments[3];
  const eip = toSegments[3];

  for (let i = sip; i <= eip; i++) {
    const currentIp = `${fromSegments[0]}.${fromSegments[1]}.${fromSegments[2]}.${i}`;
    const existingIP = await valid_ips.findOne({
      where: { Ip_Address: currentIp },
    });

    if (existingIP && req.method === "POST") {
      // res.status(400);
      // throw new AppError("IP address already exists", 400);
      continue; // Skip existing IPs
    } else if (req.method === "POST") {
      await valid_ips.create({
        Ip_Address: currentIp,
        block_name,
        vflg,
        campus,
        floor,
      });
    }
  }
  res.status(200).json({
    message: "Valid IP registration successful",
    data: req.body,
  });
});


const master_Valid_Sections_Cross_Check = asyncHandler(async (req, res) => {
  if (!db.sub_master) {
    return res.status(200).json({ message: "sub_master model not available in this project", validSectionError: [] });
  }

  // Question Paper Checking
  const Qbs_Key = await db.sub_master.findAll({
    where: {
      [Op.or]: [
        {
          qb_flg: {
            [Op.in]: ["N", "n", null, ""],
          },
        },
        {
          ans_flg: {
            [Op.in]: ["N", "n", null, ""],
          },
        },
      ],
    },
    raw: true,
  });

  Qbs_Key.forEach(async (item) => {
    const subcodeUpper = item.Subcode.toUpperCase();
    const basePath = `../uploads/${item.Eva_Mon_Year}`;
    
    // Check for both .pdf and .PDF extensions
    const Question_Paper = fs.existsSync(path.join(__dirname, `${basePath}/qbs/${item.Dep_Name}/${subcodeUpper}.pdf`))
      ? path.join(__dirname, `${basePath}/qbs/${item.Dep_Name}/${subcodeUpper}.pdf`)
      : path.join(__dirname, `${basePath}/qbs/${item.Dep_Name}/${subcodeUpper}.PDF`);
      
    const Key_Answer_Paper = fs.existsSync(path.join(__dirname, `${basePath}/key/${item.Dep_Name}/${subcodeUpper}.pdf`))
      ? path.join(__dirname, `${basePath}/key/${item.Dep_Name}/${subcodeUpper}.pdf`)
      : path.join(__dirname, `${basePath}/key/${item.Dep_Name}/${subcodeUpper}.PDF`);

    if (fs.existsSync(Question_Paper) && item.qb_flg !== 'Y') {
      await db.sub_master.update(
        { qb_flg: 'Y' },
        { where: { Subcode: item.Subcode, testcode: item.testcode } }
      );
    } else if(!fs.existsSync(Question_Paper) && item.qb_flg !== 'N') {
      await db.sub_master.update(
        { qb_flg: 'N' },
        { where: { Subcode: item.Subcode, testcode: item.testcode } }
      );
    }

    if (fs.existsSync(Key_Answer_Paper) && item.ans_flg !== 'Y') {
      await db.sub_master.update(
        { ans_flg: 'Y' },
        { where: { Subcode: item.Subcode, testcode: item.testcode } }
      );
    } else if(!fs.existsSync(Key_Answer_Paper) && item.ans_flg !== 'N') {
      await db.sub_master.update(
        { ans_flg: 'N' },
        { where: { Subcode: item.Subcode, testcode: item.testcode } }
      );
    }


  });
  const sub_master_data = await db.sub_master.findAll({
    where: {
      mismatch_flg: {
        [Op.in]: ["N", "n", null, ""],
      },
    },
    raw: true,
  });

  let validSectionError = [];
  for (const item of sub_master_data) {
    validSectionError = []; // Reset error array for each subcode

    const valid_Data = await db.valid_question.findAll({
      where: {
        SUBCODE: item.Subcode,
        testcode: item.testcode,
      },
      order: [['SECTION', 'ASC'], ['FROM_QST', 'ASC']],
      raw: true,
    });



    for (const validItem of valid_Data) {
      const section_Data = await db.valid_sections.findAll({
        where: {
          sub_code: validItem.SUBCODE,
          testcode: validItem.testcode,
          section: validItem.SECTION,
          qstn_num: {
            [Op.between]: [validItem.FROM_QST, validItem.TO_QST],
          },
        },
        order: [['section', 'ASC'], ['qstn_num', 'ASC']],
        raw: true,
      });


      if (section_Data.length === 0) {
        validSectionError.push({
          Error_Remarks: `No valid sections found for Subcode ${validItem.SUBCODE}`
        });
      } else {
        if (validItem.SUB_SEC && validItem.SUB_SEC.toUpperCase() == 'AB') {
          for (let i = validItem.FROM_QST; i <= validItem.TO_QST; i++) {
            for (let ii = 97; ii <= 98; ii++) {
              const find_section_data = section_Data.filter(
                (section) =>
                  section.sub_code === validItem.SUBCODE &&
                  section.testcode === validItem.testcode &&
                  section.section === validItem.SECTION &&
                  section.qstn_num === i &&
                  section.sub_section === String.fromCharCode(ii)
              );
              const sum_value = find_section_data.reduce((sum, section) => sum + (parseFloat(section.max_mark) || 0), 0);
              if (sum_value !== validItem.MARK_MAX) {
                validSectionError.push({
                  Error_Remarks: `Max mark for question ${i}${String.fromCharCode(ii)}: ${sum_value} does NOT match expected MARK_MAX: ${validItem.MARK_MAX}`
                });
              }
            }
          }

        } else {
          for (let i = validItem.FROM_QST; i <= validItem.TO_QST; i++) {
            const find_section_data = section_Data.filter(
              (section) =>
                section.sub_code === validItem.SUBCODE &&
                section.testcode === validItem.testcode &&
                section.section === validItem.SECTION &&
                section.qstn_num === i
            );

            const sum_value = find_section_data.reduce((sum, section) => sum + (parseFloat(section.max_mark) || 0), 0);
            if (sum_value !== validItem.MARK_MAX) {
              validSectionError.push({
                Error_Remarks: `Max mark for question ${i}: ${sum_value} does NOT match expected MARK_MAX: ${validItem.MARK_MAX}`
              });
            }
          }
        }
      }
    }

    const Section_Checking_Data = await db.valid_sections.findAll({
      where: {
        sub_code: item.Subcode,
        testcode: item.testcode,
      },
      order: [['section', 'ASC'], ['qstn_num', 'ASC']],
      raw: true,
    });

    // II Logic for checking if valid sections exist for the subcode

    for (const sectionItem of Section_Checking_Data) {

      const find_valid_Section_Data = valid_Data.filter(
        (valid) =>
          valid.SUBCODE === sectionItem.sub_code &&
          valid.testcode === sectionItem.testcode &&
          valid.SECTION === sectionItem.section &&
          sectionItem.qstn_num >= valid.FROM_QST &&
          sectionItem.qstn_num <= valid.TO_QST
      );

      if (find_valid_Section_Data.length === 0) {
        validSectionError.push({
          Error_Remarks: `No valid question(s) found for Subcode ${sectionItem.sub_code}, Section ${sectionItem.section}, Question Number ${sectionItem.qstn_num}`
        });
      }
    }
    if (validSectionError.length === 0 && (valid_Data.length > 0 || Section_Checking_Data.length > 0)) {
      await db.sub_master.update(
        { mismatch_flg: 'Y', mismatch_remarks: [] },
        { where: { Subcode: item.Subcode, testcode: item.testcode } }
      );
    } else  {
      await db.sub_master.update(
        { mismatch_flg: 'N', mismatch_remarks: validSectionError.map(error => error.Error_Remarks) },
        { where: { Subcode: item.Subcode, testcode: item.testcode } }
      );
    }

  }

  res.status(200).json({
    message: "Master valid sections cross check endpoint", validSectionError
  });

})

const table_data_where = asyncHandler(async (req, res) => {
  try {

    const { tablename, whereCondition, tblfields } = req.body;


    if (!tablename) {
      return res.status(400).json({ error: "tablename is required" });
    }

    // Get the model from db
    const model = db[tablename];

    if (!model) {
      return res.status(400).json({
        error: `Table '${tablename}' not found in database models`,
        availableTables: Object.keys(db).filter(k => typeof db[k] === 'object' && db[k].findAll)
      });
    }

    // Build query options
    const queryOptions = { where: whereCondition || {} };
    if (tblfields && Array.isArray(tblfields) && tblfields.length > 0) {
      queryOptions.attributes = tblfields;
    }


    // Query with where condition
    const data = await model.findAll(queryOptions);


    return res.status(200).json({
      data: data
    });
  } catch (error) {
    console.error("Error in table_data_where:", error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

const upload_Question_Paper_Key = asyncHandler(async (req, res) => {
  if (!db.sub_master) {
    return res.status(200).json({ success: false, message: "upload_Question_Paper_Key not available in this project" });
  }
  try {

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded. Please select at least one PDF file."
      });
    }

    // Check if uploadType is provided
    const { uploadType, username, userId, eva_month_year, user_role ,department} = req.body;
    if (!uploadType) {
      // Delete all uploaded files if uploadType is missing
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Upload type is required (question_paper or answer_key)"
      });
    }

    // Validate upload type
    if (!['question_paper', 'answer_key'].includes(uploadType)) {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Invalid upload type. Must be 'question_paper' or 'answer_key'"
      });
    }

    // Move files from temp to correct directory based on uploadType
    const subDir = uploadType === 'question_paper' ? 'qbs' : 'key';
    const finalPath = path.join(__dirname, `../uploads/${eva_month_year}/${subDir}/${department}`);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
    // console.log("Final upload path:", file.finalPath);
    // Move each file to the correct directory
    const uploadedFiles = await Promise.all(req.files.map(async (file) => {
    
    //  const finalPath = path.join(__dirname, `../uploads/${eva_month_year}/${subDir}/${department}`);
   
      const newPath = path.join(finalPath, file.filename);
      const sub_master_record = await db.sub_master.findOne({ where: 
        { Subcode: path.parse(file.filename).name, Dep_Name: department }
      
      });
      if (sub_master_record) {
        if (uploadType === 'question_paper') {
          await db.sub_master.update(
            { qb_flg: 'Y' },
            { where: { Subcode: path.parse(file.filename).name, Dep_Name: department } }
          );
        } else if (uploadType === 'answer_key') {
          await db.sub_master.update(
            { ans_flg: 'Y' },
            { where: { Subcode: path.parse(file.filename).name, Dep_Name: department } }
          );
        }
        fs.renameSync(file.path, newPath);
      } else {
        // If sub_master record not found, delete the uploaded file and skip
        fs.unlinkSync(file.path);
        console.warn(`No sub_master record found for file: ${file.filename}. File has been deleted.`);
        return null; // Skip this file in the response
      }
      return {
        originalName: file.originalname,
        filename: file.filename,
        path: newPath,
        relativePath: newPath.replace(/.*\/uploads\//, 'uploads/'),
        size: file.size,
        uploadType: uploadType,
        uploadedBy: username || 'unknown',
        userId: userId || null,
        uploadedAt: new Date().toISOString()
      };
    }));

    // You can save file metadata to database here if needed
    // Example: await db.uploaded_files.bulkCreate(uploadedFiles);

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} ${uploadType === 'question_paper' ? 'Question Paper(s)' : 'Answer Key(s)'} uploaded successfully`,
      data: {
        uploadCount: uploadedFiles.length,
        files: uploadedFiles
      }
    });

  } catch (error) {
    console.error("Error uploading files:", error);

    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error uploading files",
      error: error.message
    });
  }
});

const fetch_Master_Data = asyncHandler(async (req, res) => {

  const { Email_Id } = req.body;

  const whereClause = Email_Id
    ? { Email_Id: { [Op.notLike]: `%${Email_Id}%` } }
    : {};

  const facultyData = await db.User_Details.findAll({
    where: whereClause,
    attributes: ['id', 'User_Name', 'Email_Id', 'Role', 'D_Code']
  });

  res.status(200).json({
    message: "Fetch master data endpoint",
    data: facultyData
  });
});

// Get User Attendance Logs
const getUserAttendanceLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, userName } = req.query;

  // Build where clause
  let whereClause = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [
        new Date(startDate + ' 00:00:00'),
        new Date(endDate + ' 23:59:59')
      ]
    };
  } else if (startDate) {
    whereClause.createdAt = {
      [Op.gte]: new Date(startDate + ' 00:00:00')
    };
  }

  if (userName) {
    whereClause.User_Name = {
      [Op.like]: `%${userName}%`
    };
  }

  const logs = await User_Logs.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'User_Name', 'User_Acticity', 'User_Ip', 'createdAt', 'updatedAt']
  });

  // Get unique usernames to fetch faculty details
  const uniqueUsernames = [...new Set(logs.map(log => log.User_Name))];
  
  
  // Match log User_Name (stored as Email_Id) against User_Details.Email_Id
  const whereConditions = uniqueUsernames.length > 0
    ? { Email_Id: { [Op.in]: uniqueUsernames } }
    : {};

  const facultyDetails = await faculties.findAll({
    where: whereConditions,
    attributes: ['Email_Id', 'User_Name'],
    raw: true
  });

  // Create a map of faculty details keyed by Email_Id
  const facultyMap = {};
  if (facultyDetails && Array.isArray(facultyDetails)) {
    facultyDetails.forEach(faculty => {
      if (faculty && faculty.Email_Id) {
        const details = {
          name: faculty.User_Name || 'N/A',
          email: faculty.Email_Id || 'N/A'
        };
        facultyMap[faculty.Email_Id] = details;
        facultyMap[faculty.Email_Id.trim()] = details;
      }
    });
  }


  // Process logs to determine daily attendance
  const attendanceMap = {};
  
  logs.forEach(log => {
    const date = log.createdAt.toISOString().split('T')[0];
    const userName = log.User_Name;
    const key = `${userName}_${date}`;
    
    if (!attendanceMap[key]) {
      const userDetails = facultyMap[userName] || facultyMap[userName?.trim()] || { name: 'N/A', email: 'N/A' };
      
      attendanceMap[key] = {
        userName,
        name: userDetails.name,
        email: userDetails.email,
        date,
        status: 'Present',
        loginTime: log.createdAt,
        lastActivity: log.createdAt,
        activities: []
      };
    }
    
    // Update last activity
    if (log.createdAt > attendanceMap[key].lastActivity) {
      attendanceMap[key].lastActivity = log.createdAt;
    }
    
    // Update first login time
    if (log.createdAt < attendanceMap[key].loginTime) {
      attendanceMap[key].loginTime = log.createdAt;
    }
    
    attendanceMap[key].activities.push({
      activity: log.User_Acticity,
      time: log.createdAt,
      ip: log.User_Ip
    });
  });

  const attendance = Object.values(attendanceMap);

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance,
    rawLogs: logs
  });
});

// Get User Attendance Summary
const getUserAttendanceSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400);
    throw new AppError("Start date and end date are required", 400);
  }

  const logs = await User_Logs.findAll({
    where: {
      createdAt: {
        [Op.between]: [
          new Date(startDate + ' 00:00:00'),
          new Date(endDate + ' 23:59:59')
        ]
      }
    },
    order: [['User_Name', 'ASC'], ['createdAt', 'ASC']]
  });

  // Get unique usernames to fetch faculty details
  const uniqueUsernames = [...new Set(logs.map(log => log.User_Name))];
  
  
  // Try multiple matching strategies
  const whereConditions = [];
  uniqueUsernames.forEach(username => {
    whereConditions.push(
      { Eva_Id: username },
      { Eva_Id: username.trim() },
      { Eva_Id: username.toLowerCase() },
      { Eva_Id: username.toUpperCase() },
      { Eva_Id: { [Op.like]: `%${username}%` } }
    );
  });
  
  const facultyDetails = await faculties.findAll({
    where: {
      [Op.or]: whereConditions
    },
    attributes: ['Eva_Id', 'FACULTY_NAME', 'Mobile_Number', 'Email_Id'],
    raw: true
  });


  // Create a map of faculty details with multiple keys for flexible matching
  const facultyMap = {};
  facultyDetails.forEach(faculty => {
    const details = {
      name: faculty.FACULTY_NAME || 'N/A',
      mobile: faculty.Mobile_Number || 'N/A',
      email: faculty.Email_Id || 'N/A'
    };
    // Store with multiple key variations for flexible lookup
    facultyMap[faculty.Eva_Id] = details;
    facultyMap[faculty.Eva_Id.trim()] = details;
    facultyMap[faculty.Eva_Id.toLowerCase()] = details;
    facultyMap[faculty.Eva_Id.toUpperCase()] = details;
    facultyMap[faculty.Eva_Id.trim().toLowerCase()] = details;
    facultyMap[faculty.Eva_Id.trim().toUpperCase()] = details;
  });


  // Group by user and date
  const userAttendance = {};

  logs.forEach(log => {
    const userName = log.User_Name;
    const date = log.createdAt.toISOString().split('T')[0];

    if (!userAttendance[userName]) {
      // Try multiple lookup variations
      const userDetails = facultyMap[userName] 
        || facultyMap[userName?.trim()] 
        || facultyMap[userName?.toLowerCase()] 
        || facultyMap[userName?.toUpperCase()]
        || facultyMap[userName?.trim()?.toLowerCase()]
        || facultyMap[userName?.trim()?.toUpperCase()]
        || { name: 'N/A', mobile: 'N/A', email: 'N/A' };
      
      userAttendance[userName] = {
        userName,
        name: userDetails.name,
        mobile: userDetails.mobile,
        email: userDetails.email,
        totalDays: 0,
        dates: {}
      };
    }

    if (!userAttendance[userName].dates[date]) {
      userAttendance[userName].dates[date] = {
        status: 'Present',
        loginTime: log.createdAt,
        activityCount: 0
      };
      userAttendance[userName].totalDays++;
    }

    userAttendance[userName].dates[date].activityCount++;
  });

  // Generate complete date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateRange = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateRange.push(d.toISOString().split('T')[0]);
  }

  // Fill in absent days
  Object.values(userAttendance).forEach(user => {
    dateRange.forEach(date => {
      if (!user.dates[date]) {
        user.dates[date] = {
          status: 'Absent',
          loginTime: null,
          activityCount: 0
        };
      }
    });
  });

  res.status(200).json({
    success: true,
    dateRange,
    data: Object.values(userAttendance)
  });
});


module.exports = {
  master_Data,
  master_Data_Register,
  master_Role_Register,
  valid_Ip_Register,
  generalMasterData,
  master_Valid_Sections_Cross_Check,
  table_data_where,
  upload_Question_Paper_Key,
  fetch_Master_Data,
  getUserAttendanceLogs,
  getUserAttendanceSummary
};
