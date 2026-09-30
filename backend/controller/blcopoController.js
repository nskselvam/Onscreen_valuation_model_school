const express = require("express");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const db = require("../db/models");
const { Sequelize, Op, NOW } = require("sequelize");
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const archiverZipEncrypted = require('archiver-zip-encrypted');
const valid_sections = db.valid_sections;
const valid_question = db.valid_question;
const AppError = require("../utils/appError");

// Register the encrypted format once at module load
archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

const getBlCoPoData = asyncHandler(async (req, res, next) => {

    const { valuation_type, valuation_map, create_type, subcodes,Dep_Name ,Evaluator_Id} = req.body;

    console.log(req.body)

    //return
    let XlsPath = path.join(__dirname, '..', 'excelData');

    // Delete all existing Excel files in the directory
    if (fs.existsSync(XlsPath)) {
        const files = fs.readdirSync(XlsPath);
        files.forEach(file => {
            if (file.endsWith('.xlsx')) {
                fs.unlinkSync(path.join(XlsPath, file));
            }
        });
    }

    const CoDetails = [];
    CoDetails[1]='BL'
    CoDetails[2]='CO'
    CoDetails[3]='PO'
    const subcodeArray = subcodes.split(',').map(subcode => subcode.trim().split(' - ')[0]);
    let importData
    let flname = `import${valuation_map}`;
    let flnamevalData =`val_data_${Dep_Name}`;

    for (const subcode of subcodeArray) {

        let excelFlname = path.join(__dirname, '..', 'excelData', `${CoDetails[create_type]}_${valuation_type}_${Dep_Name}_${subcode}.xlsx`);

        // Create Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(subcode);

        // Add headers

        const BlCoPoHeader = await db.valid_sections.findAll({
            where: {
                sub_code: subcode
            },
            attributes: ['qstn_num', 'section',  'CO_Point'],
            group: ['qstn_num', 'section', 'CO_Point'],
            order: [
                ['section', 'ASC'],
                ['qstn_num', 'ASC'],
                ['CO_Point', 'ASC']
            ]
        });


        worksheet.columns = [
            { header: 'S.No', key: 'sno', width: 10 },
            { header: 'Barcode', key: 'barcode', width: 15 },
            { header: 'Evaluator ID', key: 'evaluator_id', width: 15 },
            { header: 'Subcode', key: 'subcode', width: 12 },
            ...BlCoPoHeader.map(header => {
                const { qstn_num, section, CO_Point } = header;
                return { header: `${section}${qstn_num}(${CoDetails[create_type]}${CO_Point})`, key: `point_${section}${qstn_num}_${CoDetails[create_type]}${CO_Point}`, width: 15 };
            }),
            {header: 'Mark', key: 'Total', width: 15 }
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1a3a5c' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        importData = await db[flname].findAll({
            where: {
                subcode: subcode,
            }
        });

        let rowIndex = 2;
        for (const data of importData) {
            const { barcode, Evaluator_Id ,tot_round} = data;

            const points = await db[flnamevalData].findAll({
                where: {
                    subcode: subcode,
                    barcode: barcode,
                    eva_id: Evaluator_Id,
                    Examiner_type:'2',
                    valuation_type: valuation_map

                },
                attributes: [
                    'qbno', 
                    'section', 
                    'CO_Point', 
                    [Sequelize.literal(`
                        CASE 
                            WHEN COUNT(CASE WHEN "Marks_Get" != 'NA' AND "Marks_Get" IS NOT NULL THEN 1 END) = 0 THEN 'NA'
                            ELSE CAST(SUM(CASE 
                                WHEN "Marks_Get" = 'NA' OR "Marks_Get" IS NULL THEN 0 
                                ELSE CAST("Marks_Get" AS DECIMAL) 
                            END) AS VARCHAR)
                        END
                    `), 'total_marks']
                ],
                group: ['qbno', 'section', 'CO_Point'],
                order: [
                    ['qbno', 'ASC'],
                    ['section', 'ASC'],
                    ['CO_Point', 'ASC']
                ]
            });

            // Calculate total marks for this row
            // const totalMarks = points.reduce((sum, point) => {
            //     const marks = parseFloat(point.dataValues.total_marks) || 0;
            //     return sum + marks;
            // }, 0);


            // Create a row object with the required data
            // Add data row
            const rowData = {
                sno: rowIndex - 1,
                barcode: barcode,
                evaluator_id: Evaluator_Id,
                subcode: subcode,
                Total: tot_round
            };

            // Add points data
            points.forEach(point => {
                rowData[`point_${point.section}${point.qbno}_${CoDetails[create_type]}${point.CO_Point}`] = point.dataValues.total_marks;
            });

            // rowData.Total = totalMarks;

            worksheet.addRow(rowData);

            rowIndex++;
        }

        // Create directory if it doesn't exist
        const excelDir = path.dirname(excelFlname);
        if (!fs.existsSync(excelDir)) {
            fs.mkdirSync(excelDir, { recursive: true });
        }

        // Save the Excel file
        await workbook.xlsx.writeFile(excelFlname);
    }

    let ExportZipPath = path.join(__dirname, '..', 'excelData', `${CoDetails[create_type]}_${valuation_type}_${Dep_Name}.zip`);

    // Create a zip file containing all the Excel files with password protection
    const output = fs.createWriteStream(ExportZipPath);
    const archive = archiver.create('zip-encrypted', {
        zlib: { level: 9 }, // Set compression level
        encryptionMethod: 'aes256',
        password: Evaluator_Id // Password for the zip file
    });

    output.on('close', () => {
        console.log(`Created password-protected zip file: ${ExportZipPath} (${archive.pointer()} total bytes)`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    // Append all Excel files to the zip
    for (const subcode of subcodeArray) {
        const excelFlname = path.join(__dirname, '..', 'excelData', `${CoDetails[create_type]}_${valuation_type}_${Dep_Name}_${subcode}.xlsx`);
        archive.file(excelFlname, { name: `${CoDetails[create_type]}_${valuation_type}_${Dep_Name}_${subcode}.xlsx` });
    }

    await archive.finalize();

    // Wait for the zip file to be fully written
    await new Promise((resolve) => output.on('close', resolve));

    // Send the zip file as download
    const zipFileName = `${CoDetails[create_type]}_${valuation_type}_${Dep_Name}.zip`;
    res.download(ExportZipPath, zipFileName, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            return res.status(500).json({ 
                message: 'Error downloading file', 
                error: err.message 
            });
        }
        
        // Optionally delete the zip file after download
        // fs.unlinkSync(ExportZipPath);
    });

});

const getSubcode = asyncHandler(async (req, res) => {
    const { Dep_Name } = req.query;

    console.log("Received department:", Dep_Name);

    // if (!Dep_Name) {
    //     return res.status(400).json({ 
    //         error: 'Missing required parameter: department is required' 
    //     });
    // }

    const subcodes = await db.sub_master.findAll({
        where: {
            Dep_Name: Dep_Name
        },
        attributes: ['Subcode'],
        order: [['Subcode', 'ASC']]

    });

    const subcodeList = subcodes.map(subcode => subcode.Subcode);

    const uniqueSubcodeList = [...new Set(subcodeList)];

    // Use import1 or import2 - you can make this dynamic based on your needs
    // For now, using import1 as default
    const importTableName = 'import1';
    
    const importData = await db[importTableName].findAll({
        where: {
            Dep_Name: Dep_Name
        },
        attributes: [
            'subcode',
            [Sequelize.fn('COUNT', Sequelize.col('subcode')), 'count']
        ],
        group: ['subcode'],
        order: [[Sequelize.literal('count'), 'DESC']],
        raw: true
    });

    // Format as "subcode - count"
    const subcodeWithCount = importData.map(item => `${item.subcode} - ${item.count}`);

    console.log("Fetched subcodes with count:", subcodeWithCount);

    res.status(200).json({ message: "Subcode fetched successfully", data: subcodeWithCount });
}
);


module.exports = {
    getBlCoPoData,
    getSubcode
};