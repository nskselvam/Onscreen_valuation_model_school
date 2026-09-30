const express = require("express");
const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const db = require("../db/models");
const { Op, or } = require('sequelize');
const { getCurrentISTDateTimeForPDF } = require("../utils/formatDateTime");



const pdfValuationGenearate = asyncHandler(async (req, res) => {

    const { papers, evaluatorId, evaluatorName, checkDate, Institution_Details } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400);
        throw new Error("Request body is empty");
    }

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
        res.status(400);
        throw new Error("No papers data provided");
    }

    // Create a new PDF document - portrait orientation
    const doc = new PDFDocument({
        margin: 20,
        size: 'A4',
        layout: 'portrait'
    });

    // const DateTime= getCurrentISTDateTime()
    // Set response headers
    const firstPaper = papers[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=valuation_${firstPaper.subjectCode}_${Date.now()}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);


    // Helper function to draw page footer (saves and restores Y position)
    const drawPageFooter = () => {
        const savedY = doc.y;
        const footerY = doc.page.height - 10; // Bottom of page with minimal margin
        doc.fontSize(8).font('Helvetica').fillColor('#000000');
        doc.text(`Date: ${getCurrentISTDateTimeForPDF()}`, 20, footerY, { lineBreak: false });
        doc.text('Examiner Signature: ____________________', 350, footerY, { lineBreak: false });
        doc.y = savedY; // Restore Y position
    };

    // Helper function to draw page header
    const drawPageHeader = (pageNum) => {
        doc.y = 20;
        // Page number at top right
        doc.fontSize(8).font('Helvetica').fillColor('#000000');
        doc.text(`Page ${pageNum}`, 20, 20, { align: 'right', width: 555, lineBreak: false });
        doc.y = 35;
        doc.fontSize(10).font('Helvetica-Bold').text(Institution_Details, { align: 'center' });
        doc.fontSize(8).font('Helvetica').text('Valuation Report', { align: 'center' });
        doc.fontSize(7).font('Helvetica').text(`Examiner: ${evaluatorName || 'N/A'} (${evaluatorId || 'N/A'}) | Date: ${checkDate || 'N/A'}`, { align: 'center' });
        doc.moveDown(0.3);
    };

    // Constants for grid layout
    const columns = 16;
    const colWidth = 35;
    const headerHeight = 12;
    const marksHeight = 14;
    const rowGap = 3;
    const dummyHeaderHeight = 10;
    const separatorHeight = 2;
    const paperSpacing = 5;
    const footerMargin = 25; // Minimal margin for footer

    // Helper function to calculate paper height based on questions
    const calculatePaperHeight = (paper) => {
        const questions = paper.questions || [];
        const rowsNeeded = Math.ceil(questions.length / columns);
        const gridHeight = rowsNeeded * (headerHeight + marksHeight + rowGap);
        return dummyHeaderHeight + gridHeight + separatorHeight + paperSpacing;
    };

    let currentPage = 1;

    // Draw initial header
    drawPageHeader(currentPage);
    drawPageFooter();

    // Process each paper
    papers.forEach((paper, paperIndex) => {
        // Calculate actual height needed for this paper
        const paperHeight = calculatePaperHeight(paper);
        const availableSpace = doc.page.height - doc.y - footerMargin;

        // Check if we need a new page based on actual space needed
        if (availableSpace < paperHeight) {
            doc.addPage();
            currentPage++;
            drawPageHeader(currentPage);
            drawPageFooter();
        }

        // Paper Information - Compact header
        // Add spacing before dummy number (except for first paper on page)
        const isFirstOnPage = (doc.y < 100); // Check if we're near top of page
        if (!isFirstOnPage) {
            doc.y += paperSpacing;
        }
        const dummyY = doc.y;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
        doc.text(`Dummy: ${paper.dummyNumber} | ${paper.subjectCode} - ${paper.subjectName.toString().substring(0, 65)
            }`, 20, dummyY, { lineBreak: false });
        doc.text(`Total: ${paper.total} | Round: ${paper.tot_round}`, 430, dummyY, { width: 140, align: 'right', lineBreak: false });
        doc.y = dummyY + dummyHeaderHeight;

        // Questions Grid
        const questions = paper.questions || [];
        const rowsNeeded = Math.ceil(questions.length / columns);

        const startX = 15;
        const finalGridStartY = doc.y;

        // Draw questions row by row
        for (let row = 0; row < rowsNeeded; row++) {
            const rowStartY = finalGridStartY + (row * (headerHeight + marksHeight + rowGap));

            for (let col = 0; col < columns; col++) {
                const qIndex = row * columns + col;
                if (qIndex >= questions.length) break;

                const question = questions[qIndex];
                const xPos = startX + (col * colWidth);
                let yPos = rowStartY;

                // Question number box (top)
                doc.rect(xPos, yPos, colWidth, headerHeight).stroke();
                doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000000');
                doc.text(`Q(${question.questionNumber})`, xPos + 1, yPos + 3, {
                    width: colWidth - 2,
                    align: 'center',
                    lineBreak: false
                });

                // Marks box (bottom)
                yPos += headerHeight;
                doc.rect(xPos, yPos, colWidth, marksHeight).stroke();

                // Different styling for valid vs extra questions
                if (question.valid_qbs === 'Y') {
                    doc.fontSize(7).font('Helvetica-Bold').fillColor('#155724');
                    doc.text(`${question.marks}`, xPos + 1, yPos + 4, {
                        width: colWidth - 2,
                        align: 'center',
                        lineBreak: false
                    });
                } else if (question.valid_qbs === 'N' && question.marks === 'NA') {
                    doc.fontSize(6).font('Helvetica-Bold').fillColor('#e74c3c');
                    doc.text(`${question.marks}`, xPos + 1, yPos + 4, {
                        width: colWidth - 2,
                        align: 'center',
                        lineBreak: false
                    });
                } else {
                    doc.fontSize(6).font('Helvetica-Bold').fillColor('#e74c3c');
                    doc.text(`${question.marks}(EX)`, xPos + 1, yPos + 4, {
                        width: colWidth - 2,
                        align: 'center',
                        lineBreak: false
                    });
                    doc.fillColor('#000000');
                }
            }


        }

        // Calculate total grid height
        const totalGridHeight = rowsNeeded * (headerHeight + marksHeight + rowGap);

        // Move cursor after grid
        doc.y = finalGridStartY + totalGridHeight;

        // Draw separator line
        doc.moveTo(15, doc.y).lineTo(570, doc.y).stroke();
        doc.y += separatorHeight;
    });

    // Finalize the PDF
    doc.end();
});


const pdfValuationGenearateDetails = asyncHandler(async (req, res) => {

    const { course, role, Eva_Id } = req.query;
    console.log('Received parameters:', { course, role, Eva_Id });


    let campResults = [];

    const FacultDetails = await db.faculties.findAll({});

    // return

    for (let val = 1; val <= 4; val++) {
        // Count Import records where Checked='Yes'
        let sql;
        let flname = `import${val}`;

        if (role == 0) {
            sql = `SELECT 
                "Evaluator_Id",
                "Camp_id",
                "camp_offcer_id_examiner",
                "Dep_Name",
                COUNT(*) as "overallCount",
                SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount"
            FROM ${flname} 
            WHERE "Camp_id" IS NOT NULL AND "Evaluator_Id" IS NOT NULL
            GROUP BY "Evaluator_Id", "Camp_id", "camp_offcer_id_examiner", "Dep_Name"`;
        } else if (role == 2) {
            sql = `SELECT 
                "Evaluator_Id",
                "Camp_id",
                "camp_offcer_id_examiner",
                "Dep_Name",
                COUNT(*) as "overallCount",
                SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount"
            FROM ${flname} 
            WHERE  "Camp_id" IS NOT NULL AND "Evaluator_Id" IS NOT NULL AND "Evaluator_Id" = '${Eva_Id}'
            GROUP BY "Evaluator_Id", "Camp_id", "camp_offcer_id_examiner", "Dep_Name"`;
        } else {

            sql = `SELECT 
                "Evaluator_Id",
                "Camp_id",
                "camp_offcer_id_examiner",
                "Dep_Name",
                COUNT(*) as "overallCount",
                SUM(CASE WHEN "Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount"
            FROM ${flname} 
            WHERE "Camp_id" IS NOT NULL AND "Evaluator_Id" IS NOT NULL AND "camp_offcer_id_examiner" = '${Eva_Id}'
            GROUP BY "Evaluator_Id", "Camp_id", "camp_offcer_id_examiner", "Dep_Name"`;

        }

        const countResult = await db.sequelize.query(sql, {
            type: db.sequelize.QueryTypes.SELECT
        });

        if (val === 1) {

            if (role == 0) {
                sql = `SELECT 
                "Chief_Valuation_Evaluator_Id" as "Evaluator_Id",
                "Camp_id",
                "camp_offcer_id_examiner",
                "Dep_Name",
                COUNT(*) as "overallCount",
                SUM(CASE WHEN "Chief_Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount"
            FROM ${flname} 
            WHERE "camp_offcer_id_examiner" IS NOT NULL AND "Chief_Valuation_Evaluator_Id" IS NOT NULL
            GROUP BY "Chief_Valuation_Evaluator_Id", "Camp_id", "camp_offcer_id_examiner", "Dep_Name"`;
            } else if (role == 2 || role == 1) {
                sql = `SELECT 
                "Chief_Valuation_Evaluator_Id" as "Evaluator_Id",
                "Camp_id",
                "camp_offcer_id_examiner",
                "Dep_Name",
                COUNT(*) as "overallCount",
                SUM(CASE WHEN "Chief_Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount"
            FROM ${flname} 
            WHERE "camp_offcer_id_examiner" IS NOT NULL AND "Chief_Valuation_Evaluator_Id" IS NOT NULL AND "Chief_Valuation_Evaluator_Id" = '${Eva_Id}'
            GROUP BY "Chief_Valuation_Evaluator_Id", "Camp_id", "camp_offcer_id_examiner", "Dep_Name"`;
            } else {
                sql = `SELECT 
                "Chief_Valuation_Evaluator_Id" as "Evaluator_Id",
                "Camp_id",
                "camp_offcer_id_examiner",
                "Dep_Name",
                COUNT(*) as "overallCount", 
                SUM(CASE WHEN "Chief_Checked" = 'Yes' THEN 1 ELSE 0 END) as "checkedCount"
            FROM ${flname} 
            WHERE "camp_offcer_id_examiner" IS NOT NULL AND "Chief_Valuation_Evaluator_Id" IS NOT NULL AND "camp_offcer_id_examiner" = '${Eva_Id}'
            GROUP BY "Chief_Valuation_Evaluator_Id", "Camp_id", "camp_offcer_id_examiner", "Dep_Name"`;
            }

            const chiefCountResult = await db.sequelize.query(sql, {
                type: db.sequelize.QueryTypes.SELECT
            });


            chiefCountResult.forEach(result => {
                const overallCount = parseInt(result.overallCount) || 0;
                const checkedCount = parseInt(result.checkedCount) || 0;

                const camp = FacultDetails.find(f => f.Eva_Id === result.Evaluator_Id);

                campResults.push({
                    Eva_Id: result.Evaluator_Id,
                    FACULTY_NAME: camp ? camp.FACULTY_NAME : 'Unknown',
                    Camp_id_Camp: result.Camp_id,
                    Camp_id: result.camp_offcer_id_examiner,
                    overallCount: overallCount,
                    checkedCount: checkedCount,
                    pendingCount: overallCount - checkedCount,
                    Percentage: overallCount > 0 ? ((checkedCount / overallCount) * 100).toFixed(2) : '0.00',
                    valuationType: val,
                    department: result.Dep_Name || 'N/A',
                    Email_d: camp ? camp.Email_Id : '',
                    MobileNumber: camp ? camp.Mobile_Number : '',
                    Examiner_Status: '2' // Chief Examiner status
                });
            });


        }


        if (countResult.length > 0) {
            for (let result of countResult) {
                const overallCount = parseInt(result.overallCount) || 0;
                const checkedCount = parseInt(result.checkedCount) || 0;

                const camp = FacultDetails.find(f => f.Eva_Id === result.Evaluator_Id);

                campResults.push({
                    Eva_Id: result.Evaluator_Id,
                    FACULTY_NAME: camp.FACULTY_NAME,
                    Camp_id_Camp: result.Camp_id,
                    overallCount: overallCount,
                    checkedCount: checkedCount,
                    pendingCount: overallCount - checkedCount,
                    Percentage: overallCount > 0 ? ((checkedCount / overallCount) * 100).toFixed(2) : '0.00',
                    valuationType: val,
                    department: result.Dep_Name || 'N/A',
                    Email_d: camp.Email_Id || '',
                    MobileNumber: camp.Mobile_Number || '',
                    Examiner_Status: '1' // Default status, can be updated based on additional logic
                });
            }
        }
    }

    console.log('Compiled camp results:', campResults);

    res.status(200).json({
        success: true,
        campResults: campResults
    });

});

const pdfMarkGenearateDetails = asyncHandler(async (req, res) => {

    const { course, role, evaId, campId, department, valuationType, Examiner_Status } = req.query;

    let flname = `import${valuationType}`;


console.log('Received parameters for mark details:', { course, role, evaId, campId, department, valuationType, Examiner_Status });

    const whereClause = {
        Dep_Name: department,
        ...(Examiner_Status == '2'
            ? { Chief_Valuation_Evaluator_Id: evaId, Chief_Checked: 'Yes', Camp_id: campId }
            : { Evaluator_Id: evaId, Checked: 'Yes', Camp_id: campId })
    };

    console.log('Constructed where clause:', whereClause);

    const markDetails = await db[flname].findAll({
        where: whereClause,
        attributes: ['barcode', 'subcode', 'Evaluator_Id', 'tot_round', 'Chief_Valuation_Evaluator_Id', 'Chief_tot_round'],
        order: [['subcode', 'ASC'], ['barcode', 'ASC']]
    });

    // Get unique subcodes
    const uniqueSubcodes = [...new Set(markDetails.map(item => item.subcode))];

    const Sub_Master = await db.sub_master.findAll({ where: { Subcode: { [Op.in]: uniqueSubcodes } }, attributes: ['Subcode', 'SUBNAME'] });


    res.status(200).json({
        success: true,
        message: 'Mark details overall fetched successfully',
        markDetails: markDetails,
        uniqueSubcodes: Sub_Master
    });
});

const pdfMarkGenearateCampDetails = asyncHandler(async (req, res) => {

    const { course, role, evaId, campId, department, valuationType } = req.query;


    for (const i = 1; i <= 2; i++) {


        let flname = `import${valuationType}`;

        const MarkDetailsCamp = await db[flname].findAll({

            where: {
                Dep_Name: department,
                ...(i == 2
                    ? { Checked: 'Yes', Camp_id: campId }
                    : { Chief_Checked: 'Yes', Camp_id: campId })
            }

        });

        const uniqueSubcodes = [...new Set(MarkDetailsCamp.map(item => item.subcode))];

        const Sub_Master = await db.sub_master.findAll({ where: { Subcode: { [Op.in]: uniqueSubcodes } }, attributes: ['Subcode', 'SUBNAME'] });
        //     console.log("=== PDF Generation Request ===");
        // console.log("Request Body:", JSON.stringify(req.body, null, 2));

        //const { papers, evaluatorId, evaluatorName, checkDate } = req.body;
        for (const subcodeitem of Sub_Master) {
            const filteredMarks = MarkDetailsCamp.filter(item => item.subcode === subcodeitem.Subcode);



            for (const mark of filteredMarks) {
                const doc = new PDFDocument({
                    margin: 20,
                    size: 'A4',
                    layout: 'portrait'
                });

                // const DateTime= getCurrentISTDateTime()
                // Set response headers
                const firstPaper = papers[0];
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=valuation_${firstPaper.subjectCode}_${Date.now()}.pdf`);

                // Pipe the PDF to the response
                doc.pipe(res);


                // if (!req.body || Object.keys(req.body).length === 0) {
                //     res.status(400);
                //     throw new Error("Request body is empty");
                // }

                // if (!papers || !Array.isArray(papers) || papers.length === 0) {
                //     res.status(400);
                //     throw new Error("No papers data provided");
                // }

                // Create a new PDF document - portrait orientation


                // Helper function to draw page footer (saves and restores Y position)
                const drawPageFooter = () => {
                    const savedY = doc.y;
                    const footerY = doc.page.height - 10; // Bottom of page with minimal margin
                    doc.fontSize(8).font('Helvetica').fillColor('#000000');
                    doc.text(`Date: ${getCurrentISTDateTimeForPDF()}`, 20, footerY, { lineBreak: false });
                    doc.text('Examiner Signature: ____________________', 350, footerY, { lineBreak: false });
                    doc.y = savedY; // Restore Y position
                };

                // Helper function to draw page header
                const drawPageHeader = (pageNum) => {
                    doc.y = 20;
                    // Page number at top right
                    doc.fontSize(8).font('Helvetica').fillColor('#000000');
                    doc.text(`Page ${pageNum}`, 20, 20, { align: 'right', width: 555, lineBreak: false });
                    doc.y = 35;
                    doc.fontSize(10).font('Helvetica-Bold').text('SRM Technology University', { align: 'center' });
                    doc.fontSize(8).font('Helvetica').text('Valuation Report', { align: 'center' });
                    doc.fontSize(7).font('Helvetica').text(`Examiner: ${evaluatorName || 'N/A'} (${evaluatorId || 'N/A'}) | Date: ${checkDate || 'N/A'}`, { align: 'center' });
                    doc.moveDown(0.3);
                };

                // Constants for grid layout
                const columns = 16;
                const colWidth = 35;
                const headerHeight = 12;
                const marksHeight = 14;
                const rowGap = 3;
                const dummyHeaderHeight = 10;
                const separatorHeight = 2;
                const paperSpacing = 5;
                const footerMargin = 25; // Minimal margin for footer

                // Helper function to calculate paper height based on questions
                const calculatePaperHeight = (paper) => {
                    const questions = paper.questions || [];
                    const rowsNeeded = Math.ceil(questions.length / columns);
                    const gridHeight = rowsNeeded * (headerHeight + marksHeight + rowGap);
                    return dummyHeaderHeight + gridHeight + separatorHeight + paperSpacing;
                };

                let currentPage = 1;

                // Draw initial header
                drawPageHeader(currentPage);
                drawPageFooter();

                // Process each paper
                papers.forEach((paper, paperIndex) => {
                    // Calculate actual height needed for this paper
                    const paperHeight = calculatePaperHeight(paper);
                    const availableSpace = doc.page.height - doc.y - footerMargin;

                    // Check if we need a new page based on actual space needed
                    if (availableSpace < paperHeight) {
                        doc.addPage();
                        currentPage++;
                        drawPageHeader(currentPage);
                        drawPageFooter();
                    }

                    // Paper Information - Compact header
                    // Add spacing before dummy number (except for first paper on page)
                    const isFirstOnPage = (doc.y < 100); // Check if we're near top of page
                    if (!isFirstOnPage) {
                        doc.y += paperSpacing;
                    }
                    const dummyY = doc.y;
                    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
                    doc.text(`Dummy: ${paper.dummyNumber} | ${paper.subjectCode} - ${paper.subjectName.toString().substring(0, 65)
                        }`, 20, dummyY, { lineBreak: false });
                    doc.text(`Total: ${paper.total} | Round: ${paper.tot_round}`, 430, dummyY, { width: 140, align: 'right', lineBreak: false });
                    doc.y = dummyY + dummyHeaderHeight;

                    // Questions Grid
                    const questions = paper.questions || [];
                    const rowsNeeded = Math.ceil(questions.length / columns);

                    const startX = 15;
                    const finalGridStartY = doc.y;

                    // Draw questions row by row
                    for (let row = 0; row < rowsNeeded; row++) {
                        const rowStartY = finalGridStartY + (row * (headerHeight + marksHeight + rowGap));

                        for (let col = 0; col < columns; col++) {
                            const qIndex = row * columns + col;
                            if (qIndex >= questions.length) break;

                            const question = questions[qIndex];
                            const xPos = startX + (col * colWidth);
                            let yPos = rowStartY;

                            // Question number box (top)
                            doc.rect(xPos, yPos, colWidth, headerHeight).stroke();
                            doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000000');
                            doc.text(`Q(${question.questionNumber})`, xPos + 1, yPos + 3, {
                                width: colWidth - 2,
                                align: 'center',
                                lineBreak: false
                            });

                            // Marks box (bottom)
                            yPos += headerHeight;
                            doc.rect(xPos, yPos, colWidth, marksHeight).stroke();

                            // Different styling for valid vs extra questions
                            if (question.valid_qbs === 'Y') {
                                doc.fontSize(7).font('Helvetica-Bold').fillColor('#155724');
                                doc.text(`${question.marks}`, xPos + 1, yPos + 4, {
                                    width: colWidth - 2,
                                    align: 'center',
                                    lineBreak: false
                                });
                            } else if (question.valid_qbs === 'N' && question.marks === 'NA') {
                                doc.fontSize(6).font('Helvetica-Bold').fillColor('#e74c3c');
                                doc.text(`${question.marks}`, xPos + 1, yPos + 4, {
                                    width: colWidth - 2,
                                    align: 'center',
                                    lineBreak: false
                                });
                            } else {
                                doc.fontSize(6).font('Helvetica-Bold').fillColor('#e74c3c');
                                doc.text(`${question.marks}(EX)`, xPos + 1, yPos + 4, {
                                    width: colWidth - 2,
                                    align: 'center',
                                    lineBreak: false
                                });
                                doc.fillColor('#000000');
                            }
                        }


                    }

                    // Calculate total grid height
                    const totalGridHeight = rowsNeeded * (headerHeight + marksHeight + rowGap);

                    // Move cursor after grid
                    doc.y = finalGridStartY + totalGridHeight;

                    // Draw separator line
                    doc.moveTo(15, doc.y).lineTo(570, doc.y).stroke();
                    doc.y += separatorHeight;
                });
            }
        }
    }
    // Finalize the PDF
    doc.end();



});

module.exports = {
    pdfValuationGenearate,
    pdfValuationGenearateDetails,
    pdfMarkGenearateDetails,
    pdfMarkGenearateCampDetails
};