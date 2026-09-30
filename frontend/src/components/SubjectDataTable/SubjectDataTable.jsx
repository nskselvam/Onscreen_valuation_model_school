import React, { useMemo, useState } from 'react';
import DataTableBase from 'react-data-table-component';
import { Form, InputGroup, Card, Spinner } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';
import ExaminerSubjectModal from '../modals/ExaminerSubjectModal';
import { useSelector } from 'react-redux';



const DataTable = DataTableBase.default || DataTableBase;

/**
 * SubjectDataTable Component
 * Displays subject information with DataTable
 * Fields: Subject Code, Subject Name, Department Name, Camp Id, Camp Officer Id, Total Paper in Each Subject
 */
const SubjectDataTable = ({ data = [], isLoading = false, title = "Subject Information", evaId = null, selectedRole = null, onDelete = null }) => {
  const [searchText, setSearchText] = useState('');
  const [modalShow, setModalShow] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [modalMode, setModalMode] = useState('add');

  const userDegree = useSelector((state) => state.auth.degreeInfo);
  

  // Handle save from modal
  const handleSaveSubject = (formData) => {
    // Add your save logic here (API call, etc.)
    // After successful save, you can close the modal
    // setModalShow(false);
  };




  // Filter data based on search text
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!searchText.trim()) return data;

    const lower = searchText.toLowerCase().trim();
    return data.filter((row) =>
      String(row.sub_code || row.Subcode || '').toLowerCase().includes(lower) ||
      String(row.sub_name || row.SUBNAME || '').toLowerCase().includes(lower) ||
      String(row.department || row.Dep_Name || '').toLowerCase().includes(lower) ||
      String(row.Camp_id || '').toLowerCase().includes(lower) ||
      String(row.camp_offcer_id_examiner || row.Camp_Officer_Id || '').toLowerCase().includes(lower) ||
      String(row.Eva_Subject || '0').toLowerCase().includes(lower) ||
      `val-${String(row.Eva_Subject || '0')}`.toLowerCase().includes(lower)
    );
  }, [data, searchText]);

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      sortable: false,
      width: '70px',
      center: true,
    },
    {
      name: 'Subject Code',
      selector: row => row.sub_code || row.Subcode || '-',
      sortable: true,
      width: '140px',
      cell: (row) => (
        <span style={{ 
          fontWeight: '600', 
          color: '#2c5282',
          fontSize: '13px'
        }}>
          {row.sub_code || row.Subcode || '-'}
        </span>
      ),
    },

    {
        name : 'Valuation Type',
        selector: row => row.Eva_Subject || '-',
        sortable: true,
        width: '100px',
        cell: (row) => (
          <span style={{ 
            fontWeight: '500', 
            color: '#2c5282',
            fontSize: '13px'
          }}>
           Val-   {row.Eva_Subject || '-'}
          </span>
        ),
      },    
    
  
    // {
    //   name: 'Subject Name',
    //   selector: row => row.sub_name || row.SUBNAME || '-',
    //   sortable: true,
    //   grow: 2,
    //   wrap: true,
    //   cell: (row) => (
    //     <span style={{ 
    //       fontSize: '13px',
    //       lineHeight: '1.4'
    //     }}>
    //       {row.sub_name || row.SUBNAME || '-'}
    //     </span>
    //   ),
    // },
    {
      name: 'Department',
      selector: row => row.department || row.Dep_Name || '-',
      sortable: true,
      width: '130px',
      center: true,
      cell: (row) => (
        <span style={{
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: '#e6f2ff',
          color: '#0066cc',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {userDegree && row.department ? userDegree.find(d => d.D_Code === row.department)?.Degree_Name || row.department : row.department || '-'}
        </span>
      ),
    },
    {
      name: 'Camp ID',
      selector: row => row.Camp_id || '-',
      sortable: true,
      width: '130px',
      center: true,
      cell: (row) => (
        <span style={{ 
          fontSize: '13px',
          fontWeight: '500',
          color: '#2d3748'
        }}>
          {row.Camp_id || '-'}
        </span>
      ),
    },
    {
      name: 'Camp Officer ID',
      selector: row => row.camp_offcer_id_examiner || row.Camp_Officer_Id || '-',
      sortable: true,
      width: '150px',
      center: true,
      cell: (row) => (
        <span style={{ 
          fontSize: '13px',
          fontWeight: '500',
          color: '#2d3748'
        }}>
          {row.camp_offcer_id_examiner || row.Camp_Officer_Id || '-'}
        </span>
      ),
    },
    {
      name: 'Total Papers',
      selector: row => row.Sub_Max_Papers || row.Total_Paper_In_Each_Subject || '0',
      sortable: true,
      width: '130px',
      center: true,
      cell: (row) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '8px',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {row.Sub_Max_Papers || row.Total_Paper_In_Each_Subject || '0'}
        </span>
      ),
    },

    {
        name: 'Examiner Status',
        selector: row => row.Examiner_Valuation_Status || '-',
        sortable: true,
        width: '150px',
        center: true,
        cell: (row) => (
          <span style={{
            padding: '4px 12px',
            borderRadius: '8px',
            backgroundColor: row.Examiner_Valuation_Status === 'N' ? '#f0fdf4' : '#fff7ed',
            color: row.Examiner_Valuation_Status === 'Y' ? '#16a34a' : '#d97706',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {row.Examiner_Valuation_Status == 'N' ? 'No' : 'Yes'}
          </span>
        ),
      },

      {
        name: 'Edit',
        selector: row => row.id || '-',
        width: '100px',
        center: true,
        cell: (row) => (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentData(row);
              setModalMode('edit');
              setModalShow(true);
            }}
          >
            Edit
          </button>
        ),
      },

      {
        name: 'Delete',
        width: '100px',
        center: true,
        cell: (row) => (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onDelete) {
                onDelete(row);
              } else {
              }
            }}
          >
            Delete
          </button>
        ),
      },

  ], [onDelete]);

  // Custom styles for DataTable
  const customStyles = {
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        minHeight: '52px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        color: '#334155',
        minHeight: '56px',
        '&:not(:last-of-type)': {
          borderBottom: '1px solid #f1f5f9',
        },
        '&:hover': {
          backgroundColor: '#f8fafc',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f1f5f9',
        borderBottomColor: '#cbd5e1',
        outline: '1px solid #cbd5e1',
      },
    },
    cells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
        fontSize: '13px',
        minHeight: '56px',
        backgroundColor: '#f8fafc',
      },
      pageButtonsStyle: {
        borderRadius: '6px',
        height: '36px',
        width: '36px',
        padding: '8px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: 'transparent',
        fill: '#64748b',
        '&:disabled': {
          cursor: 'not-allowed',
          fill: '#cbd5e1',
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#e2e8f0',
        },
      },
    },
  };

  return (
    <>
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            
          <h5 className="mb-0 text-dark fw-semibold">{title}</h5>
          <InputGroup style={{ width: '300px' }}>
            <InputGroup.Text className="bg-light border-end-0">
              <FiSearch size={18} color="#64748b" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search subjects..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border-start-0 bg-light"
              style={{ fontSize: '14px' }}
            />
          </InputGroup>

          <button 
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ 
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 20px',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentData(currentData);
              setModalMode('add');
              setModalShow(true);
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Add Subject
          </button>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3 text-muted">Loading subjects...</span>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
              highlightOnHover
              striped
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="py-5 text-center">
                  <p className="text-muted mb-0">No subjects found</p>
                </div>
              }
            />
            <div className="px-3 py-2 bg-light border-top">
              <small className="text-muted">
                Showing {filteredData.length} of {data.length} subjects
              </small>
            </div>
          </>
        )}
      </Card.Body>
    </Card>

    <ExaminerSubjectModal 
      show={modalShow}
      onHide={() => setModalShow(false)}
      currentData={currentData}
      mode={modalMode}
      onSave={handleSaveSubject}
      evaId={evaId || currentData?.Eva_Id}
      selectedRole={selectedRole}
    />
    </>
  );
};

export default SubjectDataTable;
