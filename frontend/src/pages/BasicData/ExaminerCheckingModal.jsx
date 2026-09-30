import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import * as XLSX from 'xlsx';

const DataTable = DataTableBase.default || DataTableBase;

const ExaminerCheckingModal = ({ show, onHide, data = [] }) => {
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [showOnlyErrors, setShowOnlyErrors] = useState(true);

    const filteredData = data.filter((row) => {
        const matchesError = showOnlyErrors ? row.Remarks_Gen !== 'OK' : true;
        const q = filterText.toLowerCase();
        const matchesSearch = !q ||
            (row.Eva_Id?.toLowerCase() || '').includes(q) ||
            (row.FACULTY_NAME?.toLowerCase() || '').includes(q) ||
            (row.Remarks_Gen?.toLowerCase() || '').includes(q);
        return matchesError && matchesSearch;
    });

    const handleExport = () => {
        if (filteredData.length === 0) { alert('No data to export'); return; }
        const rows = filteredData.map((row, i) => ({
            'S.No': i + 1,
            'Evaluator ID': row.Eva_Id,
            'Faculty Name': row.FACULTY_NAME,
            'Role': row.Role,
            'vflg': row.vflg,
            'Remarks': row.Remarks_Gen,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Examiner Check');
        XLSX.writeFile(wb, `Examiner_Check_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
    };

    const errorCount = data.filter(r => r.Remarks_Gen !== 'OK').length;
    const okCount = data.length - errorCount;

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                minHeight: '46px',
            },
        },
        headCells: { style: { color: '#ffffff' } },
        rows: {
            style: {
                fontSize: '13px',
                minHeight: '50px',
                '&:hover': { backgroundColor: '#f0f4f8' },
            },
            stripedStyle: { backgroundColor: '#f8fafc' },
        },
        cells: {
            style: { paddingLeft: '8px', paddingRight: '8px', borderRight: '1px solid #e2e8f0' },
        },
    };

    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => (currentPage - 1) * perPage + index + 1,
            width: '60px',
            center: true,
        },
        {
            name: 'Evaluator ID',
            selector: (row) => row.Eva_Id,
            sortable: true,
            width: '120px',
            cell: (row) => (
                <span style={{ fontWeight: '700', color: '#1e40af' }}>{row.Eva_Id}</span>
            ),
        },
        {
            name: 'Faculty Name',
            selector: (row) => row.FACULTY_NAME,
            sortable: true,
            minWidth: '160px',
            wrap: true,
        },
        {
            name: 'Role',
            selector: (row) => row.Role,
            sortable: true,
            width: '80px',
            center: true,
        },
        {
            name: 'Status',
            selector: (row) => row.vflg,
            sortable: true,
            width: '90px',
            center: true,
            cell: (row) => (
                <span style={{
                    backgroundColor: row.vflg === 'N' ? '#c6f6d5' : '#fed7d7',
                    color: row.vflg === 'N' ? '#22543d' : '#742a2a',
                    borderRadius: '4px', padding: '3px 10px',
                    fontWeight: '600', fontSize: '12px',
                }}>
                    {row.vflg === 'N' ? 'OK' : 'Error'}
                </span>
            ),
        },
        {
            name: 'Remarks',
            selector: (row) => row.Remarks_Gen,
            sortable: true,
            wrap: true,
            minWidth: '260px',
            cell: (row) => (
                <span style={{
                    fontSize: '12px',
                    color: row.Remarks_Gen === 'OK' ? '#38a169' : '#c53030',
                    fontWeight: row.Remarks_Gen === 'OK' ? '600' : '500',
                    lineHeight: '1.5',
                }}>
                    {row.Remarks_Gen || '-'}
                </span>
            ),
        },
    ];

    return (
        <Modal show={show} onHide={onHide} centered size="xl" backdrop="static">
            <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff' }}>
                <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>
                    Faculty Cross-Check Results
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: '16px' }}>
                {/* Summary */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total', value: data.length, bg: '#ebf8ff', color: '#2c5282' },
                        { label: 'Errors', value: errorCount, bg: '#fff5f5', color: '#c53030' },
                        { label: 'OK', value: okCount, bg: '#f0fff4', color: '#22543d' },
                    ].map((s) => (
                        <div key={s.label} style={{
                            backgroundColor: s.bg, borderRadius: '8px',
                            padding: '8px 20px', textAlign: 'center',
                            border: '1px solid #e2e8f0', minWidth: '90px',
                        }}>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: '#718096' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <Form.Control
                        type="text"
                        placeholder="🔍 Search ID / Name / Remarks"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        style={{ maxWidth: '280px' }}
                    />
                    {filterText && (
                        <Button variant="outline-secondary" size="sm" onClick={() => setFilterText('')}>✕</Button>
                    )}
                    <Form.Check
                        type="switch"
                        id="error-only-switch"
                        label="Show errors only"
                        checked={showOnlyErrors}
                        onChange={(e) => setShowOnlyErrors(e.target.checked)}
                        style={{ marginLeft: '8px' }}
                    />
                    <Button variant="success" size="sm" onClick={handleExport} style={{ marginLeft: 'auto' }}>
                        Export Excel
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredData}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50, 100]}
                    onChangePage={(page) => setCurrentPage(page)}
                    onChangeRowsPerPage={(p) => setPerPage(p)}
                    highlightOnHover
                    striped
                    responsive
                    customStyles={customStyles}
                    noDataComponent={
                        <div style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>
                            {showOnlyErrors ? '✅ No errors found — all records are OK!' : 'No data found'}
                        </div>
                    }
                />
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ExaminerCheckingModal;
