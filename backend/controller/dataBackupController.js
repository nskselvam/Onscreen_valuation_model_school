const asyncHandler   = require('express-async-handler');
const { QueryTypes } = require('sequelize');
const sequelize      = require('../config/database');
const AppError       = require('../utils/appError');

/* ─────────────────────────────────────────────────────────────────
 * GET /api/data-backup/tables
 * Returns all user tables in the public schema with row count & size.
 * ──────────────────────────────────────────────────────────────── */
const listTables = asyncHandler(async (req, res) => {
    const tables = await sequelize.query(
        `SELECT
            t.table_name,
            COALESCE(s.n_live_tup, 0)                                    AS row_count,
            COALESCE(pg_total_relation_size(quote_ident(t.table_name)), 0) AS size_bytes
         FROM information_schema.tables   t
         LEFT JOIN pg_stat_user_tables    s ON s.relname = t.table_name
         WHERE t.table_schema = 'public'
           AND t.table_type   = 'BASE TABLE'
         ORDER BY t.table_name`,
        { type: QueryTypes.SELECT }
    );

    res.status(200).json({ total: tables.length, tables });
});

/* ─────────────────────────────────────────────────────────────────
 * GET /api/data-backup/download/:tableName
 * Streams CREATE TABLE structure + INSERT data as a .sql dump.
 * ──────────────────────────────────────────────────────────────── */
const downloadTable = asyncHandler(async (req, res, next) => {
    const { tableName } = req.params;

    // ── Whitelist: verify table exists in public schema ──────────
    const [valid] = await sequelize.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type   = 'BASE TABLE'
           AND table_name   = :name`,
        { replacements: { name: tableName }, type: QueryTypes.SELECT }
    );

    if (!valid) {
        return next(new AppError(`Table "${tableName}" does not exist.`, 404));
    }

    // ── Fetch column definitions ──────────────────────────────────
    const columns = await sequelize.query(
        `SELECT
            c.column_name,
            c.data_type,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.is_nullable,
            c.column_default,
            c.ordinal_position,
            -- primary key flag
            CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_primary_key
         FROM information_schema.columns c
         LEFT JOIN (
             SELECT ku.column_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage ku
               ON tc.constraint_name = ku.constraint_name
              AND tc.table_schema    = ku.table_schema
              AND tc.table_name      = ku.table_name
             WHERE tc.constraint_type = 'PRIMARY KEY'
               AND tc.table_schema   = 'public'
               AND tc.table_name     = :name
         ) pk ON pk.column_name = c.column_name
         WHERE c.table_schema = 'public'
           AND c.table_name   = :name
         ORDER BY c.ordinal_position`,
        { replacements: { name: tableName }, type: QueryTypes.SELECT }
    );

    // ── Fetch all rows ────────────────────────────────────────────
    const rows = await sequelize.query(
        `SELECT * FROM "${tableName}"`,
        { type: QueryTypes.SELECT }
    );

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${tableName}_backup_${dateStr}.sql"`
    );

    // ── Build column type string ──────────────────────────────────
    const colTypeDef = (col) => {
        const isSerial = col.column_default && col.column_default.startsWith('nextval(');

        // Map nextval() defaults → SERIAL types (creates own sequence automatically)
        if (isSerial) {
            const dt = col.data_type.toLowerCase();
            let serialType = 'SERIAL';
            if (dt === 'bigint')   serialType = 'BIGSERIAL';
            if (dt === 'smallint') serialType = 'SMALLSERIAL';
            const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
            return `    "${col.column_name}" ${serialType}${nullable}`;
        }

        let type = col.data_type.toUpperCase();
        if (['CHARACTER VARYING', 'VARCHAR', 'CHAR', 'CHARACTER'].includes(type) && col.character_maximum_length) {
            type += `(${col.character_maximum_length})`;
        } else if (['NUMERIC', 'DECIMAL'].includes(type) && col.numeric_precision) {
            type += col.numeric_scale != null
                ? `(${col.numeric_precision},${col.numeric_scale})`
                : `(${col.numeric_precision})`;
        }
        const nullable  = col.is_nullable === 'NO' ? ' NOT NULL' : '';
        const defVal    = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        return `    "${col.column_name}" ${type}${nullable}${defVal}`;
    };

    const pkCols = columns.filter(c => c.is_primary_key === 'YES').map(c => `"${c.column_name}"`);

    const colDefs = columns.map(c => colTypeDef(c));
    if (pkCols.length) colDefs.push(`    PRIMARY KEY (${pkCols.join(', ')})`);

    // ── Helper: escape a value for SQL INSERT ─────────────────────
    const sqlVal = (val) => {
        if (val === null || val === undefined) return 'NULL';
        // Date objects → ISO string (avoids "GMT+0530" timezone format PostgreSQL can't parse)
        if (val instanceof Date) {
            return isNaN(val.getTime()) ? 'NULL' : `'${val.toISOString()}'`;
        }
        if (typeof val === 'number')  return String(val);
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'string') {
            // Catch JS Date strings like "Sun Feb 02 2025 00:00:00 GMT+0530 (India Standard Time)"
            if (/^\w{3}\s+\w{3}\s+\d{2}\s+\d{4}/.test(val)) {
                const d = new Date(val);
                if (!isNaN(d.getTime())) return `'${d.toISOString()}'`;
            }
            return `'${val.replace(/'/g, "''")}'`;
        }
        return `'${String(val).replace(/'/g, "''")}'`;
    };

    // ── Assemble SQL file ─────────────────────────────────────────
    const lines = [
        `-- ============================================================`,
        `-- Table backup: "${tableName}"`,
        `-- Generated  : ${dateStr}`,
        `-- Total rows : ${rows.length}`,
        `-- ============================================================`,
        ``,
        `-- Structure`,
        `DROP TABLE IF EXISTS "${tableName}";`,
        `CREATE TABLE "${tableName}" (`,
        colDefs.join(',\n'),
        `);`,
        ``,
    ];

    if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const colList = headers.map(h => `"${h}"`).join(', ');

        lines.push(`-- Data`);
        rows.forEach(row => {
            const vals = headers.map(h => sqlVal(row[h])).join(', ');
            lines.push(`INSERT INTO "${tableName}" (${colList}) VALUES (${vals});`);
        });
        lines.push(``);
    } else {
        lines.push(`-- No data records found.`);
        lines.push(``);
    }

    res.send(lines.join('\n'));
});

module.exports = { listTables, downloadTable };
