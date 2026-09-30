const AppError = require('../utils/appError');
const asyncHandler = require('express-async-handler');
const { Op, where, or } = require('sequelize');
const db = require('../db/models');
const bcrypt = require('bcrypt');
const generatePasword = require('../utils/passwordGenerate');
const sendSMS = require('../utils/sendSms');
const { sendEmail } = require('../utils/sendmail');
const redisClient = require('../config/redis');

const e = require('express');

const getExaminerPassword = asyncHandler(async (req, res, next) => {
    const { Dep_Name, Eva_Mon_Year } = req.query || {};


    if (!Dep_Name || !Eva_Mon_Year) {
        return next(new AppError('Dep_Name and Eva_Mon_Year are required', 400));
    }

    const examiner = await db.faculties.findAll({
        where: {
            ResetPass: "1",
        },
        order: [['Eva_Id', 'ASC']],

        attributes: ['Eva_Id', 'FACULTY_NAME', 'Role', 'Mobile_Number', 'updatedAt', 'id'],
    });

    // Return empty array if no data found instead of throwing error
    res.status(200).json({
        success: true,
        data: examiner || []
    });

});


const ExaminerPasswordReset = asyncHandler(async (req, res, next) => {
    const { id, Insitution_No } = req.body || {};


    if (!id) {
        return next(new AppError('Examiner ID is required', 400));
    }

    const examiner = await db.faculties.findOne({ where: { id } });

    if (!examiner) {
        return next(new AppError('Examiner not found', 404));
    }

    const newPassword = generatePasword();
    const hashedPassword = await bcrypt.hash(newPassword, bcrypt.genSaltSync(10));
    examiner.Password = hashedPassword;
    examiner.ResetPass = "0";
    examiner.Temp_Password = newPassword;

    // Send SMS if mobile number is available
    let smsStatus = 'Not Sent';
    if (examiner.Mobile_Number && Insitution_No == 1) {
        const smsMessage = `Dear Sir/Madam, Your User Id ${examiner.Eva_Id} & Password is ${examiner.Temp_Password} for SRMIST DEMS evaluation (https://dems.srmist.edu.in) - SRMIST`;
        const smsResult = await sendSMS(examiner.Mobile_Number, smsMessage);

        if (smsResult.success) {

            examiner.sms_status = 'Sent';
        } else {

            examiner.sms_status = 'Failed';
        }
    }

    await examiner.save();

    res.status(200).json({
        success: true,
        message: `Password reset successful for examiner ID ${id}`,
        data: examiner
    });
});

const getExaminerpassword_details = asyncHandler(async (req, res, next) => {
    // const { id } = req.query || {};
    const { InstitutionStatus, PasswordStatus } = req.query || {};

    console.log('Received query parameters:', { InstitutionStatus, PasswordStatus });

    const whereCondition = {}; // Add any filtering conditions if needed

    if (InstitutionStatus == 1 && PasswordStatus == '1') {
        whereCondition.ResetPass = "0";
        whereCondition[Op.or] = [
            { sms_status: { [Op.ne]: 'Sent' } },
            { sms_status: { [Op.is]: null } },
            { sms_status: '' }
        ];
    } else if (InstitutionStatus != 1 && PasswordStatus == '1') {
        whereCondition.Role = {
            [Op.like]: '%2%'
        };
        whereCondition.Eamil_Status = {
            [Op.like]: '%N%'
        };
    } else if (PasswordStatus) {
        whereCondition.ResetPass = "0";
    }

    const examiner = await db.faculties.findAll({
        where: whereCondition,
        order: [['Eva_Id', 'ASC']],
    });

    // Return empty array if no data found instead of throwing error
    res.status(200).json({
        success: true,
        data: examiner
    });
});


const passwordsend = asyncHandler(async (req, res, next) => {
    const { InstitutionStatus, mailSubject, letterDate, referenceNo, InstitutionName } = req.body || {};
    // Raw SQL Query for verification:
    // SELECT * FROM faculties 
    // WHERE (Sms_Status != 'Sent' OR Sms_Status IS NULL OR Sms_Status = '') 
    // AND ResetPass = '0';

    let whereCondion = {};
    if (InstitutionStatus == 1) {
        whereCondion = {
            ResetPass: '0',
            [Op.or]: [
                { sms_status: { [Op.ne]: 'Sent' } },
                { sms_status: { [Op.is]: null } },
                { sms_status: '' }
            ]
        }
    } else if (InstitutionStatus != 1) {
        whereCondion = {
            Role: {
                [Op.like]: '%2%'
            },
            Eamil_Status: {
                [Op.like]: '%N%'
            }
        }
    };

    const PasswordDetails = await db.faculties.findAll({
        where: whereCondion,
        // where: {
        //     [Op.or]: [
        //         { Sms_Status: { [Op.ne]: 'Sent' } },
        //         { Sms_Status: { [Op.is]: null } },
        //         { Sms_Status: '' }
        //     ],
        //     ResetPass: '0'

        // }
    });


    if (!PasswordDetails || PasswordDetails.length === 0) {
        return next(new AppError('Examiner not found', 404));
    }
    for (const examiner of PasswordDetails) {
        if (examiner.Mobile_Number && InstitutionStatus == 1) {


            let HostName = req.hostname || 'localhost';
            let protocol = req.protocol || 'http';
            let baseUrl = `${protocol}://${HostName}`;

            console.log(`Base URL for SMS content: ${baseUrl}`);
            let smsMessage = '';


            if (baseUrl.includes('iems.srmist.edu.in')) {
                smsMessage = `Dear Sir/Madam , Your User Id  ${examiner.Eva_Id} & Password is ${examiner.Temp_Password} for SRMIST IEMS evaluation portal (https://iems.srmist.edu.in) - by COE`
            } else if (baseUrl.includes('dems.srmist.edu.in')) {
                smsMessage = `Dear Sir/Madam, Your User Id ${examiner.Eva_Id} & Password is ${examiner.Temp_Password} for SRMIST DEMS evaluation (https://dems.srmist.edu.in) - SRMIST`;
            } else if (baseUrl.includes('osms.srmist.edu.in')) {
                smsMessage = `Dear Sir/Madam, Your User Id  ${examiner.Eva_Id} & Password is ${examiner.Temp_Password} for SRMIST OSMS evaluation (https://osms.srmist.edu.in) - SRMIST`;
            } else {
                smsMessage = `Dear Sir/Madam, Your User Id  ${examiner.Eva_Id} & Password is ${examiner.Temp_Password} for SRMIST OSMS evaluation (https://osms.srmist.edu.in) - SRMIST`;
            }
            console.log(`SMS message to be sent: ${smsMessage}`);
            // return 
            const smsResult = await sendSMS(examiner.Mobile_Number, smsMessage);
            if (smsResult.success) {
                examiner.sms_status = 'Sent';
                // examiner.ResetPass = '1';
            } else {
                examiner.sms_status = 'Failed';
            }
            await examiner.save();
        } else if (InstitutionStatus != 1 && examiner.Email_Id) {
            // Get subject details from examiner's database record
            const subcode = examiner.subcode || '';
            //const evaluation_date = examiner.evaluation_date || '';
            const subcodes = subcode.split(',').map(s => s.trim());
            const eamilsStatus = examiner.Eamil_Status ? examiner.Eamil_Status.split(',').map(s => s.trim()) : [];

            //const evalDates = evaluation_date.split(',').map(s => s.trim());

            // Fetch subject names from sub_master
            let subjectDetails = [];
            for (let i = 0; i < subcodes.length; i++) {
                if (subcodes[i] && eamilsStatus[i] === 'N') {
                    const subMaster = await db.sub_master.findOne({
                        where: { Subcode: subcodes[i] },
                        attributes: ['SUBNAME']
                    });
                    eamilsStatus[i] = 'Y'; // Mark email as sent for this subject
                    subjectDetails.push({
                        subcode: subcodes[i],
                        subname: (subMaster && subMaster.SUBNAME) ? subMaster.SUBNAME : subcodes[i],
                        evaDate: letterDate
                    });
                }
            }

            // Ensure at least one subject entry
            if (subjectDetails.length === 0) {
                subjectDetails.push({
                    subcode: 'N/A',
                    subname: 'No Subject Assigned',
                    evaDate: ''
                });
            }

            // Format letter date as DD.MM.YYYY from request or use current date
            let currentDate;
            if (letterDate) {
                const date = new Date(letterDate);
                currentDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
            } else {
                const now = new Date();
                currentDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
            }

            // Use mail subject from request or default from sms_gate.php
            const emailSubject = mailSubject || "APRIL 2025 Terminal Examinations - Phase 2 - Digital Valuation - Appointment Order - Reg.";

            // Use template body with examiner data
            const emailResult = await sendEmail(
                examiner.Email_Id,
                emailSubject,
                {
                    facultyName: examiner.FACULTY_NAME || 'Sir/Madam',
                    evaId: examiner.Eva_Id,
                    tempPassword: examiner.ResetPass == 0 ? examiner.Temp_Password : '(Already Sent)',
                    subjectDetails: subjectDetails,
                    currentDate: currentDate,
                    referenceNo: referenceNo,
                    InstitutionName: InstitutionName

                }
            );

            if (emailResult.success) {
                examiner.sms_status = 'Sent';
                examiner.Eamil_Status = eamilsStatus.join(','); // Update email status for all subjects
            } else {
                examiner.sms_status = 'Failed';
            }
            await examiner.save();
        }
    }

    res.status(200).json({
        success: true,
        message: `Password details SMS sending process completed`,
        data: PasswordDetails
    });

});
const getexamienrdetails = asyncHandler(async (req, res, next) => {
    const { Eva_Id, Role, Dep_Name } = req.body || {};
    const Dep_Name_Field = `Dep_Name_${Role}`;
    const examinerDetails = await db.faculties.findAll({
        where: {
            Eva_Id: String(Eva_Id).replace(/[\r\n\t\s]/g, ""),
            Role: {
                [Op.like]: `%${Role}%`
            },
            [Dep_Name_Field]: {
                [Op.like]: `%${Dep_Name}%`
            }
        },
        attributes: ['Eva_Id', 'FACULTY_NAME', 'Role', 'updatedAt', 'Temp_Password', 'Mobile_Number', 'Email_Id', 'Sms_Status', 'id'],
        order: [['Eva_Id', 'ASC']]
    });


    // If no examiner found, return success with empty data (not an error)
    // This allows the frontend to distinguish between "user not found" (can add) and actual errors
    if (!examinerDetails || examinerDetails.length === 0) {
        return res.status(200).json({
            success: true,
            data: [],
            message: 'No examiner found with this ID'
        });
    }

    res.status(200).json({
        success: true,
        data: examinerDetails
    });
});

const examinerSubjectDetailsUpdateInsert = asyncHandler(async (req, res, next) => {


    // if (!Eva_Id) {
    //     return next(new AppError('Examiner ID (Eva_Id) is required', 400));
    // }

    // let examiner = await db.faculties.findOne({ where: { Eva_Id } });
});

const getexaminercrosscheck = asyncHandler(async (req, res, next) => {

    const facultiesData = await db.faculties.findAll({});
    const results = [];

    for (const faculty of facultiesData) {
        let Role_Status = faculty.Role ? faculty.Role.split(',').map(s => s.trim()) : [];
        let facultyRemarks = [];

        for (const role of Role_Status) {
            switch (role) {
                case '1': {
                    // Chief Examiner arrays
                    const fields = {
                        'Chief_subcode': faculty.Chief_subcode ? faculty.Chief_subcode.split(',').map(s => s.trim()) : [],
                        'Chief_Eva_Subject': faculty.Chief_Eva_Subject ? faculty.Chief_Eva_Subject.split(',').map(s => s.trim()) : [],
                        'chief_examiner': faculty.chief_examiner ? faculty.chief_examiner.split(',').map(s => s.trim()) : [],
                        'camp_offcer_id_chief': faculty.camp_offcer_id_chief ? faculty.camp_offcer_id_chief.split(',').map(s => s.trim()) : [],
                        'Camp_id_chief': faculty.Camp_id_chief ? faculty.Camp_id_chief.split(',').map(s => s.trim()) : [],
                        'Chief_Valuation_Status': faculty.Chief_Valuation_Status ? faculty.Chief_Valuation_Status.split(',').map(s => s.trim()) : [],
                        'Dep_Name_1': faculty.Dep_Name_1 ? faculty.Dep_Name_1.split(',').map(s => s.trim()) : [],
                    };

                    const counts = Object.entries(fields).map(([key, arr]) => ({ key, count: arr.length }));
                    const uniqueCounts = [...new Set(counts.map(c => c.count))];

                    if (uniqueCounts.length > 1) {
                        const mismatchInfo = counts.map(c => `${c.key}(${c.count})`).join(', ');
                        facultyRemarks.push(`Role1 Mismatch: ${mismatchInfo}`);
                    }
                    break;
                }

                case '2': {
                    // Examiner arrays
                    const fields = {
                        'subcode': faculty.subcode ? faculty.subcode.split(',').map(s => s.trim()) : [],
                        'Eva_Subject': faculty.Eva_Subject ? faculty.Eva_Subject.split(',').map(s => s.trim()) : [],
                        'Sub_Max_Paper': faculty.Sub_Max_Paper ? faculty.Sub_Max_Paper.split(',').map(s => s.trim()) : [],
                        'camp_offcer_id_examiner': faculty.camp_offcer_id_examiner ? faculty.camp_offcer_id_examiner.split(',').map(s => s.trim()) : [],
                        'Camp_id': faculty.Camp_id ? faculty.Camp_id.split(',').map(s => s.trim()) : [],
                        'Examiner_Valuation_Status': faculty.Examiner_Valuation_Status ? faculty.Examiner_Valuation_Status.split(',').map(s => s.trim()) : [],
                        'Dep_Name_2': faculty.Dep_Name_2 ? faculty.Dep_Name_2.split(',').map(s => s.trim()) : [],
                    };

                    const counts = Object.entries(fields).map(([key, arr]) => ({ key, count: arr.length }));
                    const uniqueCounts = [...new Set(counts.map(c => c.count))];

                    if (uniqueCounts.length > 1) {
                        const mismatchInfo = counts.map(c => `${c.key}(${c.count})`).join(', ');
                        facultyRemarks.push(`Role2 Mismatch: ${mismatchInfo}`);
                    }
                    break;
                }

                // case '7': {
                //     // Chief Valuation Examiner arrays (same as role 1 structure)
                //     const fields = {
                //         'Chief_subcode':          faculty.Chief_subcode          ? faculty.Chief_subcode.split(',').map(s => s.trim())          : [],
                //         'Chief_Eva_Subject':      faculty.Chief_Eva_Subject      ? faculty.Chief_Eva_Subject.split(',').map(s => s.trim())      : [],
                //         'chief_examiner':         faculty.chief_examiner         ? faculty.chief_examiner.split(',').map(s => s.trim())         : [],
                //         'camp_offcer_id_chief':   faculty.camp_offcer_id_chief   ? faculty.camp_offcer_id_chief.split(',').map(s => s.trim())   : [],
                //         'Camp_id_chief':          faculty.Camp_id_chief          ? faculty.Camp_id_chief.split(',').map(s => s.trim())          : [],
                //         'Chief_Valuation_Status': faculty.Chief_Valuation_Status ? faculty.Chief_Valuation_Status.split(',').map(s => s.trim()) : [],
                //     };

                //     const counts = Object.entries(fields).map(([key, arr]) => ({ key, count: arr.length }));
                //     const uniqueCounts = [...new Set(counts.map(c => c.count))];

                //     if (uniqueCounts.length > 1) {
                //         const mismatchInfo = counts.map(c => `${c.key}(${c.count})`).join(', ');
                //         facultyRemarks.push(`Role7 Mismatch: ${mismatchInfo}`);
                //     }
                //     break;
                // }

                default:
                    break;
            }
        }

        const finalRemarks = facultyRemarks.length > 0 ? facultyRemarks.join(' | ') : 'OK';
        const vflg = facultyRemarks.length > 0 ? 1 : 0;

        // Save remarks and vflg to DB
        await db.faculties.update(
            { Remarks_Gen: finalRemarks, vflg: vflg },
            { where: { id: faculty.id } }
        );

        results.push({
            Eva_Id: faculty.Eva_Id,
            FACULTY_NAME: faculty.FACULTY_NAME,
            Role: faculty.Role,
            Remarks_Gen: finalRemarks,
            vflg: vflg,
        });
    }

    const mismatchCount = results.filter(r => r.Remarks_Gen !== 'OK').length;
    res.status(200).json({
        success: true,
        message: `Cross-check complete. ${mismatchCount} record(s) have mismatches.`,
        total: results.length,
        mismatchCount: mismatchCount,
        data: results,
    });
})

const UserLoginStatusDetails = asyncHandler(async (req, res) => {

    let loginUserStats = {
        totalLoggedIn: 0,
        byDegree: {},
        byRole: {},
        byDegreeAndRole: {}
    };
    let LoginUserStatsByDep = [];

    const examiner = await db.faculties.findAll({});

    try {
        // Get all user keys from Redis (pattern: user:*)
        const userKeys = await redisClient.keys('user:*');

        //console.log("User keys found in Redis:", userKeys);

        if (userKeys && userKeys.length > 0) {
            loginUserStats.totalLoggedIn = userKeys.length;

            // Fetch data for each user
            for (const key of userKeys) {
                const userData = await redisClient.hGetAll(key);

                if (userData) {
                    const degreeCode = userData.degreeCode || 'Unknown';
                    const userRole = userData.userRole || 'Unknown';

                    const Faculty_Details = examiner.find(ex => ex.Eva_Id === userData.Eva_Id);

                    LoginUserStatsByDep.push({ degreeCode, userRole, Eva_Id: userData.Eva_Id, Email_Id: Faculty_Details ? Faculty_Details.Email_Id : 'Unknown', Mobile_Number: Faculty_Details ? Faculty_Details.Mobile_Number : 'Unknown', FACULTY_NAME: Faculty_Details ? Faculty_Details.FACULTY_NAME : 'Unknown' });



                    // Count by degree
                    loginUserStats.byDegree[degreeCode] = (loginUserStats.byDegree[degreeCode] || 0) + 1;

                    // Count by role
                    loginUserStats.byRole[userRole] = (loginUserStats.byRole[userRole] || 0) + 1;

                    // Count by degree and role combination
                    const combinedKey = `${degreeCode}_${userRole}`;
                    loginUserStats.byDegreeAndRole[combinedKey] = (loginUserStats.byDegreeAndRole[combinedKey] || 0) + 1;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching login user stats from Redis:', error);
    }

    console.log("Login user stats:", loginUserStats, "By Degree and Role:", LoginUserStatsByDep);

    res.status(200).json({
        success: true,
        data: {
            loginUserStats,
            users: LoginUserStatsByDep
        }
    });
});

module.exports = { getExaminerPassword, ExaminerPasswordReset, getExaminerpassword_details, passwordsend, getexamienrdetails, getexaminercrosscheck, UserLoginStatusDetails };