import React, { useState, useMemo, useRef } from 'react';
import {
    Card, Row, Col, Button, Badge, Spinner, Alert, ProgressBar,
} from 'react-bootstrap';

const CHUNK_SIZE = 500; // rows per request — keeps each request fast
import DataTableBase from 'react-data-table-component';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { MdCloudUpload, MdSearch, MdRefresh } from 'react-icons/md';
import * as XLSX from 'xlsx';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';
import { useCheckScanningExcelDataMutation } from '../../redux-slice/scanningApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

/* ─── Required Excel columns ─────────────────────────────────────── */
const REQUIRED_COLS = ['Barcode', 'SubCode', 'ValuationType'];

/* ─── DataTable theme ─────────────────────────────────────────────── */

const customTableStyles = {
    headRow: {
        style: {
            backgroundColor: '#1a3a5c',
            color: '#fff',
            fontWeight: '700',
            fontSize: '0.84rem',
        },
    },
    headCells: { style: { color: '#fff', fontWeight: '700' } },
    rows: {
        style: { fontSize: '0.82rem', borderBottom: '1px solid #e9ecef', minHeight: '44px' },
        highlightOnHoverStyle: { backgroundColor: '#eef3fb', cursor: 'default' },
    },
    pagination: { style: { borderTop: '1px solid #dee2e6', fontSize: '0.82rem' } },
};

/* ─── Badge helpers ──────────────────────────────────────────────── */
const STATUS_CONFIG = {
    'Found':     { bg: '#22c55e', label: '✔ Found' },
    'Not Found': { bg: '#ef4444', label: '✘ Not Found' },
    'Error':     { bg: '#f59e0b', label: '⚠ Error' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { bg: '#94a3b8', label: status };
    return (
        <span style={{
            background: cfg.bg, color: '#fff', padding: '3px 10px',
            borderRadius: '20px', fontSize: '11px', fontWeight: '700',
            whiteSpace: 'nowrap',
        }}>
            {cfg.label}
        </span>
    );
};

/* ─── Summary counter card ───────────────────────────────────────── */
const CountCard = ({ label, value, color, active, onClick }) => (
    <Card
        onClick={onClick}
        style={{
            borderRadius: '14px',
            border: active ? `2px solid ${color}` : `2px solid ${color}40`,
            background: active ? `${color}22` : `${color}0d`,
            cursor: 'pointer',
            transition: 'all 0.15s',
            userSelect: 'none',
        }}
        className="text-center p-2"
    >
        <div style={{ fontSize: '1.7rem', fontWeight: '800', color }}>{value ?? 0}</div>
        <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </Card>
);

/* ═══════════════════════════════════════════════════════════════════ */
const ScanningChecking = () => {
    const fileInputRef                          = useRef(null);
    const [excelFile, setExcelFile]             = useState(null);
    const [uploadedRows, setUploadedRows]       = useState([]);     // parsed from Excel
    const [parseError, setParseError]           = useState('');
    const [results, setResults]                 = useState([]);     // backend response
    const [summary, setSummary]                 = useState(null);   // {total,found,notFound,errors}
    const [statusFilter, setStatusFilter]       = useState('All'); // 'All'|'Found'|'Not Found'|'Error'
    const [filterText, setFilterText]           = useState('');
    const [checked, setChecked]                 = useState(false);
    const [progress, setProgress]               = useState({ done: 0, total: 0 }); // chunk progress
    const [isChecking, setIsChecking]           = useState(false);

    const [checkScanningExcelData] = useCheckScanningExcelDataMutation();

    /* ── Download sample Excel ─────────────────────────────────── */
    const handleDownloadSample = () => {
        const ws = XLSX.utils.json_to_sheet([
            { Barcode: '1234567890', SubCode: '11UCS101', ValuationType: '1' },
            { Barcode: '0987654321', SubCode: '11UCS102', ValuationType: '2' },
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sample');
        XLSX.writeFile(wb, 'Scanning_Check_Sample.xlsx');
    };

    /* ── Parse Excel file on upload ────────────────────────────── */
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            toast.error('Only .xlsx / .xls / .csv files are accepted.');
            e.target.value = '';
            return;
        }

        setParseError('');
        setUploadedRows([]);
        setResults([]);
        setSummary(null);
        setChecked(false);
        setExcelFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const wb    = XLSX.read(event.target.result, { type: 'binary' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const json  = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                if (!json.length) {
                    setParseError('The Excel sheet is empty.');
                    return;
                }

                const uploadedCols = Object.keys(json[0]);
                const missing = REQUIRED_COLS.filter(c => !uploadedCols.includes(c));
                if (missing.length) {
                    setParseError(`Missing required column(s): ${missing.join(', ')}`);
                    return;
                }

                setUploadedRows(json);
                toast.success(`${json.length} row(s) loaded from "${file.name}".`);
            } catch {
                setParseError('Failed to parse the Excel file. Please check the file format.');
            }
        };
        reader.readAsBinaryString(file);
    };

    /* ── Send rows to backend in CHUNK_SIZE batches ────────────── */
    const handleCheck = async () => {
        if (!uploadedRows.length) {
            toast.warning('Please upload a valid Excel file first.');
            return;
        }

        const allRows = uploadedRows.map(r => ({
            Barcode:       String(r.Barcode       || '').trim(),
            SubCode:       String(r.SubCode       || '').trim(),
            ValuationType: String(r.ValuationType || '').trim(),
        }));

        // Split into chunks
        const chunks = [];
        for (let i = 0; i < allRows.length; i += CHUNK_SIZE)
            chunks.push(allRows.slice(i, i + CHUNK_SIZE));

        setIsChecking(true);
        setProgress({ done: 0, total: allRows.length });
        setResults([]);
        setSummary(null);
        setChecked(false);

        const accumulated = [];
        let totalFound = 0, totalNotFound = 0, totalErrors = 0;

        try {
            for (let ci = 0; ci < chunks.length; ci++) {
                const res = await checkScanningExcelData({ rows: chunks[ci] }).unwrap();
                accumulated.push(...(res.data || []));
                totalFound    += res.found    || 0;
                totalNotFound += res.notFound || 0;
                totalErrors   += res.errors   || 0;
                setProgress({ done: Math.min((ci + 1) * CHUNK_SIZE, allRows.length), total: allRows.length });
            }

            setResults(accumulated);
            setSummary({ total: accumulated.length, found: totalFound, notFound: totalNotFound, errors: totalErrors });
            setStatusFilter('All');
            setFilterText('');
            setChecked(true);
            toast.success(`Check complete — ${totalNotFound} not found out of ${accumulated.length}.`);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to check data. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    /* ── Reset ──────────────────────────────────────────────────── */
    const handleReset = () => {
        setExcelFile(null);
        setUploadedRows([]);
        setParseError('');
        setResults([]);
        setSummary(null);
        setStatusFilter('All');
        setFilterText('');
        setProgress({ done: 0, total: 0 });
        setIsChecking(false);
        setChecked(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /* ── Filtered data ──────────────────────────────────────────── */
    const filteredData = useMemo(() => {
        let data = results;
        if (statusFilter !== 'All') data = data.filter(r => r.Status === statusFilter);
        const q = filterText.toLowerCase();
        if (q) {
            data = data.filter(r =>
                (r.Barcode       || '').toLowerCase().includes(q) ||
                (r.SubCode       || '').toLowerCase().includes(q) ||
                (r.ValuationType || '').toLowerCase().includes(q) ||
                (r.Dep_Name      || '').toLowerCase().includes(q) ||
                (r.Evaluator_Id  || '').toLowerCase().includes(q) ||
                (r.Remark        || '').toLowerCase().includes(q)
            );
        }
        return data;
    }, [results, statusFilter, filterText]);

    /* ── Export results to Excel ────────────────────────────────── */
    const handleExport = () => {
        if (!filteredData.length) { toast.warning('No data to export.'); return; }
        const rows = filteredData.map((r, i) => ({
            'S.No':          i + 1,
            'Barcode':       r.Barcode       || '',
            'SubCode':       r.SubCode       || '',
            'ValuationType': r.ValuationType || '',
            'Status':        r.Status        || '',
            'Remark':        r.Remark        || '',
            'Dept':          r.Dep_Name      || '',
            'Evaluator ID':  r.Evaluator_Id  || '',
            'Camp ID':       r.Camp_id       || '',
            'Mon-Year':      r.Eva_Mon_Year  || '',
            'Img Count':     r.ImgCnt        || '',
            'Checked':       r.Checked       || '',
            'E_flg':         r.E_flg         || '',
            'Check Date':    r.checkdate     || '',
            'Chief Flag':    r.Chief_Flg     || '',
            'Chief Checked': r.Chief_Checked || '',
            'Chief Total':   r.Chief_total   ?? '',
            'Chief Rounded': r.Chief_tot_round ?? '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Check Results');
        XLSX.writeFile(wb, `Scanning_Check_${statusFilter}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
        toast.success('Exported successfully.');
    };

    /* ── DataTable columns ──────────────────────────────────────── */
    const columns = [
        {
            name: 'S.No',
            cell: (_, i) => i + 1,
            width: '58px',
            center: true,
        },
        {
            name: 'Barcode',
            selector: r => r.Barcode || '—',
            sortable: true,
            width: '120px',
            cell: r => <span style={{ fontWeight: '700', color: '#1a3a5c' }}>{r.Barcode}</span>,
        },
        {
            name: 'SubCode',
            selector: r => r.SubCode || '—',
            sortable: true,
            width: '110px',
        },
        {
            name: 'Val. Type',
            selector: r => r.ValuationType || '—',
            center: true,
            width: '90px',
            cell: r => (
                <Badge bg="primary" style={{ fontSize: '11px' }}>Type {r.ValuationType}</Badge>
            ),
        },
        {
            name: 'Status',
            selector: r => r.Status || '',
            sortable: true,
            center: true,
            width: '110px',
            cell: r => <StatusBadge status={r.Status} />,
        },
        {
            name: 'Remark',
            selector: r => r.Remark || '—',
            grow: 1,
            minWidth: '180px',
            cell: r => <span style={{ fontSize: '11.5px', color: r.Status === 'Not Found' ? '#ef4444' : r.Status === 'Error' ? '#f59e0b' : '#22c55e' }}>{r.Remark}</span>,
        },
        { name: 'Dept',         selector: r => r.Dep_Name      || '—', width: '65px', center: true },
        { name: 'Evaluator ID', selector: r => r.Evaluator_Id  || '—', sortable: true, width: '120px' },
        { name: 'Camp ID',      selector: r => r.Camp_id       || '—', width: '90px', center: true },
        { name: 'Mon-Year',     selector: r => r.Eva_Mon_Year  || '—', width: '100px', center: true },
        { name: 'Img Count',    selector: r => r.ImgCnt        || '—', width: '88px', center: true },
        { name: 'Checked',      selector: r => r.Checked       || '—', width: '80px', center: true },
        { name: 'Check Date',   selector: r => r.checkdate     || '—', sortable: true, width: '120px' },
        { name: 'Chief Total',  selector: r => r.Chief_total   ?? '—', width: '95px', center: true },
        { name: 'C. Rounded',   selector: r => r.Chief_tot_round ?? '—', width: '95px', center: true },
    ];

    /* ─── Render ────────────────────────────────────────────────── */
    return (
        <UploadPageLayout
            mainTopic="Scanning with Valuation Data"
            subTopic="Upload Excel → cross-check barcodes against import tables"
            cardTitle="Barcode Scanning Check"
        >
            {/* ── Upload Card ─────────────────────────────────── */}
            <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(30,60,114,0.10)', borderRadius: '16px', marginBottom: '20px' }}>
                <Card.Header style={{
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    color: '#fff', border: 'none', padding: '14px 22px',
                    borderRadius: '16px 16px 0 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <strong>📂 Upload Excel File</strong>
                    <Button
                        size="sm"
                        onClick={handleDownloadSample}
                        style={{ background: '#22c55e', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}
                    >
                        <FaDownload className="me-1" /> Download Sample
                    </Button>
                </Card.Header>
                <Card.Body className="p-4">
                    {/* ── Upload Zone ─────────────────────────── */}
                    <div
                        style={{
                            border: '2px dashed #b8c9e8',
                            borderRadius: '14px',
                            background: excelFile ? '#f0f7ff' : '#f8fafc',
                            padding: '32px 24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <MdCloudUpload size={46} color={excelFile ? '#2a5298' : '#94a3b8'} />
                        {excelFile ? (
                            <div className="mt-2">
                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e3c72' }}>
                                    <FaFileExcel color="#22c55e" className="me-2" />
                                    {excelFile.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                    {uploadedRows.length} row(s) loaded
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2" style={{ color: '#94a3b8', fontSize: '13px' }}>
                                Click to upload <strong>.xlsx / .xls / .csv</strong><br />
                                Required columns: <code>Barcode</code>, <code>SubCode</code>, <code>ValuationType</code>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* ── Parse Error ───────────────────────────── */}
                    {parseError && (
                        <Alert variant="danger" className="mt-3 mb-0" style={{ borderRadius: '10px', fontSize: '13px' }}>
                            <FaExclamationTriangle className="me-2" />{parseError}
                        </Alert>
                    )}

                    {/* ── Actions ──────────────────────────────── */}
                    <Row className="g-2 mt-3">
                        <Col xs="auto">
                            <Button
                                onClick={handleCheck}
                                disabled={isChecking || !uploadedRows.length}
                                style={{
                                    background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
                                    border: 'none', borderRadius: '10px',
                                    fontWeight: '700', fontSize: '13px', height: '40px',
                                    paddingInline: '24px',
                                }}
                            >
                                {isChecking
                                    ? <><Spinner size="sm" className="me-2" />Checking…</>
                                    : <><MdSearch size={16} className="me-2" />Check Database</>
                                }
                            </Button>
                        </Col>
                        {(excelFile || checked) && (
                            <Col xs="auto">
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleReset}
                                    disabled={isChecking}
                                    style={{ borderRadius: '10px', height: '40px', fontWeight: '700', fontSize: '13px', paddingInline: '20px' }}
                                >
                                    <MdRefresh size={15} className="me-1" />Reset
                                </Button>
                            </Col>
                        )}
                    </Row>

                    {/* ── Progress bar (visible while chunked processing runs) ── */}
                    {isChecking && progress.total > 0 && (
                        <div className="mt-3">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                <span>Processing rows…</span>
                                <span>{progress.done} / {progress.total}</span>
                            </div>
                            <ProgressBar
                                animated
                                now={Math.round((progress.done / progress.total) * 100)}
                                label={`${Math.round((progress.done / progress.total) * 100)}%`}
                                style={{ height: '10px', borderRadius: '8px' }}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* ── Summary Counters ──────────────────────────────── */}
            {checked && summary && (
                <Row className="g-3 mb-3">
                    <Col xs={6} md={3}>
                        <CountCard label="Total Checked" value={summary.total}    color="#1e3c72"  active={statusFilter === 'All'}       onClick={() => setStatusFilter('All')} />
                    </Col>
                    <Col xs={6} md={3}>
                        <CountCard label="Found"         value={summary.found}    color="#22c55e"  active={statusFilter === 'Found'}     onClick={() => setStatusFilter('Found')} />
                    </Col>
                    <Col xs={6} md={3}>
                        <CountCard label="Not Found"     value={summary.notFound} color="#ef4444"  active={statusFilter === 'Not Found'} onClick={() => setStatusFilter('Not Found')} />
                    </Col>
                    <Col xs={6} md={3}>
                        <CountCard label="Errors"        value={summary.errors}   color="#f59e0b"  active={statusFilter === 'Error'}     onClick={() => setStatusFilter('Error')} />
                    </Col>
                </Row>
            )}

            {/* ── Results Table ─────────────────────────────────── */}
            {checked && (
                <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(30,60,114,0.10)', borderRadius: '16px' }}>
                    <Card.Header style={{
                        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                        color: '#fff', border: 'none', padding: '14px 22px',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
                    }}>
                        <strong>
                            📋 Results — <em style={{ fontWeight: '400' }}>{statusFilter}</em> ({filteredData.length})
                        </strong>
                        <div className="d-flex gap-2 align-items-center">
                            <input
                                type="text"
                                placeholder="Filter results…"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                style={{
                                    width: '180px', height: '32px', fontSize: '12px',
                                    border: '1px solid #ffffff60', background: '#ffffff20',
                                    color: '#fff', borderRadius: '8px', padding: '0 10px',
                                    outline: 'none',
                                }}
                            />
                            <Button
                                size="sm"
                                onClick={handleExport}
                                disabled={!filteredData.length}
                                style={{ background: '#22c55e', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', height: '32px', whiteSpace: 'nowrap' }}
                            >
                                <FaFileExcel className="me-1" /> Export
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={20}
                            paginationRowsPerPageOptions={[10, 20, 50, 100, 200]}
                            striped
                            highlightOnHover
                            responsive
                            fixedHeader
                            fixedHeaderScrollHeight="55vh"
                            customStyles={customTableStyles}
                            conditionalRowStyles={[
                                {
                                    when: r => r.Status === 'Not Found',
                                    style: { background: '#fff5f5', borderLeft: '4px solid #ef4444' },
                                },
                                {
                                    when: r => r.Status === 'Error',
                                    style: { background: '#fffbeb', borderLeft: '4px solid #f59e0b' },
                                },
                                {
                                    when: r => r.Status === 'Found',
                                    style: { borderLeft: '4px solid #22c55e' },
                                },
                            ]}
                            noDataComponent={
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                    No records match the current filter.
                                </div>
                            }
                        />
                    </Card.Body>
                </Card>
            )}

            {/* ── Empty state ───────────────────────────────────── */}
            {!checked && !isChecking && !excelFile && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <FaFileExcel size={52} style={{ opacity: 0.25, marginBottom: '16px' }} />
                    <p style={{ fontSize: '15px', fontWeight: '600', maxWidth: '400px', margin: '0 auto' }}>
                        Upload an Excel file with <strong>Barcode</strong>, <strong>SubCode</strong>, and <strong>ValuationType</strong> columns, then click <strong>Check Database</strong>.
                    </p>
                </div>
            )}
        </UploadPageLayout>
    );
};

export default ScanningChecking;
