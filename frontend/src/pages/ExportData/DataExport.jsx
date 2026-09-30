import React, { useState, useMemo } from 'react';
import {
    Container, Card, Form, Row, Col, Button, Badge, Spinner,
} from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast } from 'react-toastify';
import { FaSearch, FaFileExcel, FaFileCsv } from 'react-icons/fa';
import { MdDownload } from 'react-icons/md';
import * as XLSX from 'xlsx';
import { useGetExportDataMutation } from '../../redux-slice/dataExportApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

const VALUATION_TYPE_OPTIONS = [
    { value: '', label: '-- Select Type --' },
    { value: '1', label: '1 - Examiner Valuation' },
    { value: '2', label: '2 - Chief Examiner Valuation' },

];

const VALUATION_MAP_OPTIONS = [
    { value: '', label: '-- All --' },
    { value: '1', label: 'Valuation I' },
    { value: '2', label: 'Valuation II' },
    { value: '3', label: 'Valuation III' },
    { value: '4', label: 'Valuation IV' },
];

const customTableStyles = {
    headRow: {
        style: {
            backgroundColor: '#1a3a5c',
            color: '#fff',
            fontWeight: '700',
            fontSize: '0.85rem',
            borderRadius: '6px 6px 0 0',
        },
    },
    headCells: { style: { color: '#fff', fontWeight: '700' } },
    rows: {
        style: { fontSize: '0.83rem', borderBottom: '1px solid #e9ecef' },
        highlightOnHoverStyle: { backgroundColor: '#eef3fb', cursor: 'default' },
    },
    pagination: { style: { borderTop: '1px solid #dee2e6', fontSize: '0.82rem' } },
};

const DataExport = () => {
    // ─── filter state ──────────────────────────────────────────────────────────
    const [valuationType, setValuationType] = useState('');
    const [valuationMap, setValuationMap]   = useState('');
    const [searchText, setSearchText]       = useState('');   // Camp ID / Camp Officer ID / Subcode / Evaluator ID
    const [filterText, setFilterText]       = useState('');

    // ─── table state ───────────────────────────────────────────────────────────
    const [tableData, setTableData] = useState([]);
    const [searched, setSearched]   = useState(false);

    // ─── RTK mutation ──────────────────────────────────────────────────────────
    const [getExportData, { isLoading: isFetching }] = useGetExportDataMutation();

    // ─── handlers ──────────────────────────────────────────────────────────────
    const handleView = async () => {
        if (!valuationType) {
            toast.warning('Please select a Valuation Type.');
            return;
        }
        try {
            const params = { valuation_type: valuationType };
            if (valuationMap)         params.valuation_map  = valuationMap;
            if (searchText.trim()) {
                params.camp_id        = searchText.trim();
                params.camp_office_id = searchText.trim();
                params.subcode        = searchText.trim();
                params.evaluator_id   = searchText.trim();
            }

            const result = await getExportData(params).unwrap();
            setTableData(result.data || []);
            setSearched(true);
            setFilterText('');
            if ((result.data || []).length === 0) {
                toast.info('No records found for the given criteria.');
            } else {
                toast.success(`${result.count} record(s) fetched.`);
            }
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to fetch data.');
        }
    };

    const handleReset = () => {
        setValuationType('');
        setValuationMap('');
        setSearchText('');
        setFilterText('');
        setTableData([]);
        setSearched(false);
    };

    // ─── filtered data ─────────────────────────────────────────────────────────
    const filteredData = useMemo(() => {
        const q = filterText.toLowerCase();
        if (!q) return tableData;
        return tableData.filter(
            (r) =>
                (r.barcode              || '').toLowerCase().includes(q) ||
                (r.subcode              || '').toLowerCase().includes(q) ||
                (r.Evaluator_Id         || '').toLowerCase().includes(q) ||
                (r.Dep_Name             || '').toLowerCase().includes(q) ||
                (r.Camp_id              || '').toLowerCase().includes(q) ||
                (r.camp_offcer_id_examiner || '').toLowerCase().includes(q) ||
                (r.Eva_Mon_Year         || '').toLowerCase().includes(q) ||
                (r.malpractice          || '').toLowerCase().includes(q)
        );
    }, [tableData, filterText]);

    // ─── build export rows ─────────────────────────────────────────────────────
    const buildExportRows = () =>
        filteredData.map((r, idx) => ({
            'S.No':               idx + 1,
            'Barcode':            r.barcode            || '',
            'Subcode':            r.subcode            || '',
            'Department':         r.Dep_Name           || '',
            'Evaluator ID':       r.Evaluator_Id       || '',
            'Camp ID':            r.Camp_id            || '',
            'Camp Officer ID':    r.camp_offcer_id_examiner || '',
            'Total':              r.total              ?? '',
            'Rounded':            r.tot_round          ?? '',
            'Check Date':         r.checkdate          || '',
            'Mon-Year':           r.Eva_Mon_Year       || '',
            'Chief Flag':         r.Chief_Flg          || '',
            'Chief Checked':      r.Chief_Checked      || '',
            'Chief Evaluator ID': r.Chief_Valuation_Evaluator_Id || '',
            'Chief Total':        r.Chief_total        ?? '',
            'Chief Rounded':      r.Chief_tot_round    ?? '',
            'Chief Check Date':   r.Chief_checkdate    || '',
            'Malpractice':        r.malpractice        || 'No',
        }));

    // ─── Export to Excel ───────────────────────────────────────────────────────
    const handleExportExcel = () => {
        if (filteredData.length === 0) { toast.warning('No data to export.'); return; }
        const rows      = buildExportRows();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook  = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Valuation Data');
        XLSX.writeFile(workbook, `Valuation_Export_Type${valuationType}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
        toast.success('Excel exported successfully.');
    };

    // ─── Export to CSV ─────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (filteredData.length === 0) { toast.warning('No data to export.'); return; }
        const rows      = buildExportRows();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const csv       = XLSX.utils.sheet_to_csv(worksheet);
        const blob      = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url       = URL.createObjectURL(blob);
        const a         = document.createElement('a');
        a.href          = url;
        a.download      = `Valuation_Export_Type${valuationType}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported successfully.');
    };

    // ─── columns ───────────────────────────────────────────────────────────────
    const columns = [
        { name: 'S.No', selector: (_, i) => i + 1, width: '60px', cell: (_, i) => <div style={{ textAlign: 'center' }}>{i + 1}</div> },
        {
            name: 'Barcode',
            selector: (r) => r.barcode || '—',
            sortable: true,
            width: '115px',
            cell: (r) => <span style={{ fontWeight: '600', color: '#1a3a5c' }}>{r.barcode || '—'}</span>,
        },
        { name: 'Subcode',        selector: (r) => r.subcode            || '—', sortable: true, width: '100px' },
        { name: 'Dept',           selector: (r) => r.Dep_Name           || '—', width: '70px'  },
        { name: 'Evaluator ID',   selector: (r) => r.Evaluator_Id       || '—', sortable: true, width: '130px' },
        { name: 'Camp ID',        selector: (r) => r.Camp_id            || '—', sortable: true, width: '100px' },
        { name: 'Camp Officer ID',selector: (r) => r.camp_offcer_id_examiner || '—', sortable: true, width: '130px' },
        { name: 'Lot',            selector: (r) => r.Implot             || '—', width: '60px', cell: (r) => <div style={{ textAlign: 'center' }}>{r.Implot || '—'}</div> },
        {
            name: 'Status',
            selector: (r) => r.Checked || '—',
            width: '90px',
            cell: (r) => (
                <div style={{ textAlign: 'center' }}>
                    {r.Checked === 'Yes' ? (
                    <Badge bg="success">Done</Badge>
                ) : r.Checked ? (
                    <Badge bg="warning" text="dark">{r.Checked}</Badge>
                    ) : (
                        <Badge bg="secondary">Pending</Badge>
                    )}
                </div>
            ),
        },
        { name: 'Total',    selector: (r) => r.total     ?? '—', width: '70px', cell: (r) => <div style={{ textAlign: 'center' }}>{r.total ?? '—'}</div> },
        { name: 'Rounded',  selector: (r) => r.tot_round ?? '—', width: '80px', cell: (r) => <div style={{ textAlign: 'center' }}>{r.tot_round ?? '—'}</div> },
        {
            name: 'Chief',
            selector: (r) => r.Chief_Flg || '—',
            width: '70px',
            cell: (r) => (
                <div style={{ textAlign: 'center' }}>
                    {r.Chief_Flg === 'Y' ? <Badge bg="primary">Yes</Badge> : <Badge bg="light" text="dark">No</Badge>}
                </div>
            ),
        },
        { name: 'Check Date', selector: (r) => r.checkdate    || '—', sortable: true, width: '130px' },
        { name: 'Mon-Year',   selector: (r) => r.Eva_Mon_Year || '—', sortable: true, width: '100px' },
        {
            name: 'Malpractice',
            selector: (r) => r.malpractice || 'No',
            sortable: true,
            width: '115px',
            cell: (r) => (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: r.malpractice === 'Yes' ? '#991b1b' : '#166534' }}>
                        {r.malpractice === 'Yes' ? '⚠ Yes' : 'No'}
                    </span>
                </div>
            ),
        },
    ];

    // ─── render ────────────────────────────────────────────────────────────────
    return (
        <Container fluid className="py-3 px-3">
            {/* ── Header ── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a3a5c 0%, #2563a8 100%)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '10px',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(26,58,92,0.25)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MdDownload style={{ fontSize: '2rem' }} />
                    <div>
                        <h5 style={{ margin: 0, fontWeight: '700', fontSize: '1.2rem' }}>Data Export</h5>
                        <small style={{ opacity: 0.85 }}>Filter &amp; export valuation records to Excel or CSV</small>
                    </div>
                </div>
                {/* Export buttons always visible in header */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleExportExcel}
                        disabled={filteredData.length === 0}
                        style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <FaFileExcel /> Export Excel
                    </Button>
                    <Button
                        variant="warning"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={filteredData.length === 0}
                        style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', color: '#333' }}
                    >
                        <FaFileCsv /> Export CSV
                    </Button>
                </div>
            </div>

            {/* ── Filter card ── */}
            <Card className="shadow-sm mb-3" style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}>
                <Card.Header
                    style={{
                        backgroundColor: '#f0f4fa',
                        borderBottom: '2px solid #c8d8f0',
                        fontWeight: '600',
                        color: '#1a3a5c',
                    }}
                >
                    Search / Filter Criteria
                </Card.Header>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        {/* Valuation Type */}
                        <Col xs={12} md={2}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                                Valuation Type <span style={{ color: '#dc3545' }}>*</span>
                            </Form.Label>
                            <Form.Select
                                value={valuationType}
                                onChange={(e) => setValuationType(e.target.value)}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            >
                                {VALUATION_TYPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Valuation (map / lot) */}
                        <Col xs={12} md={2}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>Valuation</Form.Label>
                            <Form.Select
                                value={valuationMap}
                                onChange={(e) => setValuationMap(e.target.value)}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            >
                                {VALUATION_MAP_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Combined search — Camp ID / Camp Officer ID / Subcode / Evaluator ID */}
                        <Col xs={12} md={4}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                                Camp ID / Camp Officer ID / Subcode / Evaluator ID
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Camp ID, Camp Officer ID, Subcode or Evaluator ID"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleView()}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            />
                        </Col>

                        {/* View & Reset buttons — same line */}
                        <Col xs={12} md="auto">
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                    variant="primary"
                                    onClick={handleView}
                                    disabled={isFetching}
                                    style={{
                                        borderRadius: '7px',
                                        fontWeight: '600',
                                        fontSize: '0.88rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    {isFetching ? <Spinner size="sm" animation="border" /> : <FaSearch />}
                                    View
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleReset}
                                    style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                                >
                                    Reset
                                </Button>
                            </div>
                        </Col>

                        {searched && (
                            <Col xs={12} md="auto" className="ms-auto d-flex align-items-end">
                                <span style={{ fontSize: '0.88rem', color: '#555' }}>
                                    Total Records: <strong style={{ color: '#1a3a5c' }}>{filteredData.length}</strong>
                                </span>
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            {/* ── Results card ── */}
            {searched && (
                <Card className="shadow-sm" style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}>
                    <Card.Header
                        style={{
                            backgroundColor: '#f0f4fa',
                            borderBottom: '2px solid #c8d8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ fontWeight: '600', color: '#1a3a5c' }}>
                            Valuation Records&nbsp;
                            <Badge bg="primary" pill>{filteredData.length}</Badge>
                        </span>
                        <Form.Control
                            type="text"
                            placeholder="Filter results…"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            style={{ width: '240px', fontSize: '0.82rem', borderRadius: '7px' }}
                        />
                    </Card.Header>
                    <Card.Body className="p-0">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={15}
                            paginationRowsPerPageOptions={[10, 15, 25, 50, 100]}
                            highlightOnHover
                            responsive
                            striped
                            customStyles={customTableStyles}
                            noDataComponent={
                                <div className="py-4 text-muted" style={{ fontSize: '0.95rem' }}>
                                    No records found.
                                </div>
                            }
                            progressPending={isFetching}
                            progressComponent={
                                <div className="py-4">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            }
                        />
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default DataExport;
