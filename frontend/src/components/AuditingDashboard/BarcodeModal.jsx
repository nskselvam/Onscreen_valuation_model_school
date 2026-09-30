import React from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import DataTableBase from 'react-data-table-component'
import { useNavigate } from 'react-router-dom'

const DataTable = DataTableBase.default || DataTableBase

const customStyles = {
  headRow: {
    style: {
      backgroundColor: '#1e3a8a',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: '700',
      minHeight: '46px',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    },
  },
  headCells: {
    style: {
      color: '#ffffff',
      fontWeight: '700',
    },
  },
  rows: {
    style: {
      minHeight: '48px',
      fontSize: '13px',
      '&:hover': {
        backgroundColor: '#eff6ff',
      },
    },
    stripedStyle: {
      backgroundColor: '#f8fafc',
    },
  },
  cells: {
    style: {
      paddingLeft: '10px',
      paddingRight: '10px',
    },
  },
}

const conditionalRowStyles = [
  {
    when: (row) => String(row?.remarksAvailable || '').toLowerCase() === 'y',
    style: {
      backgroundColor: '#dcfce7',
      borderLeft: '4px solid #16a34a',
      '&:hover': {
        backgroundColor: '#bbf7d0',
      },
    },
  },
]

const BarcodeModal = ({ selectedSubject, onClose }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [perPage, setPerPage] = React.useState(10)
  const handleViewRow = React.useCallback((row) => {
    const mergedRow = {
      ...(row || {}),
      subcode: selectedSubject?.subcode || row?.SubjectCode || '',
      subname: selectedSubject?.subname || row?.SUBNAME || '',
      subEva: selectedSubject?.subEva || row?.Eva_Mon_Year || '',
      Dummy_NO: row?.Dummy_NO || row?.barcode || '',
      SubjectCode: row?.SubjectCode || selectedSubject?.subcode || '',
      RegisterNo: row?.RegisterNo || row?.Evaluator_Id || '',
      Eva_Mon_Year: row?.Eva_Mon_Year || selectedSubject?.subEva || '',
      Valuation_Type: row?.Valuation_Type || row?.valuation_type || '1',
      Dep_Name: row?.Dep_Name || '',
    }

    const reviewData = {
      ...mergedRow,
      barcode: row?.barcode || '',
      Evaluator_Id: row?.Evaluator_Id || '',
      tot_round: row?.tot_round || '',
      import1Row: mergedRow,
    }

    sessionStorage.setItem('thiagarayaAuditingReviewData', JSON.stringify(reviewData))
    onClose()
    navigate('/examiner/thiyagaraja-auditing/review', {
      state: { reviewData },
    })
  }, [navigate, onClose, selectedSubject])


  const importRows = React.useMemo(() => {
    if (Array.isArray(selectedSubject?.import1Data)) {
      return selectedSubject.import1Data
    }

    return []
  }, [selectedSubject])

  const barcodeList = React.useMemo(() => {
    return importRows.map((entry) => entry?.barcode).filter(Boolean)
  }, [importRows])

  const deferredSearchTerm = React.useDeferredValue(searchTerm)

  const filteredRows = React.useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return importRows
    }

    return importRows.filter((row) => {
      return [
        selectedSubject?.subcode,
        row?.barcode,
        row?.Evaluator_Id,
        row?.tot_round,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    })
  }, [importRows, deferredSearchTerm, selectedSubject?.subcode])

  const columns = React.useMemo(() => ([
    {
      name: 'S.No',
      cell: (row, index) => (currentPage - 1) * perPage + index + 1,
      width: '80px',
      center: true,
    },
    {
      name: 'Subcode',
      selector: () => selectedSubject?.subcode || '-',
      sortable: true,
      width: '120px',
      cell: () => (
        <span style={{ fontWeight: '700', color: '#1d4ed8' }}>
          {selectedSubject?.subcode || '-'}
        </span>
      ),
    },
    {
      name: 'Barcode',
      selector: (row) => row?.barcode || '-',
      sortable: true,
      minWidth: '150px',
      cell: (row) => (
        <span style={{ fontWeight: '700', color: '#2563eb' }}>
          {row?.barcode || '-'}
        </span>
      ),
    },
    {
      name: 'Evaluator ID',
      selector: (row) => row?.Evaluator_Id || '-',
      sortable: true,
      minWidth: '150px',
      cell: (row) => (
        <span style={{ fontWeight: '600', color: '#0f172a' }}>
          {row?.Evaluator_Id || '-'}
        </span>
      ),
    },
    {
      name: 'Marks',
      selector: (row) => row?.tot_round || '-',
      sortable: true,
      width: '100px',
      center: true,
      cell: (row) => (
        <span style={{ fontWeight: '700', color: '#065f46' }}>
          {row?.tot_round || '-'}
        </span>
      ),
    },
    {
      name: 'View',
      width: '110px',
      center: true,
      cell: (row) => (
        <button
          type="button"
          className="auditing-table-view-button"
          onClick={() => handleViewRow(row)}
        >
          View
        </button>
      ),
    },
  ]), [currentPage, perPage, selectedSubject?.subcode, handleViewRow])

  React.useEffect(() => {
    setSearchTerm('')
    setCurrentPage(1)
  }, [selectedSubject?.subcode])

  const hasRows = importRows.length > 0

  return (
    <Modal
      show={Boolean(selectedSubject)}
      onHide={onClose}
      centered
      size="xl"
      dialogClassName="auditing-barcode-modal-dialog"
      contentClassName="auditing-barcode-modal-content"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {selectedSubject?.subcode || 'Subject'} Barcodes
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="auditing-barcode-modal-body">
        <div className="auditing-modal-subject-name">
          {selectedSubject?.subname || 'Subject name not available'}
        </div>
        <div className="auditing-modal-subject-meta">
          <span>Evaluation: {selectedSubject?.subEva || '-'}</span>
          <span>Barcode Count: {importRows.length || barcodeList.length}</span>
        </div>

        {hasRows ? (
          <>
            <Form.Group className="auditing-barcode-search-group">
              <Form.Control
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search subcode / evaluator id / marks / barcode"
                className="auditing-barcode-search-input"
              />
            </Form.Group>

            <div className="auditing-datatable-wrapper">
              <DataTable
                columns={columns}
                data={filteredRows}
                conditionalRowStyles={conditionalRowStyles}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 20, 50, 100]}
                onChangePage={(page) => setCurrentPage(page)}
                onChangeRowsPerPage={(rowsPerPage, page) => {
                  setPerPage(rowsPerPage)
                  setCurrentPage(page)
                }}
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="auditing-empty-barcodes">No records match your search.</div>
                }
              />
            </div>
          </>
        ) : (
          <div className="auditing-empty-barcodes">No data available for this subject.</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default BarcodeModal
