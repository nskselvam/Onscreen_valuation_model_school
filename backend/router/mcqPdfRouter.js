const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

router.get('/mcq-paper', asyncHandler(async (req, res) => {
    const { eva_month_year, department, registerno, subcode } = req.query;

    if (!eva_month_year || !department || !registerno || !subcode) {
        return res.status(400).json({
            error: 'Missing required parameters: eva_month_year, department, registerno, and subcode are required'
        });
    }

    // Construct the path: uploads/{eva_month_year}/{department}/{registerno}_{subcode}.pdf
    const fileName = `${registerno}_${subcode}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', eva_month_year, 'mcq',department, fileName);
    console.log(`Attempting to serve file from path: ${filePath}`); // Debug log


    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: 'MCQ PDF file not found',
            path: filePath
        });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(filePath);
}));

module.exports = router;
