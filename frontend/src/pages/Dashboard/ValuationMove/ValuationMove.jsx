import React, { useState, useMemo, useRef, useEffect, use } from 'react'
import {
  Card, Form, Row, Col, Button, Badge, Spinner, Alert, Modal
} from 'react-bootstrap'
import DataTableBase from 'react-data-table-component'
import * as XLSX from 'xlsx'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { FiUploadCloud, FiSearch, FiArrowRight, FiFileText, FiCheckCircle, FiSend, FiDownload } from 'react-icons/fi'
import { MdOutlineTableChart, MdSwapHoriz, MdCloudUpload, MdCompareArrows } from 'react-icons/md'
import { BsFileEarmarkExcel, BsArrowRightCircleFill, BsCheckSquareFill, BsSquare } from 'react-icons/bs'
import { FiX } from 'react-icons/fi'
import { useGetSubjectDataQuery } from '../../../redux-slice/SubjectMasterApiSlice'
import { useGetFileUploadMutation, useLazyGetValuationMoveDataQuery,useValuationUpdateDataMutation } from '../../../redux-slice/valuationMoveApiSlice'

const DataTable = DataTableBase.default || DataTableBase

const VALUATION_OPTIONS = [
  { value: '', label: '-- Select Valuation --' },
  { value: '1', label: 'Valuation 1' },
  { value: '2', label: 'Valuation 2' },
  { value: '3', label: 'Valuation 3' },
  { value: '4', label: 'Valuation 4' },
]

// Map: selecting From Valuation N only allows viewing Valuation N+1
const TO_VALUATION_MAP = { '1': '2', '2': '3', '3': '4' }

/* Required columns for Valuation Shift Excel upload (must match sample) */
const REQUIRED_EXCEL_COLUMNS = ['Barcode', 'SubCode', 'ToValuation']

/* Row / badge colors keyed by ToValuation value */
const VALUATION_ROW_COLORS = {
  '1': { bg: '#fef2f2', border: '#fca5a5', badge: '#991b1b', badgeBg: '#fee2e2' }, // red
}

/* ── Shared styles ─────────────────────────────────────────────────────── */
const CARD_STYLE = {
  border: 'none',
  boxShadow: '0 4px 24px rgba(30,60,114,0.10)',
  borderRadius: '16px',
  overflow: 'hidden',
}
const HEADER_STYLE = {
  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  color: '#fff',
  border: 'none',
  padding: '16px 24px',
}
const LABEL_STYLE = {
  fontSize: '11.5px',
  fontWeight: '700',
  color: '#4a5568',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}
const INPUT_STYLE = {
  fontSize: '13.5px',
  borderRadius: '10px',
  borderColor: '#c8d6e5',
  height: '42px',
  boxShadow: 'none',
  transition: 'border-color 0.2s',
}

const customTableStyles = {
  headCells: {
    style: {
      backgroundColor: '#1e3c72',
      color: '#fff',
      fontWeight: '700',
      fontSize: '12.5px',
      padding: '13px 16px',
      letterSpacing: '0.3px',
    },
  },
  rows: {
    style: {
      fontSize: '13px',
      minHeight: '48px',
      borderBottom: '1px solid #f0f4f8',
    },
    stripedStyle: { backgroundColor: '#f7fafd' },
    highlightOnHoverStyle: {
      backgroundColor: '#eaf1ff',
      cursor: 'pointer',
      transition: 'background 0.15s',
    },
  },
  cells: {
    style: { padding: '10px 16px' },
  },
  pagination: {
    style: { fontSize: '13px', borderTop: '1px solid #e8edf2', padding: '10px 16px' },
  },
  noData: {
    style: { padding: '40px 16px', color: '#94a3b8', fontSize: '14px' },
  },
}

/* ─────────────────────────────────────────────────────────────────────── */
const ValuationMove = () => {
  /* ── Mode ── */
  const [selectedMode, setSelectedMode] = useState('')

  /* ── Option 1 : Excel Upload ── */
  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadVariant, setUploadVariant] = useState('info')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmittingExcel, setIsSubmittingExcel] = useState(false)
  const fileInputRef = useRef(null)

  /* ── Option 2 : Comparison & Direct Upload ── */
  const [isSubmittingComp, setIsSubmittingComp] = useState(false)
  const [fromValuation, setFromValuation] = useState('')
  const [toValuation, setToValuation] = useState('')
  const [markText, setMarkText] = useState('')
  const [markCheckbox, setMarkCheckbox] = useState(false)
  const [compData, setCompData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const [getFileUpload] = useGetFileUploadMutation()
  const [triggerGetValuationMoveData] = useLazyGetValuationMoveDataQuery()
  const [valuationUpdateData] = useValuationUpdateDataMutation()

  /* ── Subject multi-select ── */
  const [selectedSubcodes, setSelectedSubcodes] = useState([])
  const [subcodeSearch, setSubcodeSearch] = useState('')
  const [subcodeText, setSubcodeText] = useState('')
  const [subDropdownOpen, setSubDropdownOpen] = useState(false)
  const subDropdownRef = useRef(null)
  const userInfo = useSelector((state) => state.auth.userInfo)

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (subDropdownRef.current && !subDropdownRef.current.contains(e.target)) {
        setSubDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* Fetch all subjects from /api/subject */
  const { data: subjectApiDataFin, isLoading: subjectsLoading } = useGetSubjectDataQuery()

  const subjectApiData = useMemo(() => {
    const list = subjectApiDataFin?.data ?? []
    if (!userInfo?.selected_course) return list
    return list.filter((s) => s.Dep_Name === userInfo.selected_course)
  }, [subjectApiDataFin, userInfo?.selected_course])

  /* ── Reset on mode change ── */
  const handleModeChange = (val) => {
    setSelectedMode(val)
    setExcelFile(null)
    setExcelData([])
    setUploadStatus('')
    setFromValuation('')
    setToValuation('')
    setMarkText('')
    setMarkCheckbox(false)
    setCompData([])
    setSearchText('')
    setSelectedSubcodes([])
    setSubcodeSearch('')
    setSubcodeText('')
    setSubDropdownOpen(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ──────────── OPTION 1 handlers ──────────── */

  /* Download a sample Excel template for Valuation Shift */
  const handleDownloadSample = () => {
    const sampleRows = [
      {
        Barcode: 'B10001',
        SubCode: 'CS101',
        ToValuation: '1',
      },
      {
       Barcode: 'B10002',
        SubCode: 'CS102',
        ToValuation: '2',
      },
      {
       Barcode: 'B10003',
        SubCode: 'CS103',
        ToValuation: '3',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(sampleRows)
    /* Column widths */
    ws['!cols'] = [
      { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 22 },
      { wch: 16 }, { wch: 14 }, { wch: 11 }, { wch: 11 }, { wch: 18 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ValuationShift')
    XLSX.writeFile(wb, 'ValuationShift_Sample.xlsx')
    toast.success('Sample file downloaded!')
  }

  const handleExcelChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error('Please select a valid Excel file (.xlsx / .xls / .csv)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)

        if (json.length === 0) {
          toast.error('The uploaded file is empty. Please use the sample format.')
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }

        /* ── Column format validation ── */
        const uploadedCols = Object.keys(json[0])
        const missingCols = REQUIRED_EXCEL_COLUMNS.filter(
          (col) => !uploadedCols.includes(col)
        )
        const extraCols = uploadedCols.filter(
          (col) => !REQUIRED_EXCEL_COLUMNS.includes(col)
        )

        if (missingCols.length > 0) {
          setExcelFile(null)
          setExcelData([])
          setUploadStatus(
            `Invalid format – missing column(s): ${missingCols.join(', ')}. Please download and use the sample file.`
          )
          setUploadVariant('danger')
          if (fileInputRef.current) fileInputRef.current.value = ''
          toast.error(`Missing column(s): ${missingCols.join(', ')}`)
          return
        }

        setExcelFile(file)
        setExcelData(json)

        const warnMsg = extraCols.length > 0
          ? ` (extra column(s) ignored: ${extraCols.join(', ')})`
          : ''
        setUploadStatus(
          `File loaded – ${json.length} record(s) ready to upload.${warnMsg}`
        )
        setUploadVariant(extraCols.length > 0 ? 'warning' : 'info')
        if (extraCols.length > 0) {
          toast.warning(`Extra column(s) will be ignored: ${extraCols.join(', ')}`)
        }
      } catch {
        toast.error('Error parsing Excel file. Please use the sample format.')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleExcelUpload = async () => {
    if (!excelFile || excelData.length === 0) {
      toast.warning('Please select an Excel file first.')
      return
    }
    setIsUploading(true)
    try {
      /* TODO: replace with actual API mutation call */
      await new Promise((r) => setTimeout(r, 1000))
      setUploadStatus(`Uploaded successfully – ${excelData.length} record(s) processed.`)
      setUploadVariant('success')
      toast.success('Excel uploaded successfully!')
    } catch {
      setUploadStatus('Upload failed. Please try again.')
      setUploadVariant('danger')
      toast.error('Upload failed!')
    } finally {
      setIsUploading(false)
    }
  }

  /* Submit Excel shift data to backend */
  const handleExcelSubmit = async () => {
    if (!excelFile || excelData.length === 0) {
      toast.warning('No data to submit. Please upload an Excel file first.')
      return
    }
    setIsSubmittingExcel(true)
    try {
    //   const formData = new FormData()
    //   formData.append('file', excelFile)
    //   formData.append('records', JSON.stringify(excelData))
    //   formData.append('submittedBy', userInfo?.username || '')
      /* TODO: replace with actual API call
         e.g. await submitValuationShiftExcel(formData).unwrap() */
    //   await new Promise((r) => setTimeout(r, 1200))
      const response = await getFileUpload({ exceldata: excelData }).unwrap()
      toast.success(`Valuation Shift submitted – ${excelData.length} / ${response.validRowCount} record(s) processed.`)
      setUploadStatus(`Submitted successfully – ${excelData.length} / ${response.validRowCount} record(s) processed.`)
      setUploadVariant('success')
    } catch (err) {
      toast.error('Submission failed. Please try again.')
      setUploadStatus('Submission failed. Please try again.')
      setUploadVariant('danger')
    } finally {
      setIsSubmittingExcel(false)
    }
  }

  /* Excel columns (dynamic from first row) */
  const excelColumns = useMemo(() => {
    if (!excelData.length) return []
    return Object.keys(excelData[0]).map((key) => ({
      name: key,
      selector: (row) => row[key],
      sortable: true,
      wrap: true,
      cell: key === 'ToValuation'
        ? (row) => {
            const val = String(row[key] ?? '')
            const colors = VALUATION_ROW_COLORS[val]
            return colors ? (
              <span style={{
                display: 'inline-block',
                background: colors.badgeBg,
                color: colors.badge,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '11.5px',
                padding: '2px 10px',
                letterSpacing: '0.3px',
              }}>
                Valuation {val}
              </span>
            ) : <span>{val}</span>
          }
        : undefined,
    }))
  }, [excelData])

  /* ──────────── OPTION 2 handlers ──────────── */

  // When fromValuation changes, auto-set the only allowed toValuation
  const handleFromValuationChange = (e) => {
    const val = e.target.value
    setFromValuation(val)
    setToValuation(TO_VALUATION_MAP[val] || '')
    setCompData([])
    setSelectedSubcodes([])
    setSubcodeSearch('')
  }

  /* All subject entries from API (subjectApiData is already an array) */
  const allSubjects = subjectApiData

  /* Subjects filtered by the search input */
  const filteredSubjects = useMemo(() => {
    if (!subcodeSearch.trim()) return allSubjects
    const q = subcodeSearch.toLowerCase()
    return allSubjects.filter(
      (s) =>
        String(s.Subcode || '').toLowerCase().includes(q) ||
        String(s.SUBNAME || '').toLowerCase().includes(q)
    )
  }, [allSubjects, subcodeSearch])

  const toggleSubcode = (code) => {
    setSelectedSubcodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const toggleAll = () => {
    const visibleCodes = filteredSubjects.map((s) => s.Subcode)
    const allSelected = visibleCodes.every((c) => selectedSubcodes.includes(c))
    if (allSelected) {
      setSelectedSubcodes((prev) => prev.filter((c) => !visibleCodes.includes(c)))
    } else {
      const merged = Array.from(new Set([...selectedSubcodes, ...visibleCodes]))
      setSelectedSubcodes(merged)
    }
  }

  // Derived To Valuation options – only the next valuation is shown
  const toValuationOptions = useMemo(() => {
    if (!fromValuation || !TO_VALUATION_MAP[fromValuation]) return []
    const next = TO_VALUATION_MAP[fromValuation]
    return [{ value: next, label: `Valuation ${next}` }]
  }, [fromValuation])

  const handleSearch = async () => {
    if (!fromValuation) {
      toast.warning('Please select From Valuation.')
      return
    }
    if (!toValuation) {
      toast.warning('No target valuation available for the selected From Valuation.')
      return
    }
    setIsSearching(true)
    try {
      // Parse comma-separated text field: "A,B,C" → ['A','B','C']
      const textCodes = subcodeText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      // Merge with multi-select dropdown selection (deduplicated)
      const mergedSubcodes = [...new Set([...selectedSubcodes, ...textCodes])]
      const result = await triggerGetValuationMoveData(
        { fromValuation, toValuation, mark: markText, markCheckbox, subcodes: mergedSubcodes },
        true
      ).unwrap()
      setCompData(result?.data ?? [])
    } catch {
      toast.error('Failed to load data.')
    } finally {
      setIsSearching(false)
    }
  }

  /* Submit comparison data to backend */
  const handleCompSubmit = async () => {
    if (compData.length === 0) {
      toast.warning('No records to submit. Please search first.')
      return
    }
    if (selectedSubcodes.length === 0) {
      toast.warning('Please select at least one Subject Code before submitting.')
      return
    }

    // Show confirmation modal
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false)
    setIsSubmittingComp(true)
    try {
      const payload = {
        fromValuation,
        toValuation,
        mark: markText !== '' ? Number(markText) : null,
        markCheckbox,
        subcodes: selectedSubcodes,
        records: compData,
        submittedBy: userInfo?.username || '',
        Eva_Mon_Year: userInfo?.eva_month_year || '',
      }
      const response = await valuationUpdateData({ payload }).unwrap()
      toast.success(`Comparison submitted – ${compData.length} record(s) moved from Valuation ${fromValuation} → ${toValuation}.`)
    } catch (err) {
      toast.error('Submission failed. Please try again.')
    } finally {
      setIsSubmittingComp(false)
    }
  }

  const filteredCompData = useMemo(() => {
    if (!searchText.trim()) return compData
    const q = searchText.toLowerCase()
    return compData.filter(
      (r) =>
        String(r.Barcode || '').toLowerCase().includes(q) ||
        String(r.RegisterNo || '').toLowerCase().includes(q) ||
        String(r.SubCode || '').toLowerCase().includes(q) ||
        String(r.Status || '').toLowerCase().includes(q) ||
        String(r.Camp_Id || '').toLowerCase().includes(q)
    )
  }, [compData, searchText])

  const handleExportCompExcel = () => {
    if (filteredCompData.length === 0) {
      toast.warning('No data to export.')
      return
    }
    const exportRows = filteredCompData.map((r) => ({
      'S.No':           r.SNo,
      'Barcode':        r.Barcode,
      'Register No':    r.RegisterNo,
      'Sub Code':       r.SubCode,
      'Dep Name':       r.Dep_Name,
      'Eva Mon Year':   r.Eva_Mon_Year,
      'Camp ID':        r.Camp_Id,
      'From Evaluator': r.fEvaluatorId,
      'To Evaluator':   r.tEvaluatorId,
      [`V${fromValuation} Marks`]: r.V1_Marks,
      [`V${toValuation} Marks`]:   r.V2_Marks,
      'Difference':     r.Difference,
      'Input Mark':     r.InputMark,
      'Status':         r.Status,
    }))
    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ValuationMove')
    XLSX.writeFile(wb, `ValuationMove_V${fromValuation}_to_V${toValuation}.xlsx`)
    toast.success('Excel file downloaded!')
  }

  const compColumns = [
    { 
      name: 'S.No', 
      selector: (r) => r.SNo, 
      sortable: true, 
      width: '70px',
      style: { justifyContent: 'center' }
    },
    { name: 'Barcode',     selector: (r) => r.Barcode,    sortable: true },
    { name: 'Sub Code',    selector: (r) => r.SubCode,    sortable: true },
    { name: 'Camp ID',     selector: (r) => r.Camp_Id,    sortable: true, width: '100px' },
    { name: 'From Eval',   selector: (r) => r.fEvaluatorId, sortable: true, width: '100px' },
    { name: 'To Eval',     selector: (r) => r.tEvaluatorId, sortable: true, width: '100px' },
    {
      name: `V${fromValuation} Marks`,
      selector: (r) => r.V1_Marks,
      sortable: true,
      style: { justifyContent: 'center' },
      cell: (r) => <Badge bg="primary">{r.V1_Marks}</Badge>,
    },
    {
      name: `V${toValuation} Marks`,
      selector: (r) => r.V2_Marks,
      sortable: true,
      style: { justifyContent: 'center' },
      cell: (r) => <Badge bg="secondary">{r.V2_Marks}</Badge>,
    },
    {
      name: 'Difference',
      selector: (r) => r.Difference,
      sortable: true,
      style: { justifyContent: 'center' },
      cell: (r) => (
        <Badge bg={r.Difference > r.InputMark ? 'danger' : 'success'}>
          {r.Difference}
        </Badge>
      ),
    },
  ]

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <>
      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#1e3c72', color: '#fff', border: 'none' }}>
          <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>
            <FiSend className="me-2" size={18} />
            Confirm Valuation Move
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', color: '#334155', marginBottom: '16px', fontWeight: '500' }}>
              You are about to move <strong style={{ color: '#1e3c72' }}>{compData.length}</strong> record(s):
            </p>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px' }}>From:</span>
                <Badge bg="primary" style={{ fontSize: '12px', padding: '4px 12px' }}>Valuation {fromValuation}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px' }}>To:</span>
                <Badge bg="success" style={{ fontSize: '12px', padding: '4px 12px' }}>Valuation {toValuation}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px' }}>Subjects:</span>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedSubcodes.slice(0, 5).map((code) => (
                    <Badge key={code} bg="info" text="dark" style={{ fontSize: '11px' }}>{code}</Badge>
                  ))}
                  {selectedSubcodes.length > 5 && (
                    <Badge bg="secondary" style={{ fontSize: '11px' }}>+{selectedSubcodes.length - 5} more</Badge>
                  )}
                </div>
              </div>
              {markText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px' }}>Mark Filter:</span>
                  <Badge bg="warning" text="dark" style={{ fontSize: '12px', padding: '4px 12px' }}>{markText}</Badge>
                </div>
              )}
              {markCheckbox && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px' }}>Filter:</span>
                  <Badge bg="warning" text="dark" style={{ fontSize: '12px', padding: '4px 12px' }}>Mark Filter Applied</Badge>
                </div>
              )}
            </div>
            <Alert variant="warning" style={{ fontSize: '13px', marginBottom: 0, border: 'none', background: '#fef3c7', color: '#92400e' }}>
              <strong>⚠ Warning:</strong> This action cannot be undone. Please verify the details before confirming.
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '16px 24px', background: '#f8fafc' }}>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
            style={{
              borderRadius: '8px',
              fontWeight: '600',
              padding: '8px 20px',
              fontSize: '13px',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            style={{
              borderRadius: '8px',
              fontWeight: '700',
              padding: '8px 24px',
              background: 'linear-gradient(135deg,#16a34a,#15803d)',
              border: 'none',
              fontSize: '13px',
            }}
          >
            <FiCheckCircle className="me-2" size={14} />
            Confirm & Submit
          </Button>
        </Modal.Footer>
      </Modal>

    <UploadPageLayout mainTopic="Valuation Move" subTopic="Manage Valuation Shift & Comparison">

      {/* ── Mode Selector Cards ── */}
      <Row className="g-3 mb-4">
        {/* Card 1 – Excel Upload */}
        <Col xs={12} md={6}>
          <div
            onClick={() => handleModeChange('1')}
            style={{
              cursor: 'pointer',
              borderRadius: '14px',
              border: selectedMode === '1' ? '2.5px solid #2a5298' : '2px solid #e2e8f0',
              background: selectedMode === '1'
                ? 'linear-gradient(135deg, #eef3fb 0%, #dbeafe 100%)'
                : '#fff',
              boxShadow: selectedMode === '1'
                ? '0 6px 24px rgba(30,60,114,0.15)'
                : '0 2px 10px rgba(0,0,0,0.06)',
              padding: '20px 22px',
              transition: 'all 0.25s',
              userSelect: 'none',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: selectedMode === '1'
                  ? 'linear-gradient(135deg,#1e3c72,#2a5298)'
                  : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BsFileEarmarkExcel size={22} color={selectedMode === '1' ? '#fff' : '#64748b'} />
              </div>
              <div className="flex-grow-1">
                <div style={{ fontWeight: 700, fontSize: '14px', color: selectedMode === '1' ? '#1e3c72' : '#1e293b' }}>
                  Valuation Shift Excel Upload
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                  Upload an Excel file to bulk-shift valuation records
                </div>
              </div>
              {selectedMode === '1' && (
                <FiCheckCircle size={22} color="#2a5298" style={{ flexShrink: 0 }} />
              )}
            </div>
          </div>
        </Col>

        {/* Card 2 – Comparison & Direct Upload */}
        <Col xs={12} md={6}>
          <div
            onClick={() => handleModeChange('2')}
            style={{
              cursor: 'pointer',
              borderRadius: '14px',
              border: selectedMode === '2' ? '2.5px solid #2a5298' : '2px solid #e2e8f0',
              background: selectedMode === '2'
                ? 'linear-gradient(135deg, #eef3fb 0%, #dbeafe 100%)'
                : '#fff',
              boxShadow: selectedMode === '2'
                ? '0 6px 24px rgba(30,60,114,0.15)'
                : '0 2px 10px rgba(0,0,0,0.06)',
              padding: '20px 22px',
              transition: 'all 0.25s',
              userSelect: 'none',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: selectedMode === '2'
                  ? 'linear-gradient(135deg,#1e3c72,#2a5298)'
                  : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MdCompareArrows size={24} color={selectedMode === '2' ? '#fff' : '#64748b'} />
              </div>
              <div className="flex-grow-1">
                <div style={{ fontWeight: 700, fontSize: '14px', color: selectedMode === '2' ? '#1e3c72' : '#1e293b' }}>
                  Comparison & Direct Upload
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                  Compare valuations and directly upload mark changes
                </div>
              </div>
              {selectedMode === '2' && (
                <FiCheckCircle size={22} color="#2a5298" style={{ flexShrink: 0 }} />
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* ════════════ OPTION 1 : Excel Upload ════════════ */}
      {selectedMode === '1' && (
        <Card style={CARD_STYLE}>
          <Card.Header style={HEADER_STYLE}>
            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
              <FiUploadCloud size={18} /> Valuation Shift – Excel Upload
            </h6>
          </Card.Header>
          <Card.Body className="p-4">

            {/* Upload Zone */}
            <div
              style={{
                border: '2px dashed #b8c9e8',
                borderRadius: '12px',
                background: excelFile ? '#f0f7ff' : '#f8fafc',
                padding: '28px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <MdCloudUpload size={40} color={excelFile ? '#2a5298' : '#94a3b8'} />
              {excelFile ? (
                <div className="mt-2">
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3c72' }}>
                    <BsFileEarmarkExcel className="me-1" color="#217346" />{excelFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                    {excelData.length} record(s) detected &nbsp;·&nbsp; Click to change file
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#475569' }}>
                    Click to browse or drag & drop
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>
                    Accepted: .xlsx, .xls, .csv
                  </div>
                  <div style={{
                    marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#f0f4fb', borderRadius: '8px', padding: '5px 12px',
                    fontSize: '11.5px', color: '#475569',
                  }}>
                    <span style={{ fontWeight: 700, color: '#1e3c72' }}>Required columns:</span>
                    {REQUIRED_EXCEL_COLUMNS.map((col, i) => (
                      <span key={col}>
                        <code style={{
                          background: '#dbeafe', color: '#1e3c72', borderRadius: '4px',
                          padding: '1px 6px', fontWeight: 700, fontSize: '11px',
                        }}>{col}</code>
                        {i < REQUIRED_EXCEL_COLUMNS.length - 1 && <span className="mx-1 text-muted">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Form.Control
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}
                onChange={handleExcelChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Action row: Download Sample + Upload */}
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              {/* Download Sample */}
              <Button
                variant="outline-secondary"
                onClick={handleDownloadSample}
                style={{
                  borderRadius: '10px',
                  fontWeight: '600',
                  padding: '8px 20px',
                  fontSize: '13px',
                  borderColor: '#c8d6e5',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FiDownload size={15} />
                Download Sample File
              </Button>

              {/* Upload to Server */}
              <Button
                variant="primary"
                onClick={handleExcelUpload}
                disabled={isUploading || !excelFile}
                style={{
                  borderRadius: '10px',
                  fontWeight: '700',
                  padding: '9px 28px',
                  background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
                  border: 'none',
                  boxShadow: '0 3px 12px rgba(30,60,114,0.25)',
                  fontSize: '13.5px',
                }}
              >
                {isUploading ? (
                  <><Spinner animation="border" size="sm" className="me-2" />Uploading…</>
                ) : (
                  <><FiUploadCloud className="me-2" />Upload to Server</>
                )}
              </Button>
            </div>

            {uploadStatus && (
              <Alert
                variant={uploadVariant}
                className="mt-3 mb-0 d-flex align-items-center gap-2"
                style={{ borderRadius: '10px', fontSize: '13px', border: 'none' }}
              >
                {uploadVariant === 'success' && <FiCheckCircle size={16} />}
                {uploadStatus}
              </Alert>
            )}

            {/* Preview Table */}
            {excelData.length > 0 && (
              <div className="mt-4">
                <div
                  className="d-flex justify-content-between align-items-center mb-3"
                  style={{
                    background: '#f0f4fb',
                    borderRadius: '10px',
                    padding: '10px 16px',
                  }}
                >
                  <span className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: '13px', color: '#1e3c72' }}>
                    <MdOutlineTableChart size={17} /> Preview
                    <Badge
                      bg="primary"
                      style={{ borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}
                    >
                      {excelData.length} records
                    </Badge>
                  </span>
                  <Badge
                    bg="light"
                    text="dark"
                    style={{ borderRadius: '8px', border: '1px solid #d0d7e2', fontSize: '11.5px', padding: '5px 10px' }}
                  >
                    <BsFileEarmarkExcel className="me-1" color="#217346" />
                    {excelFile?.name}
                  </Badge>
                </div>
                <DataTable
                  columns={excelColumns}
                  data={excelData}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[10, 20, 50]}
                  highlightOnHover
                  striped
                  responsive
                  customStyles={customTableStyles}
                  conditionalRowStyles={[
                    ...Object.entries(VALUATION_ROW_COLORS).map(([val, colors]) => ({
                      when: (row) => String(row.ToValuation ?? '') === val,
                      style: {
                        backgroundColor: colors.bg,
                        borderLeft: `4px solid ${colors.border}`,
                      },
                    }))
                  ]}
                  noDataComponent={
                    <div className="py-5 text-center text-muted">
                      <MdOutlineTableChart size={32} style={{ opacity: 0.3 }} />
                      <div className="mt-2" style={{ fontSize: '13px' }}>No data to display</div>
                    </div>
                  }
                />

                {/* Submit bar */}
                <div
                  className="d-flex justify-content-between align-items-center mt-3"
                  style={{
                    background: '#f0f4fb',
                    borderRadius: '10px',
                    padding: '12px 16px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#475569' }}>
                    <strong style={{ color: '#1e3c72' }}>{excelData.length}</strong> record(s) ready to submit
                  </span>
                  <Button
                    onClick={handleExcelSubmit}
                    disabled={isSubmittingExcel}
                    style={{
                      borderRadius: '10px',
                      fontWeight: '700',
                      padding: '9px 28px',
                      background: 'linear-gradient(135deg,#16a34a,#15803d)',
                      border: 'none',
                      boxShadow: '0 3px 12px rgba(22,163,74,0.28)',
                      fontSize: '13.5px',
                    }}
                  >
                    {isSubmittingExcel ? (
                      <><Spinner animation="border" size="sm" className="me-2" />Submitting…</>
                    ) : (
                      <><FiSend className="me-2" />Submit Valuation Shift</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ════════════ OPTION 2 : Comparison & Direct Upload ════════════ */}
      {selectedMode === '2' && (
        <Card style={CARD_STYLE}>
          <Card.Header style={HEADER_STYLE}>
            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
              <MdCompareArrows size={20} /> Comparison and Direct Upload
            </h6>
          </Card.Header>
          <Card.Body className="p-4">

            {/* Filter Row */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e8edf5',
                borderRadius: '12px',
                padding: '20px 20px 18px',
                marginBottom: '20px',
              }}
            >
              <Row className="g-3 align-items-end">
                {/* From Valuation */}
                <Col xs={12} md={3}>
                  <Form.Label style={LABEL_STYLE}>
                    From Valuation <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={fromValuation}
                    onChange={handleFromValuationChange}
                    style={INPUT_STYLE}
                  >
                    {VALUATION_OPTIONS.filter((o) => o.value !== '4').map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Arrow indicator */}
                <Col xs={12} md={1} className="text-center d-none d-md-flex align-items-end justify-content-center pb-1">
                  <BsArrowRightCircleFill
                    size={24}
                    color={fromValuation ? '#2a5298' : '#cbd5e1'}
                    style={{ transition: 'color 0.2s', marginBottom: 9 }}
                  />
                </Col>

                {/* To Valuation – auto-set, read-only */}
                <Col xs={12} md={2}>
                  <Form.Label style={LABEL_STYLE}>To Valuation</Form.Label>
                  <Form.Select
                    value={toValuation}
                    disabled
                    style={{
                      ...INPUT_STYLE,
                      background: fromValuation ? '#eef3fb' : '#f1f5f9',
                      color: fromValuation ? '#1e3c72' : '#94a3b8',
                      fontWeight: fromValuation ? '600' : '400',
                    }}
                  >
                    {toValuationOptions.length === 0 ? (
                      <option value="">-- Auto Selected --</option>
                    ) : (
                      toValuationOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))
                    )}
                  </Form.Select>
                  {fromValuation && toValuationOptions.length > 0 && (
                    <Form.Text style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                      ✓ Auto-set from From Valuation
                    </Form.Text>
                  )}
                  {fromValuation === '4' && (
                    <Form.Text style={{ fontSize: '11px', color: '#dc2626' }}>
                      No next valuation for Valuation 4
                    </Form.Text>
                  )}
                </Col>

                {/* Subject Code Multi-Select */}
                <Col xs={12} md={4}>
                  <Form.Label style={LABEL_STYLE}>
                    Subject Code
                    {selectedSubcodes.length > 0 && (
                      <Badge
                        bg="primary"
                        style={{ marginLeft: 6, borderRadius: '5px', fontSize: '10px', padding: '2px 6px' }}
                      >
                        {selectedSubcodes.length} selected
                      </Badge>
                    )}
                  </Form.Label>

                  {/* Plain text input for comma-separated subcodes */}
                  <Form.Control
                    type="text"
                    placeholder="e.g. A,B,C  (comma separated)"
                    value={subcodeText}
                    onChange={(e) => setSubcodeText(e.target.value)}
                    style={{ ...INPUT_STYLE, marginBottom: '6px', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                  {subcodeText.trim() && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                      {subcodeText.split(',').map(s => s.trim()).filter(Boolean).map((code) => (
                        <Badge key={code} bg="info" text="dark" style={{ fontSize: '11px', borderRadius: '5px' }}>
                          {code}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div ref={subDropdownRef} style={{ position: 'relative' }}>
                    {/* Trigger input */}
                    <div
                      style={{
                        ...INPUT_STYLE,
                        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                        gap: '4px', minHeight: '42px', height: 'auto',
                        padding: '4px 10px', cursor: 'text',
                        border: `1px solid ${subDropdownOpen ? '#2a5298' : '#c8d6e5'}`,
                        boxShadow: subDropdownOpen ? '0 0 0 3px rgba(42,82,152,0.12)' : 'none',
                        background: toValuation ? '#fff' : '#f1f5f9',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        borderRadius: '10px',
                      }}
                      onClick={() => toValuation && setSubDropdownOpen((o) => !o)}
                    >
                      {/* Selected chips */}
                      {selectedSubcodes.map((code) => (
                        <span
                          key={code}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            background: '#dbeafe', color: '#1e3c72',
                            borderRadius: '6px', fontSize: '11.5px', fontWeight: 700,
                            padding: '2px 7px',
                          }}
                        >
                          {code}
                          <FiX
                            size={11}
                            style={{ cursor: 'pointer', flexShrink: 0 }}
                            onClick={(e) => { e.stopPropagation(); toggleSubcode(code) }}
                          />
                        </span>
                      ))}

                      {/* Search input inside trigger */}
                      <input
                        value={subcodeSearch}
                        onChange={(e) => { setSubcodeSearch(e.target.value); setSubDropdownOpen(true) }}
                        onClick={(e) => { e.stopPropagation(); toValuation && setSubDropdownOpen(true) }}
                        placeholder={selectedSubcodes.length === 0 ? (toValuation ? 'Type subcode or name…' : '-- select To Valuation first --') : ''}
                        disabled={!toValuation}
                        style={{
                          border: 'none', outline: 'none', flex: 1, minWidth: 80,
                          fontSize: '13px', background: 'transparent',
                          color: '#1e293b',
                        }}
                      />

                      {/* Spinner or clear */}
                      <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        {subjectsLoading ? (
                          <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} />
                        ) : selectedSubcodes.length > 0 ? (
                          <FiX
                            size={14}
                            color="#94a3b8"
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedSubcodes([]); setSubcodeSearch('') }}
                          />
                        ) : null}
                      </span>
                    </div>

                    {/* Dropdown panel */}
                    {subDropdownOpen && toValuation && (
                      <div
                        style={{
                          position: 'absolute', zIndex: 1050, top: 'calc(100% + 4px)', left: 0, right: 0,
                          background: '#fff',
                          border: '1px solid #d0d7e2',
                          borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(30,60,114,0.14)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Header: Select All / Clear */}
                        <div
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px',
                            borderBottom: '1px solid #f0f4f8',
                            background: '#f8fafc',
                          }}
                        >
                          <button
                            type="button"
                            onClick={toggleAll}
                            style={{
                              border: 'none', background: 'none', color: '#2a5298',
                              fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0,
                            }}
                          >
                            {filteredSubjects.every((s) => selectedSubcodes.includes(s.Subcode))
                              ? '☑ Deselect All'
                              : '☐ Select All'}
                          </button>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Scrollable list */}
                        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                          {filteredSubjects.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                              No subjects found
                            </div>
                          ) : (
                            filteredSubjects.map((s) => {
                              const checked = selectedSubcodes.includes(s.Subcode)
                              return (
                                <div
                                  key={s.Subcode}
                                  onClick={() => toggleSubcode(s.Subcode)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', cursor: 'pointer',
                                    background: checked ? '#eff6ff' : 'transparent',
                                    borderBottom: '1px solid #f8fafc',
                                    transition: 'background 0.1s',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!checked) e.currentTarget.style.background = '#f8fafc'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = checked ? '#eff6ff' : 'transparent'
                                  }}
                                >
                                  {checked
                                    ? <BsCheckSquareFill size={14} color="#2a5298" style={{ flexShrink: 0 }} />
                                    : <BsSquare size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
                                  <span style={{
                                    fontSize: '12.5px', fontWeight: checked ? 700 : 400,
                                    color: checked ? '#1e3c72' : '#334155',
                                    flex: '0 0 70px',
                                  }}>
                                    {s.Subcode}
                                  </span>
                                  <span style={{
                                    fontSize: '11.5px', color: '#64748b',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {s.SUBNAME}
                                  </span>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Col>

                {/* Mark */}
                <Col xs={12} md={2}>
                  <Form.Label style={LABEL_STYLE}>Enter Mark(≥)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="e.g. 75"
                    value={markText}
                    onChange={(e) => setMarkText(e.target.value)}
                    style={INPUT_STYLE}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Apply mark filter"
                    checked={markCheckbox}
                    onChange={(e) => setMarkCheckbox(e.target.checked)}
                    style={{ fontSize: '11.5px', color: '#4a5568', marginTop: '6px', fontWeight: '600' }}
                  />
                </Col>

                {/* Search button */}
                <Col xs={12} md={2}>
                  <Button
                    variant="primary"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-100"
                    style={{
                      borderRadius: '10px',
                      fontWeight: '700',
                      height: '42px',
                      background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
                      border: 'none',
                      boxShadow: '0 3px 12px rgba(30,60,114,0.25)',
                      fontSize: '13.5px',
                    }}
                  >
                    {isSearching ? (
                      <><Spinner animation="border" size="sm" className="me-1" />Loading…</>
                    ) : (
                      <><FiSearch className="me-1" />Search</>
                    )}
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Empty prompt */}
            {compData.length === 0 && !isSearching && fromValuation && (
              <Alert
                variant="info"
                className="d-flex align-items-center gap-2 mb-0"
                style={{ borderRadius: '10px', fontSize: '13px', border: 'none', background: '#eff6ff', color: '#1d4ed8' }}
              >
                <FiSearch size={15} />
                Select a valuation and click <strong className="ms-1">Search Records</strong> to load data.
              </Alert>
            )}

            {/* Data Table */}
            {compData.length > 0 && (
              <>
                {/* Table Toolbar */}
                <div
                  className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"
                  style={{
                    background: '#f0f4fb',
                    borderRadius: '10px',
                    padding: '10px 16px',
                  }}
                >
                  <div className="d-flex align-items-center gap-2" style={{ fontSize: '13px', color: '#1e3c72', fontWeight: 600 }}>
                    <MdOutlineTableChart size={17} />
                    <span>
                      Valuation {fromValuation}
                      <BsArrowRightCircleFill size={14} className="mx-1" color="#2a5298" />
                      Valuation {toValuation}
                    </span>
                    {markText && (
                      <Badge
                        style={{ background: '#e0edff', color: '#1e3c72', borderRadius: '6px', fontWeight: 700, fontSize: '11px', padding: '4px 8px' }}
                      >
                        Mark: {markText}
                      </Badge>
                    )}
                    <Badge
                      bg="primary"
                      style={{ borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}
                    >
                      {filteredCompData.length} records
                    </Badge>
                  </div>
                  <Form.Control
                    type="text"
                    placeholder="🔍  Search barcode / register…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                      width: '240px',
                      fontSize: '13px',
                      borderRadius: '10px',
                      borderColor: '#d0d7e2',
                      height: '36px',
                    }}
                  />
                  <Button
                    onClick={handleExportCompExcel}
                    disabled={filteredCompData.length === 0}
                    style={{
                      borderRadius: '10px',
                      fontWeight: '700',
                      padding: '6px 18px',
                      background: 'linear-gradient(135deg,#16a34a,#15803d)',
                      border: 'none',
                      fontSize: '13px',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <BsFileEarmarkExcel size={16} />
                    Export Excel
                  </Button>
                </div>

                <DataTable
                  columns={compColumns}
                  data={filteredCompData}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[10, 20, 50, 100]}
                  highlightOnHover
                  striped
                  responsive
                  customStyles={customTableStyles}
                  noDataComponent={
                    <div className="py-5 text-center text-muted">
                      <FiSearch size={30} style={{ opacity: 0.3 }} />
                      <div className="mt-2" style={{ fontSize: '13px' }}>No records match your search.</div>
                    </div>
                  }
                  progressPending={isSearching}
                  progressComponent={
                    <div className="py-5 text-center">
                      <Spinner animation="border" variant="primary" />
                      <div className="mt-2" style={{ fontSize: '13px', color: '#64748b' }}>Loading records…</div>
                    </div>
                  }
                />

                {/* Submit bar */}
                <div
                  className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3"
                  style={{
                    background: '#f0f4fb',
                    borderRadius: '10px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <span>
                      Moving <strong style={{ color: '#1e3c72' }}>{compData.length}</strong> record(s) &nbsp;·&nbsp;
                      Valuation <strong style={{ color: '#1e3c72' }}>{fromValuation}</strong>
                      <BsArrowRightCircleFill size={13} className="mx-1" color="#2a5298" />
                      Valuation <strong style={{ color: '#1e3c72' }}>{toValuation}</strong>
                    </span>
                    {selectedSubcodes.length > 0 && (
                      <span className="ms-2">
                        &nbsp;·&nbsp; <strong style={{ color: '#1e3c72' }}>{selectedSubcodes.length}</strong> subcode(s) selected
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleCompSubmit}
                    disabled={isSubmittingComp || selectedSubcodes.length === 0}
                    style={{
                      borderRadius: '10px',
                      fontWeight: '700',
                      padding: '9px 28px',
                      background: selectedSubcodes.length === 0
                        ? '#94a3b8'
                        : 'linear-gradient(135deg,#16a34a,#15803d)',
                      border: 'none',
                      boxShadow: selectedSubcodes.length === 0 ? 'none' : '0 3px 12px rgba(22,163,74,0.28)',
                      fontSize: '13.5px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSubmittingComp ? (
                      <><Spinner animation="border" size="sm" className="me-2" />Submitting…</>
                    ) : (
                      <><FiSend className="me-2" />Submit Comparison</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ── Placeholder when nothing selected ── */}
      {selectedMode === '' && (
        <div
          style={{
            border: '2px dashed #c8d6e5',
            borderRadius: '16px',
            background: '#f8fafc',
            textAlign: 'center',
            padding: '56px 24px',
          }}
        >
          <div
            style={{
              width: 72, height: 72, borderRadius: '20px',
              background: 'linear-gradient(135deg,#e8eef8,#dce7f7)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <MdSwapHoriz size={38} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            Select an Operation Mode
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Choose <strong>Excel Upload</strong> or <strong>Comparison &amp; Direct Upload</strong> from the cards above.
          </div>
        </div>
      )}
    </UploadPageLayout>
    </>
  )
}

export default ValuationMove