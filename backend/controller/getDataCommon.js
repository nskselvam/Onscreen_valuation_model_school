const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const { Sequelize, Op, where } = require("sequelize");
const AppError = require("../utils/appError");


const getCommonUserData = asyncHandler(async (req, res) => {
    const { tableId  } = req.query;

    if (!tableId) {
        res.status(400);
        throw new AppError("tableId is required", 400);
    }



    const data = db[tableId];


    if (!data) {
        res.status(404);
        throw new AppError(`Table '${tableId}' not found`, 404);
    }

    let result;
    if (tableId === "sub_master") {
        const {Dep_Name} = req.query
        
        const whereClause = {};
        if (Dep_Name) {
            whereClause.Dep_Name = Dep_Name;
        }
        
        result = await data.findAll({
            where: whereClause,
            order: [['mismatch_flg', 'ASC'],
            ['Subcode', 'ASC'],
            ['testcode', 'ASC']
            ]
        });
    } else {
        result = await data.findAll();
    }
    
    // Return empty array if no data found instead of throwing error
    if (!result || result.length === 0) {
        return res.status(200).json({ data: [] });
    }
    
    res.status(200).json({ data: result });

})

const getValidQbsBySubcode = asyncHandler(async (req, res) => {
    const { subcode, testcode } = req.body;

    if (!subcode || !testcode) {
        res.status(400);
        throw new AppError("subcode and testcode are required", 400);
    }

    const model = db.valid_question;
    if (!model) {
        res.status(500);
        throw new AppError("valid_question model not found", 500);
    }

    const result = await model.findAll({ where: { SUBCODE: subcode, testcode } });
    if (!result || result.length === 0) {
        return res.status(200).json({ data: [] });
    }

    res.status(200).json({ data: result });
})

const getValidSectionsBySubcode = asyncHandler(async (req, res) => {
    const { subcode, testcode } = req.body;

    if (!subcode || !testcode) {
        res.status(400);
        throw new AppError("subcode and testcode are required", 400);
    }

    const model = db.valid_sections;
    if (!model) {
        res.status(500);
        throw new AppError("valid_sections model not found", 500);
    }

    const result = await model.findAll({ where: { sub_code: subcode, testcode } });
    if (!result || result.length === 0) {
        return res.status(200).json({ data: [] });
    }

    res.status(200).json({ data: result });
})

// Add a new subject to sub_master
const addSubject = asyncHandler(async (req, res) => {
    const {
        Subcode,
        SUBNAME,
        Dep_Name,
        Eva_Mon_Year,
        Rate_Per_Script,
        Min_Amount,
        MARKS_FOR,
        Valcnt,
        Mark_Diff,
        diff_flg,
        Degree_Status,
        Type_of_Exam,
        qb_flg,
        ans_flg,
        mismatch_flg,
        mismatch_remarks
    } = req.body;

    // Validate required fields
    if (!Subcode || !SUBNAME || !Dep_Name || !Eva_Mon_Year || !Valcnt || !Type_of_Exam) {
        res.status(400);
        throw new AppError("Required fields: Subcode, SUBNAME, Dep_Name, Eva_Mon_Year, Valcnt, Type_of_Exam", 400);
    }

    const model = db.sub_master;
    if (!model) {
        res.status(500);
        throw new AppError("sub_master model not found", 500);
    }

    // Check if subject code already exists
    const existingSubject = await model.findOne({ where: { Subcode } });
    if (existingSubject) {
        res.status(409);
        throw new AppError(`Subject with code '${Subcode}' already exists`, 409);
    }

    // Create new subject
    const newSubject = await model.create({
        Subcode,
        SUBNAME,
        Dep_Name,
        Eva_Mon_Year,
        Rate_Per_Script: Rate_Per_Script || null,
        Min_Amount: Min_Amount || null,
        MARKS_FOR: MARKS_FOR || null,
        cnt: 0,
        Valcnt,
        Mark_Diff: Mark_Diff || null,
        diff_flg: diff_flg || null,
        Degree_Status: Degree_Status || null,
        qb_flg: qb_flg || 'N',
        ans_flg: ans_flg || 'N',
        mismatch_flg: mismatch_flg || 'N',
        Type_of_Exam,
        mismatch_remarks: mismatch_remarks || []
    });

    res.status(201).json({
        success: true,
        message: "Subject created successfully",
        data: newSubject
    });
});

// Update an existing subject
const updateSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
        res.status(400);
        throw new AppError("Subject ID is required", 400);
    }

    const model = db.sub_master;
    if (!model) {
        res.status(500);
        throw new AppError("sub_master model not found", 500);
    }

    // Find the subject
    const subject = await model.findByPk(id);
    if (!subject) {
        res.status(404);
        throw new AppError(`Subject with ID '${id}' not found`, 404);
    }

    // If Subcode is being changed, check if new code already exists
    if (updateData.Subcode && updateData.Subcode !== subject.Subcode) {
        const existingSubject = await model.findOne({
            where: {
                Subcode: updateData.Subcode,
                id: { [Op.ne]: id }
            }
        });
        if (existingSubject) {
            res.status(409);
            throw new AppError(`Subject with code '${updateData.Subcode}' already exists`, 409);
        }
    }

    // Update the subject
    await subject.update(updateData);

    res.status(200).json({
        success: true,
        message: "Subject updated successfully",
        data: subject
    });
});

// Delete a subject
const deleteSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        res.status(400);
        throw new AppError("Subject ID is required", 400);
    }

    const model = db.sub_master;
    if (!model) {
        res.status(500);
        throw new AppError("sub_master model not found", 500);
    }

    // Find the subject
    const subject = await model.findByPk(id);
    if (!subject) {
        res.status(404);
        throw new AppError(`Subject with ID '${id}' not found`, 404);
    }

    // Delete the subject
    await subject.destroy();

    res.status(200).json({
        success: true,
        message: "Subject deleted successfully",
        data: { id }
    });
});

// Add a new valid question
const addValidQuestion = asyncHandler(async (req, res) => {
    const {
        SUBCODE,
        testcode,
        Dep_Name,
        SUBCODE_RAW,
        SECTION,
        FROM_QST,
        TO_QST,
        MARK_MAX,
        NOQST,
        SUB_SEC,
        Eva_Mon_Year,
        C_QST
    } = req.body;

    // Validate required fields
    if (!SUBCODE || !testcode || !Dep_Name || !SECTION || FROM_QST === undefined || TO_QST === undefined || !Eva_Mon_Year) {
        res.status(400);
        throw new AppError("Required fields: SUBCODE, testcode, Dep_Name, SECTION, FROM_QST, TO_QST, Eva_Mon_Year", 400);
    }

    const model = db.valid_question;
    if (!model) {
        res.status(500);
        throw new AppError("valid_question model not found", 500);
    }

    // Create new valid question
    const newQuestion = await model.create({
        SUBCODE,
        testcode,
        Dep_Name,
        SUBCODE_RAW: SUBCODE_RAW || '',
        SECTION : SECTION || '',
        FROM_QST: FROM_QST || '',
        TO_QST: TO_QST || '',
        MARK_MAX: MARK_MAX || '',
        NOQST: NOQST || '',
        SUB_SEC: SUB_SEC || '',
        Eva_Mon_Year: Eva_Mon_Year || '',
        C_QST: C_QST || ''
    });

    res.status(201).json({
        success: true,
        message: "Valid question created successfully",
        data: newQuestion
    });
});

// Update an existing valid question
const updateValidQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
        res.status(400);
        throw new AppError("Question ID is required", 400);
    }

    const model = db.valid_question;
    if (!model) {
        res.status(500);
        throw new AppError("valid_question model not found", 500);
    }

    // Find the question
    const question = await model.findByPk(id);
    if (!question) {
        res.status(404);
        throw new AppError(`Valid question with ID '${id}' not found`, 404);
    }

    // Update the question
    await question.update(updateData);

    res.status(200).json({
        success: true,
        message: "Valid question updated successfully",
        data: question
    });
});

// Delete a valid question
const deleteValidQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        res.status(400);
        throw new AppError("Question ID is required", 400);
    }

    const model = db.valid_question;
    if (!model) {
        res.status(500);
        throw new AppError("valid_question model not found", 500);
    }

    // Find the question
    const question = await model.findByPk(id);
    if (!question) {
        res.status(404);
        throw new AppError(`Valid question with ID '${id}' not found`, 404);
    }

    // Delete the question
    await question.destroy();

    res.status(200).json({
        success: true,
        message: "Valid question deleted successfully",
        data: { id }
    });
});

// Add a new valid section
const addValidSection = asyncHandler(async (req, res) => {
    const {
        sub_code,
        testcode,
        Dep_Name,
        subcode_raw,
        qstn_num,
        max_mark,
        valid_qstn,
        section,
        sub_section,
        add_sub_section,
        Eva_Mon_Year,
        BL_Point,
        CO_Point,
        PO_Point
    } = req.body;


    // Validate required fields
    if (!sub_code || !testcode || !Dep_Name) {
        res.status(400);
        throw new AppError("Required fields: sub_code, testcode, Dep_Name", 400);
    }

    const model = db.valid_sections;
    if (!model) {
        res.status(500);
        throw new AppError("valid_sections model not found", 500);
    }

    // Create new valid section
    const newSection = await model.create({
        sub_code,
        testcode,
        Dep_Name,
        subcode_raw: subcode_raw || '',
        qstn_num: qstn_num || '',
        max_mark: max_mark || '',
        valid_qstn: valid_qstn || '',
        section: section || '',
        sub_section: sub_section || '',
        add_sub_section: add_sub_section || '',
        Eva_Mon_Year: Eva_Mon_Year || '',
        BL_Point: BL_Point || '',
        CO_Point: CO_Point || '',
        PO_Point: PO_Point || ''
    });

    res.status(201).json({
        success: true,
        message: "Valid section created successfully",
        data: newSection
    });
});

// Update an existing valid section
const updateValidSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
        res.status(400);
        throw new AppError("Section ID is required", 400);
    }

    const model = db.valid_sections;
    if (!model) {
        res.status(500);
        throw new AppError("valid_sections model not found", 500);
    }

    // Find the section
    const section = await model.findByPk(id);
    if (!section) {
        res.status(404);
        throw new AppError(`Valid section with ID '${id}' not found`, 404);
    }

    // Update the section
    await section.update(updateData);

    res.status(200).json({
        success: true,
        message: "Valid section updated successfully",
        data: section
    });
});

// Delete a valid section
const deleteValidSection = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        res.status(400);
        throw new AppError("Section ID is required", 400);
    }

    const model = db.valid_sections;
    if (!model) {
        res.status(500);
        throw new AppError("valid_sections model not found", 500);
    }

    // Find the section
    const section = await model.findByPk(id);
    if (!section) {
        res.status(404);
        throw new AppError(`Valid section with ID '${id}' not found`, 404);
    }

    // Delete the section
    await section.destroy();

    res.status(200).json({
        success: true,
        message: "Valid section deleted successfully",
        data: { id }
    });
});

module.exports = {
    getCommonUserData,
    getValidQbsBySubcode,
    getValidSectionsBySubcode,
    addSubject,
    updateSubject,
    deleteSubject,
    addValidQuestion,
    updateValidQuestion,
    deleteValidQuestion,
    addValidSection,
    updateValidSection,
    deleteValidSection
}
