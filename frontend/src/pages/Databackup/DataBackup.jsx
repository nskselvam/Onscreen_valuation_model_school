import React, { useState, useMemo } from 'react';
import {
    Row, Col, Card, Button, Badge, Spinner, Alert, Form,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    FaDatabase, FaDownload, FaTable, FaSearch, FaSync,
} from 'react-icons/fa';
import { MdStorage } from 'react-icons/md';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';
import { useGetBackupTablesQuery } from '../../redux-slice/dataBackupApiSlice';
import { BASE_URL } from '../../constraint/constraint';

/* ── Format bytes → human-readable ───────────────────────────── */
const fmtBytes = (bytes) => {
    const b = Number(bytes);
    if (!b)              return '0 B';
    if (b < 1024)        return `${b} B`;
    if (b < 1048576)     return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1073741824)  return `${(b / 1048576).toFixed(1)} MB`;
    return `${(b / 1073741824).toFixed(2)} GB`;
};

/* ── Format row count with commas ─────────────────────────────── */
const fmtCount = (n) => Number(n).toLocaleString('en-IN');

/* ─────────────────────────────────────────────────────────────── */
const DataBackup = () => {
    const [search,      setSearch]      = useState('');
    const [downloading, setDownloading] = useState({}); // { tableName: true/false }

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useGetBackupTablesQuery();

    const tables = data?.tables || [];

    /* ── Filtered list ──────────────────────────────────────────── */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tables;
        return tables.filter(t => t.table_name.toLowerCase().includes(q));
    }, [tables, search]);

    /* ── Summary totals ─────────────────────────────────────────── */
    const totalRows  = tables.reduce((s, t) => s + Number(t.row_count),  0);
    const totalBytes = tables.reduce((s, t) => s + Number(t.size_bytes), 0);

    /* ── Download single table as CSV ───────────────────────────── */
    const handleDownload = async (tableName) => {
        setDownloading(prev => ({ ...prev, [tableName]: true }));
        try {
            const res = await fetch(
                `${BASE_URL}/api/data-backup/download/${encodeURIComponent(tableName)}`,
                {
                    credentials: 'include',
                    headers: { 'x-current-route': 'admin/data-backup' },
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const blob = await res.blob();
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement('a');
            const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            a.href     = url;
            a.download = `${tableName}_backup_${date}.sql`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`"${tableName}" SQL backup downloaded successfully.`);
        } catch (err) {
            toast.error(`Failed to download "${tableName}": ${err.message}`);
        } finally {
            setDownloading(prev => ({ ...prev, [tableName]: false }));
        }
    };

    /* ─────────────────────────────────────────────────────────── */
    return (
        <UploadPageLayout
            mainTopic="Data Backup"
            subTopic="Download individual PostgreSQL table data as SQL backup files"
            cardTitle="Database Tables"
        >
            {/* ── Summary strip ────────────────────────────────── */}
            <Row className="g-3 mb-4">
                {[
                    { icon: <FaTable />,    label: 'Total Tables', value: filtered.length,      color: '#1e3c72' },
                    { icon: <FaDatabase />, label: 'Total Rows',   value: fmtCount(totalRows),  color: '#0ea5e9' },
                    { icon: <MdStorage />,  label: 'Total Size',   value: fmtBytes(totalBytes), color: '#22c55e' },
                ].map(({ icon, label, value, color }) => (
                    <Col xs={12} sm={4} key={label}>
                        <Card style={{
                            border: `2px solid ${color}30`,
                            background: `${color}0d`,
                            borderRadius: '14px',
                            textAlign: 'center',
                            padding: '14px 10px',
                        }}>
                            <div style={{ color, fontSize: '1.5rem', marginBottom: '4px' }}>{icon}</div>
                            <div style={{ fontWeight: '800', fontSize: '1.4rem', color }}>{value}</div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ── Toolbar ──────────────────────────────────────── */}
            <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
                    <Form.Control
                        placeholder="Search table name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px', borderRadius: '10px', fontSize: '13px', height: '40px', borderColor: '#c8d6e5' }}
                    />
                </div>
                <Button
                    onClick={refetch}
                    disabled={isFetching}
                    variant="outline-secondary"
                    style={{ borderRadius: '10px', height: '40px', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                    {isFetching
                        ? <><Spinner size="sm" className="me-1" />Refreshing…</>
                        : <><FaSync className="me-1" />Refresh</>
                    }
                </Button>
            </div>

            {/* ── States ───────────────────────────────────────── */}
            {isLoading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-2" style={{ color: '#64748b', fontSize: '13px' }}>Loading tables…</div>
                </div>
            )}

            {isError && !isLoading && (
                <Alert variant="danger" style={{ borderRadius: '12px' }}>
                    Failed to load table list. Check your backend connection and try refreshing.
                </Alert>
            )}

            {/* ── Table cards ──────────────────────────────────── */}
            {!isLoading && !isError && (
                <>
                    {filtered.length === 0 ? (
                        <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                            <FaDatabase size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                            <p style={{ fontWeight: '600', fontSize: '14px' }}>
                                {search ? `No tables matching "${search}"` : 'No tables found.'}
                            </p>
                        </div>
                    ) : (
                        <Row className="g-3">
                            {filtered.map((t) => {
                                const isDown = !!downloading[t.table_name];
                                return (
                                    <Col xs={12} sm={6} lg={4} xl={3} key={t.table_name}>
                                        <Card style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '14px',
                                            boxShadow: '0 2px 12px rgba(30,60,114,0.07)',
                                            transition: 'box-shadow 0.2s, transform 0.15s',
                                            height: '100%',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(30,60,114,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,60,114,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            {/* Colour bar */}
                                            <div style={{ height: '5px', background: 'linear-gradient(90deg,#1e3c72,#2a5298)', borderRadius: '14px 14px 0 0' }} />

                                            <Card.Body className="p-3 d-flex flex-column gap-2">
                                                {/* Table name */}
                                                <div className="d-flex align-items-center gap-2">
                                                    <FaTable color="#1e3c72" size={15} style={{ flexShrink: 0 }} />
                                                    <span style={{
                                                        fontWeight: '700', fontSize: '13px', color: '#1e3c72',
                                                        wordBreak: 'break-all', lineHeight: 1.3,
                                                    }}>
                                                        {t.table_name}
                                                    </span>
                                                </div>

                                                {/* Row count prominent display */}
                                                <div style={{
                                                    background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                                                    border: '1px solid #bfdbfe',
                                                    borderRadius: '10px',
                                                    padding: '8px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                        Total Records
                                                    </span>
                                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e40af', lineHeight: 1 }}>
                                                        {fmtCount(t.row_count)}
                                                    </span>
                                                </div>

                                                {/* Size prominent display */}
                                                <div style={{
                                                    background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                                                    border: '1px solid #bbf7d0',
                                                    borderRadius: '10px',
                                                    padding: '8px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                        File Size
                                                    </span>
                                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#166534', lineHeight: 1 }}>
                                                        {fmtBytes(t.size_bytes)}
                                                    </span>
                                                </div>

                                                {/* Download button */}
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleDownload(t.table_name)}
                                                    disabled={isDown}
                                                    className="mt-auto"
                                                    style={{
                                                        background: isDown ? '#94a3b8' : 'linear-gradient(135deg,#1e3c72,#2a5298)',
                                                        border: 'none',
                                                        borderRadius: '9px',
                                                        fontWeight: '700',
                                                        fontSize: '12px',
                                                        height: '34px',
                                                    }}
                                                >
                                                    {isDown
                                                        ? <><Spinner size="sm" className="me-1" />Downloading…</>
                                                        : <><FaDownload className="me-1" />Download SQL</>
                                                    }
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}

                    {filtered.length > 0 && (
                        <div className="mt-3 text-end" style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Showing {filtered.length} of {tables.length} table(s)
                        </div>
                    )}
                </>
            )}
        </UploadPageLayout>
    );
};

export default DataBackup;
