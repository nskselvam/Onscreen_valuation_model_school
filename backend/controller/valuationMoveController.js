const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const { Sequelize, Op } = require("sequelize");
const AppError = require("../utils/appError");
const { getCurrentISTDateTime } = require("../utils/formatDateTime");

const ValuationShiftExfel = asyncHandler(async (req, res) => {
    const { exceldata } = req.body;

    let validRowCount = 0;

    if (!exceldata || !Array.isArray(exceldata) || exceldata.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty Excel data' });
    }

    for (const row of exceldata) {
        try {
            const { Barcode, SubCode, ToValuation } = row;

            if (!Barcode || !SubCode || !ToValuation) {
                continue;
            }

            const ImportModel = await db.import1.findAll({
                where: {
                    barcode: String(Barcode),
                    subcode: String(SubCode)
                }
            });

            if (ImportModel.length === 0 || Number(ToValuation) === 1) {
                continue; // Skip to next row
            }

            let flname = `import${ToValuation}`;
            if (!db[flname]) {
                continue;
            }

            await db[flname].create({
                barcode: ImportModel[0].barcode,
                subcode: ImportModel[0].subcode,
                batchname: ImportModel[0].batchname,
                Dep_Name: ImportModel[0].Dep_Name,
                R_No: ImportModel[0].R_No,
                Checked: 'NO',
                E_flg: 'N',
                ImgCnt: ImportModel[0].ImgCnt,
                ImpDate: getCurrentISTDateTime(),
                Implot: ToValuation,
                Eva_Mon_Year: ImportModel[0].Eva_Mon_Year,
                Chief_Flg: 'N',
                Chief_Checked: 'NO',
                Chief_E_flg: 'N',
            });
            validRowCount++;

            // Delete the original record from import1 after moving


        } catch (err) {
            console.error(`Error processing row:`, row, err.message);
        }
    }

    res.status(200).json({
        message: 'Excel file processed successfully',
        validRowCount: validRowCount
    });
});


const ValuationMovegetdata = asyncHandler(async (req, res) => {
    const { fromValuation, toValuation, mark, subcodes ,markCheckbox} = req.query;




    if (!fromValuation) {
        return res.status(400).json({ message: 'fromValuation is required' });
    }
    if (!toValuation) {
        return res.status(400).json({ message: 'toValuation is required' });
    }
    if (mark === undefined || mark === '') {
        return res.status(400).json({ message: 'mark is required' });
    }

    const fromModelName = `import${fromValuation}`;
    const toModelName = `import${toValuation}`;

    const FromModel = db[fromModelName];
    const ToModel = db[toModelName];

    if (!FromModel) {
        return res.status(404).json({ message: `Model '${fromModelName}' not found` });
    }
    if (!ToModel) {
        return res.status(404).json({ message: `Model '${toModelName}' not found` });
    }

    const subcodeArray = subcodes
        ? [].concat(subcodes).flatMap(s => s.split(',').map(x => x.trim())).filter(Boolean)
        : [];

    // Build shared subcode filter — IN ('A','B','C') when codes are provided
    const subcodeFilter = subcodeArray.length > 0
        ? { subcode: { [Op.in]: subcodeArray } }
        : {};

    let data = [];

    if (parseInt(mark) !== 0 && markCheckbox==='false') {
        const markThreshold = Number(mark);
        
        // Use raw SQL query to find records where (from.tot_round - to.tot_round) <= mark
        const query = `
            SELECT 
                f.barcode,
                f."R_No" as "RegisterNo",
                f.subcode as "SubCode",
                f."Dep_Name",
                f."Eva_Mon_Year",
                f.tot_round as "fromMark",
                t.tot_round as "toMark",
                f."Evaluator_Id" as "fEvaluatorId",
                t."Evaluator_Id" as "tEvaluatorId",
                f."Camp_id" as "Camp_Id",
                ABS(CAST(f.tot_round AS DECIMAL(10,2)) - CAST(t.tot_round AS DECIMAL(10,2))) as diff
            FROM ${fromModelName} f
            INNER JOIN ${toModelName} t ON f.barcode = t.barcode AND f.subcode = t.subcode
            WHERE f."Checked" = 'Yes' 
                AND f."E_flg" = 'Y'
                AND t."Checked" = 'Yes'
                AND t."E_flg" = 'Y'
                ${subcodeArray.length > 0 ? `AND f.subcode IN (${subcodeArray.map(s => `'${s}'`).join(',')})` : ''}
                AND ABS(CAST(f.tot_round AS DECIMAL(10,2)) - CAST(t.tot_round AS DECIMAL(10,2))) >= :markThreshold
            ORDER BY f.barcode
        `;

        const results = await db.sequelize.query(query, {
            replacements: { markThreshold },
            type: Sequelize.QueryTypes.SELECT
        });

        if (results.length === 0) {
            return res.status(200).json({ data: [] });
        }

        data = results.map((r, index) => ({
            SNo: index + 1,
            Barcode: r.barcode,
            RegisterNo: r.RegisterNo,
            SubCode: r.SubCode,
            Dep_Name: r.Dep_Name,
            Camp_Id: r.Camp_Id,
            fEvaluatorId: r.fEvaluatorId,
            tEvaluatorId: r.tEvaluatorId,
            Eva_Mon_Year: r.Eva_Mon_Year,
            FromValuation: `Valuation ${fromValuation}`,
            ToValuation: `Valuation ${toValuation}`,
            V1_Marks: Number(r.fromMark) || 0,
            V2_Marks: Number(r.toMark) || 0,
            Difference: Number(r.diff) || 0,
            InputMark: markThreshold,
            Status: 'Eligible',
        }));
    } else if (parseInt(mark) === 0 && markCheckbox==='false') {

        const [ZeroRecrod] = await Promise.all([
            FromModel.findAll({ 
                where: { 
                    ...subcodeFilter, 
                    Checked: 'Yes', 
                    E_flg: 'Y', 

                } 
            }),
        ]);

        if (ZeroRecrod.length === 0) {
            return res.status(200).json({ data: [] });
        }

        data.push(...ZeroRecrod.map((r, index) => ({
            SNo: index + 1,
            Barcode: r.barcode,
            RegisterNo: r.R_No,
            SubCode: r.subcode,
            Dep_Name: r.Dep_Name,
            Camp_Id: r.Camp_Id,
            fEvaluatorId: r.fEvaluatorId,
            tEvaluatorId: r.tEvaluatorId,
            Eva_Mon_Year: r.Eva_Mon_Year,
            FromValuation: `Valuation ${fromValuation}`,
            ToValuation: `Valuation ${toValuation}`,
            V1_Marks: parseFloat(r.tot_round) || 0,
            V2_Marks: 0,
            Difference: parseFloat(r.tot_round) || 0,
            InputMark: 0,
            Status: 'Eligible',
        })));
    }else if (markCheckbox==='true') {

        const markThreshold = Number(mark);

        const [CheckedRecord] = await Promise.all([
            FromModel.findAll({ 
                where: { 
                    ...subcodeFilter, 
                    Checked: 'Yes', 
                    E_flg: 'Y',
                    [Op.and]: [
                        Sequelize.where(
                            Sequelize.cast(Sequelize.col('tot_round'), 'DECIMAL'),
                            Op.lt,
                            markThreshold
                        )
                    ]
                } 
            }),
        ]);

        if (CheckedRecord.length === 0) {
            return res.status(200).json({ data: [] });
        }
        
        data.push(...CheckedRecord.map((r, index) => ({
            SNo: index + 1,
            Barcode: r.barcode,
            RegisterNo: r.R_No,
            SubCode: r.subcode,
            Dep_Name: r.Dep_Name,
            Camp_Id: r.Camp_Id,
            fEvaluatorId: r.fEvaluatorId,
            tEvaluatorId: r.tEvaluatorId,
            Eva_Mon_Year: r.Eva_Mon_Year,
            FromValuation: `Valuation ${fromValuation}`,
            ToValuation: `Valuation ${toValuation}`,
            V1_Marks: Number(r.tot_round) || 0,
            V2_Marks: 0,
            Difference: Number(r.tot_round) || 0,
            InputMark: markThreshold,
            Status: 'Eligible',
        })));
    } else {
        return res.status(400).json({ message: 'Invalid mark or markCheckbox value' });
    }

    res.status(200).json({ data });
})

const ValuationMoveUpdate = asyncHandler(async (req, res) => {

    const { payload } = req.body;
    const { fromValuation, toValuation, mark, records } = payload;

    const fromModelName = `import${fromValuation}`;
    const toModelName = `import${toValuation}`;
    const newModelName = `import${String(parseInt(toValuation) + 1)}`;

    if (!db[fromModelName]) {
        return res.status(404).json({ message: `Model '${fromModelName}' not found` });
    }
    if (!db[toModelName]) {
        return res.status(404).json({ message: `Model '${toModelName}' not found` });
    }
    if (parseInt(toValuation) === 4) {
        return res.status(400).json({ message: `Cannot move to Valuation ${toValuation} as it exceeds the maximum valuation round` });
    }

    let movedCount = 0;

    for (const record of records) {
        const { Barcode, SubCode } = record;

        if (parseInt(mark) === 0) {
            // Check if already exists in toModel
            const existing = await db[toModelName].findOne({
                where: { barcode: String(Barcode), subcode: String(SubCode) }
            });

            if (existing) continue; // already moved, skip

            // Fetch source record from fromModel
            const sourceRecord = await db[fromModelName].findOne({
                where: { barcode: String(Barcode), subcode: String(SubCode) }
            });

            if (!sourceRecord) {
                continue;
            }

            await db[toModelName].create({
                barcode: sourceRecord.barcode,
                subcode: sourceRecord.subcode,
                batchname: sourceRecord.batchname,
                Dep_Name: sourceRecord.Dep_Name,
                R_No: sourceRecord.R_No,
                Checked: 'NO',
                E_flg: 'N',
                ImgCnt: sourceRecord.ImgCnt,
                ImpDate: getCurrentISTDateTime(),
                Implot: toValuation,
                Eva_Mon_Year: sourceRecord.Eva_Mon_Year,
                Chief_Flg: 'N',
                Chief_Checked: 'NO',
                Chief_E_flg: 'N',
            });

            movedCount++;
        } else {
            const existing = await db[newModelName].findOne({
                where: { barcode: String(Barcode), subcode: String(SubCode) }
            });

            if (existing) continue; // already moved, skip

            // Fetch source record from fromModel
            const sourceRecord = await db[fromModelName].findOne({
                where: { barcode: String(Barcode), subcode: String(SubCode) }
            });

            if (!sourceRecord) {
                continue;
            }

            await db[newModelName].create({
                barcode: sourceRecord.barcode,
                subcode: sourceRecord.subcode,
                batchname: sourceRecord.batchname,
                Dep_Name: sourceRecord.Dep_Name,
                R_No: sourceRecord.R_No,
                Checked: 'NO',
                E_flg: 'N',
                ImgCnt: sourceRecord.ImgCnt,
                ImpDate: getCurrentISTDateTime(),
                Implot: toValuation,
                Eva_Mon_Year: sourceRecord.Eva_Mon_Year,
                Chief_Flg: 'N',
                Chief_Checked: 'NO',
                Chief_E_flg: 'N',
            });


        }

    }

    res.status(200).json({ message: `${movedCount} record(s) moved successfully` });
})
// for (const row of exceldata) {
//     const { Barcode, SubCode, ToValuation } = row;

//     // Validate required fields
//     if (!Barcode || !SubCode || !ToValuation) {
//         throw new AppError('Missing required fields in Excel data', 400);
//     }
//     console.log(`Processing row: Barcode=${Barcode}, SubCode=${SubCode}, ToValuation=${ToValuation}`);

//     let flname 

//     // Update the valuation move in the database}

// }


module.exports = { ValuationShiftExfel, ValuationMovegetdata, ValuationMoveUpdate };