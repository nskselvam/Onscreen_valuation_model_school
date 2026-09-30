import React, { useState, useEffect, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import Select from 'react-select'
import { useAlterationDataQuery, useUpdateChiefExaminerMutation } from '../../redux-slice/AlterationApiSlice'
import { toast } from 'react-toastify'
import { Container, Card, Row, Col, Form, Button, Badge, Spinner } from 'react-bootstrap'

/* ─── Custom Subcode Multi-Select Dropdown ───────────────────────────── */
const SubcodeMultiSelect = ({ items, selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    
    useEffect(() => {
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 2,
                left: rect.left,
                width: rect.width,
                zIndex: 99999,
                borderRadius: '4px',
                backgroundColor: '#fff',
                border: '1px solid #ced4da',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            });
        }
    }, [open]);

    const filtered = useMemo(
        () => items.filter((it) => it.label.toLowerCase().includes(search.toLowerCase())),
        [items, search]
    );

    const toggle = (val) => {
        onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
    };

    const displayLabel =
        selected.length === 0
            ? 'Please Select'
            : selected.length === items.length
                ? 'All Selected'
                : selected.length === 1
                    ? items.find((i) => i.value === selected[0])?.label || `1 selected`
                    : `${selected.length} subcode(s) selected`;

    const dropdown = open ? ReactDOM.createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
            <div className="p-2 border-bottom">
                <input
                    autoFocus
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="d-flex border-bottom">
                <button
                    type="button"
                    className="btn btn-sm btn-link flex-fill text-decoration-none border-end py-1"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => onChange(items.map((i) => i.value))}
                >
                    Select All
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-link flex-fill text-decoration-none py-1"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => onChange([])}
                >
                    Deselect All
                </button>
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                    <div className="p-2 text-muted text-center" style={{ fontSize: '0.85rem' }}>No results found</div>
                ) : (
                    filtered.map((item) => (
                        <div
                            key={item.value}
                            className="px-3 py-2 d-flex align-items-start gap-2"
                            style={{
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: selected.includes(item.value) ? '#eef3fb' : '#fff',
                            }}
                            onClick={() => toggle(item.value)}
                        >
                            <input
                                type="checkbox"
                                readOnly
                                checked={selected.includes(item.value)}
                                style={{ marginTop: '2px', flexShrink: 0 }}
                            />
                            <span>{item.label}</span>
                        </div>
                    ))
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div ref={triggerRef}>
            <div
                className="form-select"
                style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: selected.length === 0 ? '#6c757d' : '#212529',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
                onClick={() => setOpen((o) => !o)}
            >
                {displayLabel}
            </div>
            {dropdown}
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────────────── */
const Chief_Examiner_Alteration = () => {
    const { data, error, isLoading } = useAlterationDataQuery();
    const [updateChiefExaminer, { isLoading: isUpdating }] = useUpdateChiefExaminerMutation();

    const [oldChiefExaminer, setOldChiefExaminer] = useState(null);
    const [newChiefExaminer, setNewChiefExaminer] = useState(null);
    const [updateOption, setUpdateOption] = useState('');
    const [selectedSubcodes, setSelectedSubcodes] = useState([]);
    const [detailsText, setDetailsText] = useState('');

    /* ── Destructure the response ── */
    const facultiesData = useMemo(() => data?.faculties ?? [], [data]);
    const subMasterData = useMemo(() => data?.sub_master ?? [], [data]);

    /* ── Options: only Role 1 (Chief Examiners) ── */
    const chiefExaminerOptions = useMemo(() => {
        if (!facultiesData.length) return [];
        return facultiesData
            .filter((f) => {
                if (!f.Role) return false;
                const roles = f.Role.split(',').map((r) => r.trim());
                return roles.includes('1');
            })
            .map((f) => ({
                value: f.Eva_Id,
                label: `${f.Eva_Id} - ( ${f.FACULTY_NAME} )`,
            }));
    }, [facultiesData]);

    const newChiefExaminerOptions = useMemo(
        () => chiefExaminerOptions.filter((o) => o.value !== oldChiefExaminer?.value),
        [chiefExaminerOptions, oldChiefExaminer]
    );

    /* ── Build subcode items from old chief examiner's data ── */
    const subcodeItems = useMemo(() => {
        if (!oldChiefExaminer || !facultiesData.length) return [];

        const oldRecord = facultiesData.find((f) => f.Eva_Id === oldChiefExaminer.value);
        if (!oldRecord) return [];

        const subcodes = (oldRecord.Chief_subcode || '').split(',').map(s => s.trim()).filter(Boolean);

        return subcodes.map((sc) => {
            const subInfo = subMasterData.find((s) => s.Subcode === sc);
            return {
                value: sc,
                label: `${sc} - ${subInfo?.SUBNAME || sc}`,
            };
        });
    }, [oldChiefExaminer, facultiesData, subMasterData]);

    /* ── Build details text for "All Subcodes" option ── */
    useEffect(() => {
        if (!oldChiefExaminer || !facultiesData.length || updateOption !== 'all') {
            setDetailsText('');
            return;
        }

        // Find the old chief examiner's faculty record
        const oldRecord = facultiesData.find((f) => f.Eva_Id === oldChiefExaminer.value);
        if (!oldRecord) {
            setDetailsText('');
            return;
        }

        // Parse the data
        const examinerIds = (oldRecord.Examiner_Id || '').split(',').map(s => s.trim()).filter(Boolean);
        const subcodes = (oldRecord.subcode || '').split(',').map(s => s.trim()).filter(Boolean);
        const evaSubjects = (oldRecord.Eva_Subject || '').split(',').map(s => s.trim()).filter(Boolean);
        const campOfficerIds = (oldRecord.camp_offcer_id_examiner || '').split(',').map(s => s.trim()).filter(Boolean);
        const campIds = (oldRecord.Camp_id || '').split(',').map(s => s.trim()).filter(Boolean);

        // Check if we have any data
        if (examinerIds.length === 0 && subcodes.length === 0) {
            setDetailsText('No data available for this Chief Examiner');
            return;
        }

        // Build details text with all entries
        const maxLength = Math.max(examinerIds.length, subcodes.length);
        const details = [];
        
        for (let idx = 0; idx < maxLength; idx++) {
            const parts = [
                `Examiner Id - ${examinerIds[idx] || '-'}`,
                `Subcode - ${subcodes[idx] || '-'}`,
                `EvaSubject - ${evaSubjects[idx] || '-'}`,
                `CampOfficer Id - ${campOfficerIds[idx] || '-'}`,
                `Camp Id - ${campIds[idx] || '-'}`
            ];
            details.push(parts.join(', '));
        }

        setDetailsText(details.length > 0 ? details.join('\n') : 'No data available for this Chief Examiner');
    }, [oldChiefExaminer, facultiesData, updateOption]);

    /* ── Reset cascades ── */
    useEffect(() => {
        setNewChiefExaminer(null);
        setUpdateOption('');
        setSelectedSubcodes([]);
    }, [oldChiefExaminer]);

    useEffect(() => {
        setSelectedSubcodes([]);
    }, [updateOption]);

    /* ── Can submit? ── */
    const canSubmit =
        !!oldChiefExaminer &&
        !!newChiefExaminer &&
        !!updateOption &&
        (updateOption === 'all' || (updateOption === 'selective' && selectedSubcodes.length > 0));

    /* ── Handle Update ── */
    const handleUpdate = async () => {
        if (!canSubmit) return;

        try {
            // Find old chief examiner data
            const oldChiefData = facultiesData.find((f) => f.Eva_Id === oldChiefExaminer.value);
            if (!oldChiefData) {
                toast.error('Old chief examiner data not found');
                return;
            }

            // Parse the data to send
            
            const examinerIds = (oldChiefData.chief_examiner || '').split(',').map(s => s.trim()).filter(Boolean);
            const subcodes = (oldChiefData.Chief_subcode || '').split(',').map(s => s.trim()).filter(Boolean);
            const evaSubjects = (oldChiefData.Chief_Eva_Subject || '').split(',').map(s => s.trim()).filter(Boolean);
            const campOfficerIds = (oldChiefData.camp_offcer_id_chief || '').split(',').map(s => s.trim()).filter(Boolean);
            const campIds = (oldChiefData.Camp_id_chief || '').split(',').map(s => s.trim()).filter(Boolean);
            const departments = (oldChiefData.Dep_Name_1 || '').split(',').map(s => s.trim()).filter(Boolean);
            const Chief_Eva_Subject = (oldChiefData.Chief_Eva_Subject || '').split(',').map(s => s.trim()).filter(Boolean);

            // Determine which subcodes to transfer
            const subcodesToTransfer = updateOption === 'all' ? subcodes : selectedSubcodes;

            // Build transfer data only for selected subcodes
            const transferData = subcodesToTransfer.map((selectedSubcode) => {
                const idx = subcodes.indexOf(selectedSubcode);
                const subInfo = subMasterData.find((s) => s.Subcode === selectedSubcode);
                return {
                    id: subcodesToTransfer.indexOf(selectedSubcode) + 1,
                    examinerId: examinerIds[idx] || '',
                    subcode: selectedSubcode || '',
                    subname: subInfo?.SUBNAME || selectedSubcode || '',
                    evaluationType: evaSubjects[idx] || '',
                    campOfficerId: campOfficerIds[idx] || '',
                    campId: campIds[idx] || '',
                    department: departments[idx] || '',
                    Chief_Eva_Subject: Chief_Eva_Subject[idx] || '',
                };
            });

            const payload = {
                oldEvaId: oldChiefExaminer.value,
                newEvaId: newChiefExaminer.value,
                updateOption: updateOption, // Use the actual selected option
                role: 1, // Role 1 for Chief Examiner
                subcodes: subcodesToTransfer, // Only selected subcodes
                transferData: transferData,
            };

           // return

            const res = await updateChiefExaminer(payload).unwrap();
            toast.success(res?.message || 'Chief Examiner updated successfully!');

            // Reset form
            setOldChiefExaminer(null);
            setNewChiefExaminer(null);
            setUpdateOption('');
            setSelectedSubcodes([]);
            setDetailsText('');
        } catch (err) {
            toast.error(err?.data?.message || 'Update failed. Please try again.');
        }
    };

    /* ── Render ── */
    if (isLoading)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
                <p className="ms-3 mb-0 text-muted">Loading chief examiner data...</p>
            </div>
        );

    if (error)
        return (
            <div className="alert alert-danger m-3">
                Error loading chief examiner data. Please try again.
            </div>
        );

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: '38px',
            borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
            boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13,110,253,.25)' : 'none',
            '&:hover': { borderColor: '#86b7fe' },
        }),
        singleValue: (base) => ({ ...base, color: '#212529' }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
    };

    return (
        <Container fluid className="p-4">

            {/* ── Page Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 style={{ color: '#2c5282', fontWeight: '600', margin: 0 }}>
                    Chief Examiner Alteration
                </h3>
                <Badge bg="secondary" style={{ fontSize: '13px', padding: '7px 14px' }}>
                    Role : Chief Examiner
                </Badge>
            </div>

            {/* ── Filter Form Card ── */}
            <Card className="shadow-sm">
                <Card.Header style={{ backgroundColor: '#2c5282', color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                    <i className="bi bi-person-badge me-2"></i>
                    Chief Examiner Transfer Configuration
                </Card.Header>
                <Card.Body className="px-4 py-4">

                    {/* Old Chief Examiner */}
                    <Row className="align-items-center mb-3">
                        <Col sm={4} md={3}>
                            <Form.Label className="fw-semibold mb-0">Old Chief Examiner ID</Form.Label>
                        </Col>
                        <Col sm={8} md={9}>
                            <Select
                                options={chiefExaminerOptions}
                                value={oldChiefExaminer}
                                onChange={(v) => setOldChiefExaminer(v)}
                                placeholder="Please Select"
                                isClearable
                                isSearchable
                                styles={selectStyles}
                                classNamePrefix="rs"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </Col>
                    </Row>

                    {/* New Chief Examiner */}
                    {oldChiefExaminer && (
                        <Row className="align-items-center mb-3">
                            <Col sm={4} md={3}>
                                <Form.Label className="fw-semibold mb-0">New Chief Examiner ID</Form.Label>
                            </Col>
                            <Col sm={8} md={9}>
                                <Select
                                    options={newChiefExaminerOptions}
                                    value={newChiefExaminer}
                                    onChange={(v) => setNewChiefExaminer(v)}
                                    placeholder="Please Select"
                                    isClearable
                                    isSearchable
                                    styles={selectStyles}
                                    classNamePrefix="rs"
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </Col>
                        </Row>
                    )}

                    {/* Update Options */}
                    {oldChiefExaminer && newChiefExaminer && (
                        <Row className="align-items-center mb-3">
                            <Col sm={4} md={3}>
                                <Form.Label className="fw-semibold mb-0">Update Options</Form.Label>
                            </Col>
                            <Col sm={8} md={9}>
                                <Form.Select
                                    value={updateOption}
                                    onChange={(e) => setUpdateOption(e.target.value)}
                                >
                                    <option value="">Please select</option>
                                    <option value="all">All Subcodes</option>
                                    <option value="selective">Selective Subcodes</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    )}

                    {/* List of Subcodes (selective only) */}
                    {updateOption === 'selective' && (
                        <Row className="align-items-center mb-3">
                            <Col sm={4} md={3}>
                                <Form.Label className="fw-semibold mb-0">List of Subcodes</Form.Label>
                            </Col>
                            <Col sm={8} md={9}>
                                {subcodeItems.length === 0 ? (
                                    <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '0.875rem' }}>
                                        No subcodes found assigned to this chief examiner.
                                    </div>
                                ) : (
                                    <SubcodeMultiSelect
                                        items={subcodeItems}
                                        selected={selectedSubcodes}
                                        onChange={setSelectedSubcodes}
                                    />
                                )}
                            </Col>
                        </Row>
                    )}

                    {/* Update Button */}
                    <Row className="mt-4">
                        <Col className="d-flex justify-content-center">
                            <Button
                                variant="success"
                                size="lg"
                                onClick={handleUpdate}
                                disabled={!canSubmit || isUpdating}
                                style={{ minWidth: '160px', opacity: canSubmit ? 1 : 0.55 }}
                            >
                                {isUpdating ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-arrow-repeat me-2"></i>
                                        Update
                                    </>
                                )}
                            </Button>
                        </Col>
                    </Row>

                </Card.Body>
            </Card>

        </Container>
    );
};

export default Chief_Examiner_Alteration;
