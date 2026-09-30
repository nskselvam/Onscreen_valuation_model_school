const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const { where } = require("sequelize");
const { formatDateOnly } = require("../utils/formatDateTime");
const { uploadCertificateToS3 } = require("../utils/s3Upload");



const getDistrictMasterData = asyncHandler(async (req, res) => {

    console.log("District Code:", req.body);


    const masterData = await db.Master_11.findAll({
        where: { selFlg: 'Y' ,
            distFlg: 'N'
        },
        attributes: ['Emis_No', 'udise_code', 'district_name', 'school_name', 'father_name', 'name', 'com', 'sex', 'pstm', 'dob', 'Zone_Name_Jee', 'Zone_Name_Neet', 'ph', 'Disability_Name','Student_Status', 'PHONE_NUMBER', 'HOUSE_ADDRESS']
    });

    // Format the DOB field to dd-mm-yyyy
    const formattedData = masterData.map(record => {
        const data = record.toJSON();
        if (data.dob) {
            data.dob = formatDateOnly(data.dob);
        }
        return data;
    });

    res.json({ message: "Master Data Operation Controller", data: formattedData });



});

const districtSendData = asyncHandler(async (req, res) => {

    const data = req.body;

    console.log("Received data from frontend:", data);
    console.log("Number of records:", Array.isArray(data) ? data.length : 0);

    // Validate data
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return res.status(400).json({
            status: "fail",
            message: "No data received"
        });
    }

    for (const record of data) {
        const { Emis_No, udise_code } = record;

        // Validate required fields
        if (!Emis_No || !udise_code) {
            console.warn(`Skipping record with missing required fields: ${JSON.stringify(record)}`);
            continue; // Skip this record and move to the next one
        }

        try {
            await db.Master_11.update(
                { distFlg: 'Y' },
                {
                    where: {
                        Emis_No: Emis_No,
                        udise_code: udise_code
                    }
                }
            );
        } catch (error) {
            console.error(`Error processing record: ${JSON.stringify(record)}`, error);
        }
    }

    // Process the received data as needed
    // For example, you can save it to the database or perform any other operations

    // Here, we are just sending a response back with the received data
    res.json({
        status: "success",
        message: `Data received successfully. ${Array.isArray(data) ? data.length : 0} records processed.`,
        receivedData: data
    });

});

const getDistrictSelectedData = asyncHandler(async (req, res) => {

    console.log("District Code for selected data:", req.query);
    const { Centre_Code } = req.query;

    const whereCondition = { 
        selFlg: 'Y',
        distFlg: 'Y',
        statFlg: 'N' // Only fetch records that have not been processed (statFlg = 'N')
    };

    // Add district filter if Centre_Code is provided
    if (Centre_Code && Centre_Code !== '00') {
        whereCondition.Cen_Code = Centre_Code;
    }

   const masterData = await db.Master_11.findAll({
        where: whereCondition,
        attributes: ['Emis_No', 'udise_code', 'district_name', 'school_name', 'father_name', 'name', 'com', 'sex', 'pstm', 'dob', 'Zone_Name_Jee', 'Zone_Name_Neet', 'ph', 'Disability_Name', 'candidate_status', 'candidate_preferences', 'remarks','Student_Status', 'PHONE_NUMBER', 'HOUSE_ADDRESS']
    });

    // Mapping for preferences
    const preferenceCodeMap = {
        '1': 'JEE',
        '2': 'NEET',
        '3': 'TNEA',
        '4': 'CLAT',
        '5': 'CA',
        '6': 'Civil Services'
    };

    // Format the DOB field to dd-mm-yyyy and parse preferences
    const formattedData = masterData.map(record => {
        const data = record.toJSON();
        if (data.dob) {
            data.dob = formatDateOnly(data.dob);
        }
        
        // Parse comma-separated preferences back to individual fields
        if (data.candidate_preferences) {
            const prefs = data.candidate_preferences.split(',').filter(p => p);
            prefs.forEach((pref, index) => {
                data[`preference_${index + 1}`] = preferenceCodeMap[pref.trim()] || pref.trim();
            });
        }
        
        return data;
    });

    res.json({ message: "Master Data Operation Controller", data: formattedData });

});

const updateDistrictData = asyncHandler(async (req, res) => {
    const { Emis_No, udise_code, ...updateData } = req.body;
    const remarks = req.body.remarks;
    const files = req.files;

    console.log("Updating record:", { Emis_No, udise_code });
    console.log("Uploaded files:", files);
    console.log("Update data:", updateData);
    console.log("Remarks:", remarks);

    // Validate required fields
    if (!Emis_No || !udise_code) {
        return res.status(400).json({
            status: "fail",
            message: "EMIS No and UDISE Code are required"
        });
    }

    // Remove fields that should not be updated (read-only fields from frontend)
    delete updateData.dob; // DOB is disabled in frontend, don't update
    delete updateData.district_name; // District is disabled
    delete updateData.school_name; // School is disabled
    delete updateData.Zone_Name_Jee; // Zone fields are disabled
    delete updateData.Zone_Name_Neet;
    
    // Remove remarks from updateData if it exists there, we'll add it explicitly
    delete updateData.remarks;

    // Process candidate preferences into comma-separated format
    const candidateOptionMap = {
        'JEE': '1',
        'NEET': '2',
        'TNEA': '3',
        'CLAT': '4',
        'CA': '5',
        'Civil Services': '6'
    };
    
    const preferences = [];
    for (let i = 1; i <= 6; i++) {
        const prefKey = `preference_${i}`;
        if (updateData[prefKey]) {
            const prefValue = candidateOptionMap[updateData[prefKey]] || updateData[prefKey];
            preferences.push(prefValue);
        }
        delete updateData[prefKey]; // Remove individual preference fields
    }
    
    // Store preferences as comma-separated string, or null if empty
    if (preferences.length > 0) {
        updateData.candidate_preferences = preferences.join(',');
        console.log("✅ Candidate preferences:", updateData.candidate_preferences);
    } else {
        // Explicitly set to null to clear old preferences when status is not Present
        updateData.candidate_preferences = null;
        console.log("✅ Candidate preferences cleared (set to null)");
    }

    // Add remarks to update data if provided
    if (remarks !== undefined && remarks !== null && remarks !== '') {
        updateData.remarks = remarks;
        console.log("✅ Remarks will be updated:", remarks);
    }

    // Generate S3 folder path: admission_2026/std_11/DD-MM-YYYY/Emis_No
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const dateFolder = `${day}-${month}-${year}`;
    const s3FolderPath = `admission_2026/std_11/${dateFolder}/${Emis_No}`;

    console.log(`📁 S3 Upload folder: ${s3FolderPath}`);

    // Upload files to S3 and add URLs to update data
    const uploadedDocuments = {};
    
    try {
        if (files) {
            // Upload Birth Certificate to S3
            if (files.birthCertificate && files.birthCertificate[0]) {
                const s3Result = await uploadCertificateToS3(files.birthCertificate[0], s3FolderPath);
                updateData.birth_certificate_path = s3Result.key;
             //   updateData.birth_certificate_key = s3Result.key;
              //  uploadedDocuments.birthCertificate = s3Result.url;
                console.log("✅ Birth Certificate uploaded to S3:", s3Result.url);
            }
            
            // Upload Community Certificate to S3
            if (files.communityCertificate && files.communityCertificate[0]) {
                const s3Result = await uploadCertificateToS3(files.communityCertificate[0], s3FolderPath);
                updateData.community_certificate_path = s3Result.key;
            //    updateData.community_certificate_key = s3Result.key;
               // uploadedDocuments.communityCertificate = s3Result.url;
                console.log("✅ Community Certificate uploaded to S3:", s3Result.url);
            }
            
            // Upload Aadhar Card to S3
            if (files.aadharCard && files.aadharCard[0]) {
                const s3Result = await uploadCertificateToS3(files.aadharCard[0], s3FolderPath);
                updateData.aadhar_card_path = s3Result.key;
           //     updateData.aadhar_card_key = s3Result.key;
               // uploadedDocuments.aadharCard = s3Result.url;
                console.log("✅ Aadhar Card uploaded to S3:", s3Result.url);
            }
            
            // Upload Other Certificate to S3
            if (files.otherCertificate && files.otherCertificate[0]) {
                const s3Result = await uploadCertificateToS3(files.otherCertificate[0], s3FolderPath);
                updateData.other_certificate_path = s3Result.key;
             //   updateData.other_certificate_key = s3Result.key;
                //uploadedDocuments.otherCertificate = s3Result.url;
                console.log("✅ Other Certificate uploaded to S3:", s3Result.url);
            }
        }

        // Update database record
        console.log("📝 Final updateData being sent to database:", JSON.stringify(updateData, null, 2));
        const [updatedRows] = await db.Master_11.update(
            updateData,
            {
                where: {
                    Emis_No: Emis_No,
                    udise_code: udise_code
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Record not found"
            });
        }

        res.json({
            status: "success",
            message: "Record and documents updated successfully",
            updatedRows,
            uploadedDocuments
        });
    } catch (error) {
        console.error("❌ Error updating record:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to update record"
        });
    }
});


const getDashboardStatistics = asyncHandler(async (req, res) => {
    const { districtCode } = req.query;

    // Build where condition for jee_marks table
    // For State Dashboard (districtCode = '00' or not provided): all records
    // For District Dashboard (specific district): filter by BATCHNAME (district code)
    const whereCondition = {};

    // Add district filter if provided and not '00' (all districts)
    if (districtCode && districtCode !== '00') {
        whereCondition.BATCHNAME = districtCode;
    }

    try {
        // Get all test codes for reference
        const tests = await db.Test_Master.findAll({
            attributes: ['testcode', 'Test_Name', 'testdate', 'type_of_exam', 'std'],
            raw: true
        });

        // Get comprehensive statistics from jee_marks
        const [
            totalStats,
            districtStats,
            scoreRanges,
            subjectPerformance,
            testDistribution
        ] = await Promise.all([
            // Overall statistics
            db.Jee_Marks.findOne({
                attributes: [
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalStudents'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('TOTAL')), 'avgTotal'],
                    [db.Sequelize.fn('MAX', db.Sequelize.col('TOTAL')), 'maxTotal'],
                    [db.Sequelize.fn('MIN', db.Sequelize.col('TOTAL')), 'minTotal'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('CORRECT')), 'avgCorrect'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('WRONG')), 'avgWrong'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('BLANK')), 'avgBlank'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Total_Percentile')), 'avgPercentile'],
                    [db.Sequelize.fn('MAX', db.Sequelize.col('Total_Percentile')), 'maxPercentile'],
                    [db.Sequelize.fn('MIN', db.Sequelize.col('Total_Percentile')), 'minPercentile']
                ],
                where: whereCondition,
                raw: true
            }),
            
            // District-wise statistics
            db.Jee_Marks.findAll({
                attributes: [
                    'BATCHNAME',
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'studentCount'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('TOTAL')), 'avgScore'],
                    [db.Sequelize.fn('MAX', db.Sequelize.col('TOTAL')), 'maxScore']
                ],
                where: whereCondition,
                group: ['BATCHNAME'],
                order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']],
                raw: true
            }),
            
            // Score range distribution
            db.sequelize.query(`
                SELECT 
                    CASE 
                        WHEN "TOTAL" >= 240 THEN 'Excellent (240+)'
                        WHEN "TOTAL" >= 180 THEN 'Very Good (180-239)'
                        WHEN "TOTAL" >= 120 THEN 'Good (120-179)'
                        WHEN "TOTAL" >= 60 THEN 'Average (60-119)'
                        ELSE 'Needs Improvement (<60)'
                    END as score_range,
                    CASE 
                        WHEN "TOTAL" >= 240 THEN 1
                        WHEN "TOTAL" >= 180 THEN 2
                        WHEN "TOTAL" >= 120 THEN 3
                        WHEN "TOTAL" >= 60 THEN 4
                        ELSE 5
                    END as sort_order,
                    COUNT(*) as count
                FROM jee_marks
                ${districtCode && districtCode !== '00' ? `WHERE "BATCHNAME" = '${districtCode}'` : ''}
                GROUP BY 
                    CASE 
                        WHEN "TOTAL" >= 240 THEN 'Excellent (240+)'
                        WHEN "TOTAL" >= 180 THEN 'Very Good (180-239)'
                        WHEN "TOTAL" >= 120 THEN 'Good (120-179)'
                        WHEN "TOTAL" >= 60 THEN 'Average (60-119)'
                        ELSE 'Needs Improvement (<60)'
                    END,
                    CASE 
                        WHEN "TOTAL" >= 240 THEN 1
                        WHEN "TOTAL" >= 180 THEN 2
                        WHEN "TOTAL" >= 120 THEN 3
                        WHEN "TOTAL" >= 60 THEN 4
                        ELSE 5
                    END
                ORDER BY sort_order
            `, { type: db.Sequelize.QueryTypes.SELECT }),
            
            // Subject-wise average performance
            db.Jee_Marks.findOne({
                attributes: [
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Phy_Tot')), 'avgPhysics'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('che_Tot')), 'avgChemistry'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Mat_Tot')), 'avgMaths'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Phy_C')), 'phyCorrect'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Che_C')), 'cheCorrect'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Mat_C')), 'matCorrect'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Phy_Percentile')), 'avgPhyPercentile'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Che_Percentile')), 'avgChePercentile'],
                    [db.Sequelize.fn('AVG', db.Sequelize.col('Mat_Percentile')), 'avgMatPercentile']
                ],
                where: whereCondition,
                raw: true
            }),
            
            // Test-wise distribution
            db.sequelize.query(`
                SELECT 
                    "Test_Code",
                    COUNT(id) as "studentCount",
                    AVG("TOTAL") as "avgScore",
                    MAX("TOTAL") as "maxScore",
                    MIN("TOTAL") as "minScore",
                    AVG("CORRECT") as "avgCorrect",
                    AVG("Phy_Tot") as "avgPhysics",
                    AVG("che_Tot") as "avgChemistry",
                    AVG("Mat_Tot") as "avgMaths",
                    AVG("Total_Percentile") as "avgPercentile",
                    MAX("Total_Percentile") as "maxPercentile",
                    MIN("Total_Percentile") as "minPercentile",
                    AVG("Phy_Percentile") as "avgPhyPercentile",
                    AVG("Che_Percentile") as "avgChePercentile",
                    AVG("Mat_Percentile") as "avgMatPercentile"
                FROM jee_marks
                ${districtCode && districtCode !== '00' ? `WHERE "BATCHNAME" = '${districtCode}'` : ''}
                GROUP BY "Test_Code"
                ORDER BY COUNT(id) DESC
            `, { type: db.Sequelize.QueryTypes.SELECT })
        ]);

        // Get district names from District_Master
        const districts = await db.District_Master.findAll({
            attributes: ['DCODE', 'DNAME'],
            raw: true
        });

        const districtMap = {};
        districts.forEach(d => {
            districtMap[d.DCODE] = d.DNAME;
        });

        // Format district statistics with names
        const formattedDistrictStats = districtStats.map(item => ({
            districtCode: item.BATCHNAME,
            districtName: districtMap[item.BATCHNAME] || `District ${item.BATCHNAME}`,
            count: parseInt(item.studentCount),
            avgScore: parseFloat(item.avgScore).toFixed(2),
            maxScore: parseFloat(item.maxScore).toFixed(2)
        }));

        // Calculate percentages for score ranges
        const totalForRanges = scoreRanges.reduce((sum, item) => sum + parseInt(item.count), 0);
        const formattedScoreRanges = scoreRanges.map(item => ({
            range: item.score_range,
            count: parseInt(item.count),
            percentage: totalForRanges > 0 ? ((parseInt(item.count) / totalForRanges) * 100).toFixed(1) : 0
        }));

        // Format subject performance
        const subjectData = [
            { 
                subject: 'Physics', 
                avgScore: parseFloat(subjectPerformance.avgPhysics || 0).toFixed(2),
                avgCorrect: parseFloat(subjectPerformance.phyCorrect || 0).toFixed(1),
                avgPercentile: parseFloat(subjectPerformance.avgPhyPercentile || 0).toFixed(2)
            },
            { 
                subject: 'Chemistry', 
                avgScore: parseFloat(subjectPerformance.avgChemistry || 0).toFixed(2),
                avgCorrect: parseFloat(subjectPerformance.cheCorrect || 0).toFixed(1),
                avgPercentile: parseFloat(subjectPerformance.avgChePercentile || 0).toFixed(2)
            },
            { 
                subject: 'Mathematics', 
                avgScore: parseFloat(subjectPerformance.avgMaths || 0).toFixed(2),
                avgCorrect: parseFloat(subjectPerformance.matCorrect || 0).toFixed(1),
                avgPercentile: parseFloat(subjectPerformance.avgMatPercentile || 0).toFixed(2)
            }
        ];

        // Map test codes to test names
        const testMap = {};
        tests.forEach(t => {
            testMap[t.testcode] = t.Test_Name;
        });

        const formattedTestDistribution = testDistribution.map(item => ({
            testCode: item.Test_Code,
            testName: testMap[item.Test_Code] || item.Test_Code,
            studentCount: parseInt(item.studentCount),
            avgScore: parseFloat(item.avgScore || 0).toFixed(2),
            maxScore: parseFloat(item.maxScore || 0).toFixed(2),
            minScore: parseFloat(item.minScore || 0).toFixed(2),
            avgCorrect: parseFloat(item.avgCorrect || 0).toFixed(1),
            avgPhysics: parseFloat(item.avgPhysics || 0).toFixed(2),
            avgChemistry: parseFloat(item.avgChemistry || 0).toFixed(2),
            avgMaths: parseFloat(item.avgMaths || 0).toFixed(2),
            avgPercentile: parseFloat(item.avgPercentile || 0).toFixed(2),
            maxPercentile: parseFloat(item.maxPercentile || 0).toFixed(2),
            minPercentile: parseFloat(item.minPercentile || 0).toFixed(2),
            avgPhyPercentile: parseFloat(item.avgPhyPercentile || 0).toFixed(2),
            avgChePercentile: parseFloat(item.avgChePercentile || 0).toFixed(2),
            avgMatPercentile: parseFloat(item.avgMatPercentile || 0).toFixed(2)
        }));

        // Calculate response accuracy percentages
        const totalQuestions = parseFloat(totalStats.avgCorrect || 0) + 
                              parseFloat(totalStats.avgWrong || 0) + 
                              parseFloat(totalStats.avgBlank || 0);
        
        const accuracyData = {
            correct: totalQuestions > 0 ? ((parseFloat(totalStats.avgCorrect || 0) / totalQuestions) * 100).toFixed(1) : 0,
            wrong: totalQuestions > 0 ? ((parseFloat(totalStats.avgWrong || 0) / totalQuestions) * 100).toFixed(1) : 0,
            blank: totalQuestions > 0 ? ((parseFloat(totalStats.avgBlank || 0) / totalQuestions) * 100).toFixed(1) : 0
        };

        // Format data for response
        res.json({
            status: 'success',
            data: {
                // Overview metrics
                totalStudents: parseInt(totalStats.totalStudents) || 0,
                avgScore: parseFloat(totalStats.avgTotal || 0).toFixed(2),
                maxScore: parseFloat(totalStats.maxTotal || 0).toFixed(2),
                minScore: parseFloat(totalStats.minTotal || 0).toFixed(2),
                avgCorrect: parseFloat(totalStats.avgCorrect || 0).toFixed(1),
                avgWrong: parseFloat(totalStats.avgWrong || 0).toFixed(1),
                avgBlank: parseFloat(totalStats.avgBlank || 0).toFixed(1),
                
                // Accuracy percentages
                accuracyData,
                
                // District-wise data
                districtWiseStats: formattedDistrictStats,
                
                // Score range distribution
                scoreRangeDistribution: formattedScoreRanges,
                
                // Subject performance
                subjectPerformance: subjectData,
                
                // Test distribution
                testDistribution: formattedTestDistribution,
                
                // Total tests
                totalTests: tests.length,
                
                // Total districts with data
                totalDistricts: districtStats.length
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch dashboard statistics"
        });
    }
});

const getStudentProcessingReport = asyncHandler(async (req, res) => {
    const { districtCode, candidateStatus, schoolType } = req.query;

    // Build where condition - filter by selFlg = 'Y' (eligible candidates)
    // For State view: only selFlg = 'Y'
    // For District view: selFlg = 'Y' AND distFlg = 'Y' (sent to district)
    const whereCondition = { selFlg: 'Y' };

    console.log("Received filters - District Code:", districtCode, "Candidate Status:", candidateStatus, "School Type:", schoolType);
    
    // Special handling for candidateStatus = 5 (Pending/Not Processed)
    if(candidateStatus == '5') {
        whereCondition.candidate_status = 0; // Candidates not yet processed
    }

    console.log("Constructed where condition:", whereCondition);

    // Add district filter if provided and not '00' or 'all'
    if (districtCode && districtCode !== '00' && districtCode !== 'all') {
        whereCondition.Cen_Code = districtCode;
        whereCondition.distFlg = 'Y'; // Only add distFlg for specific district view
    }

    // Add candidate status filter if provided (skip for '5' as it's handled above)
    if (candidateStatus !== undefined && candidateStatus !== 'all' && candidateStatus !== '5') {
        whereCondition.candidate_status = parseInt(candidateStatus);
    }

    // Add school type filter if provided
    if (schoolType && schoolType !== 'all') {
        whereCondition.Student_Status = parseInt(schoolType);
    }

    try {
        // Get individual student records
        const studentRecords = await db.Master_11.findAll({
            attributes: [
                'Emis_No',
                'udise_code',
                'school_name',
                'district_name',
                'Cen_Code',
                'name',
                'father_name',
                'Student_Status',
                'candidate_status',
                'com',
                'sex',
                'pstm',
                'dob',
                'ph',
                'Disability_Name',
                'Zone_Name_Jee',
                'Zone_Name_Neet',
                'candidate_preferences',
                'PHONE_NUMBER',
                'HOUSE_ADDRESS'
            ],
            where: whereCondition,
            order: [
                ['Cen_Code', 'ASC'],
                ['Emis_No', 'ASC']
            ]
        });

        // Format dates in the response
        const formattedRecords = studentRecords.map(record => {
            const data = record.toJSON();
            if (data.dob) {
                data.dob = formatDateOnly(data.dob);
            }
            return data;
        });

        // Get summary statistics
        const totalRecords = formattedRecords.length;
        const presentCount = formattedRecords.filter(r => r.candidate_status === 1).length;
        const absentCount = formattedRecords.filter(r => r.candidate_status === 4).length;
        const notProcessedCount = formattedRecords.filter(r => r.candidate_status === 0).length;
        const status2Count = formattedRecords.filter(r => r.candidate_status === 2).length;
        const status3Count = formattedRecords.filter(r => r.candidate_status === 3).length;
        

        
        // Get unique districts for dropdown
        const uniqueDistricts = await db.Master_11.findAll({
            attributes: [
                [db.Sequelize.fn('DISTINCT', db.Sequelize.col('Cen_Code')), 'Cen_Code'],
                'district_name'
            ],
            where: { selFlg: 'Y' },
            order: [['Cen_Code', 'ASC']],
            raw: true
        });

        res.json({
            status: 'success',
            data: formattedRecords,
            summary: {
                totalRecords,
                presentCount,
                absentCount,
                notProcessedCount,
                status2Count,
                status3Count
            },
            districts: uniqueDistricts.map(d => ({
                code: d.Cen_Code,
                name: d.district_name || `District ${d.Cen_Code}`
            })),
            filters: {
                districtCode: districtCode || 'all',
                candidateStatus: candidateStatus || 'all',
                schoolType: schoolType || 'all'
            }
        });
    } catch (error) {
        console.error("Error fetching student processing report:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch student processing report"
        });
    }
});

const updateCertificateVerifiedStatus = asyncHandler(async (req, res) => {
    const { Emis_No, udise_code } = req.body;

    console.log("Updating certificate verification status for:", { Emis_No, udise_code });

    // Validate required fields
    if (!Emis_No || !udise_code) {
        return res.status(400).json({
            status: "fail",
            message: "EMIS No and UDISE Code are required"
        });
    }

    try {
        // Update statFlg to 'Y' (certificate verified/printed)
        const [updatedRows] = await db.Master_11.update(
            { statFlg: 'Y' },
            {
                where: {
                    Emis_No: Emis_No,
                    udise_code: udise_code
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Record not found"
            });
        }

        res.json({
            status: "success",
            message: "Certificate verification status updated successfully",
            updatedRows
        });
    } catch (error) {
        console.error("❌ Error updating certificate verification status:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to update certificate verification status"
        });
    }
});

module.exports = {
    getDistrictMasterData,
    districtSendData,
    getDistrictSelectedData,
    updateDistrictData,
    getDashboardStatistics,
    getStudentProcessingReport,
    updateCertificateVerifiedStatus
}

