import React, { useState, useEffect, useRef, useMemo } from 'react'
import ReactDOM from 'react-dom'
import Select from 'react-select'
import { useAlterationDataQuery, useUpdateExaminerMutation } from '../../redux-slice/AlterationApiSlice'
import { toast } from 'react-toastify'
import DataTableBase from 'react-data-table-component'
import { Container, Card, Modal, Button, Form, Row, Col, Spinner, Badge } from 'react-bootstrap'

const DataTable = DataTableBase.default || DataTableBase

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
const Examiner_Alteration = () => {
    const { data, error, isLoading } = useAlterationDataQuery();
    const [updateExaminer, { isLoading: isUpdating }] = useUpdateExaminerMutation();

    const [oldExaminer, setOldExaminer] = useState(null);
    const [newExaminer, setNewExaminer] = useState(null);
    const [updateOption, setUpdateOption] = useState('');
    const [selectedSubcodes, setSelectedSubcodes] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [chiefExaminerOptions, setChiefExaminerOptions] = useState([]);

    /* ── Destructure the response ── */
    const facultiesData = useMemo(() => data?.faculties ?? [], [data]);
    const subMasterData = useMemo(() => data?.sub_master ?? [], [data]);



    //onsole.log('Faculties Data:', data);


    /* ── Options: only Role 2 ── */
    const examinerOptions = useMemo(() => {
        if (!facultiesData.length) return [];
        return facultiesData
            .filter((f) => {
                if (!f.Role) return false;
                const roles = f.Role.split(',').map((r) => r.trim());
                return roles.includes('2');
            })
            .map((f) => ({
                value: f.Eva_Id,
                label: `${f.Eva_Id} - ( ${f.FACULTY_NAME} )`,
            }));
    }, [facultiesData]);

    /* ── Chief Examiner Options: only Role 7 ── */
    useEffect(() => {
        if (!facultiesData.length) return;
        const chiefOptions = facultiesData
            .filter((f) => {
                if (!f.Role) return false;
                const roles = f.Role.split(',').map((r) => r.trim());
                return roles.includes('1');
            })
            .map((f) => ({
                value: f.Eva_Id,
                label: `${f.Eva_Id} - ${f.FACULTY_NAME}`,
            }));
        setChiefExaminerOptions(chiefOptions);
    }, [facultiesData]);

    const newExaminerOptions = useMemo(
        () => examinerOptions.filter((o) => o.value !== oldExaminer?.value),
        [examinerOptions, oldExaminer]
    );

    /* ── Subcode items: read subcodes from the old examiner's own faculty record,
       filter out any subcodes the new examiner already has (we can only transfer
       subcodes that old has but new does NOT have), then look up subject names
       from sub_master.
    */
    const subcodeItems = useMemo(() => {
        if (!oldExaminer || !facultiesData.length) return [];

        // Find the old examiner's faculty record
        const oldRecord = facultiesData.find((f) => f.Eva_Id === oldExaminer.value);
        if (!oldRecord || !oldRecord.subcode) return [];

        const oldSubcodes = oldRecord.subcode.split(',').map((s) => s.trim()).filter(Boolean);

        // Get the new examiner's existing subcodes so we can exclude them
        const newRecord = newExaminer
            ? facultiesData.find((f) => f.Eva_Id === newExaminer.value)
            : null;
        const newSubcodes = newRecord?.subcode
            ? newRecord.subcode.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

        // Only show subcodes the old examiner has that the new examiner does NOT have
        const transferable = oldSubcodes.filter((sc) => !newSubcodes.includes(sc));

        return transferable.map((sc) => {
            const subInfo = subMasterData.find((s) => s.Subcode === sc);
            return {
                value: sc,
                label: `${sc} - ${subInfo?.SUBNAME || sc}`,
            };
        });
    }, [oldExaminer, newExaminer, facultiesData, subMasterData]);

    /* ── Reset cascades ── */
    useEffect(() => {
        setNewExaminer(null);
        setUpdateOption('');
        setSelectedSubcodes([]);
    }, [oldExaminer]);

    useEffect(() => {
        setSelectedSubcodes([]);
    }, [updateOption]);




    const SearchCheifExaminer = facultiesData.filter((f) => f.chiefExaminer === oldExaminer?.value).map((f) => f.Eva_Id);
    /* ── Can submit? ── */
    const canSubmit =
        !!oldExaminer &&
        !!newExaminer &&
        !!updateOption &&
        (updateOption === 'all' || (updateOption === 'selective' && selectedSubcodes.length > 0));

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!canSubmit) return;

        // Find old examiner data
        const oldExaminerData = facultiesData.find((f) => f.Eva_Id === oldExaminer.value);
        if (!oldExaminerData) return;

        // Get subcodes to transfer
        const subcodesToTransfer = updateOption === 'all'
            ? (oldExaminerData.subcode || '').split(',').map(s => s.trim()).filter(Boolean)
            : selectedSubcodes;

        // Parse old examiner's data
        const oldSubcodes = (oldExaminerData.subcode || '').split(',').map(s => s.trim()).filter(Boolean);
        const oldEvaSubjects = (oldExaminerData.Eva_Subject || '').split(',').map(s => s.trim()).filter(Boolean);
        const oldCampOfficers = (oldExaminerData.camp_offcer_id_examiner || '').split(',').map(s => s.trim()).filter(Boolean);
        const oldCampIds = (oldExaminerData.Camp_id || '').split(',').map(s => s.trim()).filter(Boolean);
        const Dep_Name = (oldExaminerData.Dep_Name_2 || '').split(',').map(s => s.trim()).filter(Boolean);
        const Sub_Max_Count = (oldExaminerData.Sub_Max_Paper || '').split(',').map(s => s.trim()).filter(Boolean);
        const oldCheifExaminer = (oldExaminerData.chief_examiner || '').split(',').map(s => s.trim()).filter(Boolean);

        // Build a mapping of subcode -> chief examiner ID by finding records where old examiner is the chief
        const chiefExaminerMap = {};
        const evaluatorId = oldExaminerData.Eva_Id;

        facultiesData.forEach(faculty => {
            if (!faculty.chief_examiner || !faculty.Chief_subcode) return;

            const chiefExaminerIds = faculty.chief_examiner.split(',').map(s => s.trim());
            const chiefSubcodes = faculty.Chief_subcode.split(',').map(s => s.trim());

            // Map each chief subcode to its corresponding chief examiner ID
            chiefSubcodes.forEach((subcode, index) => {
                // Check if this subcode is in the transferring list and the chief examiner is the old examiner
                if (chiefExaminerIds[index] === evaluatorId && subcodesToTransfer.includes(subcode)) {
                    chiefExaminerMap[subcode] = faculty.Eva_Id; // The faculty who owns this chief assignment
                }
            });
        });

        // Build transfer table data
        const transferData = subcodesToTransfer.map((sc, idx) => {
            const scIndex = oldSubcodes.indexOf(sc);
            const subInfo = subMasterData.find((s) => s.Subcode === sc);

            return {
                id: idx + 1,
                subcode: sc,
                subname: subInfo?.SUBNAME || sc,
                evaluationType: oldEvaSubjects[scIndex] || '',
                campOfficerId: oldCampOfficers[scIndex] || '',
                campId: oldCampIds[scIndex] || '',
                chiefExaminer: chiefExaminerMap[sc] || oldCheifExaminer[scIndex] || 'Not Assigned',
                department: Dep_Name[scIndex] || '',
                maxCount: Sub_Max_Count[scIndex] || '0',

            };
        });

        setTableData(transferData);
        setShowTable(true);
    };

    /* ── Handle Edit ── */
    const handleEdit = (row) => {
        setEditingRow({ ...row });
        setShowEditModal(true);
    };

    /* ── Handle Edit Save ── */
    const handleEditSave = () => {
        // Update the table data locally
        const updatedData = tableData.map(item =>
            item.id === editingRow.id ? editingRow : item
        );
        setTableData(updatedData);
        setShowEditModal(false);
        toast.success('Changes saved. Click "Update All" to send to backend.');
    };

    /* ── Handle Final Update to Backend ── */
    const handleFinalUpdate = async () => {
        try {
            const payload = {
                oldEvaId: oldExaminer.value,
                newEvaId: newExaminer.value,
                updateOption,
                role: 2,
                subcodes: updateOption === 'selective' ? selectedSubcodes : [],
                transferData: tableData, // Send all the edited transfer data

            };
            const res = await updateExaminer(payload).unwrap();
            toast.success(res?.message || 'Examiner updated successfully!');

            // Reset form
            setOldExaminer(null);
            setNewExaminer(null);
            setUpdateOption('');
            setSelectedSubcodes([]);
            setShowTable(false);
            setTableData([]);
        } catch (err) {
            toast.error(err?.data?.message || 'Update failed. Please try again.');
        }
    };

    /* ── Filter Table Data ── */
    const filteredTableData = tableData.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(filterText.toLowerCase())
        )
    );

    /* ── DataTable Columns ── */
    const columns = [
        {
            name: 'S.No',
            selector: row => row.id,
            width: '70px',
            cell: row => <div style={{ textAlign: 'center' }}>{row.id}</div>,
        },
        {
            name: 'Subject Code',
            selector: row => row.subcode,
            sortable: true,
            width: '140px',
        },
        {
            name: 'Subject Name',
            selector: row => row.subname,
            sortable: true,
            width: '240px',
            wrap: true,
        },
        {
            name: 'Eval. Type',
            selector: row => row.evaluationType || '-',
            sortable: true,
            width: '110px',
            cell: row => <div style={{ textAlign: 'center' }}>{row.evaluationType || '-'}</div>,
        },
        {
            name: 'Camp Officer ID',
            selector: row => row.campOfficerId || '-',
            sortable: true,
            width: '150px',
        },
        {
            name: 'Camp ID',
            selector: row => row.campId || '-',
            sortable: true,
            width: '110px',
        },
        {
            name: 'Chief Examiner',
            selector: row => row.chiefExaminer || 'Not Assigned',
            sortable: true,
            width: '170px',
            cell: row => (
                <Badge
                    bg={row.chiefExaminer ? 'info' : 'secondary'}
                    text={row.chiefExaminer ? 'dark' : 'white'}
                    style={{ fontSize: '11px', padding: '5px 8px' }}
                >
                    {row.chiefExaminer || 'Not Assigned'}
                </Badge>
            ),
        },
        {
            name: 'Actions',
            width: '100px',
            cell: row => (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleEdit(row)}
                    style={{ fontSize: '12px' }}
                >
                    <i className="bi bi-pencil me-1"></i> Edit
                </Button>
            ),
        },
    ];

    /* ── Render ── */
    if (isLoading)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
                <p className="ms-3 mb-0 text-muted">Loading examiner data...</p>
            </div>
        );

    if (error)
        return (
            <div className="alert alert-danger m-3">
                Error loading examiner data. Please try again.
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

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
                borderBottom: '2px solid #1a365d',
            },
        },
        headCells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                color: '#ffffff',
                borderRight: '1px solid #4a6fa5',
                '&:last-child': { borderRight: 'none' },
            },
        },
        rows: {
            style: {
                minHeight: '52px',
                borderBottom: '1px solid #e2e8f0',
                '&:hover': { backgroundColor: '#f7fafc', cursor: 'pointer' },
            },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #e2e8f0',
                '&:last-child': { borderRight: 'none' },
            },
        },
    };

    return (
        <Container fluid className="p-4">

            {/* ── Page Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 style={{ color: '#2c5282', fontWeight: '600', margin: 0 }}>
                    Examiner Alteration
                </h3>
                <Badge bg="secondary" style={{ fontSize: '13px', padding: '7px 14px' }}>
                    Role : Examiner
                </Badge>
            </div>

            {/* ── Filter Form Card ── */}
            <Card className="mb-4 shadow-sm">
                <Card.Header style={{ backgroundColor: '#2c5282', color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                    <i className="bi bi-person-arrows me-2"></i>
                    Examiner Transfer Configuration
                </Card.Header>
                <Card.Body className="px-4 py-4">

                    {/* Old Examiner */}
                    <Row className="align-items-center mb-3">
                        <Col sm={4} md={3}>
                            <Form.Label className="fw-semibold mb-0">Old Examiner ID</Form.Label>
                        </Col>
                        <Col sm={8} md={9}>
                            <Select
                                options={examinerOptions}
                                value={oldExaminer}
                                onChange={(v) => setOldExaminer(v)}
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

                    {/* New Examiner */}
                    {oldExaminer && (
                        <Row className="align-items-center mb-3">
                            <Col sm={4} md={3}>
                                <Form.Label className="fw-semibold mb-0">New Examiner ID</Form.Label>
                            </Col>
                            <Col sm={8} md={9}>
                                <Select
                                    options={newExaminerOptions}
                                    value={newExaminer}
                                    onChange={(v) => setNewExaminer(v)}
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
                    {oldExaminer && newExaminer && (
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
                                    <option value="all">All Subcodes with Chief Examiner</option>
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
                                        No subcodes found assigned to this examiner.
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

                    {/* Submit Button */}
                    <Row className="mt-4">
                        <Col className="d-flex justify-content-center">
                            <Button
                                variant="success"
                                size="lg"
                                onClick={handleSubmit}
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
                                        Submit
                                    </>
                                )}
                            </Button>
                        </Col>
                    </Row>

                </Card.Body>
            </Card>

            {/* ── Transfer Details Table Card ── */}
            {showTable && tableData.length > 0 && (
                <Card className="shadow-sm">
                    <Card.Header style={{ backgroundColor: '#2c5282', color: '#fff' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <span style={{ fontWeight: '600', fontSize: '15px' }}>
                                <i className="bi bi-table me-2"></i>
                                Transfer Details: {oldExaminer?.label} → {newExaminer?.label}
                            </span>
                            <Badge bg="light" text="dark" style={{ fontSize: '12px', padding: '5px 10px' }}>
                                {tableData.length} record{tableData.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search subject code, name, camp..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                            </Col>
                            <Col md={6} className="text-end">
                                <Button
                                    variant="success"
                                    size="lg"
                                    onClick={handleFinalUpdate}
                                    disabled={isUpdating}
                                    style={{ minWidth: '180px' }}
                                >
                                    {isUpdating ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            Update All Changes
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>

                        <DataTable
                            columns={columns}
                            data={filteredTableData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 30, 50]}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5">
                                    <p className="text-muted">No transfer records found</p>
                                </div>
                            }
                        />
                    </Card.Body>
                </Card>
            )}

            {/* ── Edit Modal ── */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered backdrop="static">
                <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff' }}>
                    <Modal.Title style={{ fontSize: '17px', fontWeight: '600' }}>
                        <i className="bi bi-pencil-square me-2"></i>
                        Edit Transfer Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    {editingRow && (
                        <Form>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Subject Code</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingRow.subcode || ''}
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Subject Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingRow.subname || ''}
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Evaluation Type</Form.Label>
                                        <Form.Select
                                            value={editingRow.evaluationType || ''}
                                            onChange={(e) => setEditingRow({ ...editingRow, evaluationType: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Camp Officer ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingRow.campOfficerId || ''}
                                            onChange={(e) => setEditingRow({ ...editingRow, campOfficerId: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Camp ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingRow.campId || ''}
                                            onChange={(e) => setEditingRow({ ...editingRow, campId: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Chief Examiner</Form.Label>
                                        <Select
                                            options={chiefExaminerOptions}
                                            value={chiefExaminerOptions.find(opt => opt.value === editingRow.chiefExaminer) || null}
                                            onChange={(selected) => setEditingRow({ ...editingRow, chiefExaminer: selected?.value || '' })}
                                            placeholder="Select Chief Examiner"
                                            isClearable
                                            isSearchable
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    minHeight: '38px',
                                                    borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
                                                    boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13,110,253,.25)' : 'none',
                                                    '&:hover': { borderColor: '#86b7fe' },
                                                }),
                                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer className="px-4">
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        <i className="bi bi-x-circle me-1"></i> Cancel
                    </Button>
                    <Button variant="primary" onClick={handleEditSave}>
                        <i className="bi bi-check-circle me-1"></i> Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Examiner_Alteration;
