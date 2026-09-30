import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Modal } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { useGetSubcodeEvaluationStatusQuery } from '../../../redux-slice/valuationStatusApiSlice';
import { useSelector } from 'react-redux';
import ElegantLoader from '../../../components/ElegantLoader';

const DataTable = DataTableBase.default || DataTableBase;

const Subcode_Examiner_Details = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const Dep_Name = userInfo?.selected_course || '01';

    const [valuationType, setValuationType] = useState(1);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [modalData, setModalData] = useState(null);

    const { data: apiData, isLoading } = useGetSubcodeEvaluationStatusQuery(
        { Dep_Name, Valuation_Type: valuationType },
        { refetchOnMountOrArgChange: true }
    );

    const rawData = apiData?.data || [];

    // Flatten: one row per subcode (examiners shown as nested info)
    const filteredData = rawData.filter((item) => {
        const q = search.toLowerCase();
        if (!q) return true;
        return (
            (item.Subcode?.toLowerCase() || '').includes(q) ||
            (item.SUBNAME?.toLowerCase() || '').includes(q) ||
            item.examiners?.some(
                (e) =>
                    (e.Evaluator_Id?.toLowerCase() || '').includes(q) ||
                    (e.FACULTY_NAME?.toLowerCase() || '').includes(q)
            )
        );
    });

    const handleExportToExcel = () => {
        if (filteredData.length === 0) { alert('No data to export'); return; }
        const rows = [];
        filteredData.forEach((item, idx) => {
            const examiners = item.examiners || [];
            if (examiners.length === 0) {
                rows.push({
                    'S.No': idx + 1,
                    'Subcode': item.Subcode,
                    'Subject Name': item.SUBNAME,
                    'Type of Exam': item.Type_of_Exam,
                    'QB Flag': item.qb_flg,
                    'Ans Flag': item.ans_flg,
                    'Mismatch Flag': item.mismatch_flg,
                    'Total Scripts': item.totalCount,
                    'Checked Count': item.checkedCount,
                    'Pending Count': item.pendingCount,
                    'Examiner ID': '',
                    'Examiner Name': '',
                    'Mobile Number': '',
                    'Email ID': '',
                    'Camp ID': '',
                    'Examiner Status': '',
                    
                });
            } else {
                examiners.forEach((e, ei) => {
                    rows.push({
                        'S.No': ei === 0 ? idx + 1 : '',
                        'Subcode': item.Subcode,
                        'Subject Name': item.SUBNAME,
                        'Type of Exam': item.Type_of_Exam,
                        'QB Flag': item.qb_flg,
                        'Ans Flag': item.ans_flg,
                        'Mismatch Flag': item.mismatch_flg,
                        'Total Scripts': ei === 0 ? item.totalCount : '',
                        'Checked Count': ei === 0 ? item.checkedCount : '',
                        'Pending Count': ei === 0 ? item.pendingCount : '',
                        'Examiner ID': e.Evaluator_Id,
                        'Examiner Name': e.FACULTY_NAME,
                        'Mobile Number': e.Mobile_Number || '',
                        'Email ID': e.Email_Id || '',
                        'Camp ID': e.Camp_Id || '',
                        'Examiner Status': e.Examiner_Valuation_Status === 'Y' ? 'Completed' : 'Active'
                    });
                });
            }
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Subcode Examiner Details');
        XLSX.writeFile(wb, `Subcode_Examiner_Details_Type${valuationType}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
    };

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                minHeight: '50px',
            },
        },
        headCells: { style: { color: '#ffffff' } },
        rows: {
            style: {
                fontSize: '13px',
                minHeight: '56px',
                '&:hover': { backgroundColor: '#f0f4f8', cursor: 'pointer' },
            },
            stripedStyle: { backgroundColor: '#f8fafc' },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #e2e8f0',
            },
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
            name: 'Subcode',
            selector: (row) => row.Subcode,
            sortable: true,
            width: '110px',
            cell: (row) => (
                <div>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '13px' }}>{row.Subcode}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>{row.Type_of_Exam === 'R' ? 'Regular' : 'Arrear'}</div>
                </div>
            ),
        },
        {
            name: 'Subject Name',
            selector: (row) => row.SUBNAME,
            sortable: true,
            wrap: true,
            minWidth: '180px',
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>Type</div><div style={{ fontSize: '11px' }}>of Exam</div></div>,
            selector: (row) => row.Type_of_Exam,
            sortable: true,
            width: '70px',
            center: true,
            cell: (row) => (
                <span style={{
                    backgroundColor: row.Type_of_Exam === 'R' ? '#e9f5ff' : '#fff3cd',
                    color: row.Type_of_Exam === 'R' ? '#1e40af' : '#856404',
                    borderRadius: '4px', padding: '2px 8px', fontWeight: '600', fontSize: '12px'
                }}>{row.Type_of_Exam === 'R' ? 'Reg' :'Arr'}</span>
            ),
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>QB</div><div style={{ fontSize: '11px' }}>Flag</div></div>,
            selector: (row) => row.qb_flg,
            sortable: true,
            width: '60px',
            center: true,
            cell: (row) => (
                <span style={{
                    backgroundColor: row.qb_flg === 'Y' ? '#c6f6d5' : '#fed7d7',
                    color: row.qb_flg === 'Y' ? '#22543d' : '#742a2a',
                    borderRadius: '4px', padding: '2px 8px', fontWeight: '600', fontSize: '12px'
                }}>{row.qb_flg === 'Y' ? 'Yes' : 'No'}</span>
            ),
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>Ans</div><div style={{ fontSize: '11px' }}>Flag</div></div>,
            selector: (row) => row.ans_flg,
            sortable: true,
            width: '60px',
            center: true,
            cell: (row) => (
                <span style={{
                    backgroundColor: row.ans_flg === 'Y' ? '#c6f6d5' : '#fed7d7',
                    color: row.ans_flg === 'Y' ? '#22543d' : '#742a2a',
                    borderRadius: '4px', padding: '2px 8px', fontWeight: '600', fontSize: '12px'
                }}>{row.ans_flg === 'Y' ? 'Yes' : 'No'}</span>
            ),
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>V S</div><div style={{ fontSize: '11px' }}>Flag</div></div>,
            selector: (row) => row.mismatch_flg,
            sortable: true,
            width: '60px',
            center: true,
            cell: (row) => (
                <span style={{
                    backgroundColor: row.mismatch_flg === 'Y' ? '#c6f6d5' : '#fed7d7',
                    color: row.mismatch_flg === 'Y' ? '#22543d' : '#742a2a',
                    borderRadius: '4px', padding: '2px 8px', fontWeight: '600', fontSize: '12px'
                }}>{row.mismatch_flg === 'Y' ? 'Yes' : 'No'}</span>
            ),
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>Total</div><div style={{ fontSize: '11px' }}>Scripts</div></div>,
            selector: (row) => Number(row.totalCount),
            sortable: true,
            width: '90px',
            center: true,
            cell: (row) => <span style={{ fontWeight: '700', fontSize: '15px' }}>{row.totalCount}</span>,
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>Checked</div><div style={{ fontSize: '11px' }}>Count</div></div>,
            selector: (row) => Number(row.checkedCount),
            sortable: true,
            width: '90px',
            center: true,
            cell: (row) => <span style={{ fontWeight: '700', fontSize: '15px', color: '#38a169' }}>{row.checkedCount}</span>,
        },
        {
            name: <div style={{ textAlign: 'center' }}><div>Pending</div><div style={{ fontSize: '11px' }}>Count</div></div>,
            selector: (row) => Number(row.pendingCount),
            sortable: true,
            width: '90px',
            center: true,
            cell: (row) => <span style={{ fontWeight: '700', fontSize: '15px', color: row.pendingCount > 0 ? '#e53e3e' : '#38a169' }}>{row.pendingCount}</span>,
        },
        {
            name: 'Examiners',
            selector: (row) => row.examiners?.length,
            sortable: true,
            width: '280px',
            wrap: true,
            cell: (row) => {
                const examiners = row.examiners || [];
                if (examiners.length === 0) return <span style={{ color: '#a0aec0', fontSize: '12px' }}>No examiners</span>;
                const visible = examiners.slice(0, 2);
                return (
                    <div style={{ fontSize: '12px', lineHeight: '1.8', width: '100%' }}>
                        {visible.map((e) => (
                            <div key={e.Evaluator_Id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: '700', color: '#1e40af' }}>{e.Evaluator_Id}</span>
                                <span style={{ color: '#4a5568' }}>{e.FACULTY_NAME}</span>
                                <span style={{
                                    backgroundColor: e.Examiner_Valuation_Status === 'Y' ? '#c6f6d5' : '#fef3c7',
                                    color: e.Examiner_Valuation_Status === 'Y' ? '#22543d' : '#92400e',
                                    borderRadius: '4px', padding: '1px 6px', fontSize: '11px', fontWeight: '600'
                                }}>{e.Examiner_Valuation_Status === 'Y' ? 'Done' : 'Active'}</span>
                            </div>
                        ))}
                        {examiners.length > 2 && (
                            <button
                                onClick={() => setModalData(row)}
                                style={{ border: 'none', background: 'none', color: '#1976d2', fontSize: '11px', padding: 0, cursor: 'pointer', fontWeight: '600' }}
                            >+{examiners.length - 2} more...</button>
                        )}
                    </div>
                );
            },
        },
        {
            name: 'Progress',
            selector: (row) => row.totalCount > 0 ? Math.round((row.checkedCount / row.totalCount) * 100) : 0,
            sortable: true,
            width: '130px',
            center: true,
            cell: (row) => {
                const pct = row.totalCount > 0 ? Math.round((row.checkedCount / row.totalCount) * 100) : 0;
                const color = pct >= 80 ? '#38a169' : pct >= 40 ? '#d69e2e' : '#e53e3e';
                return (
                    <div style={{ width: '100%', padding: '0 4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color, textAlign: 'center', marginBottom: '3px' }}>{pct}%</div>
                        <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.4s' }} />
                        </div>
                    </div>
                );
            },
        },
        {
            name: 'View All',
            width: '80px',
            center: true,
            cell: (row) => (
                <button
                    onClick={() => setModalData(row)}
                    style={{
                        backgroundColor: '#1976d2', color: '#fff', border: 'none',
                        borderRadius: '4px', padding: '4px 10px', fontSize: '12px',
                        fontWeight: '600', cursor: 'pointer'
                    }}
                >View</button>
            ),
        },
    ];

    return (
        <Container fluid className="p-4">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Examiner Detail Modal */}
            <Modal show={!!modalData} onHide={() => setModalData(null)} centered size="lg">
                <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff' }}>
                    <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>
                        {modalData?.Subcode} — {modalData?.SUBNAME}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Total', value: modalData?.totalCount, color: '#2c5282' },
                            { label: 'Checked', value: modalData?.checkedCount, color: '#38a169' },
                            { label: 'Pending', value: modalData?.pendingCount, color: '#e53e3e' },
                        ].map((s) => (
                            <div key={s.label} style={{ backgroundColor: '#f7fafc', borderRadius: '6px', padding: '8px 20px', textAlign: 'center', border: `1px solid #e2e8f0` }}>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: '#718096' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>S.No</th>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>Evaluator ID</th>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>Examiner Name</th>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>Mobile Number</th>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>Email ID</th>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>Camp ID</th>
                                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(modalData?.examiners || []).map((e, i) => (
                                <tr key={e.Evaluator_Id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{i + 1}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: '700', color: '#1e40af' }}>{e.Evaluator_Id}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#4a5568' }}>{e.FACULTY_NAME}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#4a5568' }}>{e.Mobile_Number || '-'}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#4a5568' }}>{e.Email_Id || '-'}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#4a5568' }}>{e.Camp_Id || '-'}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        <span style={{
                                            backgroundColor: e.Examiner_Valuation_Status === 'Y' ? '#c6f6d5' : '#fef3c7',
                                            color: e.Examiner_Valuation_Status === 'Y' ? '#22543d' : '#92400e',
                                            borderRadius: '4px', padding: '3px 10px', fontWeight: '600', fontSize: '12px'
                                        }}>{e.Examiner_Valuation_Status === 'Y' ? 'Completed' : 'Active'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setModalData(null)}>Close</Button>
                </Modal.Footer>
            </Modal>

            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
                Subcode Examiner Details
            </h3>

            <Card className="mb-3">
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={7}>
                            <div className="d-flex gap-2 flex-wrap">
                                {[
                                    { value: 1, label: 'First Valuation', color: '#0066cc' },
                                    { value: 2, label: 'Second Valuation', color: '#28a745' },
                                    { value: 3, label: 'Third Valuation', color: '#fd7e14' },
                                    { value: 4, label: 'Fourth Valuation', color: '#6f42c1' },
                                ].map((type) => (
                                    <Button
                                        key={type.value}
                                        onClick={() => setValuationType(type.value)}
                                        style={{
                                            borderRadius: '8px', padding: '8px 18px', fontWeight: '600', fontSize: '13px',
                                            border: `2px solid ${valuationType === type.value ? type.color : '#dee2e6'}`,
                                            backgroundColor: valuationType === type.value ? type.color : '#fff',
                                            color: valuationType === type.value ? '#fff' : '#6c757d',
                                            boxShadow: valuationType === type.value ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                                        }}
                                    >{type.label}</Button>
                                ))}
                            </div>
                        </Col>
                        <Col md={5} className="d-flex align-items-center justify-content-end gap-2">
                            <Form.Control
                                type="text"
                                placeholder="🔍 Search subcode / subject / examiner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ maxWidth: '300px' }}
                            />
                            {search && (
                                <Button variant="outline-secondary" size="sm" onClick={() => setSearch('')}>✕</Button>
                            )}
                            <Button
                                variant="success"
                                size="sm"
                                onClick={handleExportToExcel}
                                disabled={filteredData.length === 0}
                            >
                                Export Excel
                            </Button>
                        </Col>
                    </Row>

                    {/* Summary Cards */}
                    {rawData.length > 0 && (
                        <Row className="mb-3">
                            {[
                                { label: 'Total Subcodes', value: rawData.length, color: '#2c5282', bg: '#ebf8ff' },
                                { label: 'Total Scripts', value: rawData.reduce((s, i) => s + (i.totalCount || 0), 0), color: '#744210', bg: '#fefcbf' },
                                { label: 'Checked', value: rawData.reduce((s, i) => s + (i.checkedCount || 0), 0), color: '#22543d', bg: '#f0fff4' },
                                { label: 'Pending', value: rawData.reduce((s, i) => s + (i.pendingCount || 0), 0), color: '#742a2a', bg: '#fff5f5' },
                            ].map((s) => (
                                <Col key={s.label} xs={6} md={3}>
                                    <div style={{ backgroundColor: s.bg, borderRadius: '8px', padding: '12px 16px', textAlign: 'center', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '12px', color: '#718096' }}>{s.label}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {isLoading ? (
                        <ElegantLoader 
                            message="Loading evaluation status..." 
                            size="medium"
                            variant="success"
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 50, 100]}
                            onChangePage={(page) => setCurrentPage(page)}
                            onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5">
                                    <p>No data found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Subcode_Examiner_Details;