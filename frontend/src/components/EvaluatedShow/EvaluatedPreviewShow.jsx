import React, { useEffect, useMemo, useState } from 'react'
import DataTableBase from 'react-data-table-component'
import { useGetValuationTimingDataQuery } from '../../redux-slice/valuationApiSlice'

const DataTable = DataTableBase.default || DataTableBase;

const EvaluatedPreviewShow = ({ basicData }) => {

  const { data: timingData, error, isLoading } = useGetValuationTimingDataQuery({
    evaluator_id: basicData?.Eva_Id,
  })

  const [searchText, setSearchText] = useState('');

  const filteredData = useMemo(() => {
    if (!timingData?.data) return [];
    if (!searchText.trim()) return timingData.data;
    const lower = searchText.toLowerCase().trim();
    return timingData.data.filter((row) =>
      String(row.barcode || '').toLowerCase().includes(lower) ||
      String(row.subcode || '').toLowerCase().includes(lower) ||
      String(row.tot_round || '').toLowerCase().includes(lower) ||
      String(row.valuation_type || '').toLowerCase().includes(lower)
    );
  }, [timingData, searchText]);

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      sortable: false,
      width: '70px',
    },
    {
      name: 'Barcode',
      selector: (row) => row.barcode,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Subcode',
      selector: (row) => row.subcode,
      sortable: true,
      width: '130px',
    },
    {
      name: 'Mark',
      selector: (row) => row.tot_round,
      sortable: true,
      width: '120px',
      cell: (row) => (
        <span style={{ fontWeight: '600', color: '#2c5282' }}>
          {row.tot_round || '-'}
        </span>
      ),
    },
    {
      name: 'Duration',
      selector: (row) => row.time_taken?.formatted,
      sortable: true,
      width: '150px',
      cell: (row) => (
        <span style={{ 
          padding: '4px 10px', 
          borderRadius: '12px', 
          backgroundColor: '#e6f2ff', 
          color: '#0066cc',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          {row.time_taken?.formatted || '-'}
        </span>
      ),
    },
    {
      name: 'V-Type',
      selector: (row) => row.valuation_type,
      sortable: true,
      width: '130px',
      cell: (row) => (
        <span style={{
          padding: '3px 8px',
          borderRadius: '8px',
          backgroundColor: '#f0f0f0',
          fontSize: '12px'
        }}>
          Val - {row.valuation_type}
        </span>
      ),
    },
  ], []);

  // Custom styles for DataTable
  const customStyles = {
    table: {
      style: {
        borderRadius: '8px',
        overflow: 'hidden',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#2c5282',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderBottom: '2px solid #1a365d',
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '13px',
        '&:hover': {
          backgroundColor: '#f7fafc',
          cursor: 'pointer',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#edf2f7',
        borderBottomColor: '#FFFFFF',
        outline: '1px solid #cbd5e0',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading valuation timing data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#e53e3e',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        padding: '20px'
      }}>
        Error loading data: {error?.data?.message || error?.message || 'Failed to fetch timing data'}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* <div style={{ 
        marginBottom: '20px', 
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: '#2c5282',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Today's Valuation Summary
        </h4>
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          fontSize: '14px', 
          color: '#4a5568' 
        }}>
          <div>
            <strong>Evaluator ID:</strong> {basicData?.Eva_Id || '-'}
          </div>
          <div>
            <strong>Total Papers:</strong> {timingData?.data?.length || 0}
          </div>
        </div>
      </div> */}

      <style>
        {`
          .rdt_TableBody::-webkit-scrollbar {
            height: 10px;
          }
          .rdt_TableBody::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .rdt_TableBody::-webkit-scrollbar-thumb {
            background: #2c5282;
            border-radius: 10px;
          }
          .rdt_TableBody::-webkit-scrollbar-thumb:hover {
            background: #1a365d;
          }
        `}
      </style>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
      }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search barcode, subcode..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 38px 9px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e0',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2c5282')}
            onBlur={(e) => (e.target.style.borderColor = '#cbd5e0')}
          />
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#718096',
            fontSize: '16px',
            pointerEvents: 'none',
          }}>
            🔍
          </span>
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#2c5282',
          marginLeft: '10px',
          color: '#ffffff',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
        }}>
         {filteredData.length}
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30, 50]}
          highlightOnHover
          striped
          responsive
          customStyles={customStyles}
          noDataComponent={
            <div style={{ 
              padding: '60px 20px', 
              textAlign: 'center',
              color: '#718096',
              fontSize: '15px'
            }}>
              No valuation data found for today
            </div>
          }
        />
      </div>
    </div>
  )
}

export default EvaluatedPreviewShow
