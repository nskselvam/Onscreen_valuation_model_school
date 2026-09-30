import React, { useMemo, useState, useEffect } from 'react'
import Select from 'react-select';
import DataTableBase from 'react-data-table-component';
import {
    useGetCommonDataQuery,
    useGetvalidQbsDataMutation,
    useAddValidQuestionMutation,
    useUpdateValidQuestionMutation,
    useDeleteValidQuestionMutation
} from '../../../redux-slice/getDataCommonRouterdata.js';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { masterDataAdminDataSubcode } from '../../../redux-slice/getDataCommonRouterSlice';
import ValidQbsAddModal from '../../../components/modals/ValidQbsAddModal';
import ValidQbsEditModal from '../../../components/modals/ValidQbsEditModal';
import { sub } from 'date-fns';


const DataTable = DataTableBase.default || DataTableBase;

const Valid_Qbs_Master = () => {
    const dispatch = useDispatch();
    const { data: submasterData, error: submasterError, isLoading: submasterLoading, refetch } = useGetCommonDataQuery(
        { tableId: 'sub_master' }
    );
    const [getValidQbsData, { data: validQuestionData, error: validQuestionError, isLoading: validQuestionLoading }] = useGetvalidQbsDataMutation();
    const [addValidQuestion, { isLoading: isAdding }] = useAddValidQuestionMutation();
    const [updateValidQuestion, { isLoading: isUpdating }] = useUpdateValidQuestionMutation();
    const [deleteValidQuestion, { isLoading: isDeleting }] = useDeleteValidQuestionMutation();

    const [searchText, setSearchText] = useState('');
    const [selectedSubcode, setSelectedSubcode] = useState('');
    const [selectedTestcode, setSelectedTestcode] = useState('');
    const [displayedQuestions, setDisplayedQuestions] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [subcodeError, setSubcodeError] = useState(false);
    const [subcnt, setSubcnt] = useState(0);

    // Get data from Redux store
    const subjectsFromStore = useSelector((state) => state.masterDataAdminData.master_data_admin);

    // Store subject master data in Redux when fetched
    useEffect(() => {
        if (submasterData?.data) {
            dispatch(masterDataAdminDataSubcode(submasterData.data));
        }
    }, [submasterData, dispatch]);

    // Memoized subjects for dropdown
    const subjects = useMemo(() => {
        return subjectsFromStore || [];
    }, [subjectsFromStore]);

    const subjectOptions = useMemo(() => {
        return subjects.map((subject) => ({
            value: `${subject.Subcode}::${subject.testcode || ''}`,
            subcode: subject.Subcode,
            testcode: subject.testcode || '',
            label: `${subject.Subcode} - ${subject.SUBNAME} (${subject.testcode || 'No testcode'})`,
        }));
    }, [subjects]);

    const selectedOption = useMemo(() => {
        if (!selectedSubcode || !selectedTestcode) {
            return null;
        }

        return subjectOptions.find((option) => option.subcode === selectedSubcode && option.testcode === selectedTestcode) || null;
    }, [selectedSubcode, selectedTestcode, subjectOptions]);

    // Memoized questions data from API
    const questions = useMemo(() => {
        return validQuestionData?.data || [];
    }, [validQuestionData]);

    // Keep last successful data to avoid flicker while loading
    useEffect(() => {
        setDisplayedQuestions(questions);
    }, [questions]);

    const subjectKeys = useMemo(() => {
        return new Set(subjects.map((subject) => `${subject.Subcode}::${subject.testcode || ''}`));
    }, [subjects]);

    // Fetch valid QBS data when subcode changes
    useEffect(() => {
        const subjectKey = `${selectedSubcode}::${selectedTestcode}`;
        if (selectedSubcode && selectedTestcode && subjectKeys.has(subjectKey)) {
            getValidQbsData({ subcode: selectedSubcode, testcode: selectedTestcode });
            return;
        }

        if (!selectedSubcode || !selectedTestcode) {
            setDisplayedQuestions([]);
        }
    }, [selectedSubcode, selectedTestcode, getValidQbsData, subjectKeys]);

    // Compute mismatch flag and set subcodeError in an effect (never call setState during render)
    useEffect(() => {
        if (!selectedSubcode) {
            setSubcodeError(false);
            return;
        }
        const subjectData = subjectsFromStore?.find(subject => subject.Subcode === selectedSubcode && subject.testcode === selectedTestcode);
        const mismatchFlg = subjectData?.mismatch_flg || '';
        setSubcodeError(mismatchFlg !== 'Y');
    }, [selectedSubcode, selectedTestcode, subjectsFromStore]);

    // Filter questions by search text
    const filteredQuestions = useMemo(() => {
        let filtered = displayedQuestions;

        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter(question =>
                question.SECTION?.toLowerCase().includes(searchLower) ||
                question.SUB_SEC?.toLowerCase().includes(searchLower) ||
                question.Eva_Mon_Year?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [displayedQuestions, selectedSubcode, searchText]);

    const getQuestionKey = (question) => {
        return question?.id || question?.QID || `${question?.SUBCODE}-${question?.SECTION}-${question?.FROM_QST}-${question?.TO_QST}-${question?.Eva_Mon_Year}`;
    };

    const handleEdit = (question) => {
        setSelectedQuestion(question);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (updatedQuestion) => {
        try {
            const questionId = selectedQuestion?.id;
            if (!questionId) {
                toast.error('Question ID is missing');
                return;
            }

            await updateValidQuestion({ id: questionId, ...updatedQuestion, testcode: selectedTestcode }).unwrap();
            toast.success('Question updated successfully!');
            setShowEditModal(false);
            setSelectedQuestion(null);

            // Refetch the data for current subcode
            if (selectedSubcode && selectedTestcode) {
                getValidQbsData({ subcode: selectedSubcode, testcode: selectedTestcode });
            }
        } catch (error) {
            console.error('Failed to update question:', error);
            toast.error(error?.data?.message || 'Failed to update question');
        }
    };

    const handleSaveAdd = async (newQuestion) => {
        try {
            const subjectCode = newQuestion.SUBCODE || selectedSubcode;
            if (!subjectCode) {
                toast.error('Subject code is required');
                return;
            }

            const questionData = {
                ...newQuestion,
                SUBCODE: subjectCode,
                testcode: selectedTestcode,
            };

            await addValidQuestion(questionData).unwrap();
            toast.success('Question added successfully!');
            setShowAddModal(false);

            // Refetch the data for current subcode
            if (selectedSubcode && selectedTestcode) {
                getValidQbsData({ subcode: selectedSubcode, testcode: selectedTestcode });
            }
        } catch (error) {
            console.error('Failed to add question:', error);
            toast.error(error?.data?.message || 'Failed to add question');
        }
    };

    const handleDelete = async (question) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                const questionId = question?.id;
                const subcode = question?.SUBCODE || selectedSubcode;

                if (!questionId) {
                    toast.error('Question ID is missing');
                    return;
                }

                await deleteValidQuestion({ id: questionId, subcode, testcode: selectedTestcode }).unwrap();
                toast.success('Question deleted successfully!');

                // Refetch the data for current subcode
                if (selectedSubcode && selectedTestcode) {
                    getValidQbsData({ subcode: selectedSubcode, testcode: selectedTestcode });
                }
            } catch (error) {
                console.error('Failed to delete question:', error);
                toast.error(error?.data?.message || 'Failed to delete question');
            }
        }
    };

    // Define columns for DataTable
    const columns = useMemo(() => [
        {
            name: 'Subject Code',
            selector: row => row.SUBCODE,
            sortable: true,
            width: '140px',
        },
        {
            name: 'Test Code',
            selector: row => row.testcode || '',
            sortable: true,
            width: '150px',
        },
        {
            name: 'Section',
            selector: row => row.SECTION,
            sortable: true,
            width: '100px',
        },
        {
            name: 'Sub Sec',
            selector: row => row.SUB_SEC,
            sortable: true,
            width: '100px',
            center: true,
            cell: row => row.SUB_SEC ?? '—',
        },
        {
            name: 'From Qst',
            selector: row => row.FROM_QST,
            sortable: true,
            width: '100px',
            center: true,
        },
        {
            name: 'To Qst',
            selector: row => row.TO_QST,
            sortable: true,
            width: '100px',
            center: true,
        },
        {
            name: 'Max Marks',
            selector: row => row.MARK_MAX,
            sortable: true,
            width: '110px',
            center: true,
        },
        {
            name: 'No. of Qst',
            selector: row => row.NOQST,
            sortable: true,
            width: '100px',
            center: true,
        },
        {
            name: 'Compulsory Qst',
            selector: row => row.C_QST,
            sortable: true,
            width: '110px',
            center: true,
        },
        {
            name: 'Eva Month/Year',
            selector: row => row.Eva_Mon_Year,
            sortable: true,
            width: '150px',
        },
        {
            name: 'Action',
            cell: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => handleEdit(row)}
                        disabled={!subcodeError}
                        style={{
                            padding: '6px 16px',
                            backgroundColor: subcodeError ? '#4CAF50' : '#a5d6a7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: subcodeError ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: subcodeError ? 1 : 0.6,
                        }}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        disabled={!subcodeError}
                        style={{
                            padding: '6px 16px',
                            backgroundColor: subcodeError ? '#f44336' : '#ef9a9a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: subcodeError ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: subcodeError ? 1 : 0.6,
                        }}
                    >
                        Delete
                    </button>
                </div>
            ),
            width: '180px',
            center: true,
        },
    ], [subcodeError]);

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


            <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
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
                        <h1 style={{
                            margin: '0',
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Valid Questions Master
                        </h1>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: !subcodeError ? '#1976d2' : '#e80f0f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: !subcodeError ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    opacity: subcodeError ? 1 : 0.6,
                                }}
                                disabled={!subcodeError}
                            >
                                Add Question
                            </button>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="Search questions..."
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

                    {/* Subject Code Selector */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            Subject Code
                        </label>
                        <Select
                            value={selectedOption}
                            onChange={(option) => {
                                setSelectedSubcode(option?.subcode || '');
                                setSelectedTestcode(option?.testcode || '');
                            }}
                            options={subjectOptions}
                            placeholder="Please select the subcode"
                            isSearchable
                            isClearable
                            isDisabled={submasterLoading}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderColor: '#4CAF50',
                                    boxShadow: state.isFocused ? '0 0 0 1px #4CAF50' : 'none',
                                    minHeight: '40px',
                                    height: '40px',
                                    '&:hover': { borderColor: '#4CAF50' },
                                    fontSize: '14px',
                                    fontWeight: 500,
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 12px',
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: '40px',
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: '#666',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 5,
                                }),
                            }}
                        />
                    </div>

                    {(validQuestionError || submasterError) && (
                        <div style={{
                            padding: '12px',
                            marginBottom: '16px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '4px',
                            border: '1px solid #ef9a9a'
                        }}>
                            Error: {validQuestionError?.message || submasterError?.message || 'Failed to load data'}
                        </div>
                    )}

                    <DataTable
                        columns={columns}
                        data={filteredQuestions}
                        progressPending={(validQuestionLoading || submasterLoading) && displayedQuestions.length === 0}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        highlightOnHover
                        pointerOnHover
                        responsive
                        customStyles={customStyles}
                        noDataComponent={
                            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                No questions found.
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

            {/* Add Modal */}
            <ValidQbsAddModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSave={handleSaveAdd}
                defaultSubcode={selectedSubcode}
                defaultTestcode={selectedTestcode}
            />

            {/* Edit Modal */}
            <ValidQbsEditModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                initialData={selectedQuestion || {}}
                onSave={handleSaveEdit}
            />
        </>
    )
}

export default Valid_Qbs_Master
