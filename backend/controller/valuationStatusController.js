const asyncHandler = require('express-async-handler');
const AppError = require('../utils/appError');
const { Op, where } = require('sequelize');
const db = require("../db/models");
const { getCurrentISTDateTime, parseISTDateTime } = require('../utils/formatDateTime');

const getValuationCampDetails = asyncHandler(async (req, res, next) => {
    const { course, role } = req.query;
    // console.log('Received request for camp details with course:', course, 'and role:', role);
    // return

    const valuationCamps = await db.faculties.findAll({
        where: {
            Role: {
                [Op.like]: '%4%'
            },
            Camp_id_Camp: {
                [Op.not]: null
            }
        },
        order: [['Eva_Id', 'ASC']]
    });
    let campResults = [];
    let flname = '';

    for (let camp of valuationCamps) {
        if (camp.Dep_Name_4) {
            let depnameField = camp.Dep_Name_4.split(',') || [];
            let Camp_id_Camp = camp.Camp_id_Camp.split(',') || [];
            // Assuming the first department name is relevant
            for (let i = 0; i < depnameField.length; i++) {
                let depname = depnameField[i];
                let campId = Camp_id_Camp[i];
                let examinerDetaisl = await db.faculties.findAll({
                    where: {
                        Dep_Name_2: {
                            [Op.like]: `%${depname}%`
                        },
                        camp_offcer_id_examiner: {
                            [Op.like]: `%${camp.Eva_Id}%`
                        },
                        Camp_id: {
                            [Op.like]: `%${campId}%`
                        }
                    },

                });
                if (examinerDetaisl.length === 0) {
                    continue;
                }

                for (let val = 1; val <= 4; val++) {
                    let CamFinalSubcode = [];
                    for (let examiner of examinerDetaisl) {
                        let Campsubcode = examiner.subcode.split(',') || [];
                        let CampId = examiner.Camp_id.split(',') || [];
                        let Evaluation_Type = examiner.Eva_Subject.split(',') || [];
                        let CampEvaId = examiner.camp_offcer_id_examiner.split(',') || [];
                        for (let j = 0; j < Campsubcode.length; j++) {
                            if (CampId[j] === campId && CampEvaId[j] === camp.Eva_Id && Evaluation_Type[j] == val) {
                                CamFinalSubcode.push(Campsubcode[j].trim());
                            }
                        }

                    }

                    // Count Import1 records where Checked='Yes' and subcode in CamFinalSubcode
                    let checkedCount = 0;
                    let overallCount = 0;
                    if (CamFinalSubcode.length > 0) {
                        flname = `import${val}`;
                        const placeholders = CamFinalSubcode.map((_, index) => `$${index + 1}`).join(',');
                        const countResult = await db.sequelize.query(
                            `SELECT 
                            COUNT(*) as "overallCount",
                            SUM(CASE WHEN "Checked" = 'Yes' and "E_flg" = 'Y' THEN 1 ELSE 0 END) as "checkedCount"
                        FROM ${flname} 
                        WHERE subcode IN (${placeholders})`,
                            {
                                bind: CamFinalSubcode,
                                type: db.sequelize.QueryTypes.SELECT
                            }
                        );


                        overallCount = parseInt(countResult[0]?.overallCount) || 0;
                        checkedCount = parseInt(countResult[0]?.checkedCount) || 0;
                        if (countResult.length > 0) {
                            campResults.push({
                                Eva_Id: camp.Eva_Id,
                                FACULTY_NAME: camp.FACULTY_NAME,
                                Camp_id_Camp: campId,
                                overallCount: overallCount,
                                checkedCount: checkedCount,
                                pendingCount: overallCount - checkedCount,
                                Percentage: overallCount > 0 ? ((checkedCount / overallCount) * 100).toFixed(2) : '0.00',
                                department: depname,
                                valuationType: val,
                                Email_d: camp.Email_Id || '',
                                MobileNumber: camp.Mobile_Number || ''
                            });
                        }
                    }
                }

                // Create or update object



                // console.log(`Examiner details for department ${depname}:`, CamFinalSubcode);
                // console.log(`Overall count for department ${depname}:`, overallCount);
                // console.log(`Checked count for department ${depname}:`, checkedCount);
            }
        }
    }


    if (parseInt(role) !== 0) campResults = campResults.filter(camp => camp.department === course);


    res.status(200).json({
        success: true,
        campResults: campResults,
    })

})

const getSubcodeDetails = asyncHandler(async (req, res, next) => {

    const { Valuation_Type, course, role } = req.query;


    let flname = `import${Valuation_Type}`;
    const Sub_Master = await db.sub_master.findAll({});

    // Get today's date in format matching database (date part only: DD-MM-YYYY)
    const todayStr = getCurrentISTDateTime().substring(0, 10);

    // Get subcode list with counts
    let subcodeList = [];
    if (parseInt(role) === 0) {
        subcodeList = await db.sequelize.query(
            `SELECT 
            "subcode",
            COUNT(*) as "totalCount",
            SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount",
            SUM(CASE WHEN SUBSTRING("checkdate", 1, 10) = '${todayStr}' THEN 1 ELSE 0 END) as "todayCheckedCount"
        FROM ${flname} 
        WHERE "subcode" IS NOT NULL 
        GROUP BY "subcode"
        ORDER BY "subcode"`,

            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    } else {

        subcodeList = await db.sequelize.query(
            `SELECT 
            "subcode",
            COUNT(*) as "totalCount",
            SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount",
            SUM(CASE WHEN SUBSTRING("checkdate", 1, 10) = '${todayStr}' THEN 1 ELSE 0 END) as "todayCheckedCount"
        FROM ${flname} 
        WHERE "subcode" IS NOT NULL AND "Dep_Name" = '${course}'
        GROUP BY "subcode"
        ORDER BY "subcode"`,

            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    }

    subcodeList = subcodeList.map(item => {
        let subcodeInfo = Sub_Master.find(sub => sub.Subcode === item.subcode);
        return {
            subcode: item.subcode,
            totalCount: item.totalCount,
            checkedCount: item.checkedCount,
            todayCheckedCount: item.todayCheckedCount,
            no_Papers: subcodeInfo ? subcodeInfo.no_Papers : 0,
            Subject_Name: subcodeInfo ? subcodeInfo.SUBNAME : ''
        };
    });

    // Calculate overall totals from grouped data



    let overallSubjectCount = subcodeList.length;
    let overallCheckedCount = subcodeList.reduce((sum, item) => sum + (parseInt(item.checkedCount) || 0), 0);
    let todayCheckedCount = subcodeList.reduce((sum, item) => sum + (parseInt(item.todayCheckedCount) || 0), 0);
    let overallTotalCount = subcodeList.reduce((sum, item) => sum + (parseInt(item.totalCount) || 0), 0);



    res.status(200).json({
        success: true,
        overallResult: {
            subjectCount: overallSubjectCount,
            checkedCount: overallCheckedCount,
            todayCheckedCount: todayCheckedCount,
            totalCount: overallTotalCount
        },
        subcodeList: subcodeList

    });
});

const getExaminerSubjectDetails = asyncHandler(async (req, res, next) => {

    const { Valuation_Type, role, course, Eva_Id } = req.query;

    //console.log(req.query);

    let flname = `import${Valuation_Type}`;
    const todayStr = getCurrentISTDateTime().substring(0, 10); // Extract date part for comparison

    let ExaminerSubjectDetails = [];

    const examinerDetails = await db.faculties.findAll({

        order: [['Eva_Id', 'ASC']]
    });

    let ChiefSubjectDetails = [];

    if (parseInt(role) !== 0) {
        ChiefSubjectDetails = await db.sequelize.query(


            `SELECT 
            t1."Evaluator_Id",
            t1."subcode",
            COUNT(*) as "totalCount",
            SUM(CASE WHEN t1."Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount",
            SUM(CASE WHEN SUBSTRING(t1."checkdate", 1, 10) = '${todayStr}' THEN 1 ELSE 0 END) as "todayCheckedCount",
            t2."subcodeTotalCount",
            t2."subcodeCheckedCount"
        FROM ${flname} t1
        LEFT JOIN (
            SELECT 
                "subcode", 
                COUNT(*) as "subcodeTotalCount",
                SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "subcodeCheckedCount"
            FROM ${flname}
            WHERE "subcode" IS NOT NULL AND "Dep_Name" = '${course}'
            GROUP BY "subcode"
        ) t2 ON t1."subcode" = t2."subcode"
        WHERE  t1."subcode" IS NOT NULL AND t1."Dep_Name" = '${course}'
        GROUP BY t1."Evaluator_Id", t1."subcode", t2."subcodeTotalCount", t2."subcodeCheckedCount"
        ORDER BY t1."subcode",t1."Evaluator_Id" `,

            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    } else {
        ChiefSubjectDetails = await db.sequelize.query(


            `SELECT 
            t1."Evaluator_Id",
            t1."subcode",
            COUNT(*) as "totalCount",
            SUM(CASE WHEN t1."Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount",
            SUM(CASE WHEN SUBSTRING(t1."checkdate", 1, 10) = '${todayStr}' THEN 1 ELSE 0 END) as "todayCheckedCount",
            t2."subcodeTotalCount",
            t2."subcodeCheckedCount"
        FROM ${flname} t1
        LEFT JOIN (
            SELECT 
                "subcode", 
                COUNT(*) as "subcodeTotalCount",
                SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "subcodeCheckedCount"
            FROM ${flname}
            WHERE "subcode" IS NOT NULL
            GROUP BY "subcode"
        ) t2 ON t1."subcode" = t2."subcode"
        WHERE t1."subcode" IS NOT NULL 
        GROUP BY t1."Evaluator_Id", t1."subcode", t2."subcodeTotalCount", t2."subcodeCheckedCount"
        ORDER BY t1."subcode",t1."Evaluator_Id" `,

            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    }


    let facultSubcodeDetails = [];

    for (let faculty of examinerDetails) {

        let subcodeDetails = faculty.subcode ? faculty.subcode.split(',') : [];
        let Eva_Subject = faculty.Eva_Subject ? faculty.Eva_Subject.split(',') : [];
        let Dep_Name = faculty.Dep_Name_2 ? faculty.Dep_Name_2.split(',') : [];
        for (let i = 0; i < subcodeDetails.length; i++) {
            if (Eva_Subject[i] && Eva_Subject[i].trim() === Valuation_Type) {
                facultSubcodeDetails.push({
                    subcode: subcodeDetails[i] ? subcodeDetails[i].trim() : null,
                    Eva_Subject: Eva_Subject[i] ? Eva_Subject[i].trim() : null,
                    Dep_Name: Dep_Name[i] ? Dep_Name[i].trim() : null,
                    sub_Max_Paper: faculty.Sub_Max_Paper ? faculty.Sub_Max_Paper.split(',')[i]?.trim() : null,
                    Evaluator_Id: faculty.Eva_Id,
                    FACULTY_NAME: faculty.FACULTY_NAME,
                    Mobile_Number: faculty.Mobile_Number,
                    Email_Id: faculty.Email_Id,
                    Camp_Id: faculty.Camp_id ? faculty.Camp_id.split(',')[i]?.trim() : null,
                    camp_offcer_id_examiner: faculty.camp_offcer_id_examiner ? faculty.camp_offcer_id_examiner.split(',')[i]?.trim() : null,
                    Camp_Officer_Name: examinerDetails.find(examiner => examiner.Eva_Id === (faculty.camp_offcer_id_examiner ? faculty.camp_offcer_id_examiner.split(',')[i]?.trim() : null))?.FACULTY_NAME || '',
                    Examiner_Valuation_Status: faculty.Examiner_Valuation_Status ? faculty.Examiner_Valuation_Status.split(',')[i]?.trim() : null,
                    Camp_id_Mobile: examinerDetails.find(examiner => examiner.Eva_Id === (faculty.camp_offcer_id_examiner ? faculty.camp_offcer_id_examiner.split(',')[i]?.trim() : null))?.Mobile_Number || '',
                    Camp_id_Email: examinerDetails.find(examiner => examiner.Eva_Id === (faculty.camp_offcer_id_examiner ? faculty.camp_offcer_id_examiner.split(',')[i]?.trim() : null))?.Email_Id || ''

                });
            }
        }

    }

    // console.log('Facult Subcode Details:', facultSubcodeDetails,course, role);
    let filteredChiefSubjectDetails = parseInt(role) !== 0 ? facultSubcodeDetails.filter(detail => detail.Dep_Name === course) : facultSubcodeDetails;

    // console.log('Chief Subject Details:', filteredChiefSubjectDetails);

    // console.log('Chief Subject Details:', ChiefSubjectDetails);

    for (let detail of filteredChiefSubjectDetails) {

        let valuationData = ChiefSubjectDetails.find(item => item.Evaluator_Id === detail.Evaluator_Id && item.subcode === detail.subcode);
        let valuationTotalCount = ChiefSubjectDetails.find(item => item.subcode === detail.subcode);

        if (valuationData) {


            ExaminerSubjectDetails.push({
                Eva_Id: detail.Evaluator_Id,
                FACULTY_NAME: detail.FACULTY_NAME,
                subcode: detail.subcode,
                totalCount: valuationData.totalCount,
                checkedCount: valuationData.checkedCount,
                todayCheckedCount: valuationData.todayCheckedCount,
                subcodeTotalCount: valuationData.subcodeTotalCount,
                subcodeCheckedCount: valuationData.subcodeCheckedCount,
                Email_d: detail.Email_Id || '',
                MobileNumber: detail.Mobile_Number || '',
                Camp_id_Examer: detail.camp_offcer_id_examiner || '',
                Camp_id_Examer_Name: detail.Camp_Officer_Name || '',
                Camp_id_Mobile: detail.Camp_id_Mobile || '',
                Camp_id_Email: detail.Camp_id_Email || '',
                subtotal: detail.sub_Max_Paper || 0,
                Camp_Id: detail.Camp_Id || '',
                Valuation_Type: Valuation_Type,
                Examiner_Valuation_Status: detail.Examiner_Valuation_Status || ''

            });

        } else {

            ExaminerSubjectDetails.push({
                Eva_Id: detail.Evaluator_Id,
                FACULTY_NAME: detail.FACULTY_NAME,
                subcode: detail.subcode,
                totalCount: valuationTotalCount ? valuationTotalCount.totalCount : 0,
                checkedCount: 0,
                todayCheckedCount: 0,
                subcodeTotalCount: valuationTotalCount ? valuationTotalCount.subcodeTotalCount : 0,
                subcodeCheckedCount: valuationTotalCount ? valuationTotalCount.subcodeCheckedCount : 0,
                Email_d: detail.Email_Id || '',
                MobileNumber: detail.Mobile_Number || '',
                Camp_id_Examer: detail.camp_offcer_id_examiner || '',
                Camp_id_Examer_Name: detail.Camp_Officer_Name || '',
                Camp_id_Mobile: detail.Camp_id_Mobile || '',
                Camp_id_Email: detail.Camp_id_Email || '',
                subtotal: detail.sub_Max_Paper || 0,
                Camp_Id: detail.Camp_Id || '',
                Valuation_Type: Valuation_Type,
                Examiner_Valuation_Status: detail.Examiner_Valuation_Status || ''
            });

        }






    }

    // for (let detail of ChiefSubjectDetails) {
    //     let faculty = examinerDetails.find(examiner => examiner.Eva_Id === detail.Evaluator_Id);

    //     if (!faculty) {
    //         console.log(`Faculty not found for Evaluator_Id: ${detail.Evaluator_Id}`);
    //         continue;
    //     }

    //     let subcodeDetails = faculty.subcode ? faculty.subcode.split(',') : [];
    //     let subcodeTotalCount = faculty.Sub_Max_Paper ? faculty.Sub_Max_Paper.split(',') : [];
    //     let subcodeIndex = subcodeDetails.findIndex(sub => sub.trim() === detail.subcode.trim());
    //     let subtotal = subcodeIndex !== -1 ? subcodeTotalCount[subcodeIndex] : 0;

    //     let Camp_id_Examer = "";
    //     let Camp_id_Examer_Name = "";
    //     let Camp_id_Mobile = "";
    //     let Camp_id_Email = "";
    //     let campId = "";
    //     let Examiner_Valuation_Status = "";

    //     console.log('Examiner:', faculty.Eva_Id, 'Subcode Index:', subcodeIndex, 'Subcode Details:', subcodeDetails);

    //     if (subcodeIndex !== -1 && faculty.camp_offcer_id_examiner) {
    //         let campOfficerIds = faculty.camp_offcer_id_examiner.split(',');
    //         campId = faculty.Camp_id ? faculty.Camp_id.split(',')[subcodeIndex]?.trim() : null;
    //         Examiner_Valuation_Status = faculty.Examiner_Valuation_Status ? faculty.Examiner_Valuation_Status.split(',')[subcodeIndex]?.trim() : null;



    //         let Camp_id_Examer_Master = campOfficerIds[subcodeIndex];

    //         console.log('Camp Officer ID:', Camp_id_Examer_Master, 'Camp ID:', campId);
    //         if (Camp_id_Examer_Master) {
    //             let Camp_id_Master = examinerDetails.find(examiner => examiner.Eva_Id === Camp_id_Examer_Master.trim());
    //             if (Camp_id_Master) {
    //                 Camp_id_Examer = Camp_id_Master.Eva_Id || '';
    //                 Camp_id_Examer_Name = Camp_id_Master.FACULTY_NAME || '';
    //                 Camp_id_Mobile = Camp_id_Master.Mobile_Number || '';
    //                 Camp_id_Email = Camp_id_Master.Email_Id || '';
    //             }
    //         }
    //     }

    //     console.log('Subcode Index:', subcodeIndex, 'for subcode:', detail.subcode);

    //     ExaminerSubjectDetails.push({
    //         Eva_Id: detail.Evaluator_Id,
    //         FACULTY_NAME: faculty.FACULTY_NAME,
    //         subcode: detail.subcode,
    //         totalCount: detail.totalCount,
    //         checkedCount: detail.checkedCount,
    //         todayCheckedCount: detail.todayCheckedCount,
    //         subcodeTotalCount: detail.subcodeTotalCount,
    //         subcodeCheckedCount: detail.subcodeCheckedCount,
    //         Email_d: faculty.Email_Id || '',
    //         MobileNumber: faculty.Mobile_Number || '',
    //         Camp_id_Examer: Camp_id_Examer,
    //         Camp_id_Examer_Name: Camp_id_Examer_Name,
    //         Camp_id_Mobile: Camp_id_Mobile,
    //         Camp_id_Email: Camp_id_Email,
    //         subtotal: subtotal,
    //         Camp_Id: campId || '',
    //         Valuation_Type: Valuation_Type,
    //         Examiner_Valuation_Status: Examiner_Valuation_Status || ''

    //     });
    // }


    let NewExaminerSubjectDetails = [];
    console.log('Role:', role);

    if (role == 1) {
        let ChiefExaminerDetails = examinerDetails.filter(examiner => examiner.Eva_Id === Eva_Id);
        if (ChiefExaminerDetails.length > 0) {


            let ChiefwithExaminer = ChiefExaminerDetails[0].chief_examiner ? ChiefExaminerDetails[0].chief_examiner.split(',').map(id => id.trim()) : [];
            console.log('Chief with Examiner:', ChiefwithExaminer);
            let ChiefwithSubcode = ChiefExaminerDetails[0].Chief_subcode ? ChiefExaminerDetails[0].Chief_subcode.split(',').map(sub => sub.trim()) : [];
            for (let i = 0; i < ChiefwithExaminer.length; i++) {
                let filteredDetails = ExaminerSubjectDetails.filter(subjectDetail => subjectDetail.Eva_Id === ChiefwithExaminer[i] && subjectDetail.subcode === ChiefwithSubcode[i]);
                NewExaminerSubjectDetails.push(...filteredDetails);
            }
            //     NewExaminerSubjectDetails = ExaminerSubjectDetails.filter(detail => ChiefwithExaminer.includes(detail.Eva_Id) && ChiefwithSubcode.includes(detail.subcode));
        } else {
            NewExaminerSubjectDetails = ExaminerSubjectDetails;
        }

    } else {
        NewExaminerSubjectDetails = ExaminerSubjectDetails;
    }
    console.log('Final Examiner Subject Details:', NewExaminerSubjectDetails);
    res.status(200).json({
        success: true,
        message: 'Examiner subject details endpoint',
        data: NewExaminerSubjectDetails || ExaminerSubjectDetails
    });
})

const getChiefSubjectDetails = asyncHandler(async (req, res, next) => {

    const { Valuation_Type, course, role } = req.query;

    let flname = `import${Valuation_Type}`;

    let ChiefSubjectDetailsExaminer = [];

    const examinerDetailsAll = await db.faculties.findAll({});

    const examinerDetails = await db.faculties.findAll({
        where: {
            Role: {
                [Op.like]: '%1%'
            }
        },
        order: [['Eva_Id', 'ASC']]
    });

    //return
    // console.log('Examiner Details:', examinerDetails);

    const ChiefSubjectDetails = await db.sequelize.query(


        // `SELECT 
        //     t1."Evaluator_Id",
        //     t1."Chief_Evaluator_Id",
        //     t1."Chief_Valuation_Evaluator_Id",
        //     t1."subcode",
        //     COALESCE(SUM(CASE WHEN t1."Evaluator_Id" IS NOT NULL AND t1."Checked" = 'Yes' THEN 1 ELSE 0 END), 0) as "evaluatorCheckedCount",
        //     t2."subcodeTotalCount",
        //     t2."subcodeCheckedCount",
        //     COALESCE(t2."subcodeChiefReviewCheckedCount", 0) as "subcodeChiefReviewCheckedCount",
        //     COALESCE(t2."subcodeChiefValuationCheckedCount", 0) as "subcodeChiefValuationCheckedCount",
        //     COALESCE(t2."subcodeChiefReturnCount", 0) as "subcodeChiefReturnCount"
        // FROM ${flname} t1
        // LEFT JOIN (
        //     SELECT 
        //         "subcode", 
        //         COUNT(*) as "subcodeTotalCount",
        //         SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "subcodeCheckedCount",
        //         COALESCE(SUM(CASE WHEN "Chief_Evaluator_Id" IS NOT NULL AND "Chief_Flg" = 'Y' THEN 1 ELSE 0 END), 0) as "subcodeChiefReviewCheckedCount",
        //         COALESCE(SUM(CASE WHEN "Chief_Valuation_Evaluator_Id" IS NOT NULL AND "Chief_Checked" = 'Yes' THEN 1 ELSE 0 END), 0) as "subcodeChiefValuationCheckedCount",
        //         COALESCE(SUM(CASE WHEN "Chief_Evaluator_Id" IS NOT NULL AND "Chief_Flg" = 'E' THEN 1 ELSE 0 END), 0) as "subcodeChiefReturnCount"
        //     FROM ${flname}
        //     WHERE "subcode" IS NOT NULL
        //     GROUP BY "subcode"
        // ) t2 ON t1."subcode" = t2."subcode"
        // WHERE t1."Evaluator_Id" IS NOT NULL AND t1."subcode" IS NOT NULL 
        // GROUP BY t1."Evaluator_Id", t1."Chief_Evaluator_Id", t1."Chief_Valuation_Evaluator_Id", t1."subcode", t2."subcodeTotalCount", t2."subcodeCheckedCount", t2."subcodeChiefReviewCheckedCount", t2."subcodeChiefValuationCheckedCount", t2."subcodeChiefReturnCount"
        // ORDER BY t1."subcode"`,

        `SELECT
            t1."Evaluator_Id",
            MAX(t1."Chief_Evaluator_Id") as "Chief_Evaluator_Id",
            t1."Chief_Valuation_Evaluator_Id",
            t1."subcode",
            MAX(t1."Camp_id") as "Camp_id",
            MAX(t1."Dep_Name") as "Dep_Name",
            MAX(t1."camp_offcer_id_examiner") as "camp_offcer_id_examiner",

            -- 1. Evaluator + subcode: total assigned and checked count
            MAX(t3."totalCount") as "totalCount",
            MAX(t3."checkedCount") as "checkedCount",

            -- 2. Overall subcode: total and checked count across all evaluators
            MAX(t2."subcodeTotalCount") as "subcodeTotalCount",
            MAX(t2."subcodeCheckedCount") as "subcodeCheckedCount",

            -- 3. Evaluator + Chief_Evaluator_Id + subcode: chief review count and return count
            MAX(t4."evaluatorChiefReviewCount") as "evaluatorChiefReviewCount",
            MAX(t4."evaluatorChiefReturnCount") as "evaluatorChiefReturnCount",

            -- 4. Evaluator + Chief_Valuation_Evaluator_Id + subcode: chief valuation total and checked count
            MAX(t5."chiefValuationTotalCount") as "chiefValuationTotalCount",
            MAX(t5."evaluatorChiefValuationCheckedCount") as "evaluatorChiefValuationCheckedCount",
            MAX(t5."chiefValuationCheckedCount") as "chiefValuationCheckedCount"

        FROM ${flname} t1

        -- 2. Subcode-level totals
        LEFT JOIN (
            SELECT
                "subcode",
                COUNT(*) as "subcodeTotalCount",
                COALESCE(SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END), 0) as "subcodeCheckedCount"
            FROM ${flname}
            WHERE "subcode" IS NOT NULL
            GROUP BY "subcode"
        ) t2 ON t1."subcode" = t2."subcode"

        -- 1. Evaluator + subcode totals
        LEFT JOIN (
            SELECT
                "Evaluator_Id",
                "subcode",
                COUNT(*) as "totalCount",
                COALESCE(SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END), 0) as "checkedCount"
            FROM ${flname}
            WHERE "Evaluator_Id" IS NOT NULL AND "subcode" IS NOT NULL
            GROUP BY "Evaluator_Id", "subcode"
        ) t3 ON t1."Evaluator_Id" = t3."Evaluator_Id"
            AND t1."subcode" = t3."subcode"

        -- 3. Evaluator + Chief_Evaluator_Id + subcode: chief review and return counts
        LEFT JOIN (
            SELECT
                "Evaluator_Id",
                "Chief_Evaluator_Id",
                "subcode",
                COALESCE(SUM(CASE WHEN "Chief_Flg" = 'Y' THEN 1 ELSE 0 END), 0) as "evaluatorChiefReviewCount",
                COALESCE(SUM(CASE WHEN "Chief_Flg" = 'E' THEN 1 ELSE 0 END), 0) as "evaluatorChiefReturnCount"
            FROM ${flname}
            WHERE "Evaluator_Id" IS NOT NULL AND "Chief_Evaluator_Id" IS NOT NULL AND "subcode" IS NOT NULL
            GROUP BY "Evaluator_Id", "Chief_Evaluator_Id", "subcode"
        ) t4 ON t1."Evaluator_Id" = t4."Evaluator_Id"
            AND t1."subcode" = t4."subcode"
            AND t1."Chief_Evaluator_Id" IS NOT DISTINCT FROM t4."Chief_Evaluator_Id"

        -- 4. Evaluator + Chief_Valuation_Evaluator_Id + subcode: chief valuation counts
        LEFT JOIN (
            SELECT
                "Evaluator_Id",
                "Chief_Valuation_Evaluator_Id",
                "subcode",
                COUNT(*) as "chiefValuationTotalCount",
                COALESCE(SUM(CASE WHEN "Chief_Checked" = 'Yes' THEN 1 ELSE 0 END), 0) as "evaluatorChiefValuationCheckedCount",
                COALESCE(SUM(CASE WHEN "Chief_Checked" = 'Yes' THEN 1 ELSE 0 END), 0) as "chiefValuationCheckedCount"
            FROM ${flname}
            WHERE "Evaluator_Id" IS NOT NULL AND "Chief_Valuation_Evaluator_Id" IS NOT NULL AND "subcode" IS NOT NULL
            GROUP BY "Evaluator_Id", "Chief_Valuation_Evaluator_Id", "subcode"
        ) t5 ON t1."Evaluator_Id" = t5."Evaluator_Id"
            AND t1."Chief_Valuation_Evaluator_Id" IS NOT DISTINCT FROM t5."Chief_Valuation_Evaluator_Id"
            AND t1."subcode" = t5."subcode"

        WHERE t1."Evaluator_Id" IS NOT NULL AND t1."subcode" IS NOT NULL
        GROUP BY t1."Evaluator_Id", t1."Chief_Valuation_Evaluator_Id", t1."subcode"
        ORDER BY t1."subcode", t1."Evaluator_Id" `,

        {
            type: db.sequelize.QueryTypes.SELECT
        }
    );


    for (let faculty of examinerDetails) {
        let ChiefSubcode = faculty.Chief_subcode ? faculty.Chief_subcode.split(',') : [];
        let ExaminerCheif = faculty.chief_examiner ? faculty.chief_examiner.split(',') : [];
        let Dep_Name = faculty.Dep_Name_1 ? faculty.Dep_Name_1.split(',') : [];
        let Chief_Valuation_Status = faculty.Chief_Valuation_Status ? faculty.Chief_Valuation_Status.split(',') : [];

        for (let i = 0; i < ChiefSubcode.length; i++) {
            let subcode = ChiefSubcode[i].trim();
            let chiefExaminerId = ExaminerCheif[i] ? ExaminerCheif[i].trim() : null;
            let Eva_Subject = faculty.Chief_Eva_Subject ? faculty.Chief_Eva_Subject.split(',') : [];
            let Evaluator_id = faculty.Eva_Id ? faculty.Eva_Id.trim() : null;
            let Dep_Name_1 = Dep_Name[i] != null ? Dep_Name[i].trim() : null;
            let Chief_Valuation_Status_1 = Chief_Valuation_Status[i] != null ? Chief_Valuation_Status[i].trim() : null;
            let Camp_id = faculty.Camp_id_chief ? faculty.Camp_id_chief.split(',')[i]?.trim() : null;


            // Find row where Chief_Valuation_Evaluator_Id matches — used for t5 (valuation checked counts)
            let chiefValuationDetail = ChiefSubjectDetails.find(detail =>
                (detail.subcode || '').trim() === subcode &&
                (detail.Evaluator_Id || '').trim() === chiefExaminerId &&
                (detail.Chief_Valuation_Evaluator_Id || '').trim() === (faculty.Eva_Id || '').trim()
            );

            // Find row where Chief_Evaluator_Id matches — used for t4 (review / return counts)
            let chiefReviewDetail = ChiefSubjectDetails.find(detail =>
                (detail.subcode || '').trim() === subcode &&
                (detail.Evaluator_Id || '').trim() === chiefExaminerId &&
                (detail.Chief_Evaluator_Id || '').trim() === (faculty.Eva_Id || '').trim()
            );

            let examinerValuationDetail = ChiefSubjectDetails.find(detail =>
                (detail.subcode || '').trim() === subcode &&
                (detail.Evaluator_Id || '').trim() === (chiefExaminerId || '').trim()
            );

            // Use either for general fields (totalCount, subcodeTotalCount, Camp_id, etc.)
            let chiefSubjectDetail = chiefValuationDetail || chiefReviewDetail;
            // console.log('Processing faculty:', Evaluator_id, 'with Chief Subcode:', subcode, 'and Chief Examiner ID:', chiefExaminerId);
            // if (chiefSubjectDetail) {
            //     continue;

            // }
            const matchbioData = examinerDetailsAll.find(examiner => examiner.Eva_Id === chiefExaminerId);
            if (chiefSubjectDetail && Eva_Subject[i] == Valuation_Type) {
                ChiefSubjectDetailsExaminer.push({
                    Eva_Id: chiefSubjectDetail.Evaluator_Id,
                    FACULTY_NAME: faculty.FACULTY_NAME,
                    Evaluator_Name: matchbioData ? matchbioData.FACULTY_NAME : '',
                    Evaluator_Mobile: matchbioData ? matchbioData.Mobile_Number : '',
                    subcode: subcode,
                    totalCount: chiefSubjectDetail.totalCount,
                    checkedCount: chiefSubjectDetail.checkedCount,
                    evaluatorChiefReviewCount: chiefReviewDetail?.evaluatorChiefReviewCount || 0,
                    evaluatorChiefValuationCheckedCount: chiefValuationDetail?.evaluatorChiefValuationCheckedCount || 0,
                    evaluatorChiefReturnCount: chiefReviewDetail?.evaluatorChiefReturnCount || 0,
                    subcodeTotalCount: chiefSubjectDetail.subcodeTotalCount,
                    subcodeCheckedCount: chiefSubjectDetail.subcodeCheckedCount,
                    Email_d: faculty.Email_Id || '',
                    MobileNumber: faculty.Mobile_Number || '',
                    Chief_Evaluator_Id: chiefSubjectDetail.Chief_Evaluator_Id,
                    Chief_Valuation_Evaluator_Id: chiefSubjectDetail.Chief_Valuation_Evaluator_Id,
                    Camp_id: chiefSubjectDetail.Camp_id,
                    Dep_Name: chiefSubjectDetail.Dep_Name,
                    camp_offcer_id_examiner: chiefSubjectDetail.camp_offcer_id_examiner,
                    Chief_Valuation_Status: Chief_Valuation_Status_1 || '',
                    chiefValuationTotalCount: chiefValuationDetail?.chiefValuationTotalCount || 0,
                    chiefValuationCheckedCount: chiefValuationDetail?.chiefValuationCheckedCount || 0,
                    subpos: i,
                });
            } else if (Eva_Subject[i] == Valuation_Type) {

                ChiefSubjectDetailsExaminer.push({
                    Eva_Id: chiefExaminerId,
                    FACULTY_NAME: faculty.FACULTY_NAME,
                    subcode: subcode,
                    Evaluator_Name: matchbioData ? matchbioData.FACULTY_NAME : '',
                    Evaluator_Mobile: matchbioData ? matchbioData.Mobile_Number : '',
                    totalCount: examinerValuationDetail ? examinerValuationDetail.totalCount : 0,
                    checkedCount: examinerValuationDetail ? examinerValuationDetail.checkedCount : 0,
                    evaluatorChiefReviewCount: 0,
                    evaluatorChiefValuationCheckedCount: 0,
                    evaluatorChiefReturnCount: 0,
                    subcodeTotalCount: examinerValuationDetail ? examinerValuationDetail.subcodeTotalCount : 0,
                    subcodeCheckedCount: examinerValuationDetail ? examinerValuationDetail.subcodeCheckedCount : 0,
                    Email_d: faculty.Email_Id || '',
                    MobileNumber: faculty.Mobile_Number || '',
                    Chief_Evaluator_Id: '',
                    Chief_Valuation_Evaluator_Id: faculty.Eva_Id,
                    Camp_id: Camp_id || '',
                    Dep_Name: Dep_Name_1 || '',
                    camp_offcer_id_examiner: '',
                    Chief_Valuation_Status: Chief_Valuation_Status_1 || '',
                    chiefValuationTotalCount: 0,
                    chiefValuationCheckedCount: 0,
                    subpos: i,
                });
            }
        }

    }

    if (role !== '0') ChiefSubjectDetailsExaminer = ChiefSubjectDetailsExaminer.filter((detail) => detail.Dep_Name === course);


    res.status(200).json({
        success: true,
        message: 'Chief subject details endpoint',
        data: ChiefSubjectDetailsExaminer,

    });
})

const ExaminerRemarksDetails = asyncHandler(async (req, res) => {



    const examinerRemarks = await db.valuation_remarks.findAll({

        order: [['createdAt', 'DESC']]
    });


    res.status(200).json({
        message: "Examiner remarks details endpoint",
        data: examinerRemarks
    });

})

const getValuationPendingDetails = asyncHandler(async (req, res) => {
    const { Valuation_Type } = req.query;


    let flname = Valuation_Type === '5' ? `import1` : `import${Valuation_Type}`;

    // Validate that the model exists
    if (!db[flname]) {
        return res.status(400).json({
            success: false,
            message: `Invalid Valuation_Type: ${Valuation_Type}. Model ${flname} not found.`
        });
    }

    const whereClause = Valuation_Type === '5' ? { Chief_Checked: 'NO', Chief_E_flg: 'A' } : { Checked: 'NO', E_flg: 'A' };
    const assignmentDateField = Valuation_Type === '5' ? 'Chief_A_date' : 'A_date';

    const pendingDetails = await db[flname].findAll({
        where: whereClause,
        attributes: ['id', 'subcode', 'testcode', 'Evaluator_Id', 'Dep_Name', 'barcode', 'Camp_id', 'camp_offcer_id_examiner', 'A_date', 'Chief_checkdate_Valuation', 'Chief_A_date', 'Chief_Valuation_Evaluator_Id'],
        order: [[assignmentDateField, 'ASC']]
    });

    // Fetch faculty details
    const faculties = await db.faculties.findAll({
        attributes: ['Eva_Id', 'FACULTY_NAME', 'Email_Id', 'Mobile_Number']
    });

    // Fetch subject master details
    const subjects = await db.sub_master.findAll({
        attributes: ['Subcode', 'SUBNAME']
    });


    // Map pending details with faculty names and camp officer details
    const currentDate = parseISTDateTime(getCurrentISTDateTime());
    const pendingDetailsWithFaculty = pendingDetails.map(pending => {
        const faculty = faculties.find(f => f.Eva_Id == (Valuation_Type == '5' ? pending.Chief_Valuation_Evaluator_Id : pending.Evaluator_Id));
        const campOfficer = faculties.find(f => f.Eva_Id === pending.camp_offcer_id_examiner);
        const subject = subjects.find(s => s.Subcode === pending.subcode);
        const assignedAt = parseISTDateTime(Valuation_Type === '5' ? pending.Chief_A_date : pending.A_date);
        const pendingHours = currentDate && assignedAt
            ? (currentDate - assignedAt) / (1000 * 60 * 60)
            : null;

        return {
            ...pending.toJSON(),
            FACULTY_NAME: faculty ? faculty.FACULTY_NAME : null,
            Email_Id: faculty ? faculty.Email_Id : null,
            Mobile_Number: faculty ? faculty.Mobile_Number : null,
            Camp_Officer_Name: campOfficer ? campOfficer.FACULTY_NAME : null,
            Camp_Officer_Mobile: campOfficer ? campOfficer.Mobile_Number : null,
            Camp_Officer_Email: campOfficer ? campOfficer.Email_Id : null,
            Subject_Name: subject ? subject.SUBNAME : null,
            Pending_Hours: Number.isFinite(pendingHours) ? Number(pendingHours.toFixed(1)) : null,
            Can_Clear: Number.isFinite(pendingHours) && pendingHours >= 5
        };
    });

    res.status(200).json({
        message: "Valuation pending details endpoint",
        data: pendingDetailsWithFaculty
    });

})

const submitPendingAssignment = asyncHandler(async (req, res) => {

    const { barcode, subcode, assignmentType, selectedEvaluator, Valuation_Type, Dep_Name } = req.body;

    if (!barcode || !subcode || !assignmentType || !Valuation_Type || !Dep_Name) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: barcode, subcode, assignmentType, Valuation_Type, Dep_Name"
        });
    }


    const flname = `import${Valuation_Type}`;

    const valuationData = `val_data_${Dep_Name}`;

    // return;

    // If assignment type is '1' (Open to All), clear the Evaluator_Id and set E_flg to 'N'
    if (assignmentType === '1') {
        await db[flname].update(
            {
                E_flg: 'N',
                Evaluator_Id: null,
                A_date: null
            },
            {
                where: {
                    barcode: barcode,
                    subcode: subcode,
                    Dep_Name: Dep_Name
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Assignment opened to all examiners successfully"
        });
    }

    // If assignment type is '2' (Specific Examiner), assign to selectedEvaluator
    if (assignmentType === '2') {
        if (!selectedEvaluator) {
            return res.status(400).json({
                success: false,
                message: "Selected evaluator is required for specific assignment"
            });
        }

        await db[flname].update(
            {
                E_flg: 'A',
                Evaluator_Id: selectedEvaluator,
                A_date: getCurrentISTDateTime()
            },
            {
                where: {
                    barcode: barcode,
                    subcode: subcode,
                    Dep_Name: Dep_Name
                }
            }
        );

        // Delete from valuation data table if exists
        if (db[valuationData]) {
            await db[valuationData].destroy({
                where: {
                    barcode: barcode,
                    subcode: subcode,
                    Dep_Name: Dep_Name
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Assignment assigned to specific examiner successfully"
        });
    }

    return res.status(400).json({
        success: false,
        message: "Invalid assignment type"
    });
});

const updateExaminerStatus = asyncHandler(async (req, res) => {

    const { Eva_Id, subcode, Valuation_Type, Examiner_Valuation_Status } = req.body;

    if (!Eva_Id || !subcode || !Valuation_Type || !Examiner_Valuation_Status) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: Eva_Id, subcode, Valuation_Type, Examiner_Valuation_Status"
        });
    }

    const examiner = await db.faculties.findOne({
        where: {
            Eva_Id: Eva_Id
        }
    });

    if (!examiner) {
        return res.status(404).json({
            success: false,
            message: "Examiner not found"
        });
    }

    let subcodeList = examiner.subcode ? examiner.subcode.split(',') : [];
    let valuationStatusList = examiner.Examiner_Valuation_Status ? examiner.Examiner_Valuation_Status.split(',') : [];

    const subcodeIndex = subcodeList.findIndex(sub => sub.trim() === subcode.trim() && examiner.Eva_Subject.split(',')[subcodeList.indexOf(sub)].trim() === Valuation_Type.trim());

    if (subcodeIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "Subcode not found for examiner"
        });
    }

    // Update the valuation status for the specific subcode
    valuationStatusList[subcodeIndex] = Examiner_Valuation_Status;

    // Save the updated status back to the database
    await db.faculties.update(
        {
            Examiner_Valuation_Status: valuationStatusList.join(',')
        },
        {
            where: {
                Eva_Id: Eva_Id
            }
        }
    );

    return res.status(200).json({
        success: true,
        message: "Examiner valuation status updated successfully"
    });

})

const getSubcodeEvaluationStatus = asyncHandler(async (req, res) => {
    // console.log('Received request for subcode evaluation status with query:', req.body);
    const { Dep_Name, Valuation_Type } = req.query;

    const Subject_Master = await db.sub_master.findAll({
        where: {
            Dep_Name: Dep_Name
        },
        order: [['Subcode', 'ASC']],
        attributes: ['Subcode', 'SUBNAME', 'qb_flg', 'ans_flg', 'mismatch_flg', 'Type_of_Exam']
    });

    let flname = `import${Valuation_Type}`;

    // Get subcodes for this department
    const subcodes = Subject_Master.map(s => s.Subcode).filter(Boolean);

    let importCounts = [];
    if (subcodes.length > 0) {
        importCounts = await db.sequelize.query(
            `SELECT 
                "subcode",
                COUNT(*) AS "totalCount",
                SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) AS "checkedCount"
            FROM ${flname}
            WHERE "subcode" IN (:subcodes)
              AND "subcode" IS NOT NULL
            GROUP BY "subcode"`,
            {
                replacements: { subcodes },
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    }

    const examinerDetails = await db.faculties.findAll({
        attributes: ['Eva_Id', 'FACULTY_NAME', 'subcode', 'Eva_Subject', 'Examiner_Valuation_Status', 'Camp_id', 'Mobile_Number', 'Email_Id'],
        order: [['Eva_Id', 'ASC']]
    });
    //  console.log('Examiner details for subcode evaluation status:', examinerDetails);
    // Merge subject master with import counts and examiner details
    const result = Subject_Master.map(sub => {
        const countData = importCounts.find(c => c.subcode === sub.Subcode);
        const total = parseInt(countData?.totalCount) || 0;
        const checked = parseInt(countData?.checkedCount) || 0;

        // Find all examiners assigned to this subcode with matching Valuation_Type
        const examiners = [];
        for (const faculty of examinerDetails) {
            const subcodeArr = faculty.subcode ? faculty.subcode.split(',') : [];
            const subjectArr = faculty.Eva_Subject ? faculty.Eva_Subject.split(',') : [];
            const statusArr = faculty.Examiner_Valuation_Status ? faculty.Examiner_Valuation_Status.split(',') : [];
            const campIdArr = faculty.Camp_id ? faculty.Camp_id.split(',') : [];

            for (let i = 0; i < subcodeArr.length; i++) {
                if (
                    subcodeArr[i].trim() === sub.Subcode &&
                    subjectArr[i]?.trim() === String(Valuation_Type)
                ) {
                    examiners.push({
                        Evaluator_Id: faculty.Eva_Id,
                        FACULTY_NAME: faculty.FACULTY_NAME,
                        Mobile_Number: faculty.Mobile_Number || '',
                        Email_Id: faculty.Email_Id || '',
                        Camp_Id: campIdArr[i]?.trim() || '',
                        Examiner_Valuation_Status: statusArr[i]?.trim() || ''
                    });
                    break;
                }
            }
        }

        return {
            Subcode: sub.Subcode,
            SUBNAME: sub.SUBNAME,
            qb_flg: sub.qb_flg,
            ans_flg: sub.ans_flg,
            mismatch_flg: sub.mismatch_flg,
            Type_of_Exam: sub.Type_of_Exam,
            totalCount: total,
            checkedCount: checked,
            pendingCount: total - checked,
            examiners: examiners
        };
    });


    res.status(200).json({
        success: true,
        data: result
    });
})

const chiefEvaluationupdateflg = asyncHandler(async (req, res) => {

    const { Chief_Valuation_Evaluator_Id, subpos } = req.body;

    //return

    console.log('Received request for chief evaluation update with data:', Chief_Valuation_Evaluator_Id, subpos);



    if (!Chief_Valuation_Evaluator_Id) {
        return res.status(400).json({
            success: false,
            message: "Missing required field: Chief_Valuation_Evaluator_Id"
        });
    }

    const examiner = await db.faculties.findOne({
        where: {
            Eva_Id: Chief_Valuation_Evaluator_Id
        }
    });

    if (!examiner) {
        return next(new AppError('Examiner not found', 404));
    }

    let valuationStatusList = examiner.Chief_Valuation_Status ? examiner.Chief_Valuation_Status.split(',') : [];

    if (subpos >= 0 && subpos <= valuationStatusList.length) {
        valuationStatusList[subpos] = valuationStatusList[subpos] === 'Y' ? 'N' : 'Y';
    }
    examiner.Chief_Valuation_Status = valuationStatusList.join(',');
    await examiner.save();

    res.status(200).json({
        success: true,
        message: "Chief valuation evaluator ID received successfully",
        data: {
            Eva_Id: examiner.Eva_Id,
            Chief_Valuation_Status: valuationStatusList[subpos],
            subpos: subpos
        }
    });


})

const paperPendingClear = asyncHandler(async (req, res) => {

    const { PendingDataDetails, Valuation_Type } = req.body;

    if (!Array.isArray(PendingDataDetails) || PendingDataDetails.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Select at least one pending paper to clear"
        });
    }

    let flname = Valuation_Type == '5' ? `import1` : `import${Valuation_Type}`;

    // Validate that the models exist
    if (!db[flname]) {
        return res.status(400).json({
            success: false,
            message: `Invalid Valuation_Type: ${Valuation_Type}. Model ${flname} not found.`
        });
    }

    let getCurrentTime = getCurrentISTDateTime();

    let whereClause = Valuation_Type == '5' ? { Chief_Checked: 'NO', Chief_E_flg: 'A' } : { Checked: 'NO', E_flg: 'A' };
    let clearedCount = 0;
    let tooRecentCount = 0;
    let notFoundCount = 0;


    //console.log('Received request for paper pending clear with data:', PendingDataDetails, Valuation_Type, Dep_Name);
    for (let paper of PendingDataDetails) {

        const paperWhere = {
            ...(paper.id ? { id: paper.id } : {
                barcode: paper.barcode,
                subcode: paper.subcode,
                Dep_Name: paper.Dep_Name,
                ...(flname === 'import1' && paper.testcode ? { testcode: paper.testcode } : {})
            }),
            ...whereClause,
            [Op.or]: [
                { tflg: { [Op.is]: null } },
                { tflg: { [Op.eq]: '' } },
                { tflg: { [Op.regexp]: '^\\s*$' } }
            ]
        };

        const PendingPaper = await db[flname].findOne({
            where: paperWhere
        });


        if (PendingPaper) {
            const currentDate = parseISTDateTime(getCurrentTime);
            const assignedDate = Valuation_Type == '5' ? parseISTDateTime(PendingPaper.Chief_A_date) : parseISTDateTime(PendingPaper.A_date);
            let pendingTimeDifference = currentDate && assignedDate ? currentDate - assignedDate : NaN;
            let pendingTimeDifferenceInHours = pendingTimeDifference / (1000 * 60 * 60);

            if (pendingTimeDifferenceInHours >= 5) {

                const valuationData = `val_data_${String(PendingPaper.Dep_Name || '').padStart(2, '0')}`;

                let UpdateClass = Valuation_Type == '5' ? {
                    Chief_E_flg: 'N',
                    Chief_Valuation_Evaluator_Id: null,
                    Chief_A_date: null
                } : {
                    E_flg: 'N',
                    Evaluator_Id: null,
                    A_date: null
                };


                await db[flname].update(
                    UpdateClass,
                    {
                        where: paperWhere
                    }
                );
                clearedCount += 1;

                // Delete from valuation data table if exists
                if (db[valuationData]) {
                    await db[valuationData].destroy({
                        where: {
                            barcode: paper.barcode,
                            subcode: paper.subcode,
                            Dep_Name: paper.Dep_Name,
                            ...(flname === 'import1' && paper.testcode ? { testcode: paper.testcode } : {}),
                            valuation_type: String(Valuation_Type == '5' ? '1' : Valuation_Type),
                            Examiner_type: Valuation_Type == '5'
                                ? '1'
                                : { [Op.in]: ['2', '11'] }

                        }
                    });
                }

            } else {
                tooRecentCount += 1;
            }
        } else {
            notFoundCount += 1;
        }


    }




    res.status(200).json({
        success: true,
        message: `${clearedCount} pending paper${clearedCount === 1 ? '' : 's'} cleared`,
        data: {
            selectedCount: PendingDataDetails.length,
            clearedCount,
            tooRecentCount,
            notFoundCount,
            Valuation_Type,
        }
    });

});

const barcodeReversal = asyncHandler(async (req, res) => {


    // Support both basicData and basicDetails for backward compatibility
    const data = req.body.basicData || req.body.basicDetails || req.body;

    const { sub_code,
        barcode,
        Dep_Name,
        Valuation_Type, Examiner_type } = data;

    // Detailed validation with specific field checking
    const missingFields = [];
    if (!Valuation_Type) missingFields.push('Valuation_Type');
    if (!barcode) missingFields.push('barcode');
    if (!sub_code) missingFields.push('sub_code');
    if (!Dep_Name) missingFields.push('Dep_Name');

    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`,
            receivedData: { Valuation_Type, barcode, sub_code, Dep_Name }
        });
    }

    let flname = `import${Valuation_Type}`;
    let valuationData = `val_data_${Dep_Name}`;

    // Use raw query to find the paper
    const papers = await db.sequelize.query(
        `SELECT * FROM ${flname} 
         WHERE "barcode" = :barcode 
         AND "subcode" = :sub_code 
         AND "Dep_Name" = :Dep_Name 
         AND ("tflg" IS NULL OR "tflg" = '') 
         AND "Checked" = 'NO' 
         AND "E_flg" = 'A'
         LIMIT 1`,
        {
            replacements: { barcode, sub_code, Dep_Name },
            type: db.sequelize.QueryTypes.SELECT
        }
    );

    // if (!papers || papers.length === 0) {
    //     return res.status(404).json({
    //         success: false,
    //         message: "Paper not found for barcode reversal"
    //     });
    // }

    const paper = papers[0];

    const ValuationDataEntry = await db[valuationData].destroy({
        where: {
            barcode: barcode,
            subcode: sub_code,
            Dep_Name: Dep_Name,
            Examiner_type: Examiner_type,
            valuation_type: Valuation_Type
        }
    });

    if (Examiner_type == '2') {
        await db.sequelize.query(
            `UPDATE ${flname} 
         SET "E_flg" = 'N', "Evaluator_Id" = NULL, "A_date" = NULL
         WHERE "barcode" = :barcode 
         AND "subcode" = :sub_code 
         AND "Dep_Name" = :Dep_Name`,
            {
                replacements: { barcode, sub_code, Dep_Name },
                type: db.sequelize.QueryTypes.UPDATE
            }
        );
    }


    // TODO: Implement the reversal logic here

    res.status(200).json({
        success: true,
        message: "Barcode reversal endpoint - implementation pending",
        data: paper
    });

})

const PendingReleaseChief = asyncHandler(async (req, res) => {

    const { PendingDataDetails, Valuation_Type, Dep_Name } = req.body;

    // PendingDataDetails is an array, extract the first item
    const paper = PendingDataDetails[0];

    // Extract barcode and subcode from the paper object
    const barcode = paper.barcode;
    const subcode = paper.subcode;
    const evaluatorId = paper.Evaluator_Id;
    const campId = paper.Camp_id;
    const campOfficerId = paper.camp_offcer_id_examiner;


    // TODO: Implement the logic to release the chief valuation
    // Similar to paperPendingClear but for chief valuation

    const flname = Valuation_Type == '5' ? `import1` : `import${Valuation_Type}`;
    let valuationData = `val_data_${Dep_Name}`;

    const valuationChiefBarcode = await db[flname].findOne({
        where: {
            barcode: barcode,
            subcode: subcode,
            Dep_Name: Dep_Name,
            Chief_E_flg: 'A',
            Chief_Checked: 'NO',
            [Op.or]: [
                { tflg: { [Op.is]: null } },
                { tflg: { [Op.eq]: '' } },
                { tflg: { [Op.regexp]: '^\\s*$' } }  // Matches blank/whitespace-only strings
            ]
        }
    });

    if (!valuationChiefBarcode) {
        return res.status(404).json({
            success: false,
            message: "Chief valuation paper not found for pending release"
        });
    }

    // Implement the logic to release the chief valuation here
    // This may involve updating the status, notifying the chief examiner, etc.
    if (valuationChiefBarcode) {
        await db[flname].update(
            {
                Chief_E_flg: 'N',
                Chief_Valuation_Evaluator_Id: null,
                Chief_A_date: null
            },
            {
                where: {
                    barcode: barcode,
                    subcode: subcode,
                    Dep_Name: Dep_Name,
                    Chief_E_flg: 'A',
                    Chief_Checked: 'NO',
                    [Op.or]: [
                        { tflg: { [Op.is]: null } },
                        { tflg: { [Op.eq]: '' } },
                        { tflg: { [Op.regexp]: '^\\s*$' } }  // Matches blank/whitespace-only strings
                    ]
                }
            }
        );

        const valuationDataEntry = await db[valuationData].destroy({
            where: {
                barcode: barcode,
                subcode: subcode,
                Dep_Name: Dep_Name,
                Examiner_type: Valuation_Type == '5' ? '1' : '2',
                valuation_type: Valuation_Type == '5' ? '1' : Valuation_Type
            }
        });

    }

    res.status(200).json({
        success: true,
        message: "Pending release chief endpoint hit",
        data: {
            barcode,
            subcode,
            evaluatorId,
            Valuation_Type,
            Dep_Name
        }
    });

})

const getChiefRemarks = asyncHandler(async (req, res) => {

    const { Role, Dep_Name, Evaluator_Id } = req.query;

    console.log('Received request for chief remarks with query:', req.query,Evaluator_Id);



    const chiefRemarks = await db.chief_remarks.findAll({});

    const facultyDetails = await db.faculties.findAll({});

    const Sub_Master = await db.sub_master.findAll({});

    const importData = await db.import1.findAll({
        where: {
            barcode: {
                [Op.in]: chiefRemarks.map(remark => remark.Barcode)
            }
        }
    });

    const chiefRemarksWithImportData = parseInt(Role) !== 0 ? importData.filter(remark => remark.Dep_Name === Dep_Name) : importData;

   

    const chiefRemarksWithEvaluatorData = parseInt(Role) === 1 ? chiefRemarksWithImportData.filter(remark => remark.Chief_Evaluator_Id === Evaluator_Id || remark.Chief_Valuation_Evaluator_Id === Evaluator_Id) :
        parseInt(Role) === 2 ? chiefRemarksWithImportData.filter(remark => remark.Evaluator_Id === Evaluator_Id) : chiefRemarksWithImportData;

    let chiefRemarksMap = [];

    chiefRemarksWithEvaluatorData.forEach(remark => {
        const matchingRemark = chiefRemarksWithImportData.find(r => r.barcode === remark.barcode);
        const chiefEvaluatorId = matchingRemark?.Chief_Valuation_Evaluator_Id || matchingRemark?.Chief_Evaluator_Id;

        chiefRemarksMap.push({
            Barcode: remark.barcode,
            Subcode: remark.subcode,
            subjectName: Sub_Master.find(sub => sub.Subcode === remark.subcode)?.SUBNAME || null,
            Dep_Name: remark.Dep_Name,
            Evaluator_Id: remark.Evaluator_Id,
            Evaulator_Name: facultyDetails.find(faculty => faculty.Eva_Id === remark.Evaluator_Id)?.FACULTY_NAME || null,
            ChiefEvaluator_Name: facultyDetails.find(faculty => faculty.Eva_Id === chiefEvaluatorId)?.FACULTY_NAME || null,
            Chief_Evaluator_Id: chiefEvaluatorId || null,
            Chief_Remarks: chiefRemarks.find(cr => cr.Barcode === remark.barcode)?.msg || null,
            CampId: remark.Camp_id,

        });
    });



    res.status(200).json({
        success: true,
        message: "Get chief remarks endpoint hit",
        data: chiefRemarksMap
    });

})

const getCampDetailsOverall = asyncHandler(async (req, res) => {

    // const { valuationData } = req.query;
    const { course, role, evaId, campId, department, valuationType } = req.query;


    let CampExaminer = [];
    let CampChiefExaminer = [];

    const examinerDetails = await db.faculties.findAll({
        where: {
            [Op.and]: [
                {
                    [Op.or]: [
                        { Dep_Name_1: { [Op.like]: `%${department}%` } },
                        { Dep_Name_2: { [Op.like]: `%${department}%` } }
                    ]
                },
                {
                    [Op.or]: [
                        { Camp_id: { [Op.like]: `%${campId}%` } },
                        { Camp_id_chief: { [Op.like]: `%${campId}%` } }
                    ]
                }
            ]
        }
    });

    for (const faculty of examinerDetails) {

        let subCode = faculty.subcode ? faculty.subcode.split(',') : [];
        let Eva_Subject = faculty.Eva_Subject ? faculty.Eva_Subject.split(',') : [];
        let chief_examiner_id = faculty.chief_examiner ? faculty.chief_examiner.split(',') : [];
        let chief_examiner_Subcode = faculty.Chief_subcode ? faculty.Chief_subcode.split(',') : [];
        // let chief_examiner_subcode = faculty.chief_examiner_subcode ? faculty.chief_examiner_subcode.split(',') : [];
        let Dep_Name_1_Array = faculty.Dep_Name_1 ? faculty.Dep_Name_1.split(',') : [];
        let Dep_Name_2_Array = faculty.Dep_Name_2 ? faculty.Dep_Name_2.split(',') : [];
        let Camp_id_Array = faculty.Camp_id ? faculty.Camp_id.split(',') : [];
        let Camp_id_chief = faculty.Camp_id_chief ? faculty.Camp_id_chief.split(',') : [];


        for (let i = 0; i < subCode.length; i++) {
            let subcode = subCode[i].trim();
            let evaSubject = Eva_Subject[i] ? Eva_Subject[i].trim() : '';
            let Dep_Name_1 = Dep_Name_1_Array[i] ? Dep_Name_1_Array[i].trim() : '';
            let Dep_Name_2 = Dep_Name_2_Array[i] ? Dep_Name_2_Array[i].trim() : '';
            let Camp_id = Camp_id_Array[i] ? Camp_id_Array[i].trim() : '';

            if (Camp_id == campId && evaSubject == valuationType) {
                CampExaminer.push({
                    Eva_Id: faculty.Eva_Id,
                    FACULTY_NAME: faculty.FACULTY_NAME,
                    subcode: subcode,
                    Email_d: faculty.Email_Id || '',
                    MobileNumber: faculty.Mobile_Number || '',
                });
            }

        }



        for (let j = 0; j < chief_examiner_Subcode.length; j++) {

            let Camp_id_chief_item = Camp_id_chief[j] ? Camp_id_chief[j].trim() : '';

            if (Camp_id_chief_item == campId && valuationType == 1) {
                CampChiefExaminer.push({
                    Eva_Id: faculty.Eva_Id,
                    subcode: chief_examiner_Subcode[j] ? chief_examiner_Subcode[j].trim() : '',
                    FACULTY_NAME: faculty.FACULTY_NAME,
                    Email_d: faculty.Email_Id || '',
                    MobileNumber: faculty.Mobile_Number || '',
                });
            }

        }
    }



    let flname = `import${valuationType}`;

    // Get unique subcodes from examiners
    const subcodes = [...new Set(CampExaminer.map(examiner => examiner.subcode))];

    if (subcodes.length === 0) {
        return res.status(200).json({
            success: true,
            message: 'No examiners found for the specified camp',
            data: {
                examiners: [],
                subcodeStats: [],
                summary: {
                    totalSubcodes: 0,
                    totalPapers: 0,
                    checkedPapers: 0,
                    pendingPapers: 0
                }
            }
        });
    }

    // Get subcode-wise statistics
    const placeholders = subcodes.map((_, index) => `:subcode${index}`).join(',');
    const replacements = {};
    subcodes.forEach((subcode, index) => {
        replacements[`subcode${index}`] = subcode;
    });

    const subcodeStats = await db.sequelize.query(
        `SELECT 
            "subcode",
            COUNT(*) AS "totalPapers", 
            SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) AS "checkedPapers",
            SUM(CASE WHEN "Checked" = 'NO' THEN 1 ELSE 0 END) AS "pendingPapers"
        FROM ${flname}
        WHERE "subcode" IN (${placeholders})  AND "Dep_Name" = :department
        GROUP BY "subcode"
        ORDER BY "subcode"`,
        {
            replacements: { ...replacements, campId, department },
            type: db.sequelize.QueryTypes.SELECT
        }
    );

    // Get date-wise summary with subcode count and checked count
    const datewiseSummary = await db.sequelize.query(
        `SELECT 
            SUBSTRING("checkdate", 1, 10) AS "date",
            COUNT(DISTINCT "subcode") AS "subcodeCount",
            COUNT(*) AS "checkedCount"
        FROM ${flname}
        WHERE "subcode" IN (${placeholders}) 
            
            AND "Dep_Name" = :department
            AND "Checked" = 'Yes'
            AND "checkdate" IS NOT NULL
        GROUP BY SUBSTRING("checkdate", 1, 10)
        ORDER BY SUBSTRING("checkdate", 1, 10) DESC`,
        {
            replacements: { ...replacements, campId, department },
            type: db.sequelize.QueryTypes.SELECT
        }
    );

    // Get overall summary
    const overallStats = await db.sequelize.query(
        `SELECT 
            COUNT(DISTINCT "subcode") AS "totalSubcodes",
            COUNT(*) AS "totalPapers", 
            SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) AS "checkedPapers",
            SUM(CASE WHEN "Checked" = 'NO' THEN 1 ELSE 0 END) AS "pendingPapers"
        FROM ${flname}
        WHERE "subcode" IN (${placeholders})  AND "Dep_Name" = :department`,
        {
            replacements: { ...replacements, campId, department },
            type: db.sequelize.QueryTypes.SELECT
        }
    );

    // Get current date for filtering
    const currentDate = getCurrentISTDateTime().substring(0, 10);

    const Examiner_Absent_Details = await db.sequelize.query(
        `SELECT 
            "Evaluator_Id",
            SUBSTRING("A_date", 1, 10) AS "assignedDate",
            COUNT(DISTINCT "subcode") AS "subcodeCount",
            COUNT(*) AS "paperCount"
         FROM ${flname}
         WHERE "Camp_id" = :campId 
           AND "Dep_Name" = :department
           AND "Checked" = 'Yes'
           AND "E_flg" = 'Y'
           AND SUBSTRING("A_date", 1, 10) = :currentDate
         GROUP BY "Evaluator_Id", SUBSTRING("A_date", 1, 10)
         ORDER BY "Evaluator_Id"`,
        {
            replacements: { campId, department, currentDate },
            type: db.sequelize.QueryTypes.SELECT
        }
    );



    let examinerAbsentDetailsWithNames = [];

    for (const detail of CampExaminer) {
        const examiner_Data = Examiner_Absent_Details.find(examiner => examiner.Evaluator_Id === detail.Eva_Id);
        if (!examiner_Data) {
            examinerAbsentDetailsWithNames.push({
                Evaluator_Id: detail.Eva_Id,
                FACULTY_NAME: detail.FACULTY_NAME || 'Unknown',
                subcode: detail.subcode || 'Unknown',
                MobileNumber: detail.MobileNumber || 'Unknown',
                Email_d: detail.Email_d || 'Unknown',

            });
        }
    }


    // Get Chief Examiner Absent Details (for valuation type 1)
    let chiefExaminerAbsentDetailsWithNames = [];


    if (valuationType == 1 && CampChiefExaminer.length > 0) {
        const Chief_Examiner_Absent_Details = await db.sequelize.query(
            `SELECT 
                "Chief_Valuation_Evaluator_Id",
                SUBSTRING("Chief_checkdate_Valuation", 1, 10) AS "assignedDate",
                COUNT(DISTINCT "subcode") AS "subcodeCount",
                COUNT(*) AS "paperCount"
             FROM ${flname}
             WHERE "Camp_id" = :campId 
               AND "Dep_Name" = :department
               AND "Chief_Checked" = 'Yes'
               AND "Chief_E_flg" = 'Y'
               AND SUBSTRING("Chief_checkdate_Valuation", 1, 10) = :currentDate
             GROUP BY "Chief_Valuation_Evaluator_Id", SUBSTRING("Chief_checkdate_Valuation", 1, 10)
             ORDER BY "Chief_Valuation_Evaluator_Id"`,
            {
                replacements: { campId, department, currentDate },
                type: db.sequelize.QueryTypes.SELECT
            }
        );


        for (const detail of CampChiefExaminer) {
            const chiefExaminer_Data = Chief_Examiner_Absent_Details.find(
                examiner => examiner.Chief_Valuation_Evaluator_Id === detail.Eva_Id
            );
            if (!chiefExaminer_Data) {
                chiefExaminerAbsentDetailsWithNames.push({
                    Evaluator_Id: detail.Eva_Id,
                    FACULTY_NAME: detail.FACULTY_NAME || 'Unknown',
                    subcode: detail.subcode || 'Unknown',
                    MobileNumber: detail.MobileNumber || 'Unknown',
                    Email_d: detail.Email_d || 'Unknown',
                });
            }
        }

    }

    // Get subject names from sub_master
    const subMaster = await db.sub_master.findAll({
        where: {
            Subcode: {
                [Op.in]: subcodes
            }
        },
        attributes: ['Subcode', 'SUBNAME']
    });

    // Enrich subcode stats with subject names
    const enrichedSubcodeStats = subcodeStats.map(stat => ({
        subcode: stat.subcode,
        subjectName: subMaster.find(s => s.Subcode === stat.subcode)?.SUBNAME || '',
        totalPapers: parseInt(stat.totalPapers) || 0,
        checkedPapers: parseInt(stat.checkedPapers) || 0,
        pendingPapers: parseInt(stat.pendingPapers) || 0,
        percentage: stat.totalPapers > 0
            ? ((parseInt(stat.checkedPapers) / parseInt(stat.totalPapers)) * 100).toFixed(2)
            : '0.00'
    }));

    // Format date-wise summary with overall stats
    const totalSubcodes = parseInt(overallStats[0]?.totalSubcodes) || 0;
    const totalPapers = parseInt(overallStats[0]?.totalPapers) || 0;

    const summaryByDate = datewiseSummary.map(item => ({
        date: item.date,
        subcodeCount: parseInt(item.subcodeCount) || 0,
        checkedCount: parseInt(item.checkedCount) || 0,
        overallSubcodes: totalSubcodes,
        totalPapers: totalPapers
    }));

    // Add total row to summaryByDate
    summaryByDate.push({
        date: 'Total',
        subcodeCount: totalSubcodes,
        checkedCount: summaryByDate.reduce((sum, item) => sum + item.checkedCount, 0),
        overallSubcodes: totalSubcodes,
        totalPapers: totalPapers
    });

    // Calculate overall summary
    const overallSummary = {
        totalSubcodes: parseInt(overallStats[0]?.totalSubcodes) || 0,
        totalPapers: parseInt(overallStats[0]?.totalPapers) || 0,
        checkedPapers: parseInt(overallStats[0]?.checkedPapers) || 0,
        pendingPapers: parseInt(overallStats[0]?.pendingPapers) || 0,
        completionPercentage: overallStats[0]?.totalPapers > 0
            ? ((parseInt(overallStats[0]?.checkedPapers) / parseInt(overallStats[0]?.totalPapers)) * 100).toFixed(2)
            : '0.00'
    };

    const valuation_Remarks = await db.valuation_remarks.findAll({
        where: {
            Campid: campId,
            Dep_Name: department,
            Remarks_Type: '2'
        }
    });

    let valuationRemarksWithNames = [];

    for (const remark of valuation_Remarks) {
        const MalExaminerDetails = examinerDetails.find(examiner => examiner.Eva_Id === remark.evaluator_id);
        valuationRemarksWithNames.push({
            Eva_Id: remark.evaluator_id,
            FACULTY_NAME: MalExaminerDetails ? MalExaminerDetails.FACULTY_NAME : 'Unknown',
            MobileNumber: MalExaminerDetails ? MalExaminerDetails.Mobile_Number : 'Unknown',
            Email_d: MalExaminerDetails ? MalExaminerDetails.Email_Id : 'Unknown',
            subcode: remark.evaluator_subject || 'Unknown',
            Barcode: remark.Dummy_Number || 'Unknown',

        });
    }




    res.status(200).json({
        success: true,
        message: 'Get camp details overall endpoint hit',
        data: {
            examiners: CampExaminer,
            chiefExaminers: CampChiefExaminer,
            subcodeStats: enrichedSubcodeStats,
            summaryByDate: summaryByDate,
            overallSummary: overallSummary,
            examinerAbsentDetailsWithNames: examinerAbsentDetailsWithNames,
            chiefExaminerAbsentDetailsWithNames: chiefExaminerAbsentDetailsWithNames,
            valuationRemarksWithNames: valuationRemarksWithNames
        }
    });
})

module.exports = {
    getValuationCampDetails,
    getSubcodeDetails,
    getExaminerSubjectDetails,
    getChiefSubjectDetails,
    ExaminerRemarksDetails,
    getValuationPendingDetails,
    submitPendingAssignment,
    updateExaminerStatus,
    getSubcodeEvaluationStatus,
    chiefEvaluationupdateflg,
    paperPendingClear,
    barcodeReversal,
    PendingReleaseChief,
    getChiefRemarks,
    getCampDetailsOverall
};
