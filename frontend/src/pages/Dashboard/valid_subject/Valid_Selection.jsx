import React, { useMemo, useState, useEffect } from 'react'
import Select from 'react-select';
import DataTableBase from 'react-data-table-component';
import {
  useGetCommonDataQuery,
  useGetValidSectionsDataMutation,
  useAddValidSectionMutation,
  useUpdateValidSectionMutation,
  useDeleteValidSectionMutation
} from '../../../redux-slice/getDataCommonRouterdata.js';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { masterDataAdminDataSubcode } from '../../../redux-slice/getDataCommonRouterSlice';
import ValidSelectionAddModal from '../../../components/modals/ValidSelectionAddModal';
import ValidSelectionEditModal from '../../../components/modals/ValidSelectionEditModal';

const DataTable = DataTableBase.default || DataTableBase;

const Valid_Selection = () => {
  const dispatch = useDispatch();
  const { data: submasterData, error: submasterError, isLoading: submasterLoading, refetch } = useGetCommonDataQuery(
    { tableId: 'sub_master' }
  );

  const [getValidSectionsData, { data: validSectionsData, error: validSectionsError, isLoading: validSectionsLoading }] = useGetValidSectionsDataMutation();
  const [addValidSection, { isLoading: isAdding }] = useAddValidSectionMutation();
  const [updateValidSection, { isLoading: isUpdating }] = useUpdateValidSectionMutation();
  const [deleteValidSection, { isLoading: isDeleting }] = useDeleteValidSectionMutation();

  const [searchText, setSearchText] = useState('');
  const [selectedSubcode, setSelectedSubcode] = useState('');
  const [selectedTestcode, setSelectedTestcode] = useState('');
  const [displayedSections, setDisplayedSections] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [subcodeError, setSubcodeError] = useState(false);
  const [subcnt, setSubcnt] = useState(0);

  const subjectsFromStore = useSelector((state) => state.masterDataAdminData.master_data_admin);


  useEffect(() => {
    if (submasterData?.data) {
      dispatch(masterDataAdminDataSubcode(submasterData.data));
    }
  }, [submasterData, dispatch]);

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

  const sections = useMemo(() => {
    return validSectionsData?.data || [];
  }, [validSectionsData]);

  useEffect(() => {
    setDisplayedSections(sections);
  }, [sections]);

  const subjectKeys = useMemo(() => {
    return new Set(subjects.map((subject) => `${subject.Subcode}::${subject.testcode || ''}`));
  }, [subjects]);

  useEffect(() => {
    const subjectKey = `${selectedSubcode}::${selectedTestcode}`;
    if (selectedSubcode && selectedTestcode && subjectKeys.has(subjectKey)) {
      getValidSectionsData({ subcode: selectedSubcode, testcode: selectedTestcode });
      return;
    }

    if (!selectedSubcode || !selectedTestcode) {
      setDisplayedSections([]);
    }
  }, [selectedSubcode, selectedTestcode, getValidSectionsData, subjectKeys]);

  useEffect(() => {
    if (!selectedSubcode) {
      setSubcodeError(false);
      return;
    }
    const subjectData = subjectsFromStore?.find(subject => subject.Subcode === selectedSubcode && subject.testcode === selectedTestcode);
    const mismatchFlg = subjectData?.mismatch_flg || '';
    setSubcodeError(mismatchFlg !== 'Y');
  }, [selectedSubcode, selectedTestcode, subjectsFromStore]);

  const filteredSections = useMemo(() => {
    let filtered = displayedSections;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(section =>
        section.section?.toLowerCase().includes(searchLower) ||
        section.sub_section?.toLowerCase().includes(searchLower) ||
        section.Eva_Mon_Year?.toLowerCase().includes(searchLower) ||
        section.sub_code?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [displayedSections, searchText]);

  const getSectionKey = (section) => {
    return section?.id || section?.section_id || `${section?.sub_code}-${section?.section}-${section?.sub_section}-${section?.qstn_num}-${section?.Eva_Mon_Year}`;
  };

  const handleEdit = (section) => {
    setSelectedSection(section);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedSection) => {
    try {
      const sectionId = selectedSection?.id;
      if (!sectionId) {
        toast.error('Section ID is missing');
        return;
      }

      await updateValidSection({ id: sectionId, ...updatedSection, testcode: selectedTestcode }).unwrap();
      toast.success('Section updated successfully!');
      setShowEditModal(false);
      setSelectedSection(null);

      // Refetch the data for current subcode
      if (selectedSubcode && selectedTestcode) {
        getValidSectionsData({ subcode: selectedSubcode, testcode: selectedTestcode });
      }
    } catch (error) {
      console.error('Failed to update section:', error);
      toast.error(error?.data?.message || 'Failed to update section');
    }
  };

  const handleSaveAdd = async (newSection) => {
    try {
      const subjectCode = newSection.sub_code || selectedSubcode;
      if (!subjectCode) {
        toast.error('Subject code is required');
        return;
      }

      const sectionData = {
        ...newSection,
        sub_code: subjectCode,
        testcode: selectedTestcode,
      };

      await addValidSection(sectionData).unwrap();
      toast.success('Section added successfully!');
      setShowAddModal(false);

      // Refetch the data for current subcode
      if (selectedSubcode && selectedTestcode) {
        getValidSectionsData({ subcode: selectedSubcode, testcode: selectedTestcode });
      }
    } catch (error) {
      console.error('Failed to add section:', error);
      toast.error(error?.data?.message || 'Failed to add section');
    }
  };

  const handleDelete = async (section) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        const sectionId = section?.id;
        const subcode = section?.sub_code || selectedSubcode;

        if (!sectionId) {
          toast.error('Section ID is missing');
          return;
        }

        await deleteValidSection({ id: sectionId, subcode, testcode: selectedTestcode }).unwrap();
        toast.success('Section deleted successfully!');

        // Refetch the data for current subcode
        if (selectedSubcode && selectedTestcode) {
          getValidSectionsData({ subcode: selectedSubcode, testcode: selectedTestcode });
        }
      } catch (error) {
        console.error('Failed to delete section:', error);
        toast.error(error?.data?.message || 'Failed to delete section');
      }
    }
  };

  const columns = useMemo(() => [
    {
      name: 'Subject Code',
      selector: row => row.sub_code,
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
      name: 'Section',
      selector: row => row.section,
      sortable: true,
      width: '100px',
    },
    {
      name: 'Sub Section',
      selector: row => row.sub_section,
      sortable: true,
      width: '120px',
    },

    {
      name: 'Add Sub Section',
      selector: row => row.add_sub_section,
      sortable: true,
      width: '120px',
    },
    
    {
      name: 'Qstn No',
      selector: row => row.qstn_num,
      sortable: true,
      width: '100px',
      center: true,
    },
    {
      name: 'Max Marks',
      selector: row => row.max_mark,
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
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
          <button
            onClick={() => handleEdit(row)}
            disabled={!subcodeError}
            style={{
              padding: '4px 10px',
              backgroundColor: subcodeError ? '#4CAF50' : '#a5d6a7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: subcodeError ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: '500',
              lineHeight: '1',
              whiteSpace: 'nowrap',
              opacity: subcodeError ? 1 : 0.6,
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            disabled={!subcodeError}
            style={{
              padding: '4px 10px',
              backgroundColor: subcodeError ? '#f44336' : '#ef9a9a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: subcodeError ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: '500',
              lineHeight: '1',
              whiteSpace: 'nowrap',
              opacity: subcodeError ? 1 : 0.6,
            }}
          >
            Delete
          </button>
        </div>
      ),
      width: '150px',
      grow: 0,
      center: true,
    },
  ], [subcodeError]);

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
              Valid Sections
            </h1>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: subcodeError ? '#1976d2' : '#90caf9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: subcodeError ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                disabled={!subcodeError}
              >
                Add Section
              </button>
              <div style={{ position: 'relative', width: '300px' }}>
                <input
                  type="text"
                  placeholder="Search sections..."
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
                setSelectedSubcode(option?.subcode || '')
                setSelectedTestcode(option?.testcode || '')
                setSubcnt(subcnt + 1)
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

          {(validSectionsError || submasterError) && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              border: '1px solid #ef9a9a'
            }}>
              Error: {validSectionsError?.message || submasterError?.message || 'Failed to load data'}
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredSections}
            progressPending={(validSectionsLoading || submasterLoading) && displayedSections.length === 0}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            highlightOnHover
            pointerOnHover
            responsive
            customStyles={customStyles}
            noDataComponent={
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                No sections found.
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
      <ValidSelectionAddModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSave={handleSaveAdd}
        defaultSubcode={selectedSubcode}
        defaultTestcode={selectedTestcode}
      />

      {/* Edit Modal */}
      <ValidSelectionEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        initialData={selectedSection || {}}
        onSave={handleSaveEdit}
      />
    </>
  )
}

export default Valid_Selection
