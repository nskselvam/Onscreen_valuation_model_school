import React, { useState, useMemo } from 'react';
import {
    Container, Card, Form, Row, Col, Button, Badge, Spinner, Modal
} from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast } from 'react-toastify';
import { FaSearch, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import { MdCancelPresentation } from 'react-icons/md';
import {
    useGetValuationCancelDataMutation,
    useDeleteValuationRecordMutation,
} from '../../redux-slice/valuationCancelApiSlice';
import ElegantLoader from '../../components/ElegantLoader';

const DataTable = DataTableBase.default || DataTableBase;

const VALUATION_TYPE_OPTIONS = [
    { value: '', label: '-- Select Type --' },
    { value: '1', label: '1 - Examiner Valuation' },
    { value: '2', label: '2 - Chief Examiner Valuation' },
      { value: '3', label: '3 - Chief Examiner Review' },


];
const VALUATION_TYPE_MAP = [
    { value: '1', label: 'Valuation I' },
    { value: '2', label: 'Valuation II' },
    { value: '3', label: 'Valuation III' },
    { value: '4', label: 'Valuation IV' },  
]

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

// Conditional row styles based on E_flg
const conditionalRowStyles = [
    {
        when: row => row.E_flg === 'H',
        style: {
            backgroundColor: '#fff3cd',
            color: '#856404',
            fontWeight: '500',
            '&:hover': {
                backgroundColor: '#ffe69c',
                cursor: 'pointer',
            },
        },
    },
];

const ValuationCancel = () => {
    // ─── form state ────────────────────────────────────────────────────────────
    const [valuationType, setValuationType] = useState('');
    const [valuationMap, setValuationMap] = useState('');
    const [searchText, setSearchText] = useState('');   // Barcode / Examiner ID / Subcode
    const [filterText, setFilterText] = useState('');
    const [includeHold, setIncludeHold] = useState(false);

    // ─── table / modal state ───────────────────────────────────────────────────
    const [tableData, setTableData] = useState([]);
    const [searched, setSearched] = useState(false);

    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null); // { id, barcode }
    const [showHoldConfirm, setShowHoldConfirm] = useState(false);
    const [pendingHold, setPendingHold] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteAction, setPendingDeleteAction] = useState(null);
    const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
    const [pendingRelease, setPendingRelease] = useState(null);

    // ─── RTK mutations ─────────────────────────────────────────────────────────
    const [getValuationCancelData, { isLoading: isSearching }] = useGetValuationCancelDataMutation();
    const [deleteValuationRecord, { isLoading: isDeleting }] = useDeleteValuationRecordMutation();

    // ─── handlers ──────────────────────────────────────────────────────────────
    const handleView = async () => {
        if (!valuationType) {
            toast.warning('Please select a Valuation Type.');
            return;
        }
        if (!searchText.trim()) {
            toast.warning('Please enter a Barcode, Examiner ID or Subcode to search.');
            return;
        }
        try {
            const params = { valuation_type: valuationType };
            if (valuationMap) params.valuationMap = valuationMap;
            // Single search box searches all three fields
            params.barcode     = searchText.trim();
            params.examiner_id = searchText.trim();
            params.subcode     = searchText.trim();
            params.includeHold = includeHold;

            const result = await getValuationCancelData(params).unwrap();
            setTableData(result.data || []);
            setSearched(true);
            if ((result.data || []).length === 0) {
                toast.info('No records found for the given criteria.');
            }
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to fetch data.');
        }
    };

    const handleDeleteClick = (row) => {
        setPendingDelete({ id: row.id, barcode: row.barcode, subcode: row.subcode });
        setShowConfirm(true);
    };

    const handleHoldClick = (row) => {
        setPendingHold({ id: row.id, barcode: row.barcode, subcode: row.subcode, action: 'Hold' });
        setShowHoldConfirm(true);
    };

    const handleDeleteActionClick = (row) => {
        setPendingDeleteAction({ id: row.id, barcode: row.barcode, subcode: row.subcode, action: 'Delete' });
        setShowDeleteConfirm(true);
    };

    const handleReleaseClick = (row) => {
        setPendingRelease({ id: row.id, barcode: row.barcode, subcode: row.subcode, action: 'Hold Release' });
        setShowReleaseConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await deleteValuationRecord({
                valuation_type: valuationType,
                barcode: pendingDelete.barcode,
                id: pendingDelete.id,
                valuationMap: valuationMap,
                action: 'Cancel'
            }).unwrap();
            toast.success(`Valuation for barcode ${pendingDelete.barcode} cancelled successfully.`);
            setShowConfirm(false);
            setPendingDelete(null);
            handleView();
        } catch (err) {
            toast.error(err?.data?.message || 'Delete failed.');
            setShowConfirm(false);
        }
    };

    const handleConfirmHold = async () => {
        if (!pendingHold) return;
        try {
            await deleteValuationRecord({
                valuation_type: valuationType,
                barcode: pendingHold.barcode,
                id: pendingHold.id,
                valuationMap: valuationMap,
                action: 'Hold'
            }).unwrap();
            toast.success(`Valuation for barcode ${pendingHold.barcode} has been put on hold.`);
            setShowHoldConfirm(false);
            setPendingHold(null);
            handleView();
        } catch (err) {
            toast.error(err?.data?.message || 'Hold action failed.');
            setShowHoldConfirm(false);
        }
    };

    const handleConfirmDeleteAction = async () => {
        if (!pendingDeleteAction) return;
        try {
            await deleteValuationRecord({
                valuation_type: valuationType,
                barcode: pendingDeleteAction.barcode,
                id: pendingDeleteAction.id,
                valuationMap: valuationMap,
                action: 'Delete'
            }).unwrap();
            toast.success(`Valuation for barcode ${pendingDeleteAction.barcode} deleted successfully.`);
            setShowDeleteConfirm(false);
            setPendingDeleteAction(null);
            handleView();
        } catch (err) {
            toast.error(err?.data?.message || 'Delete action failed.');
            setShowDeleteConfirm(false);
        }
    };

    const handleConfirmRelease = async () => {
        if (!pendingRelease) return;
        try {
            await deleteValuationRecord({
                valuation_type: valuationType,
                barcode: pendingRelease.barcode,
                id: pendingRelease.id,
                valuationMap: valuationMap,
                action: 'Hold Release'
            }).unwrap();
            toast.success(`Hold released for barcode ${pendingRelease.barcode}.`);
            setShowReleaseConfirm(false);
            setPendingRelease(null);
            handleView();
        } catch (err) {
            toast.error(err?.data?.message || 'Release action failed.');
            setShowReleaseConfirm(false);
        }
    };

    const handleReset = () => {
        setValuationType('');
        setValuationMap('');
        setSearchText('');
        setFilterText('');
        setIncludeHold(false);
        setTableData([]);
        setSearched(false);
    };

    // ─── filtered data ─────────────────────────────────────────────────────────
    const filteredData = useMemo(() => {
        const q = filterText.toLowerCase();
        return tableData.filter(
            (r) =>
                (r.barcode || '').toLowerCase().includes(q) ||
                (r.subcode || '').toLowerCase().includes(q) ||
                (r.Evaluator_Id || '').toLowerCase().includes(q) ||
                (r.Dep_Name || '').toLowerCase().includes(q) ||
                (r.Checked || '').toLowerCase().includes(q)
        );
    }, [tableData, filterText]);

    // ─── columns ───────────────────────────────────────────────────────────────
    const columns = [
        {
            name: 'S.No',
            selector: (_, i) => i + 1,
            width: '60px',
            cell: (_, i) => <div style={{ textAlign: 'center' }}>{i + 1}</div>,
        },
        {
            name: 'Barcode',
            selector: (r) => r.barcode || '—',
            sortable: true,
            width: '110px',
            cell: (r) => (
                <span style={{ fontWeight: '600', color: '#1a3a5c' }}>{r.barcode || '—'}</span>
            ),
        },
        {
            name: 'Subcode',
            selector: (r) => r.subcode || '—',
            sortable: true,
            width: '100px',
        },
        {
            name: 'Dept',
            selector: (r) => r.Dep_Name || '—',
            sortable: true,
            width: '70px',
        },
        {
            name: 'Examiner ID',
            selector: (r) => r.Evaluator_Id || '—',
            sortable: true,
            width: '130px',
        },
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
        {
            name: 'Total',
            selector: (r) => r.total ?? '—',
            sortable: true,
            width: '70px',
            cell: (r) => <div style={{ textAlign: 'center' }}>{r.total ?? '—'}</div>,
        },
        {
            name: 'Rounded',
            selector: (r) => r.tot_round ?? '—',
            width: '80px',
            cell: (r) => <div style={{ textAlign: 'center' }}>{r.tot_round ?? '—'}</div>,
        },
        {
            name: 'Chief Flg',
            selector: (r) => r.Chief_Flg || '—',
            width: '85px',
            cell: (r) => (
                <div style={{ textAlign: 'center' }}>
                    {r.Chief_Flg === 'Y' ? (
                    <Badge bg="primary">Yes</Badge>
                    ) : (
                        <Badge bg="light" text="dark">No</Badge>
                    )}
                </div>
            ),
        },
        {
            name: 'Chief Total',
            selector: (r) => r.Chief_total ?? '—',
            width: '90px',
            cell: (r) => <div style={{ textAlign: 'center' }}>{r.Chief_total ?? '—'}</div>,
        },
        {
            name: 'Check Date',
            selector: (r) => r.checkdate || '—',
            sortable: true,
            width: '130px',
        },
        {
            name: 'Mon-Year',
            selector: (r) => r.Eva_Mon_Year || '—',
            sortable: true,
            width: '100px',
        },
        {
            name: 'Action',
            width: '320px',
            cell: (r) => {
                const canHold = r.Checked === 'NO' && r.E_flg === 'A';
                const canRelease = r.Checked === 'NO' && r.E_flg === 'H';
                
                return (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <Button
                            size="sm"
                            variant="warning"
                            title={canHold ? "Hold" : "Hold (Requires Checked=NO and E_flg=A)"}
                            onClick={() => handleHoldClick(r)}
                            disabled={!canHold}
                            style={{
                                borderRadius: '6px',
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                            }}
                        >
                            Hold
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            title="Delete"
                            onClick={() => handleDeleteActionClick(r)}
                            style={{
                                borderRadius: '6px',
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                            }}
                        >
                            Delete
                        </Button>
                        <Button
                            size="sm"
                            variant="success"
                            title={canRelease ? "Hold Release" : "Hold Release (Requires Checked=NO and E_flg=H)"}
                            onClick={() => handleReleaseClick(r)}
                            disabled={!canRelease}
                            style={{
                                borderRadius: '6px',
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                            }}
                        >
                            Hold Release
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-danger"
                            title="Cancel Valuation"
                            onClick={() => handleDeleteClick(r)}
                            style={{
                                borderRadius: '6px',
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                            }}
                        >
                            <FaTrashAlt /> Cancel
                        </Button>
                    </div>
                );
            },
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
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(26,58,92,0.25)',
                }}
            >
                <MdCancelPresentation style={{ fontSize: '2rem' }} />
                <div>

                    <h5 style={{ margin: 0, fontWeight: '700', fontSize: '1.2rem' }}>
                        Valuation Cancel
                    </h5>
                    <small style={{ opacity: 0.85 }}>
                        Search &amp; cancel examiner valuation records
                    </small>
                </div>
            </div>

            {/* ── Search card ── */}
            <Card className="shadow-sm mb-3" style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}>
                <Card.Header
                    style={{
                        backgroundColor: '#f0f4fa',
                        borderBottom: '2px solid #c8d8f0',
                        fontWeight: '600',
                        color: '#1a3a5c',
                    }}
                >
                    Search Criteria
                </Card.Header>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        {/* Valuation Type combo */}
                        <Col xs={12} md={2}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                                Valuation Type <span style={{ color: '#dc3545' }}>*</span>
                            </Form.Label>
                            <Form.Select
                                value={valuationType}
                                onChange={(e) => setValuationType(e.target.value)}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            >
                                {VALUATION_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Valuation Map combo */}
                        <Col xs={12} md={2}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                                Valuation
                            </Form.Label>
                            <Form.Select
                                value={valuationMap}
                                onChange={(e) => setValuationMap(e.target.value)}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            >
                                <option value=''>-- All --</option>
                                {VALUATION_TYPE_MAP.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Combined search input */}
                        <Col xs={12} md={3}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                                Barcode / Examiner ID / Subcode
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Barcode, Examiner ID or Subcode"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleView()}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            />
                        </Col>

                        {/* Include Hold Checkbox */}
                        <Col xs={12} md={1}>
                            <Form.Check
                                type="checkbox"
                                id="includeHoldCheck"
                                label="Barccode to Delete"
                                checked={includeHold}
                                onChange={(e) => setIncludeHold(e.target.checked)}
                                style={{ marginTop: '28px', fontSize: '0.88rem' }}
                            />
                        </Col>

                        {/* Buttons */}
                        <Col xs={12} md={2}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                    variant="primary"
                                    onClick={handleView}
                                    disabled={isSearching}
                                    style={{
                                        borderRadius: '7px',
                                        fontWeight: '600',
                                        fontSize: '0.88rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        flex: 1,
                                    }}
                                >
                                    {isSearching ? (
                                        <Spinner size="sm" animation="border" />
                                    ) : (
                                        <FaSearch />
                                    )}
                                    View
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleReset}
                                    style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                                    title="Reset"
                                >
                                    Reset
                                </Button>
                            </div>
                        </Col>
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
                            <Badge bg="primary" pill>
                                {filteredData.length}
                            </Badge>
                        </span>
                        <Form.Control
                            type="text"
                            placeholder="Filter results…"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            style={{
                                width: '220px',
                                fontSize: '0.82rem',
                                borderRadius: '7px',
                            }}
                        />
                    </Card.Header>
                    <Card.Body className="p-0">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={15}
                            paginationRowsPerPageOptions={[10, 15, 25, 50]}
                            highlightOnHover
                            responsive
                            striped
                            customStyles={customTableStyles}
                            conditionalRowStyles={conditionalRowStyles}
                            noDataComponent={
                                <div className="py-4 text-muted" style={{ fontSize: '0.95rem' }}>
                                    No records found.
                                </div>
                            }
                            progressPending={isSearching}
                            progressComponent={
                                <ElegantLoader 
                                    message="Searching records..." 
                                    size="medium"
                                    variant="primary"
                                />
                            }
                        />
                    </Card.Body>
                </Card>
            )}

            {/* ── Confirm Delete Modal ── */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#fff5f5', borderBottom: '3px solid #dc3545' }}>
                    <Modal.Title style={{ color: '#dc3545', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaExclamationTriangle /> Confirm Cancellation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem' }}>
                    <div
                        style={{
                            backgroundColor: '#fff5f5',
                            border: '1px solid #ffc9c9',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            lineHeight: '1.8',
                        }}
                    >
                        <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>
                            Are you sure you want to <strong style={{ color: '#dc3545' }}>cancel</strong> the
                            valuation for:
                        </p>
                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem' }}>
                            <strong>Barcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c', fontWeight: '700' }}>
                                {pendingDelete?.barcode}
                            </span>
                            <br />
                            <strong>Subcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>{pendingDelete?.subcode}</span>
                            <br />
                            <strong>Type&nbsp;&nbsp;&nbsp;&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>
                                {VALUATION_TYPE_OPTIONS.find((o) => o.value === valuationType)?.label}
                            </span>
                        </p>
                        <p
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: '#fff3cd',
                                borderRadius: '4px',
                                border: '1px solid #ffeaa7',
                                color: '#856404',
                                fontSize: '0.88rem',
                                marginBottom: 0,
                            }}
                        >
                            ⚠️ This action will reset all valuation marks for this barcode. It cannot be undone.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', gap: '0.75rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowConfirm(false)}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600' }}
                    >
                        No, Keep It
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600', minWidth: '130px' }}
                    >
                        {isDeleting ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" /> Cancelling…
                            </>
                        ) : (
                            <>
                                <FaTrashAlt className="me-1" /> Yes, Cancel
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Confirm Hold Modal ── */}
            <Modal show={showHoldConfirm} onHide={() => setShowHoldConfirm(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#fff9e6', borderBottom: '3px solid #ffc107' }}>
                    <Modal.Title style={{ color: '#856404', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaExclamationTriangle /> Confirm Hold
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem' }}>
                    <div
                        style={{
                            backgroundColor: '#fff9e6',
                            border: '1px solid #ffe69c',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            lineHeight: '1.8',
                        }}
                    >
                        <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>
                            Are you sure you want to <strong style={{ color: '#ffc107' }}>hold</strong> the
                            valuation for:
                        </p>
                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem' }}>
                            <strong>Barcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c', fontWeight: '700' }}>
                                {pendingHold?.barcode}
                            </span>
                            <br />
                            <strong>Subcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>{pendingHold?.subcode}</span>
                            <br />
                            <strong>Type&nbsp;&nbsp;&nbsp;&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>
                                {VALUATION_TYPE_OPTIONS.find((o) => o.value === valuationType)?.label}
                            </span>
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', gap: '0.75rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowHoldConfirm(false)}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="warning"
                        onClick={handleConfirmHold}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600', minWidth: '130px' }}
                    >
                        {isDeleting ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" /> Processing…
                            </>
                        ) : (
                            'Yes, Hold'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Confirm Delete Modal ── */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#fff5f5', borderBottom: '3px solid #dc3545' }}>
                    <Modal.Title style={{ color: '#dc3545', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaExclamationTriangle /> Confirm Delete
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem' }}>
                    <div
                        style={{
                            backgroundColor: '#fff5f5',
                            border: '1px solid #ffc9c9',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            lineHeight: '1.8',
                        }}
                    >
                        <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>
                            Are you sure you want to <strong style={{ color: '#dc3545' }}>delete</strong> the
                            valuation for:
                        </p>
                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem' }}>
                            <strong>Barcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c', fontWeight: '700' }}>
                                {pendingDeleteAction?.barcode}
                            </span>
                            <br />
                            <strong>Subcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>{pendingDeleteAction?.subcode}</span>
                            <br />
                            <strong>Type&nbsp;&nbsp;&nbsp;&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>
                                {VALUATION_TYPE_OPTIONS.find((o) => o.value === valuationType)?.label}
                            </span>
                        </p>
                        <p
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: '#fff3cd',
                                borderRadius: '4px',
                                border: '1px solid #ffeaa7',
                                color: '#856404',
                                fontSize: '0.88rem',
                                marginBottom: 0,
                            }}
                        >
                            ⚠️ This action will permanently delete the valuation data. It cannot be undone.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', gap: '0.75rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmDeleteAction}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600', minWidth: '130px' }}
                    >
                        {isDeleting ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" /> Deleting…
                            </>
                        ) : (
                            <>
                                <FaTrashAlt className="me-1" /> Yes, Delete
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Confirm Hold Release Modal ── */}
            <Modal show={showReleaseConfirm} onHide={() => setShowReleaseConfirm(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#e8f5e9', borderBottom: '3px solid #28a745' }}>
                    <Modal.Title style={{ color: '#155724', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaExclamationTriangle /> Confirm Hold Release
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem' }}>
                    <div
                        style={{
                            backgroundColor: '#e8f5e9',
                            border: '1px solid #c3e6cb',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            lineHeight: '1.8',
                        }}
                    >
                        <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>
                            Are you sure you want to <strong style={{ color: '#28a745' }}>release hold</strong> for:
                        </p>
                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem' }}>
                            <strong>Barcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c', fontWeight: '700' }}>
                                {pendingRelease?.barcode}
                            </span>
                            <br />
                            <strong>Subcode&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>{pendingRelease?.subcode}</span>
                            <br />
                            <strong>Type&nbsp;&nbsp;&nbsp;&nbsp;:</strong>{' '}
                            <span style={{ color: '#1a3a5c' }}>
                                {VALUATION_TYPE_OPTIONS.find((o) => o.value === valuationType)?.label}
                            </span>
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', gap: '0.75rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowReleaseConfirm(false)}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleConfirmRelease}
                        disabled={isDeleting}
                        style={{ borderRadius: '7px', fontWeight: '600', minWidth: '130px' }}
                    >
                        {isDeleting ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" /> Processing…
                            </>
                        ) : (
                            'Yes, Release'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ValuationCancel;
