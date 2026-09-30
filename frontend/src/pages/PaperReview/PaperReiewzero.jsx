import React, { useState, useMemo, useEffect } from 'react';
import { Form, InputGroup, Card, Spinner, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { FiSearch, FiRefreshCw, FiDownload } from 'react-icons/fi';
import DataTableBase from 'react-data-table-component';
import { useSelector } from 'react-redux';
import { useLazyGetPaperReviewZeroQuery, usePaperReviewDownloadMutation, useLazySearchPaperReviewBarcodeQuery } from '../../redux-slice/reviewapiSlice';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';
import * as XLSX from 'xlsx';
import navbarData from '../../hooks/navbar/navbar.json';

const { VITE_Institution_Name, VITE_Institution_No } = import.meta.env;

const DataTable = DataTableBase.default || DataTableBase;

const VAL_BUTTONS = [
  { label: 'Val - 1', value: '1' },
  { label: 'Val - 2', value: '2' },
  { label: 'Val - 3', value: '3' },
  { label: 'Val - 4', value: '4' },
];

const PaperReiewzero = () => {
  const [activeVal, setActiveVal]   = useState('1');
  const [searchText, setSearchText] = useState('');
  const [tableData, setTableData]   = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [dummyInput, setDummyInput] = useState('');
  const [dummySearchMsg, setDummySearchMsg] = useState('');

  const userInfo  = useSelector((state) => state.auth?.userInfo);
  const degreeInfo = useSelector((state) => state.auth?.degreeInfo);

    const Institution_Details = navbarData.find(n => String(n._id) === String(VITE_Institution_No)) || {}
    console.log('PaperReviewZero Rendered with userInfo:', userInfo, 'and Institution_Details:', Institution_Details)


  const Dep_Name = userInfo?.selected_course || '';
  const deptDescription = Array.isArray(degreeInfo)
    ? degreeInfo.find((d) => d.D_Code === Dep_Name)?.Degree_Name || Dep_Name
    : Dep_Name;

  const [triggerGetZero, { isLoading, isError }] = useLazyGetPaperReviewZeroQuery();
  const [triggerBarcodeSearch, { isLoading: isSearching }] = useLazySearchPaperReviewBarcodeQuery();
  const [paperReviewDownload] = usePaperReviewDownloadMutation();

  const handleDummySearch = async () => {
    if (!dummyInput.trim()) return;
    setDummySearchMsg('');
    try {
      const res = await triggerBarcodeSearch({ barcode: dummyInput.trim(), Valuation_Type: activeVal }).unwrap();
      const found = res?.data || [];
      if (found.length === 0) {
        setDummySearchMsg(`No records found for "${dummyInput.trim()}" in Val-${activeVal}`);
      } else {
        setTableData(found);
        setDummySearchMsg(`Showing ${found.length} result(s) for "${dummyInput.trim()}"`);
        setHasFetched(true);
      }
    } catch (err) {
      console.error('Barcode search failed:', err);
      setDummySearchMsg('Search failed. Please try again.');
    }
  };

  const handleClearSearch = () => {
    setDummyInput('');
    setDummySearchMsg('');
    handleValClick(activeVal);
  };

  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = filteredData.map((row, index) => {
      const deptName = Array.isArray(degreeInfo)
        ? degreeInfo.find((d) => d.D_Code === row.Dep_Name)?.Degree_Name || row.Dep_Name
        : row.Dep_Name;

      return {
        'S.No': index + 1,
        'Barcode': row.barcode || '-',
        'Sub Code': row.subcode || '-',
        'Evaluator ID': row.Evaluator_Id || '-',
        'Total': row.tot_round === null || row.tot_round === '' ? 'NULL / Blank' : row.tot_round,
        'Department': deptName || '-',
        'Month / Year': row.Eva_Mon_Year || '-',
        'Val Type': `Val-${row.Valuation_Type || '-'}`,
        'Camp ID': row.Camp_id || '-',
        'Camp Officer': row.camp_offcer_id_examiner || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paper Review Zero');

    const fileName = `Paper_Review_Zero_Val${activeVal}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleValClick = async (val) => {
    setActiveVal(val);
    setSearchText('');
    setHasFetched(false);
    try {
      const res = await triggerGetZero({ Dep_Name, Valuation_Type: val }).unwrap();
      setTableData(res?.data || []);
    } catch (err) {
      console.error('Fetch failed:', err);
      setTableData([]);
    } finally {
      setHasFetched(true);
    }
  };

  useEffect(() => {
    if (Dep_Name) {
      handleValClick('1');
    }
  }, [Dep_Name]);

    const DownloadAnswerBook = async (row) => {
    try {
        const response = await paperReviewDownload({
          Dummy_NO: row.barcode,
          SubjectCode: row.subcode,
          Valuation_Type: row.Valuation_Type,
          Eva_Mon_Year: row.Eva_Mon_Year,
          Dep_Name: row.Dep_Name,
          FACULTY_NAME:null,
          username: userInfo?.username,
          institution_Name: Institution_Details.InstitutionName 
        }).unwrap();

        // The response is a Blob (PDF binary) — create a download link
        const blob = new Blob([response], { type: 'application/pdf' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `${row.RegisterNo}_${row.SubjectCode}_${row.Dummy_NO}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed:", error);
        alert("Download failed. Please try again.");
    }
  }

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return tableData;
    const lower = searchText.toLowerCase().trim();
    return tableData.filter((row) =>
      String(row.barcode         || '').toLowerCase().includes(lower) ||
      String(row.subcode         || '').toLowerCase().includes(lower) ||
      String(row.Evaluator_Id   || '').toLowerCase().includes(lower) ||
      String(row.Dep_Name       || '').toLowerCase().includes(lower) ||
      String(row.Eva_Mon_Year   || '').toLowerCase().includes(lower) ||
      String(row.Camp_id        || '').toLowerCase().includes(lower) ||
      String(row.camp_offcer_id_examiner || '').toLowerCase().includes(lower) ||
      String(row.tot_round      || '').toLowerCase().includes(lower)
    );
  }, [tableData, searchText]);

  const columns = useMemo(() => [
    {
      name: 'S.No',
      selector: (_, index) => index + 1,
      width: '65px',
      cell: (_, index) => <div style={{ textAlign: 'center' }}>{index + 1}</div>,
    },
    {
      name: 'Barcode',
      selector: (row) => row.barcode || '-',
      sortable: true,
      minWidth: '130px',
      cell: (row) => (
        <div style={{ textAlign: 'center' }}><span style={{ fontWeight: '600', color: '#2c5282' }}>{row.barcode || '-'}</span></div>
      ),
    },
    {
      name: 'Sub Code',
      selector: (row) => row.subcode || '-',
      sortable: true,
      width: '120px',
      cell: (row) => <div style={{ textAlign: 'center' }}>{row.subcode || '-'}</div>,
    },
    {
      name: 'Evaluator ID',
      selector: (row) => row.Evaluator_Id || '-',
      sortable: true,
      minWidth: '130px',
      cell: (row) => <div style={{ textAlign: 'center' }}>{row.Evaluator_Id || '-'}</div>,
    },
    {
      name: 'Total',
      selector: (row) => row.tot_round,
      sortable: true,
      width: '110px',
      cell: (row) => (
        <div style={{ textAlign: 'center' }}>
          <Badge bg={row.tot_round === null || row.tot_round === '' ? 'secondary' : 'warning'} text="dark">
            {row.tot_round === null || row.tot_round === '' ? 'NULL / Blank' : row.tot_round}
          </Badge>
        </div>
      ),
    },
    {
      name: 'Department',
      selector: (row) => row.Dep_Name || '-',
      sortable: true,
      minWidth: '150px',
      wrap: true,
      cell: (row) => {
        const name = Array.isArray(degreeInfo)
          ? degreeInfo.find((d) => d.D_Code === row.Dep_Name)?.Degree_Name || row.Dep_Name
          : row.Dep_Name;
        return <span title={name}>{name || '-'}</span>;
      },
    },
    {
      name: 'Month / Year',
      selector: (row) => row.Eva_Mon_Year || '-',
      sortable: true,
      width: '130px',
      center: true,
    },
    {
      name: 'Val Type',
      selector: (row) => row.Valuation_Type || '-',
      sortable: true,
      width: '100px',
      center: true,
      cell: (row) => (
        <Badge bg="primary" style={{ fontSize: '12px' }}>
          Val-{row.Valuation_Type || '-'}
        </Badge>
      ),
    },
    {
      name: 'Camp ID',
      selector: (row) => row.Camp_id || '-',
      sortable: true,
      width: '110px',
      center: true,
    },
    {
      name: 'Camp Officer',
      selector: (row) => row.camp_offcer_id_examiner || '-',
      sortable: true,
      minWidth: '140px',
      wrap: true,
    },
        {
        name: 'Download',
        selector: (row) => row.Dummy_NO  || '-',
        width: '120px',
        center: true,
        cell: (row) => (
            <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => DownloadAnswerBook(row)}
               >Download</button>
        ),
    },
  ], [degreeInfo]);

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        minHeight: '48px',
      },
    },
    rows: {
      style: {
        fontSize: '13px',
        color: '#334155',
        minHeight: '50px',
        '&:not(:last-of-type)': { borderBottom: '1px solid #f1f5f9' },
        '&:hover': { backgroundColor: '#f8fafc', cursor: 'default' },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
        fontSize: '13px',
        backgroundColor: '#f8fafc',
      },
    },
  };

  return (
    <UploadPageLayout
      mainTopic="Paper Review"
      subTopic="Papers with zero or blank total round marks"
    >
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="mb-0 fw-semibold text-dark">Paper Review — Zero / Blank Total Round</h5>
              {Dep_Name && (
                <small className="text-muted" style={{ fontSize: '12px' }}>
                  Department : <strong>{Dep_Name}</strong> — {deptDescription}
                </small>
              )}
            </div>

            <div className="d-flex flex-wrap gap-3 align-items-center">
              {/* Valuation Type Buttons */}
              <ButtonGroup>
                {VAL_BUTTONS.map((btn) => (
                  <Button
                    key={btn.value}
                    variant={activeVal === btn.value ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleValClick(btn.value)}
                    disabled={isLoading || isSearching}
                    style={{ minWidth: '75px', fontSize: '13px' }}
                  >
                    {isLoading && activeVal === btn.value
                      ? <Spinner animation="border" size="sm" />
                      : btn.label}
                  </Button>
                ))}
              </ButtonGroup>

              {/* Dummy No fetch search */}
              <InputGroup style={{ width: '280px' }}>
                <Form.Control
                  type="text"
                  placeholder="Dummy No / Subcode / Evaluator ID"
                  value={dummyInput}
                  onChange={(e) => setDummyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDummySearch(); }}
                  style={{ fontSize: '13px' }}
                />
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleDummySearch}
                  disabled={isSearching || !dummyInput.trim()}
                  title="Fetch by Dummy No"
                >
                  {isSearching ? <Spinner animation="border" size="sm" /> : <FiSearch size={15} />}
                </Button>
                {dummyInput && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleClearSearch}
                    title="Clear & reload"
                  >✕</Button>
                )}
              </InputGroup>

              {/* General search box */}
              <InputGroup style={{ width: '220px' }}>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch size={16} color="#64748b" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="border-start-0 bg-light"
                  style={{ fontSize: '13px' }}
                  disabled={!hasFetched}
                />
              </InputGroup>

              {/* Export to Excel Button */}
              <Button
                variant="success"
                size="sm"
                onClick={handleExportToExcel}
                disabled={!hasFetched || filteredData.length === 0}
                style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiDownload size={15} /> Export Excel
              </Button>
            </div>
          </div>
          {dummySearchMsg && (
            <div className={`mt-2 px-1 small fw-semibold ${dummySearchMsg.includes('No records') || dummySearchMsg.includes('failed') ? 'text-danger' : 'text-success'}`}>
              {dummySearchMsg}
            </div>
          )}
        </Card.Header>

        <Card.Body className="p-0">
          {!hasFetched && !isLoading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
              <FiRefreshCw size={36} className="mb-3" style={{ opacity: 0.4 }} />
              <span style={{ fontSize: '14px' }}>Select a Valuation Type button above to load data</span>
            </div>
          ) : isLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" variant="primary" />
              <span className="ms-3 text-muted">Loading data...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-5 text-danger">Failed to load data. Please try again.</div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 20, 50, 100]}
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="py-5 text-center text-muted">
                    No zero / blank records found for Val-{activeVal}
                  </div>
                }
              />
              <div className="px-3 py-2 bg-light border-top">
                <small className="text-muted">
                  Showing {filteredData.length} of {tableData.length} records
                  {activeVal && <> · Valuation Type: <strong>Val-{activeVal}</strong></>}
                </small>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </UploadPageLayout>
  );
};

export default PaperReiewzero;
