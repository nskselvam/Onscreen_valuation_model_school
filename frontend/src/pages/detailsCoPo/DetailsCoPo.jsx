import React, { useState, useMemo, useEffect } from 'react';
import {
    Container, Card, Form, Row, Col, Button, Badge, Spinner,
} from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaSearch } from 'react-icons/fa';
import { MdDownload } from 'react-icons/md';
import { useGetExportDataMutation } from '../../redux-slice/dataExportApiSlice';
import {useGetCoPoDataQuery,useBlCoPoDataMutation} from '../../redux-slice/blcopoApiSlice';

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

const CREATE_TYPE_OPTIONS = [
    { value: '', label: '-- Select Type --' },
    { value: '1', label: '1 - BL Point' },
    { value: '2', label: '2 - CO Point' },
    { value: '3', label: '3 - PO Point' },
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

const DetailsCoPo = () => {
    // ─── filter state ──────────────────────────────────────────────────────────
    const [valuationType, setValuationType] = useState('');
    const [valuationMap, setValuationMap]   = useState('');
    const [selectedSubcodes, setSelectedSubcodes] = useState([]);
    const [createType, setCreateType]       = useState('');

    const storeDepName =  useSelector((state) => state.auth.userInfo?.selected_course);
    const storeEvaId =  useSelector((state) => state.auth.userInfo?.username);
    

    const { data: coPoData, isLoading: isCoPoLoading, error: coPoError } = useGetCoPoDataQuery({ Dep_Name: storeDepName });


    useEffect(() => {
        if (coPoError) {
            toast.error(coPoError?.data?.message || 'Failed to fetch CoPo data.');
        }
    }, [coPoError]);

    // ─── table state ───────────────────────────────────────────────────────────
    const [tableData, setTableData] = useState([]);
    const [searched, setSearched]   = useState(false);

    // ─── RTK mutation ──────────────────────────────────────────────────────────
    const [getExportData, { isLoading: isFetching }] = useGetExportDataMutation();
    const [blCoPoData, { isLoading: isBlCoPoLoading }] = useBlCoPoDataMutation();
    // ─── handlers ──────────────────────────────────────────────────────────────
    const handleView = async () => {
        if (!valuationType) {
            toast.warning('Please select a Valuation Type.');
            return;
        }
        try {
            const params = { valuation_type: valuationType };
            if (valuationMap)         params.valuation_map  = valuationMap;
            if (createType)           params.create_type    = createType;
            if (selectedSubcodes.length > 0) {
                params.subcodes = selectedSubcodes.join(',');
            }
            if(storeDepName) params.Dep_Name = storeDepName;
            if(storeEvaId) params.Evaluator_Id = storeEvaId;

            const result = await blCoPoData(params).unwrap();
            
            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Excel files generated and downloaded successfully!');
            setSearched(true);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to generate Excel files.');
        }
    };

    const handleReset = () => {
        setValuationType('');
        setValuationMap('');
        setSelectedSubcodes([]);
        setCreateType('');
        setTableData([]);
        setSearched(false);
    };

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
                        <h5 style={{ margin: 0, fontWeight: '700', fontSize: '1.2rem' }}>Details CO-PO</h5>
                        <small style={{ opacity: 0.85 }}>Filter CO-PO valuation records with BL, CO, and PO points</small>
                    </div>
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

                        {/* Create Type */}
                        <Col xs={12} md={2}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem' }}>BL/CO/PO Type</Form.Label>
                            <Form.Select
                                value={createType}
                                onChange={(e) => setCreateType(e.target.value)}
                                style={{ borderRadius: '7px', fontSize: '0.88rem' }}
                            >
                                {CREATE_TYPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Subcode Checkboxes */}
                        <Col xs={12} md={3}>
                            <Form.Label style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                                Subcode(s) <Badge bg="info" pill style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>{selectedSubcodes.length}</Badge>
                            </Form.Label>
                            <div style={{ 
                                borderRadius: '8px', 
                                fontSize: '0.85rem', 
                                maxHeight: '150px',
                                overflowY: 'auto',
                                border: '2px solid #c8d8f0',
                                padding: '0.5rem',
                                backgroundColor: '#f8f9fa'
                            }}>
                                {isCoPoLoading ? (
                                    <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', padding: '1rem' }}>
                                        🔄 Loading subcodes...
                                    </div>
                                ) : coPoData?.data && coPoData.data.length > 0 ? (
                                    <>
                                        {/* Select All Checkbox */}
                                        <Form.Check
                                            type="checkbox"
                                            id="select-all-subcodes"
                                            label={<strong>✓ Select All</strong>}
                                            checked={selectedSubcodes.length === coPoData.data.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSubcodes(coPoData.data.map(s => s));
                                                } else {
                                                    setSelectedSubcodes([]);
                                                }
                                            }}
                                            style={{ 
                                                marginBottom: '0.5rem',
                                                paddingBottom: '0.5rem',
                                                borderBottom: '1px solid #dee2e6'
                                            }}
                                        />
                                        {coPoData.data.map((subcode) => (
                                            <Form.Check
                                                key={subcode}
                                                type="checkbox"
                                                id={`subcode-${subcode}`}
                                                label={`📚 ${subcode}`}
                                                checked={selectedSubcodes.includes(subcode)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSubcodes([...selectedSubcodes, subcode]);
                                                    } else {
                                                        setSelectedSubcodes(selectedSubcodes.filter(s => s !== subcode));
                                                    }
                                                }}
                                                style={{ marginBottom: '0.3rem' }}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#dc3545', fontStyle: 'italic', padding: '1rem' }}>
                                        ⚠️ No subcodes available
                                    </div>
                                )}
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                marginTop: '0.4rem'
                            }}>
                                {selectedSubcodes.length > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="link" 
                                        onClick={() => setSelectedSubcodes([])}
                                        style={{ 
                                            fontSize: '0.75rem', 
                                            padding: '0',
                                            textDecoration: 'none',
                                            color: '#dc3545'
                                        }}
                                    >
                                        ✕ Clear all
                                    </Button>
                                )}
                            </div>
                        </Col>

                        {/* View & Reset buttons — same line */}
                        <Col xs={12} md="auto">
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                    variant="primary"
                                    onClick={handleView}
                                    disabled={isBlCoPoLoading}
                                    style={{
                                        borderRadius: '7px',
                                        fontWeight: '600',
                                        fontSize: '0.88rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    {isBlCoPoLoading ? <Spinner size="sm" animation="border" /> : <FaSearch />}
                                   Generate
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
                    </Row>
                </Card.Body>
            </Card>

            {/* ── Results / Loader ── */}
            {searched && (
                <Card className="shadow-sm" style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}>
                    <Card.Body className="p-5">
                        {isBlCoPoLoading ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '400px',
                                gap: '1.5rem'
                            }}>
                                <div style={{
                                    position: 'relative',
                                    width: '100px',
                                    height: '100px'
                                }}>
                                    <Spinner
                                        animation="border"
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            borderWidth: '5px',
                                            color: '#1a3a5c'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: '2rem'
                                    }}>
                                        📊
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ color: '#1a3a5c', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        Generating Excel Files...
                                    </h4>
                                    <p style={{ color: '#6c757d', fontSize: '0.95rem', marginBottom: '0' }}>
                                        Please wait while we prepare your download
                                    </p>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginTop: '1rem'
                                }}>
                                    <div className="loading-dot" style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1a3a5c',
                                        animation: 'bounce 1.4s infinite ease-in-out both',
                                        animationDelay: '-0.32s'
                                    }}></div>
                                    <div className="loading-dot" style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#2563a8',
                                        animation: 'bounce 1.4s infinite ease-in-out both',
                                        animationDelay: '-0.16s'
                                    }}></div>
                                    <div className="loading-dot" style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#3b82f6',
                                        animation: 'bounce 1.4s infinite ease-in-out both'
                                    }}></div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '300px',
                                gap: '1.5rem'
                            }}>
                                <div style={{ fontSize: '5rem' }}>🎉</div>
                                <h4 style={{ color: '#28a745', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    Download Complete!
                                </h4>
                                <p style={{ color: '#6c757d', fontSize: '1rem', textAlign: 'center', maxWidth: '500px' }}>
                                    Your password-protected Excel files have been downloaded successfully.
                                    <br />
                                    <strong>Password:</strong> <code style={{ backgroundColor: '#f8f9fa', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#d63384' }}>{storeEvaId}</code>
                                </p>
                                <Badge bg="success" pill style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                                    ✓ ZIP file saved to your downloads
                                </Badge>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default DetailsCoPo;