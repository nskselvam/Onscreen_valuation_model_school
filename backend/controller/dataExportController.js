const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const db = require('../db/models');
const AppError = require('../utils/appError');

// Map valuation_type → import table model
const getImportModel = (valuation_type) => {
    const models = { '1': db.import1, '2': db.import2, '3': db.import3, '4': db.import4 };
    return models[String(valuation_type)] || null;
};

/**
 * GET /api/data-export/export
 * Query params:
 *   valuation_type  – required (1–4) selects import table
 *   valuation_map   – optional (filter by Implot)
 *   camp_id         – optional (filter by Camp_id)
 *   camp_office_id  – optional (filter by camp_offcer_id_examiner)
 *   subcode         – optional (filter by subcode)
 *   evaluator_id    – optional (filter by Evaluator_Id)
 *
 * Each returned record includes:
 *   malpractice – 'Yes' if a valuation_remarks row exists where
 *                 Dummy_Number = barcode AND Remarks_Type = '2',
 *                 otherwise 'No'
 */
const getExportData = asyncHandler(async (req, res, next) => {
    const {
        valuation_type,
        valuation_map,
        camp_id,
        camp_office_id,
        subcode,
        evaluator_id,
    } = req.query;

    if (!valuation_type) {
        return next(new AppError('valuation_type is required.', 400));
    }

    // ── Fix: use valuation_type (not valuation_map) to pick the model ──
    const ImportModel = getImportModel(valuation_map);
    if (!ImportModel) {
        return next(new AppError('Invalid valuation_type. Must be 1, 2, 3 or 4.', 400));
    }

    const where = {
        Checked: 'Yes',
        E_flg: 'Y',
    };


    if (valuation_type === '2') {
        where.Chief_Checked = 'Yes';
    }

    // Combined OR search across key fields
    const searchVal = (camp_id || camp_office_id || subcode || evaluator_id || '').trim();
    if (searchVal) {
        where[Op.or] = [
            { Camp_id:                 { [Op.like]: `%${searchVal}%` } },
            { camp_offcer_id_examiner: { [Op.like]: `%${searchVal}%` } },
            { subcode:                 { [Op.like]: `%${searchVal}%` } },
            { Evaluator_Id:            { [Op.like]: `%${searchVal}%` } },
        ];
    }

    const records = await ImportModel.findAll({
        where,
        attributes: [
            'id',
            'barcode',
            'subcode',
            'Dep_Name',
            'Evaluator_Id',
            'Checked',
            'E_flg',
            'total',
            'tot_round',
            'checkdate',
            'A_date',
            'Eva_Mon_Year',
            'Chief_Flg',
            'Chief_Checked',
            'Chief_Evaluator_Id',
            'Chief_Valuation_Evaluator_Id',
            'Chief_total',
            'Chief_tot_round',
            'Chief_checkdate',
            'tflg',
            'PFLG',
            'Remarks',
            'Camp_id',
            'camp_offcer_id_examiner',
            'Implot',
        ],
        order: [['barcode', 'ASC']],
        limit: 50000,
    });

    // ── Malpractice flag: find all barcodes that have Remarks_Type = '2' ──
    const barcodes = records.map((r) => r.barcode).filter(Boolean);

    let malpracticeBarcodes = new Set();
    if (barcodes.length > 0) {
        const remarksRows = await db.valuation_remarks.findAll({
            where: {
                Dummy_Number: { [Op.in]: barcodes },
                Remarks_Type: '2',
            },
            attributes: ['Dummy_Number'],
            raw: true,
        });
        remarksRows.forEach((row) => malpracticeBarcodes.add(row.Dummy_Number));
    }

    // ── Attach malpractice field to every record ──
    const data = records.map((r) => ({
        ...r.toJSON(),
        malpractice: malpracticeBarcodes.has(r.barcode) ? 'Yes' : 'No',
    }));

    res.status(200).json({
        status: 'success',
        count: data.length,
        valuation_type,
        data,
    });
});

module.exports = { getExportData };

