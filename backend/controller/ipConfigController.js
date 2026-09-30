const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const db = require("../db/models"); // Import Sequelize models
const { Op } = require('sequelize');

const valid_Ip_Data = asyncHandler(async (req, res) => {
    const ipData = await db.valid_ips.findAll(); // Use db.valid_ips
    res.status(200).json({ data: ipData });
});

const valid_ip_update = asyncHandler(async (req, res) => {
    const { id, vflg, ids } = req.body;

    // Handle single record update
    if (id && vflg) {
        const ipRecord = await db.valid_ips.findByPk(id);

        if (!ipRecord) {
            throw new AppError("IP record not found", 404);
        }

        // Update the record
        await db.valid_ips.update(
            { vflg: vflg },
            { where: { id: id } }
        );

        const updatedRecord = await db.valid_ips.findByPk(id);
        res.status(200).json({ message: "IP record updated successfully", data: updatedRecord });
    }
    // Handle bulk delete
    else if (ids && Array.isArray(ids) && ids.length > 0) {
        const deletedCount = await db.valid_ips.destroy({
            where: { id: ids }
        });

        res.status(200).json({ 
            message: `${deletedCount} record(s) deleted successfully`, 
            data: { deletedCount }
        });
    }
    else {
        throw new AppError("Invalid request parameters", 400);
    }
});

const valid_ip_add = asyncHandler(async (req, res) => {
    const { Ip_Address, To_Ip, block_name, campus, floor, vflg } = req.body;

    // ── 1. Presence check ───────────────────────────────────────────────────
    if (!Ip_Address || To_Ip === undefined || To_Ip === '' || !block_name || !campus || !floor) {
        throw new AppError("All fields are required", 400);
    }

    // ── 2. Validate From IP format (full x.x.x.x) ──────────────────────────
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(Ip_Address)) {
        throw new AppError("Invalid From IP format (e.g. 192.168.1.1)", 400);
    }

    const fromOctets = Ip_Address.split('.').map(Number);
    if (fromOctets.some(o => o < 0 || o > 255)) {
        throw new AppError("From IP octets must each be between 0 and 255", 400);
    }

    // ── 3. Validate To_Ip (last octet only, 0–255) ──────────────────────────
    const toLastOctet = parseInt(To_Ip, 10);
    if (isNaN(toLastOctet) || toLastOctet < 0 || toLastOctet > 255) {
        throw new AppError("To IP must be a number between 0 and 255", 400);
    }

    // ── 4. Range logic check (To >= From last octet) ────────────────────────
    const fromLastOctet = fromOctets[3];
    if (toLastOctet < fromLastOctet) {
        throw new AppError(
            `To IP (${toLastOctet}) must be greater than or equal to From IP last octet (${fromLastOctet})`,
            400
        );
    }

    // ── 5. Build all IPs in the range ────────────────────────────────────────
    const basePrefix = fromOctets.slice(0, 3).join('.'); // e.g. "192.168.1"
    const rangeIps = [];
    for (let octet = fromLastOctet; octet <= toLastOctet; octet++) {
        rangeIps.push(`${basePrefix}.${octet}`);
    }

    // ── 6. Check for existing duplicates in this range ───────────────────────
    
    const existingRecords = await db.valid_ips.findAll({
        where: { Ip_Address: { [Op.in]: rangeIps } },
        attributes: ['Ip_Address']
    });

    const existingIps = existingRecords.map(r => r.Ip_Address);
    const newIps = rangeIps.filter(ip => !existingIps.includes(ip));

    if (newIps.length === 0) {
        return res.status(200).json({
            message: `All ${rangeIps.length} IP(s) in this range already exist. Nothing added.`,
            skipped: existingIps,
            data: []
        });
    }

    // ── 7. Bulk insert only new IPs in range ─────────────────────────────────
    const records = newIps.map(ip => ({
        Ip_Address: ip,
        block_name: block_name.trim(),
        campus: campus.trim(),
        floor: String(floor),
        vflg: vflg || 'Y'
    }));

    const created = await db.valid_ips.bulkCreate(records);

    res.status(201).json({
        message: `${created.length} IP(s) added, ${existingIps.length} skipped (already exist). Range: ${Ip_Address} → ${basePrefix}.${toLastOctet}`,
        added: created.length,
        skipped: existingIps,
        data: created
    });
});

module.exports = { valid_Ip_Data,valid_ip_update,valid_ip_add };