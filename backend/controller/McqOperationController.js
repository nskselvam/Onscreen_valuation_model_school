const express = require("express");
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const db = require("../db/models");
const McqData = db.sub_master;
const McqMaster = db.mcq_Answers_Master;
const McqMarkMaster = db.mcq_answerkey_data
const submaster = db.sub_master;
const faculties = db.faculties;
const {
  formatToIST,
  getCurrentISTDateTime,
  getClientIP,
} = require("../utils/formatDateTime");


const McqMasterDataUpdate = asyncHandler(async (req, res) => {
    const { mcqAssign, NoOfQbs, Eva_Id, subcode, SubName, Dep_Name, Eva_Month, Camp_id, camp_offcer_id_examiner } = req.body;
    
    if (mcqAssign === undefined || subcode === undefined) {
        return res.status(400).json({ error: "Missing required fields: mcqAssign, subcode" });
    }

    let result;

    if (mcqAssign === 'Y') {
        result = await McqData.update(
            { mcq_flg: mcqAssign, mcq_qst: NoOfQbs, Eva_Id },
            { where: { Subcode: subcode } }
        );

    }
    
    if (mcqAssign === 'N') {
        result = await McqData.update(
            { mcq_flg: mcqAssign, Eva_Id: null, mcq_updates: 'N' },
            { where: { Subcode: subcode } }

        );

        await McqMaster.destroy({
            where: { Subcode: subcode }
        });
    }

    res.status(200).json({ 
        success: true,
        message: `MCQ assignment ${mcqAssign === 'Y' ? 'completed' : 'removed'} successfully`,
        data: result 
    });
});

const getMcqDataBySubcode = asyncHandler(async (req, res) => {
    const data = await McqMarkMaster.findAll({})
    res.status(200).json({ success: true, data })
});


const McqDataUpdate = asyncHandler(async (req, res) => {
    const { answers } = req.body; // Extract answers array from request body

    if(!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Invalid input: 'answers' must be an array" });
    }

    // Get current timestamp once for all records
    const currentDate = getCurrentISTDateTime();

    try {
        // Use Promise.all to wait for all database operations
        const results = await Promise.all(
            answers.map(async (answer, index) => {
                const { Qst_Number, Qst_Ans, Qst_Remarks, Eva_Id, Subcode, SubName, Dep_Name, Eva_Month } = answer;
                
                if(!Qst_Number || !Qst_Ans || !Eva_Id || !Subcode || !SubName || !Dep_Name || !Eva_Month) {
                    throw new Error(`Invalid answer at index ${index}: ${JSON.stringify(answer)}`);
                }

                // Check if record already exists
                const existingRecord = await McqMaster.findOne({
                    where: {
                        Subcode: Subcode,
                        Qst_Number: Qst_Number,
                        Eva_Id: Eva_Id,
                        Eva_Month: Eva_Month
                    }
                });

                if (existingRecord) {
                    return { skipped: true, index };
                }

                const result = await McqMaster.create({
                    Qst_Number: Qst_Number,
                    Qst_Ans: Qst_Ans,
                    Qst_Remarks: Qst_Remarks || '',
                    Eva_Id: Eva_Id,
                    Subcode: Subcode,
                    SubName: SubName,
                    Dep_Name: Dep_Name,
                    Eva_Month: Eva_Month,
                    Upload_Date: currentDate,
                    Updated_Flg: 'Y'
                });

                return { created: true, result };
            })
        );
        
        const created = results.filter(r => r.created).length;
        const skipped = results.filter(r => r.skipped).length;
        res.status(200).json({ 
            success: true, 
            message: `MCQ answers processed: ${created} created, ${skipped} skipped (already exists)`, 
            created: created,
            skipped: skipped,
            total: answers.length
        });

    } catch (err) {
        console.error('Error saving MCQ answers:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Failed to save MCQ answers' 
        });
    }
});


const getMcqDataBySubcodeFromTheBack = asyncHandler(async (req, res) => {
    const {Eva_Id, subcode} = req.query;
    
    if(!Eva_Id) {
        return res.status(400).json({ error: "Missing required query parameter: Eva_Id" });
    }

    try {
        const whereClause = { Eva_Id };
        if (subcode) {
            whereClause.Subcode = subcode;
        }

        const data = await McqMaster.findAll({
            where: whereClause
        });

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('Error fetching MCQ data by subcode:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Failed to fetch MCQ data by subcode' 
        });
    }

})


const updateMcqDataFinal = asyncHandler(async (req, res) => {
    const { Eva_Id, Subcode } = req.body;

    if (!Eva_Id || !Subcode) {
        return res.status(400).json({ error: "Missing required fields: Eva_Id, Subcode" });
    }
    
    try {
        const result = await submaster.update(
            { mcq_updates: 'Y' },
            { where: { Eva_Id, Subcode } }
        );

        res.status(200).json({ 
            success: true, 
            message: `MCQ data for Eva_Id: ${Eva_Id}, Subcode: ${Subcode} marked as final successfully`, 
            data: result 
        });
    } catch (err) {
        console.error('Error updating MCQ data final status:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Failed to update MCQ data final status' 
        });
    }
});

const reverteMcqDataFinal = asyncHandler(async (req, res) => {
    const { Eva_Id, Subcode } = req.body;

    if (!Eva_Id || !Subcode) {
        return res.status(400).json({ error: "Missing required fields: Eva_Id, Subcode" });
    }

    try {
    await submaster.update(
            { mcq_updates: 'N' },
            { where: { Eva_Id, Subcode } }
        );


        await McqMaster.destroy({
            where: { Eva_Id, Subcode }
        });

        res.status(200).json({ 
            success: true, 
            message: `MCQ data for Eva_Id: ${Eva_Id}, Subcode: ${Subcode} reverted from final successfully`, 
        });
    } catch (err) {
        console.error('Error reverting MCQ data final status:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Failed to revert MCQ data final status' 
        });
    }
});



const EvaluatorData = asyncHandler(async (req, res) => {
    const data = await faculties.findAll({
        where: {
            [Op.or]: [
                { Role: '2' },
                { Role: { [Op.like]: '2,%' } },
                { Role: { [Op.like]: '%,2,%' } },
                { Role: { [Op.like]: '%,2' } }
            ]
        }
    })
    res.status(200).json({ success: true, data });
});



module.exports = {
    McqMasterDataUpdate,
    getMcqDataBySubcode,
    McqDataUpdate,
    getMcqDataBySubcodeFromTheBack,
    updateMcqDataFinal,
    reverteMcqDataFinal,
    EvaluatorData
};