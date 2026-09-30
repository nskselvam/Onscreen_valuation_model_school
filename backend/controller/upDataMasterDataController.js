const express = require("express");

const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const { Sequelize, Op, or, where } = require("sequelize");
const bcrypt = require("bcrypt");
const generatePasword = require("../utils/passwordGenerate");



const upDataMasterDataController = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Master data endpoint"
  });
});

const getUserDetailsOriginal = asyncHandler(async (req, res) => {
  try {
    const results = await db.sequelize.query(
      'SELECT * FROM "New_Icm_Name"',
      {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      }
    );


    results.forEach(async record => {

      const DataUpdate = await db.Icm_Name_master.create(
        {
          DCODE: record.DCODE,
          DNAME: record.DNAME,
          dist_Name: record.dist_Name
        }
      );

    });

    res.status(200).json({
      status: "success",
      count: results?.length || 0,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

const getUserDetailsInsert = asyncHandler(async (req, res) => {
  try {
    const userDetails = await db.sequelize.query(
      'SELECT * FROM "user_details1"',
      {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      }
    );

    console.log('Fetched user details:', userDetails.length);

      for (const record of userDetails) {
        await db.User_Details.create({
          D_Code: record.D_Code,
          User_Id: record.User_Id,
          User_Name: record.User_Name,
          Password: record.Password,
          Role: record.Role,
          Email_Id: record.Email_Id,
          ResetPass: record.ResetPass,
          Mailer: record.Mailer,
          Temp_Password: record.Temp_Password,
         Mobile_No: record.Mobile_No,
        });
      }

    res.status(200).json({
      status: "success",
      message: "Data inserted successfully",
      count: userDetails.length
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

  //   for (const record of userDetails) {
  //     await db.Master_11.create({
  //       district_name: record.district_name,
  //       block_name: record.block_name,
  //       edu_dist_name: record.edu_dist_name,
  //       udise_code: record.udise_code,
  //       school_name: record.school_name,
  //       school_type: record.school_type,
  //       management: record.management,
  //       category: record.category,
  //       cate_type: record.cate_type,
  //       Emis_No: record.user_id,
  //       name: record.name,
  //       Gender_Label: record.Gender_Label,
  //       dob_emis: record.dob_emis,
  //       father_name: record.father_name,
  //       mother_name: record.mother_name,
  //       class_studying_id: record.class_studying_id,
  //       Disability_status: record.Disability_status,
  //       Disability_Name: record.Disability_Name,
  //       community_name: record.community_name,
  //       Medium: record.Medium,
  //       // Gdc_DOB: record.Gdc_DOB,
  //       // Gdc_Gender: record.Gdc_Gender,
  //       // Gdc_Medium: record.Gdc_Medium,
  //       // Cen_Code: record.Cen_Code,
  //       com: record.com,
  //       sex: record.sex,
  //       pstm: record.pstm,
  //       dob: record.dob,
  //       ph: record.ph,
  //       Student_Status: record.Student_Status,
  //       Zone_Jee: record.Zone_Jee,
  //       Zone_Neet: record.Zone_Neet,
  //       Zone_Name_Jee: record.Zone_Name_Jee,
  //       Zone_Name_Neet: record.Zone_Name_Neet
  //     });
  //   }

  //   res.status(200).json({
  //     status: "success",
  //     message: "Data inserted successfully",
  //     count: userDetails.length
  //   });
  // } catch (error) {
  //   res.status(500).json({
  //     status: "error",
  //     message: error.message




const generateRank = asyncHandler(async (req, res) => {


  let rank = 244279;
  const masterData = await db.Master_11.findAll({
    where: { ORANK: null },
    attributes: ['id', 'MRK03', 'MRK04', 'MRKTOTAL', 'Emis_No', 'name', 'dob'],
    order: [['MRKTOTAL', 'DESC'],
    ['MRK03', 'DESC'],
    ['MRK04', 'DESC'],
    ['dob', 'ASC'],
    ['name', 'ASC']
    ]
  });

  // return

  for (const record of masterData) {
    await db.Master_11.update(
      { ORANK: rank },
      {
        where: {
          id: record.id
        }
      }
    );
    rank++;
  }

  res.status(200).json({
    status: "success",
    message: "Rank generated successfully"
  });

});

const vacancyAllot = asyncHandler(async (req, res) => {

  let SchoolStatus= [
    { code: 1, label: 'M' },
    { code: 2, label: 'G' },
  ]


  const vacancyData = await db.Vacancy_Master.findAll({
    where: {
      [Op.and]: [
        Sequelize.literal('"vac" > "filledVacancy"')
      ],
      // Student_Status: 1,
      // Vacancy_Type: 1,
      // Zone_Code: 1
    },
    order: [['Student_Status', 'ASC'],
    ['Vacancy_Type', 'ASC'],
    ['Zone_Code', 'ASC'],
    ['seq', 'ASC']
    ]
  });



  for (const record of vacancyData) {
    const vacancyType = record.Vacancy_Type;
    const zoneCode = record.Zone_Code;
    const studentStatus = record.Student_Status;
    const communtiy = record.Com;
    const vacanyCnt = record.vac;
    const CenterType = record.Center_Type;
    const phstatus = record.ph;
    let selcat = `${record.REM}-${record.REM1}-${record.REM2}`;
    if (record.REM3 != null) {
      selcat += `-${record.REM3}`;
    }

    let MasterData

    const whereConditon = {
      Student_Status: studentStatus
    };

    if (vacancyType == 1) {
      whereConditon.Zone_Jee = zoneCode;
    } else if (vacancyType == 2) {
      whereConditon.Zone_Neet = zoneCode;
    }
    console.log(whereConditon, communtiy, phstatus);

    if (communtiy == 5 && phstatus == 1) {
      MasterData = await db.Master_11.findAll({
        where: {
          ...whereConditon,
          sex: record.sex,
          pstm: record.pstm,
          ph: phstatus,
          selcat: null
        },
        order: [['ORANK', 'ASC']]
      });
    } else if (communtiy == 5 && phstatus == 0) {
      MasterData = await db.Master_11.findAll({
        where: {
          ...whereConditon,
          sex: record.sex,
          pstm: record.pstm,
          selcat: null
        },
        order: [['ORANK', 'ASC']]
      });
    } else if (communtiy != 5) {
      if (communtiy == 1 && phstatus == 1) {
        MasterData = await db.Master_11.findAll({
          where: {
            ...whereConditon,
            sex: record.sex,
            pstm: record.pstm,
            [Op.or]: [
              { com: communtiy },

              { com: 6 }
            ],
            ph: phstatus,
            selcat: null
          },
          order: [['ORANK', 'ASC']]
        });
      } else if (communtiy == 1 && phstatus == 0) {
        MasterData = await db.Master_11.findAll({
          where: {
            ...whereConditon,
            sex: record.sex,
            pstm: record.pstm,
            [Op.or]: [
              { com: communtiy },
              { com: 6 }
            ],
            selcat: null
          },
          order: [['ORANK', 'ASC']]
        });
      } else if (communtiy != 1 && phstatus == 1) {
        MasterData = await db.Master_11.findAll({
          where: {
            ...whereConditon,
            sex: record.sex,
            pstm: record.pstm,
            com: communtiy,
            ph: phstatus,
            selcat: null
          },
          order: [['ORANK', 'ASC']]
        });
      } else if (communtiy != 1 && phstatus == 0) {
        MasterData = await db.Master_11.findAll({
          where: {
            ...whereConditon,
            sex: record.sex,
            pstm: record.pstm,
            com: communtiy,
            selcat: null
          },
          order: [['ORANK', 'ASC']]
        });
      }
    }
    console.log(MasterData.length, vacanyCnt);


    for (let i = 0; i < MasterData.length && i < vacanyCnt; i++) {
      const studentRecord = MasterData[i];

      await db.Master_11.update(
        {
          selcom: communtiy, selpstm: record.pstm, selsex: record.sex,
          selPost: vacancyType,
          selcat: SchoolStatus.find(status => status.code === record.Student_Status).label + '-' + CenterType + '-' + selcat + (`(${i + 1}/${vacanyCnt})`), selFlg: 'Y'
        },
        {
          where: {
            id: studentRecord.id
          }
        }
      );
    }
    const filledVacancy = await db.Vacancy_Master.update(
      { filledVacancy: record.filledVacancy + Math.min(MasterData.length, vacanyCnt) },
      {
        where: {
          id: record.id
        }
      }
    );
  }

  res.status(200).json({
    status: "success",
    message: vacancyData
  });

});

const passwordReset = asyncHandler(async (req, res) => {

  const facultData = await db.User_Details.findAll({
    where: {
      Role: '1',
      ResetPass: 'Y'

    }
  });

  for (const record of facultData) {
    const newPassword = generatePasword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.User_Details.update(
      {
        Password: hashedPassword,
        Temp_Password: newPassword,
        ResetPass: 'N'
      },
      { where: { id: record.id } }
    );
  }

  res.status(200).json({
    status: "success",
    message: "Password reset endpoint",
    data: facultData
  });

});

const resetUserPassword = asyncHandler(async (req, res) => {
  // const { id } = req.body;
  // console.log('Reset password request for user ID:', id);

  // if (!id) {
  //     throw new AppError('User ID is required', 400);
  // }

  // Find user by id
  const users = await db.User_Details.findAll({
    where: {
      ResetPass: 'N',
      Role: '2'

      // Find users with ResetPass='Y' (temporary password already set)
    }
  });

  if (!users || users.length === 0) {
    throw new AppError('No users found with ResetPass="Y"', 404);
  }



  console.log(`Found ${users.length} user(s) to reset password for.`);
  // Generate new password
  // const newPassword = generatePasword();
  // const hashedPassword = await bcrypt.hash(newPassword, bcrypt.genSaltSync(10));

  // // Update user password
  // user.User_Pass = hashedPassword;
  // user.Temp_Password = newPassword;
  // user.ResetPass = 'N'; // Mark as temporary password - user must change on login (N = not reset)

  // await user.save();

  console.log(`Reset password for ${users.length} user(s).`);


  for (const user of users) {

    // Send email with new password
    let emailStatus = 'Not sent';
    try {
      const { sendEmail } = require('../utils/sendmail');

      const result = await sendEmail(
        user.Email_Id,
        'Password Reset - Model School ',
        {
          evaId: user.Email_Id,
          tempPassword: user.Temp_Password
        }
      );

      if (result.success) {
        user.Mail_Satus = 'Sent';
        // Update Mailer field to 'Y' (email sent)
        user.Mailer = 'Y';
        await user.save();
      } else {
        user.Mail_Satus = 'Failed';
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      user.Mail_Satus = 'Failed';
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Password reset emails sent to ${users.length} user(s).`,
    data: {
      totalUsers: users.length,
      users: users.map(u => ({
        userId: u.id,
        candidateName: u.candidateName,
        email: u.Email_Id
      }))
    }
  });
});



module.exports = { upDataMasterDataController, getUserDetailsOriginal, getUserDetailsInsert, generateRank, vacancyAllot ,passwordReset,resetUserPassword};