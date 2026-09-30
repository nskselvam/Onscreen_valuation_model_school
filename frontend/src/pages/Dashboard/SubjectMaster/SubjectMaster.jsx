import React, { useMemo, useState, useEffect } from 'react'
import DataTableBase from 'react-data-table-component';
import { 
    useGetCommonDataQuery, 
    useAddSubjectMutation, 
    useUpdateSubjectMutation, 
    useDeleteSubjectMutation,
    useLazyGetDataFromTheSubcodeQuery
} from '../../../redux-slice/getDataCommonRouterdata';
import SubjectEditModal from '../../../components/modals/SubjectEditModal';
import SubjectAddModal from '../../../components/modals/SubjectAddModal';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { masterDataAdminDataSubcode } from '../../../redux-slice/getDataCommonRouterSlice'
import { Button, Modal } from 'react-bootstrap';

const DataTable = DataTableBase.default || DataTableBase;

const SubjectMaster = () => {

    const dispatch = useDispatch();
    const { data, error, isLoading, refetch } = useGetCommonDataQuery(
        { tableId: 'sub_master' }
    );
    const [addSubject, { isLoading: isAdding }] = useAddSubjectMutation();
    const [updateSubject, { isLoading: isUpdating }] = useUpdateSubjectMutation();
    const [deleteSubject, { isLoading: isDeleting }] = useDeleteSubjectMutation();
    const [triggerMismatchCheck, { isLoading: isMismatchChecking }] = useLazyGetDataFromTheSubcodeQuery();
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [showMismatchModal, setShowMismatchModal] = useState(false);
    const [mismatchRemarks, setMismatchRemarks] = useState([]);
    const [mismatchSubcode, setMismatchSubcode] = useState('');
    const [isCheckingMismatch, setIsCheckingMismatch] = useState(false);

    const normalizeRemarks = (remarks) => {
        if (!remarks) return [];
        if (Array.isArray(remarks)) return remarks;
        if (typeof remarks === 'string') {
            try {
                const parsed = JSON.parse(remarks);
                return Array.isArray(parsed) ? parsed : [remarks];
            } catch {
                return [remarks];
            }
        }
        return [String(remarks)];
    };


    // Get data from Redux store
    const subjectsFromStore = useSelector((state) => state.masterDataAdminData.master_data_admin);

    // Store data in Redux when API data is fetched
    useEffect(() => {
        if (data?.data) {
            dispatch(masterDataAdminDataSubcode(data.data));
        }
    }, [data, dispatch]);

    // Memoized subjects data from Redux store
    const subjects = useMemo(() => {
        return subjectsFromStore || [];
    }, [subjectsFromStore]);

    // Filtered subjects based on search text
    const filteredSubjects = useMemo(() => {
        if (!searchText) return subjects;
        
        const searchLower = searchText.toLowerCase();
        return subjects.filter(subject => 
            subject.Subcode?.toLowerCase().includes(searchLower) ||
            subject.testcode?.toLowerCase().includes(searchLower) ||
            subject.SUBNAME?.toLowerCase().includes(searchLower) ||
            subject.Degree_Status?.toLowerCase().includes(searchLower) ||
            subject.Type_of_Exam?.toLowerCase().includes(searchLower)
        );
    }, [subjects, searchText]);

    const handleEdit = (subject) => {
        setSelectedSubject(subject);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (updatedData) => {
        try {
            const subjectId = selectedSubject?.id;
            if (!subjectId) {
                toast.error('Subject ID is missing');
                return;
            }

            await updateSubject({ id: subjectId, ...updatedData }).unwrap();
            toast.success('Subject updated successfully!');
            setShowEditModal(false);
            setSelectedSubject(null);
        } catch (error) {
            console.error('Failed to update subject:', error);
            toast.error(error?.data?.message || 'Failed to update subject');
        }
    };

    const handleSaveAdd = async (newSubject) => {
        try {
            await addSubject(newSubject).unwrap();
            toast.success('Subject added successfully!');
            setShowAddModal(false);
        } catch (error) {
            console.error('Failed to add subject:', error);
            toast.error(error?.data?.message || 'Failed to add subject');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await deleteSubject(id).unwrap();
                toast.success('Subject deleted successfully!');
            } catch (error) {
                console.error('Failed to delete subject:', error);
                toast.error(error?.data?.message || 'Failed to delete subject');
            }
        }
    };

    const handleViewMismatch = (row) => {
        setMismatchSubcode(`${row.Subcode || ''} (${row.testcode || 'no testcode'})`);
        setMismatchRemarks(normalizeRemarks(row.mismatch_remarks));
        setShowMismatchModal(true);
    };

    const handleCheckMismatch = async () => {
        try {
            setIsCheckingMismatch(true);
            
            // Trigger the mismatch check API
            await triggerMismatchCheck().unwrap();
            
            // Show loading for 2 seconds
            setTimeout(async () => {
                // Refetch the table data
                await refetch();
                setIsCheckingMismatch(false);
                toast.success('Mismatch check completed and table reloaded!');
            }, 2000);
        } catch (error) {
            console.error('Failed to check mismatch:', error);
            setIsCheckingMismatch(false);
            toast.error(error?.data?.message || 'Failed to check mismatch');
        }
    };

    // Define columns for DataTable
    const columns = useMemo(() => [
        {
            name: 'Subject Code',
            selector: row => row.Subcode,
            sortable: true,
            width: '140px',
        },
        {
            name: 'Test Code',
            selector: row => row.testcode || '',
            sortable: true,
            width: '140px',
        },
        {
            name: 'Subject Name',
            selector: row => row.SUBNAME,
            sortable: true,
            grow: 2,
            wrap: true,
        },
        {
            name: 'Valuation Count',
            selector: row => row.Valcnt,
            sortable: true,
            width: '130px',
            center: true,
        },
        {
            name: 'Rate Per Script',
            selector: row => row.Rate_Per_Script,
            sortable: true,
            width: '130px',
            center: true,
        },
        {
            name: 'Script Min Amount',
            selector: row => row.Min_Amount,
            sortable: true,
            width: '150px',
            center: true,
        },
        {
            name: 'Degree Status',
            selector: row => row.Degree_Status,
            sortable: true,
            width: '120px',
            center: true,
        },
        {
            name: 'Type of Exam',
            selector: row => row.Type_of_Exam === 'R' ? 'Regular' : row.Type_of_Exam === 'A' ? 'Arrear' : row.Type_of_Exam,
            sortable: true,
            width: '120px',
            center: true,
        },
        {
            name: 'No of Papers',
            selector: row => row.no_Papers,
            sortable: true,
            width: '120px',
            center: true,
        },
        {
            name: 'Action',
            cell: (row) => (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' }}>
                    {(row.mismatch_flg === 'N' || row.qb_flg === 'N' || (row.ans_flg === 'N' && row.Type_of_Exam === 'R')) && (
                        row.mismatch_flg === 'N' ? (
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleViewMismatch(row)}
                            style={{ minWidth: '64px' }}
                        >
                            Error
                        </Button>
                        ) : row.qb_flg === 'N' ? (
                            <Button
                                size="sm"
                                variant="warning"
                       
                                style={{ minWidth: '64px' }}
                            >
                                QB 
                            </Button>
                        ) : row.ans_flg === 'N' ? (
                            <Button
                                size="sm"
                                variant="warning"
                         
                                style={{ minWidth: '64px' }}
                            >
                                Key
                            </Button>
                        ): null
                    )}
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleEdit(row)}
                        style={{ minWidth: '64px' }}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(row.id)}
                        style={{ minWidth: '72px' }}
                    >
                        Delete
                    </Button>
                </div>
            ),
            width: '260px',
            center: true,
        },
    ], []);

    // Custom styles for DataTable
    const customStyles = {
        table: {
            style: {
                backgroundColor: '#ffffff',
            },
        },
        headRow: {
            style: {
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
                minHeight: '52px',
            },
        },
        headCells: {
            style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                paddingLeft: '16px',
                paddingRight: '16px',
            },
        },
        rows: {
            style: {
                minHeight: '56px',
                backgroundColor: '#ffffff',
                '&:hover': {
                    backgroundColor: '#f9f9f9',
                },
                borderBottom: '1px solid #e0e0e0',
            },
        },
        cells: {
            style: {
                fontSize: '14px',
                color: '#555',
                paddingLeft: '16px',
                paddingRight: '16px',
            },
        },
        pagination: {
            style: {
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e0e0e0',
                minHeight: '56px',
            },
        },
    };

    return (
        <>
            <div style={{ padding: '10px 24px 16px 24px', backgroundColor: '#f5f5f5', minHeight: '100%', overflowY: 'auto' }}>
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '24px', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ 
                                margin: '0',
                                fontSize: '24px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Subject Master
                            </h1>
                            <button
                                onClick={handleCheckMismatch}
                                disabled={isCheckingMismatch || isLoading}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: isCheckingMismatch ? '#ffa726' : '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isCheckingMismatch || isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    opacity: isCheckingMismatch || isLoading ? '0.7' : '1',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {isCheckingMismatch ? (
                                    <>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '14px',
                                            height: '14px',
                                            border: '2px solid #fff',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                        Checking...
                                    </>
                                ) : (
                                    'Check Mismatch'
                                )}
                            </button>
                        </div>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>

                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                }}
                            >
                                Add Subject
                            </button>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="Search subjects..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 40px 10px 16px',
                                        fontSize: '14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                                {searchText && (
                                    <button
                                        onClick={() => setSearchText('')}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            color: '#999',
                                            padding: '0',
                                            lineHeight: '1'
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {error && (
                        <div style={{ 
                            padding: '12px', 
                            marginBottom: '16px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '4px',
                            border: '1px solid #ef9a9a'
                        }}>
                            Error: {error.message || 'Failed to load data'}
                        </div>
                    )}
                    
                    <DataTable
                        columns={columns}
                        data={filteredSubjects}
                        progressPending={isLoading}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        highlightOnHover
                        pointerOnHover
                        responsive
                        customStyles={customStyles}
                        noDataComponent={
                            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                No subjects found.
                            </div>
                        }
                        progressComponent={
                            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                Loading...
                            </div>
                        }
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <SubjectEditModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                initialData={selectedSubject || {}}
                onSave={handleSaveEdit}
            />

            {/* Add Modal */}
            <SubjectAddModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSave={handleSaveAdd}
            />

            <Modal
                show={showMismatchModal}
                onHide={() => setShowMismatchModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Mismatch Remarks {mismatchSubcode ? `- ${mismatchSubcode}` : ''}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {mismatchRemarks.length ? (
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                            {mismatchRemarks.map((remark, idx) => (
                                <li key={`${idx}-${remark}`} style={{ marginBottom: '0.5rem' }}>
                                    {remark}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ color: '#666' }}>No mismatch remarks found.</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMismatchModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default SubjectMaster
