const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const db = require('../db/models');
const AppError = require('../utils/appError');

// Map valuation_type → import table model
const getImportModel = (valuation_type) => {
    const models = { '1': db.import1, '2': db.import2, '3': db.import3, '4': db.import4 };
    return models[String(valuation_type)] || null;
};

// Map valuation_type → val_data table model


/**
 * GET /api/valuation-cancel/data
 * Query params: valuation_type (1-4), barcode (optional), examiner_id (optional)
 */
const getValuationCancelData = asyncHandler(async (req, res, next) => {
    const { valuation_type, barcode, examiner_id, subcode, valuationMap,includeHold } = req.query;

    if (!valuation_type) {
        return next(new AppError('valuation_type is required', 400));
    }

    const ImportModel = getImportModel(valuationMap);
    if (!ImportModel) {
        return next(new AppError('Invalid valuation_type. Must be 1, 2, 3 or 4.', 400));
    }

    const searchVal = (barcode || examiner_id || subcode || '').trim();
    if (!searchVal) {
        return next(new AppError('Please provide a search value (Barcode / Examiner ID / Subcode).', 400));
    }

    // OR search: match barcode, Evaluator_Id or subcode
    let where = {};
    if (valuation_type === '1') {
        where = {
            [Op.and]: [
                {
                    [Op.or]: [
                        { Checked: 'Yes' },
                        { Checked: 'NO' }
                    ]
                },
                {
                    [Op.or]: [
                        { E_flg: 'Y' },
                        { E_flg: 'H' },
                        { E_flg: 'A' },
                        ...(includeHold === 'true' ? [{ E_flg: 'N' }] : [])
                    ]
                },
                {
                    [Op.or]: [
                        { barcode: { [Op.like]: `%${searchVal}%` } },
                        { Evaluator_Id: { [Op.like]: `%${searchVal}%` } },
                        { subcode: { [Op.like]: `%${searchVal}%` } }
                    ]
                }
            ]
        };
    } else if (valuation_type === '2') {
        where = {
            Chief_Checked: 'Yes',
            Chief_E_flg: 'Y',
            [Op.or]: [
                { barcode: { [Op.like]: `%${searchVal}%` } },
                { Chief_Valuation_Evaluator_Id: { [Op.like]: `%${searchVal}%` } },
                { subcode: { [Op.like]: `%${searchVal}%` } },
            ],
        };
    } else if (valuation_type === '3') {
        where = {
            Chief_Flg: 'Y',
            [Op.or]: [
                { barcode: { [Op.like]: `%${searchVal}%` } },
                { Chief_Evaluator_Id: { [Op.like]: `%${searchVal}%` } },
                { subcode: { [Op.like]: `%${searchVal}%` } },
            ],
        };
    }
    const records = await ImportModel.findAll({
        where,
        attributes: [
            'id', 'barcode', 'subcode', 'Dep_Name', 'Evaluator_Id',
            'Checked', 'E_flg', 'total', 'tot_round',
            'checkdate', 'A_date', 'Eva_Mon_Year',
            'Chief_Flg', 'Chief_Checked', 'Chief_Evaluator_Id',
            'Chief_total', 'Chief_tot_round', 'Chief_checkdate',
            'tflg', 'PFLG', 'Remarks'
        ],
        order: [['barcode', 'ASC']],
    });

    res.status(200).json({
        status: 'success',
        count: records.length,
        valuation_type,
        data: records,
    });
});

/**
 * DELETE /api/valuation-cancel/delete
 * Body: { valuation_type, barcode, id, action }
 * Deletes the import record AND all matching val_data rows for that barcode.
 */
const deleteValuationRecord = asyncHandler(async (req, res, next) => {
    const { valuation_type, barcode, id, valuationMap, action } = req.body;

    console.log('body received:', req.body);
    let importflname = `import${valuationMap}`;
    let message = '';
    // return
    if (action === 'Cancel') {

        // return

        if (!valuation_type || !barcode || !id) {
            return next(new AppError('valuation_type, barcode and id are required.', 400));
        }

        if (!valuation_type || !barcode || !id) {
            return next(new AppError('valuation_type, barcode and id are required.', 400));
        }

        const ImportModel = getImportModel(valuationMap);
        if (!ImportModel) {
            return next(new AppError('Invalid valuation_type.', 400));
        }

        // Verify the record exists
        const record = await ImportModel.findOne({ where: { id, barcode } });

        console.log('Record found:', record);
        //return
        if (!record) {
            return next(new AppError('Record not found.', 404));
        }
        let Examiner_type = valuation_type === '1' ? '2' : valuation_type === '2' ? '1' : '';

        // Delete from val_data table (question-level marks) first
        const ValDataModel = `val_data_${record.Dep_Name}`;
        let valDataDeleted = 0;
        if (ValDataModel) {
            valDataDeleted = await db[ValDataModel].destroy({ where: { barcode, valuation_type: String(valuationMap), Examiner_type: Examiner_type } });

            if (Examiner_type === '2') await db.valuation_remarks.destroy({ where: { Dummy_Number: barcode } });

        }



        // // Reset import record fields instead of hard delete (keeps barcode row intact)
        if (valuation_type === '1') {
            await record.update({
                Evaluator_Id: null,
                Checked: 'NO',
                E_flg: 'N',
                total: null,
                tot_round: null,
                checkdate: null,
            });

            await db.chief_remarks.destroy({ where: { Barcode: barcode } });
        } else if (valuation_type === '2') {
            await record.update({
                Chief_Valuation_Evaluator_Id: null,
                Chief_Checked: 'NO',
                Chief_E_flg: 'N',
                Chief_total: null,
                Chief_tot_round: null,
                Chief_checkdate: null,
            });
            await db.valuation_remarks.destroy({ where: { Dummy_Number: barcode } });
        } else if (valuation_type === '3') {
            await record.update({
                Chief_Evaluator_Id: null,
                Chief_Flg: 'N',
            });
            await db.chief_remarks.destroy({ where: { Barcode: barcode } });
        }

        // Determine the success message based on action
        message = `Valuation data for barcode ${barcode} has been cancelled successfully.`;
    } else if (action === 'Hold') {
        message = `Valuation data for barcode ${barcode} has been put on hold.`;
        const importRecordHold = await db[importflname].findOne({ where: { barcode: barcode } });
        if (importRecordHold) {
            await importRecordHold.update({ E_flg: 'H' ,Checked: 'NO' });
        }
    } else if (action === 'Delete') {
        const importRecordDelete = await db[importflname].findOne({ where: { barcode: barcode } });
        let Dep_Name_delete = importRecordDelete ? importRecordDelete.Dep_Name : null;
        let ValDataModelDelete = Dep_Name_delete ? `val_data_${Dep_Name_delete}` : null;
        if (ValDataModelDelete) {
            await db[ValDataModelDelete].destroy({ where: { barcode, valuation_type: String(valuationMap) } });
        }
        await db.chief_remarks.destroy({ where: { Barcode: barcode } });
        await importRecordDelete.destroy();
        message = `Valuation data for barcode ${barcode} has been deleted successfully.`;
    } else if (action === 'Hold Release') {
        message = `Hold released for barcode ${barcode}.`;
        const importRecordHoldRelease = await db[importflname].findOne({ where: { barcode: barcode } });
        if (importRecordHoldRelease) {
            await importRecordHoldRelease.update({ E_flg: 'A' ,Checked: 'NO' });
        }
    }

    res.status(200).json({
        status: 'success',
        message,
        action: action || 'Cancel',

    });
});

module.exports = { getValuationCancelData, deleteValuationRecord };
