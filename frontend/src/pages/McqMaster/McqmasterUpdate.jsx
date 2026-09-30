import React, { useMemo, useState, useEffect } from 'react'
import DataTableBase from 'react-data-table-component';
import { 
    useGetCommonDataQuery, 
} from '../../redux-slice/getDataCommonRouterdata';
import { useSelector, useDispatch } from 'react-redux';
import { masterDataAdminDataSubcode } from '../../redux-slice/getDataCommonRouterSlice';
import { Button, Modal } from 'react-bootstrap';
import { useMcqMasterDataUpdateMutation, useReverteMcqDataFinalMutation, useEvaluatorDataFromTheBackQuery, useGetMcqDataBySubcodeFromTheBackQuery } from '../../redux-slice/mcqOperationSlice';
import McqAssignModal from '../../components/modals/McqAssignModal';
import { toast } from 'react-toastify';
import { McqAnswerKeyPdfDownload } from '../../utils/McqAnswerKeyPdfGenerator.jsx';
 

const DataTable = DataTableBase.default || DataTableBase;

// Component to fetch MCQ data and render PDF download
const McqDataFetcher = ({ subcode, evaId, subname }) => {
    const { data: mcqData, isLoading, isError } = useGetMcqDataBySubcodeFromTheBackQuery(
        { Subcode: subcode, Eva_Id: evaId },
        { skip: !subcode || !evaId }
    );

    if (isLoading) {
        return (
            <Button size="sm" variant="secondary" disabled style={{ fontSize: '0.8rem' }}>
                Loading...
            </Button>
        );
    }

    if (isError || !mcqData?.data || mcqData.data.length === 0) {
        return (
            <Button size="sm" variant="secondary" disabled style={{ fontSize: '0.8rem' }}>
                No Data
            </Button>
        );
    }

    return (
        <McqAnswerKeyPdfDownload
            data={mcqData.data}
            subcode={subcode}
            filename={`MCQ_AnswerKey_${subcode}_${subname?.replace(/\s+/g, '_') || 'Subject'}.pdf`}
        />
    );
};

const McqmasterUpdate = () => {

    const Dep_Name = useSelector((state) => state?.auth?.userInfo?.selected_course);
    const dispatch = useDispatch();
    
    const { data, error, isLoading, refetch } = useGetCommonDataQuery(
        { tableId: 'sub_master', Dep_Name },
        { skip: !Dep_Name }
    );
    
    const { data: evaluatorData, isLoading: isEvaluatorDataLoading } = useEvaluatorDataFromTheBackQuery();



    const [updateMcqMaster, { isLoading: isUpdating }] = useMcqMasterDataUpdateMutation();
    const [revertMcqData, { isLoading: isReverting }] = useReverteMcqDataFinalMutation();
    const [searchText, setSearchText] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [selectedRevertSubject, setSelectedRevertSubject] = useState(null);
    const [mcqDataCache, setMcqDataCache] = useState({});

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
            subject.SUBNAME?.toLowerCase().includes(searchLower) ||
            subject.Eva_Id?.toLowerCase().includes(searchLower) ||
            subject.mcq_qst?.toString().toLowerCase().includes(searchLower)
        );
    }, [subjects, searchText]);

    // Handle Assign Button Click
    const handleAssign = (subject) => {
        setSelectedSubject(subject);
        setShowAssignModal(true);
    };

    // Handle Save MCQ Assignment
    const handleSaveAssignment = async (assignmentData) => {
        try {
            await updateMcqMaster(assignmentData).unwrap();
            toast.success('MCQ assignment updated successfully!');
            setShowAssignModal(false);
            setSelectedSubject(null);
            // Refetch data to update the table
            await refetch();
        } catch (error) {
            console.error('Failed to update MCQ assignment:', error);
            toast.error(error?.data?.message || 'Failed to update MCQ assignment');
        }
    };

    // Handle Revert Button Click
    const handleRevert = (subject) => {
        setSelectedRevertSubject(subject);
        setShowRevertModal(true);
    };

    // Handle Confirm Revert
    const handleConfirmRevert = async () => {
        try {
            const revertData = {
                Eva_Id: selectedRevertSubject.Eva_Id,
                Subcode: selectedRevertSubject.Subcode,
            };
            
            await revertMcqData(revertData).unwrap();
            toast.success('MCQ reverted successfully!');
            setShowRevertModal(false);
            setSelectedRevertSubject(null);
            // Refetch data to update the table
            await refetch();
        } catch (error) {
            console.error('Failed to revert MCQ:', error);
            toast.error(error?.data?.message || 'Failed to revert MCQ');
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
            name: 'Subject Name',
            selector: row => row.SUBNAME,
            sortable: true,
            grow: 2,
            wrap: true,
        },
        {
            name: 'MCQ Assigned',
            selector: row => {
                if (row.mcq_flg === 'N') return 'Not Assigned';
                if (row.mcq_flg === 'Y' && row.mcq_updates === 'Y') return 'Completed';
                return 'Assigned';
            },
            sortable: true,
            width: '140px',
            center: true,
            cell: (row) => {
                let status, color;
                if (row.mcq_flg === 'N') {
                    status = 'Not Assigned';
                    color = '#d32f2f';
                } else if (row.mcq_flg === 'Y' && row.mcq_updates === 'Y') {
                    status = 'Completed';
                    color = '#2196f3';
                } else {
                    status = 'Assigned';
                    color = '#4caf50';
                }
                return (
                    <span style={{
                        color: color,
                        fontWeight: '600'
                    }}>
                        {status}
                    </span>
                );
            },
        },
        {
            name: 'No. of MCQ',
            selector: row => row.mcq_qst || '--',
            sortable: true,
            width: '120px',
            center: true,
        },
        {
            name: 'Evaluator ID',
            selector: row => row.Eva_Id || '--',
            sortable: true,
            width: '140px',
            center: true,
        },
        {
            name: 'Action',
            cell: (row) => {
                const isCompleted = row.mcq_flg === 'Y' && row.mcq_updates === 'Y';
                
                return (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <Button
                            size="sm"
                            variant={isCompleted ? 'warning' : 'primary'}
                            onClick={() => isCompleted ? handleRevert(row) : handleAssign(row)}
                            style={{ minWidth: '72px' }}
                        >
                            {isCompleted ? 'Revert' : 'Assign'}
                        </Button>
                        {isCompleted && (
                            <McqDataFetcher 
                                subcode={row.Subcode} 
                                evaId={row.Eva_Id}
                                subname={row.SUBNAME}
                            />
                        )}
                    </div>
                );
            },
            width: '200px',
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
                        <div>
                            <h1 style={{ 
                                margin: '0',
                                fontSize: '24px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                MCQ Master - Update and Assign
                            </h1>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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

            {/* MCQ Assignment Modal */}
            <McqAssignModal
                show={showAssignModal}
                onHide={() => setShowAssignModal(false)}
                initialData={selectedSubject || {}}
                onSave={handleSaveAssignment}
            />

            {/* Revert Confirmation Modal */}
            <Modal 
                show={showRevertModal} 
                onHide={() => setShowRevertModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Revert MCQ Assignment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to revert the MCQ assignment for:</p>
                    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '12px' }}>
                        <p style={{ margin: '4px 0' }}><strong>Subject Code:</strong> {selectedRevertSubject?.Subcode}</p>
                        <p style={{ margin: '4px 0' }}><strong>Subject Name:</strong> {selectedRevertSubject?.SUBNAME}</p>
                        <p style={{ margin: '4px 0' }}><strong>Evaluator ID:</strong> {selectedRevertSubject?.Eva_Id}</p>
                        <p style={{ margin: '4px 0' }}><strong>No. of MCQ:</strong> {selectedRevertSubject?.mcq_qst}</p>
                    </div>
                    <p style={{ marginTop: '16px', color: '#d32f2f', fontWeight: '500' }}>
                        This will change the status from "Completed" back to "Assigned".
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowRevertModal(false)}
                        disabled={isReverting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="warning" 
                        onClick={handleConfirmRevert}
                        disabled={isReverting}
                    >
                        {isReverting ? 'Reverting...' : 'Confirm Revert'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default McqmasterUpdate
