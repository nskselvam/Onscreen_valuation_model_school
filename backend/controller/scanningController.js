const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const db = require('../db/models');
const AppError = require('../utils/appError');

const IMPORT_MODELS = { '1': 'import1', '2': 'import2', '3': 'import3', '4': 'import4' };

const getImportModel = (vt) => db[IMPORT_MODELS[String(vt)]] || null;

const EMPTY_ROW = {
    Dep_Name: '', Evaluator_Id: '', Camp_id: '', ImgCnt: '',
    Eva_Mon_Year: '', Checked: '', E_flg: '',
    checkdate: '',
    Chief_Flg: '', Chief_Checked: '', Chief_total: '', Chief_tot_round: '',
};

/**
 * POST /api/scanning/check
 * Body: { rows: [{ Barcode, SubCode, ValuationType }] }
 *
 * Performance: groups rows by ValuationType and runs ONE batch IN-query
 * per valuation type (max 4 DB queries regardless of row count).
 */
const checkScanningData = asyncHandler(async (req, res, next) => {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return next(new AppError('rows array is required', 400));
    }

    // ── Step 1: normalise & pre-validate ────────────────────────
    const normalised = rows.map((row, i) => ({
        _idx:          i,
        Barcode:       String(row.Barcode       || row.barcode       || '').trim(),
        SubCode:       String(row.SubCode       || row.subcode       || '').trim(),
        ValuationType: String(row.ValuationType || row.valuation_type || '').trim(),
    }));

    const resultSlots = new Array(normalised.length).fill(null);
    const grouped     = {}; // { '1': [rows], '2': [rows], ... }

    for (const row of normalised) {
        if (!row.Barcode || !row.SubCode || !row.ValuationType) {
            resultSlots[row._idx] = {
                Barcode: row.Barcode || '—', SubCode: row.SubCode || '—',
                ValuationType: row.ValuationType || '—',
                Status: 'Error', Remark: 'Missing Barcode / SubCode / ValuationType',
                ...EMPTY_ROW,
            };
            continue;
        }
        if (!getImportModel(row.ValuationType)) {
            resultSlots[row._idx] = {
                Barcode: row.Barcode, SubCode: row.SubCode, ValuationType: row.ValuationType,
                Status: 'Error', Remark: `Invalid ValuationType: ${row.ValuationType}`,
                ...EMPTY_ROW,
            };
            continue;
        }
        (grouped[row.ValuationType] = grouped[row.ValuationType] || []).push(row);
    }

    // ── Step 2: ONE batch query per valuation type (max 4 total) ─
    for (const [type, typeRows] of Object.entries(grouped)) {
        const ImportModel = getImportModel(type);

        // Fetch all records whose barcode appears in this batch
        const barcodes = [...new Set(typeRows.map(r => r.Barcode))];
        const records  = await ImportModel.findAll({
            where: { barcode: { [Op.in]: barcodes } },
            attributes: [
                'barcode', 'subcode', 'Dep_Name', 'Evaluator_Id', 'Camp_id',
                'ImgCnt', 'Eva_Mon_Year', 'Checked', 'E_flg',
                'checkdate',
                'Chief_Flg', 'Chief_Checked', 'Chief_total', 'Chief_tot_round',
            ],
            raw: true,
        });

        // Build in-memory lookup  "barcode|subcode" → record
        const lookup = Object.create(null);
        for (const rec of records) {
            lookup[`${rec.barcode}|${rec.subcode}`] = rec;
        }

        // Map each input row against the lookup
        for (const row of typeRows) {
            const rec = lookup[`${row.Barcode}|${row.SubCode}`];
            if (rec) {
                resultSlots[row._idx] = {
                    Barcode: row.Barcode, SubCode: row.SubCode, ValuationType: type,
                    Status: 'Found', Remark: 'Record exists in table',
                    Dep_Name:        rec.Dep_Name        || '',
                    Evaluator_Id:    rec.Evaluator_Id    || '',
                    Camp_id:         rec.Camp_id         || '',
                    ImgCnt:          rec.ImgCnt          || '',
                    Eva_Mon_Year:    rec.Eva_Mon_Year    || '',
                    Checked:         rec.Checked         || '',
                    E_flg:           rec.E_flg           || '',
                    checkdate:       rec.checkdate       || '',
                    Chief_Flg:       rec.Chief_Flg       || '',
                    Chief_Checked:   rec.Chief_Checked   || '',
                    Chief_total:     rec.Chief_total     ?? '',
                    Chief_tot_round: rec.Chief_tot_round ?? '',
                };
            } else {
                resultSlots[row._idx] = {
                    Barcode: row.Barcode, SubCode: row.SubCode, ValuationType: type,
                    Status: 'Not Found', Remark: `No record in import${type} table`,
                    ...EMPTY_ROW,
                };
            }
        }
    }

    const data     = resultSlots.filter(Boolean);
    const found    = data.filter(r => r.Status === 'Found').length;
    const notFound = data.filter(r => r.Status === 'Not Found').length;
    const errors   = data.filter(r => r.Status === 'Error').length;

    res.status(200).json({ total: data.length, found, notFound, errors, data });
});

module.exports = { checkScanningData };
