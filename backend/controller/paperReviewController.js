const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const db = require("../db/models");
const { Sequelize, Op } = require("sequelize");
const { getClientIP } = require("../utils/formatDateTime");
const { sendEmail } = require("../utils/sendmailanswerbook");

// Separate function to generate PDF for paper review
const generatePaperReviewPDF = async ({ Dummy_NO, SubjectCode, Valuation_Type, Eva_Mon_Year, Dep_Name, FACULTY_NAME, username, institution_Name, clientIP, saveToFile = false }) => {
    const valNum = parseInt(Valuation_Type);
    if (isNaN(valNum) || valNum < 1 || valNum > 20) {
        throw new Error("Invalid Valuation_Type");
    }

    const importModelName = `import${valNum}`;
    const valDataModelName = `val_data_${Dep_Name}`;

    if (!db[importModelName] || !db[valDataModelName]) {
        throw new Error(`Model not found for Valuation_Type: ${valNum}`);
    }

    // 1. Main evaluation row from import table
    const importRows = await db[importModelName].findAll({ where: { barcode: Dummy_NO } });
    if (!importRows || importRows.length === 0) {
        throw new Error("No evaluation data found for the given Dummy_NO");
    }
    const mainRow = importRows[0];

    // 2. Subject name
    const subjectRec = await db.sub_master.findOne({ where: { Subcode: SubjectCode } });
    const subjectName = subjectRec?.SUBNAME || '';

    // 3. Student register number
    const studentRec = await db.student_result_data.findOne({ where: { Dummy_NO } });
    const registerNo = studentRec?.RegisterNo || '';

    // 4. Per-question marks ordered by qbno, section, sub_section, add_sub_section
    const valDataRows = await db[valDataModelName].findAll({
        where: { barcode: Dummy_NO, Eva_Mon_Year, Examiner_type: '2' },
        order: [['qbno', 'ASC'], ['section', 'ASC'], ['sub_section', 'ASC'], ['add_sub_section', 'ASC']],
    });

    // Build question display data
    const questions = valDataRows.map((row) => {
        let questionLabel = `${row.qbno}-${row.section}`;
        if (row.sub_section) questionLabel += `-${row.sub_section}`;
        if (row.add_sub_section) questionLabel += `(${row.add_sub_section})`;

        let marksLabel;
        if (row.valid_qbs === 'Y') {
            marksLabel = String(row.Marks_Get);
        } else if (row.valid_qbs === 'N' && !isNaN(Number(row.Marks_Get))) {
            marksLabel = Number(row.Marks_Get) !== 0 ? `${row.Marks_Get}(Ex)` : String(row.Marks_Get);
        } else {
            marksLabel = String(row.Marks_Get);
        }

        return { questionLabel, marksLabel, valid_qbs: row.valid_qbs };
    });

    // 5. Collect image paths
    const imgDir = path.join(__dirname, '..', 'uploads', Eva_Mon_Year, 'ImgImp', mainRow.Dep_Name || Dep_Name || '', Dummy_NO);
    let imgFiles = [];
    for (let i = 1; i <= mainRow.ImgCnt; i++) {
        const imgPath = path.join(imgDir, Dummy_NO + '_' + String(i).padStart(2, '0') + "_" + SubjectCode + '.jpg');
        if (fs.existsSync(imgPath)) {
            imgFiles.push(imgPath);
        } else {
            console.warn(`Image not found: ${imgPath}`);
        }
    }

    // ── PDF Generation ────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'portrait', autoFirstPage: false });
    const filename = `${registerNo}_${SubjectCode}_${mainRow.Evaluator_Id}_${Dummy_NO}.pdf`;

    let pdfFilePath = null;
    if (saveToFile) {
        // Create local directory for storing PDFs for mail sending
        const pdfMailDir = path.join(__dirname, '..', 'uploads', 'paper_review_pdfs', Eva_Mon_Year, Dep_Name);
        if (!fs.existsSync(pdfMailDir)) {
            fs.mkdirSync(pdfMailDir, { recursive: true });
        }
        pdfFilePath = path.join(pdfMailDir, filename);
        const writeStream = fs.createWriteStream(pdfFilePath);
        doc.pipe(writeStream);
        console.log(`PDF will be saved to: ${pdfFilePath}`);
    }

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const ML = 20;
    const MR = 20;
    const CONTENT_W = PAGE_W - ML - MR;

    const HDR_TITLE_H = 14;
    const HDR_SUBTITLE_H = 13;
    const HDR_META_H = 10;
    const COL_COUNT = 10;
    const CELL_W = CONTENT_W / COL_COUNT;
    const CELL_QH = 14;
    const CELL_MH = 16;
    const CELL_H = CELL_QH + CELL_MH;
    const PAPER_HDR = 26;
    const FOOTER_H = 100;

    const drawPageHeader = () => {
        let y = 15;
        const logoPath = path.join(__dirname, '..', 'uploads', 'template', 'srm.png');
        if (fs.existsSync(logoPath)) {
            try { doc.image(logoPath, ML + 10, y - 2, { width: 35 }); } catch (_) {}
        }

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000')
            .text(institution_Name, ML, y, { align: 'center', width: CONTENT_W, lineBreak: false });
        y += HDR_TITLE_H;

        doc.fontSize(8.5).text('Paper Review Report', ML, y, { align: 'center', width: CONTENT_W, lineBreak: false });
        y += HDR_SUBTITLE_H;

        if (FACULTY_NAME) {
            doc.fontSize(7.5).text(`Evaluator Id : ${mainRow.Evaluator_Id} - ${FACULTY_NAME}`, ML, y, { lineBreak: false });
            y += HDR_META_H;
        } else {
            doc.fontSize(7.5).text(`Evaluator Id : ${mainRow.Evaluator_Id}`, ML, y, { lineBreak: false });
            y += HDR_META_H;
        }

        doc.text(`Subject Code with Name : ${SubjectCode} - ${subjectName}`, ML, y, { lineBreak: false });
        y += HDR_META_H;

        if (FACULTY_NAME) {
            doc.text(`Student Register No : ${registerNo}`, ML, y, { lineBreak: false });
            y += HDR_META_H + 3;
        }

        return y + 5;
    };

    doc.addPage();
    let curY = drawPageHeader();

    const total = parseFloat(mainRow.total) || 0;
    const totalRound = mainRow.tot_round !== null ? mainRow.tot_round : Math.round(total);

    const rowsNeeded = Math.ceil(questions.length / COL_COUNT) || 1;
    const blockH = PAPER_HDR + (rowsNeeded * CELL_H) + 4;

    if (curY + blockH + FOOTER_H > PAGE_H - 20) {
        doc.addPage();
        curY = drawPageHeader();
    }

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000')
        .text(`Dummy No : ${Dummy_NO}     Total Marks : ${total}     Total Marks - Round Off : ${totalRound}`,
            ML, curY + 8, { width: CONTENT_W, align: 'center', lineBreak: false });

    const blockStartY = curY;
    doc.rect(ML, blockStartY, CONTENT_W, blockH).lineWidth(0.5).stroke();
    curY += PAPER_HDR;

    for (let r = 0; r < rowsNeeded; r++) {
        const rowY = curY + r * CELL_H;
        for (let c = 0; c < COL_COUNT; c++) {
            const qIdx = r * COL_COUNT + c;
            if (qIdx >= questions.length) break;

            const q = questions[qIdx];
            const cellX = ML + c * CELL_W;

            doc.rect(cellX, rowY, CELL_W, CELL_QH).lineWidth(0.3).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
                .text(q.questionLabel, cellX + 1, rowY + 3, { width: CELL_W - 2, align: 'center', lineBreak: false });

            doc.rect(cellX, rowY + CELL_QH, CELL_W, CELL_MH).lineWidth(0.3).stroke();
            const markColor = q.valid_qbs === 'Y' ? '#155724' : '#c0392b';
            doc.font('Helvetica-Bold').fontSize(10).fillColor(markColor)
                .text(q.marksLabel, cellX + 1, rowY + CELL_QH + 3, { width: CELL_W - 2, align: 'center', lineBreak: false });
        }
    }

    curY += rowsNeeded * CELL_H + 12;

    if (FACULTY_NAME) {
        if (curY + FOOTER_H > PAGE_H - 20) {
            doc.addPage();
            curY = drawPageHeader();
        }

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5);
        doc.text('I have reviewed my answer paper in the presence of evaluator and the marks awarded by them.',
            ML, curY, { width: CONTENT_W });
        curY += 13;
        doc.text('I ACCEPT  /  I have NOT ACCEPTED the marks awarded.', ML, curY, { width: CONTENT_W });
        curY += 18;

        doc.text('Remarks if any :', ML, curY);
        curY += 8;
        doc.rect(ML, curY, CONTENT_W, 28).lineWidth(0.5).stroke();
        curY += 75;

        doc.text('Signature of the Student :', ML, curY);
        doc.text('Signature of the Evaluator / Reviewer', ML + 300, curY);
        curY += 12;
        doc.text('Date :', ML, curY);
    }

    const tDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.font('Helvetica').fontSize(7).fillColor('#000000')
        .text(`Date : ${tDate}     User : ${username || ''}     IP : ${clientIP}`, ML, 810, { align: 'right', width: CONTENT_W, lineBreak: false });

    for (const imgPath of imgFiles) {
        doc.addPage();
        try {
            doc.image(imgPath, 5, 5, { width: PAGE_W - 10, height: PAGE_H - 10, cover: [PAGE_W - 10, PAGE_H - 10] });
        } catch (e) {
            console.error(`Failed to embed image ${imgPath}:`, e.message);
            doc.font('Helvetica').fontSize(9).fillColor('red')
                .text(`[Image could not be loaded: ${path.basename(imgPath)}]`, ML, 40);
        }
        doc.font('Helvetica').fontSize(7).fillColor('#000000')
            .text(`Date : ${tDate}     User : ${username || ''}     IP : ${clientIP}`, ML, 810, { align: 'right', width: CONTENT_W, lineBreak: false });
    }

    doc.end();

    return { doc, filename, pdfFilePath };
};

const paperReview = asyncHandler(async (req, res) => {
  const { Dep_Name} = req.query;

  const paperReviewData = await db.student_result_data.findAll({
    where: {
      Dep_Name: Dep_Name,
    },
    attributes: ['RegisterNo', 'Dummy_NO', 'SubjectCode','StudentMobileno','StudentOfficalEmailID','StudentContactNo','StudentPersonalEmailID','Evaluator_Id','Dep_Name','Eva_Mon_Year','Valuation_Type','Import_Date','FACULTY_NAME','Import_Date','reviewStatus'],
  });


  if (paperReviewData) {
    const importDates = [...new Set(paperReviewData.map(item => item.Import_Date))];
    res.status(200).json({ paperReviewData ,
        importDates });
  } else {
    res.status(404).json({ message: "No data found for the specified department" });
  }
});

const paperReviewDownload = asyncHandler(async (req, res) => {
    const { Dummy_NO, SubjectCode, Valuation_Type, Eva_Mon_Year, Dep_Name, FACULTY_NAME, username, institution_Name } = req.body;
    const clientIP = getClientIP(req);

    if (!Dummy_NO || !SubjectCode || !Valuation_Type || !Eva_Mon_Year) {
        return res.status(400).json({ message: "Missing required fields: Dummy_NO, SubjectCode, Valuation_Type, Eva_Mon_Year" });
    }

    try {
        const { doc, filename } = await generatePaperReviewPDF({
            Dummy_NO,
            SubjectCode,
            Valuation_Type,
            Eva_Mon_Year,
            Dep_Name,
            FACULTY_NAME,
            username,
            institution_Name,
            clientIP,
            saveToFile: false
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);
    } catch (error) {
        console.error("PDF generation failed:", error);
        res.status(500).json({ message: error.message || "PDF generation failed" });
    }
});

const paperReviewZero = asyncHandler(async (req, res) => {

    const { Dep_Name, Valuation_Type } = req.query;

    let flname  = `import${Valuation_Type}`;

      const paperReviewData = await db[flname].findAll({
    where: {
      Dep_Name: Dep_Name,
      Checked: 'Yes',
      E_flg: 'Y',
      [Op.or]: [
        { tot_round: null },
        { tot_round: '' },
        Sequelize.where(
          Sequelize.cast(
            Sequelize.fn('NULLIF', Sequelize.fn('TRIM', Sequelize.col('tot_round')), ''),
            'INTEGER'
          ),
          { [Op.eq]: 0 }
        )
      ]
    },
    attributes: ['barcode', 'Evaluator_Id', 'subcode','tot_round','Dep_Name','Eva_Mon_Year','Camp_id','camp_offcer_id_examiner'],
   
  });

  const result = paperReviewData.map(item => ({
    ...item.toJSON(),
    Valuation_Type: item.Valuation_Type ?? Valuation_Type,
  }));

    res.status(200).json({ message: "Paper Review Zero endpoint is working!", data: result });

});

const paperReviewSearchBarcode = asyncHandler(async (req, res) => {
    const { barcode, Valuation_Type } = req.query;

    if (!barcode || !Valuation_Type) {
        return res.status(400).json({ message: 'barcode and Valuation_Type are required' });
    }

    const flname = `import${Valuation_Type}`;
    if (!db[flname]) {
        return res.status(400).json({ message: `Model not found for Valuation_Type: ${Valuation_Type}` });
    }

    const searchVal = barcode.trim();

    // Support comma-separated barcodes e.g. "82191134,82188454"
    const barcodeList = searchVal.split(',').map(b => b.trim()).filter(Boolean);

    let orClause;
    if (barcodeList.length > 1) {
        // Multiple comma-separated values — exact match on barcode only
        orClause = { barcode: { [Op.in]: barcodeList } };
    } else {
        // Single value — OR search across Dummy No, Subcode, Evaluator ID
        orClause = {
            [Op.or]: [
                { barcode:      { [Op.like]: `%${searchVal}%` } },
                { subcode:      { [Op.like]: `%${searchVal}%` } },
                { Evaluator_Id: { [Op.like]: `%${searchVal}%` } },
            ],
        };
    }

    const rows = await db[flname].findAll({
        where: {
            ...orClause,
            Checked: 'Yes',
            E_flg: 'Y',
            [Op.and]: [
                Sequelize.where(
                    Sequelize.cast(
                        Sequelize.fn('NULLIF', Sequelize.fn('TRIM', Sequelize.col('tot_round')), ''),
                        'INTEGER'
                    ),
                    { [Op.eq]: 0 }
                )
            ]
        },
        attributes: ['barcode', 'Evaluator_Id', 'subcode', 'tot_round', 'Dep_Name', 'Eva_Mon_Year', 'Camp_id', 'camp_offcer_id_examiner'],
    });

    const result = rows.map(item => ({
        ...item.toJSON(),
        Valuation_Type: item.Valuation_Type ?? Valuation_Type,
    }));

    res.status(200).json({ data: result });
});

const paperReviewExaminer = asyncHandler(async (req, res) => {
  const { Dep_Name, username } = req.query;
  console.log("Received paper review examiner request for department:", Dep_Name, "and user:", username);
    

  const paperReviewData = await db.student_result_data.findAll({
    where: {
      Dep_Name: Dep_Name,
      Evaluator_Id: username
    },
    order: [['reviewStatus', 'DESC']],
    attributes: ['RegisterNo', 'Dummy_NO', 'SubjectCode', 'studentname', 'StudentMobileno', 'StudentOfficalEmailID', 'StudentContactNo', 'StudentPersonalEmailID', 'Evaluator_Id', 'Dep_Name', 'Eva_Mon_Year', 'Valuation_Type', 'Import_Date', 'FACULTY_NAME', 'Import_Date', 'reviewStatus'],
  });


  if (paperReviewData) {
    const importDates = [...new Set(paperReviewData.map(item => item.Import_Date))];
    res.status(200).json({ paperReviewData ,
        importDates });
  } else {
    res.status(404).json({ message: "No data found for the specified department" });
  }
});

const paperReviewMailSend = asyncHandler(async (req, res) => {
    const { data, username, institution_Name } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected a non-empty array." });
    }

    const clientIP = getClientIP(req);
    const generatedPDFs = [];
    const errors = [];
    const emailResults = [];

    console.log(`Starting PDF generation and email sending for ${data.length} records...`);

    // Generate PDFs and send emails for all records
    for (const item of data) {
        try {
            const { Dummy_NO, SubjectCode, Valuation_Type, Eva_Mon_Year, Dep_Name, FACULTY_NAME, StudentOfficalEmailID, RegisterNo } = item;

            if (!Dummy_NO || !SubjectCode || !Valuation_Type || !Eva_Mon_Year) {
                errors.push({ Dummy_NO, error: "Missing required fields" });
                continue;
            }

            // if (!StudentOfficalEmailID) {
            //     errors.push({ Dummy_NO, error: "Missing email address" });
            //     continue;
            // }

            // Generate PDF
            const { filename, pdfFilePath } = await generatePaperReviewPDF({
                Dummy_NO,
                SubjectCode,
                Valuation_Type,
                Eva_Mon_Year,
                Dep_Name,
                FACULTY_NAME,
                username,
                institution_Name,
                clientIP,
                saveToFile: true
            });

            generatedPDFs.push({
                Dummy_NO,
                SubjectCode,
                RegisterNo,
                filename,
                pdfFilePath,
                email: StudentOfficalEmailID
            });

            console.log(`PDF generated for ${Dummy_NO}: ${filename}`);

            // Send email with PDF attachment
            const emailBody = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Paper Review Report</h2>
                    <p>Dear Student,</p>
                    <p>Please find attached your paper review report for the following details:</p>
                    <ul>
                        <li><strong>Register Number:</strong> ${RegisterNo || 'N/A'}</li>
                        <li><strong>Dummy Number:</strong> ${Dummy_NO}</li>
                        <li><strong>Subject Code:</strong> ${SubjectCode}</li>
                        <li><strong>Evaluator:</strong> ${FACULTY_NAME || 'N/A'}</li>
                    </ul>
                    <p>If you have any queries, please contact the examination department.</p>
                    <br>
                    <p>Best regards,<br>${institution_Name || 'Examination Department'}</p>
                </div>
            `;

            const emailResult = await sendEmail(
                'nskselvam@gmail.com', // For testing, replace with StudentOfficalEmailID in production
                `Paper Review Report - ${RegisterNo || Dummy_NO} - ${SubjectCode}`,
                emailBody,
                pdfFilePath
            );

            emailResults.push({
                Dummy_NO,
                email: 'nskselvam@gmail.com', // For testing, replace with StudentOfficalEmailID in production
                success: emailResult.success,
                messageId: emailResult.messageId || null,
                error: emailResult.error || null
            });

            if (emailResult.success) {
                console.log(`✅ Email sent successfully to ${StudentOfficalEmailID} for ${Dummy_NO}`);
            } else {
                console.error(`❌ Failed to send email to ${StudentOfficalEmailID} for ${Dummy_NO}:`, emailResult.error);
            }

        } catch (error) {
            console.error(`Failed to process ${item.Dummy_NO}:`, error.message);
            errors.push({ Dummy_NO: item.Dummy_NO, error: error.message });
        }
    }

    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.filter(r => !r.success).length;

    res.status(200).json({
        message: "PDF generation and email sending completed",
        totalRequested: data.length,
        pdfGenerated: generatedPDFs.length,
        emailsSent: successfulEmails,
        emailsFailed: failedEmails,
        errors: errors.length,
        generatedPDFs,
        emailResults,
        errorDetails: errors
    });
});

module.exports = { paperReviewZero, paperReview, paperReviewDownload, paperReviewSearchBarcode, paperReviewExaminer, paperReviewMailSend };