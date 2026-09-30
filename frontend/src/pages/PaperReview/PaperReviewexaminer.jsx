import React, { useState, useMemo, useEffect } from 'react';
import { Form, InputGroup, Card, Spinner, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FiSearch, FiDownload } from 'react-icons/fi';
import DataTableBase from 'react-data-table-component';
import { useSelector } from 'react-redux';
import { useGetPaperReviewDataQuery, usePaperReviewDownloadMutation , usePaperReviewMailSendMutation} from '../../redux-slice/reviewapiSlice';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';
const  { VITE_Institution_Name ,VITE_Institution_No} = import.meta.env;
import * as XLSX from 'xlsx';

const DataTable = DataTableBase.default || DataTableBase;

const PaperReviewexaminer = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [searchText, setSearchText] = useState('');

  const userInfo = useSelector((state) => state.auth?.userInfo);
  const degreeInfo = useSelector((state) => state.auth?.degreeInfo);

  const Dep_Name = userInfo?.selected_course || '';
  const deptDescription = Array.isArray(degreeInfo)
    ? degreeInfo.find((d) => d.D_Code === Dep_Name)?.Degree_Name || Dep_Name
    : Dep_Name;

  const { data, isLoading, isError } = useGetPaperReviewDataQuery(Dep_Name ? { Dep_Name } : undefined, { skip: !Dep_Name });
  const [paperReviewDownload, { isLoading: isDownloading }] = usePaperReviewDownloadMutation();
  const [paperReviewMailSend] = usePaperReviewMailSendMutation();

  const DownloadAnswerBook = async (row) => {
    try {
        const response = await paperReviewDownload({
          Dummy_NO: row.Dummy_NO,
          SubjectCode: row.SubjectCode,
          Valuation_Type: row.Valuation_Type,
          Eva_Mon_Year: row.Eva_Mon_Year,
          Dep_Name: row.Dep_Name,
          FACULTY_NAME: row.FACULTY_NAME,
          username: userInfo?.username,
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

  const handleMailSend = async(row) => {
    console.log('Mail Send clicked for row:', row);


    try {
      const response = await paperReviewMailSend({ data: [row] }).unwrap();
      console.log('Mail send response:', response);
    } catch (error) {
      console.error('Mail send error:', error);
    }
    // TODO: Implement mail send functionality
    // You can access all row data here:
    // row.RegisterNo, row.StudentOfficalEmailID, row.StudentMobileno, etc.
  }

  const importDates = data?.importDates || [];
  const paperReviewData = data?.paperReviewData || [];

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
        'Register No': row.RegisterNo || '-',
        'StudentMobileno': row.StudentMobileno || '-',
        'StudentOfficalEmailID': row.StudentOfficalEmailID || '-',
        'StudentContactNo': row.StudentContactNo || '-',
        'StudentPersonalEmailID': row.StudentPersonalEmailID || '-',
        'Dummy No': row.Dummy_NO || '-',
        'Subject Code': row.SubjectCode || '-',
        'Evaluator ID': row.Evaluator_Id || '-',
        'Department': deptName || '-',
        'Month / Year': row.Eva_Mon_Year || '-',
        'Val Type': `Val-${row.Valuation_Type || '-'}`,
        'Faculty Name': row.FACULTY_NAME || '-',
        'Import Date': row.Import_Date || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paper Review');

    const fileName = `Paper_Review_Examiner_${selectedDate || 'All'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleMailSendAll = async () => {
    if (filteredData.length === 0) {
      alert('No data to send mail');
      return;
    }

    try {
      const response = await paperReviewMailSend({ data: filteredData }).unwrap();
      console.log('Mail send response:', response);
    } catch (error) {
      console.error('Mail send error:', error);
    }

    console.log('Mail Send All clicked with data:', filteredData);
    console.log(`Total candidates: ${filteredData.length}`);
    
    // TODO: Implement mail send all functionality
    // You can access all filtered row data here
    // Each row contains: RegisterNo, StudentOfficalEmailID, StudentMobileno, etc.
    
    // Example: Extract all emails
   // const emails = filteredData.map(row => row.StudentOfficalEmailID).filter(Boolean);

    console.log('Candidate emails:', emails);
  };

  // Filter by selected date, then by search text
  const filteredData = useMemo(() => {
    let rows = paperReviewData;
    if (selectedDate) {
      rows = rows.filter((row) => {
        const rowDate = String(row.Import_Date || '').substring(0, 10);
        const selDate = selectedDate.substring(0, 10);
        return rowDate === selDate;
      });
    }
    if (searchText.trim()) {
      const lower = searchText.toLowerCase().trim();
      rows = rows.filter((row) =>
        String(row.RegisterNo || '').toLowerCase().includes(lower) ||
        String(row.Dummy_NO || '').toLowerCase().includes(lower) ||
        String(row.SubjectCode || '').toLowerCase().includes(lower) ||
        String(row.Evaluator_Id || '').toLowerCase().includes(lower) ||
        String(row.Valuation_Type || '').toLowerCase().includes(lower) ||
        String(row.Import_Date || '').toLowerCase().includes(lower)
      );
    }
    return rows;
  }, [paperReviewData, selectedDate, searchText]);

  const columns = useMemo(() => [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      width: '65px',
      center: true,
    },
    {
      name: 'Register No',
      selector: (row) => row.RegisterNo || '-',
      sortable: true,
      wrap: true,
      minWidth: '160px',
      cell: (row) => {
        if (row.reviewStatus === 1 || row.reviewStatus === '1') {
          return (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-${row.RegisterNo}`}>Already Reviewed</Tooltip>}
            >
              <div style={{ cursor: 'help' }}>{row.RegisterNo || '-'}</div>
            </OverlayTrigger>
          );
        }
        return <span>{row.RegisterNo || '-'}</span>;
      },
    },
    {
      name:'StudentMobileno',
      selector: (row) => row.StudentMobileno || '-',
      sortable: true,
      wrap: true,
      minWidth: '160px',

    },
    {
      name:'StudentOfficalEmailID',
      selector: (row) => row.StudentOfficalEmailID || '-',
      sortable: true,
      wrap: true,
      minWidth: '200px',
    },
    {
      name:'StudentContactNo',
      selector: (row) => row.StudentContactNo || '-',
      sortable: true,
      wrap: true,
      minWidth: '160px',
    },
    {
      name:'StudentPersonalEmailID',
      selector: (row) => row.StudentPersonalEmailID || '-',
      sortable: true,
      wrap: true,
      minWidth: '200px',
    },
    {
      name: 'Dummy No',
      selector: (row) => row.Dummy_NO || '-',
      sortable: true,
      width: '130px',
      center: true,
      cell: (row) => (
        <span style={{ fontWeight: '600', color: '#2c5282' }}>{row.Dummy_NO || '-'}</span>
      ),
    },
    {
      name: 'Subject Code',
      selector: (row) => row.SubjectCode || '-',
      sortable: true,
      width: '140px',
      center: true,
    },
    {
      name: 'Evaluator ID',
      selector: (row) => row.Evaluator_Id || '-',
      sortable: true,
      width: '130px',
      center: true,
    },
    {
      name: 'Department',
      selector: (row) => row.Dep_Name || '-',
      sortable: true,
      minWidth: '180px',
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
      name :'Import_Date',
      selector:(row) => row.Import_Date || '-',
      sortable:true,
      width:'160px',
      center:true,
      cell:(row) => (
        <span style={{ fontSize: '12px', color: '#4a5568' }}>{row.Import_Date || '-'}</span>
      ),  
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
    ...(VITE_Institution_No === '2' ? [{
        name: 'Mailsend',
        width: '120px',
        center: true,
        cell: (row) => (
            <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleMailSend(row)}
            >
                Mail Send
            </button>
        ),
    }] : []),
    // {
    //   name: 'Import Date',
    //   selector: (row) => row.Import_Date || '-',
    //   sortable: true,
    //   width: '160px',
    //   center: true,
    //   cell: (row) => (
    //     <span style={{ fontSize: '12px', color: '#4a5568' }}>{row.Import_Date || '-'}</span>
    //   ),
    // },
  ], []);

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

  const conditionalRowStyles = [
    {
      when: (row) => {
        console.log('Row reviewStatus:', row.reviewStatus, 'Type:', typeof row.reviewStatus);
        return row.reviewStatus === 1 || row.reviewStatus === '1';
      },
      style: {
        backgroundColor: '#d1fae5 !important',
        color: '#065f46 !important',
        fontWeight: '500',
        '&:hover': {
          backgroundColor: '#a7f3d0 !important',
          cursor: 'pointer',
        },
      },
    },
  ];

  return (
    <UploadPageLayout
      mainTopic="Paper Review"
      subTopic="Review imported paper data by upload date"
    >
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="mb-0 fw-semibold text-dark">Paper Review — Examiner</h5>
              {Dep_Name && (
                <small className="text-muted" style={{ fontSize: '12px' }}>
                  Department : <strong>{Dep_Name}</strong> — {deptDescription}
                </small>
              )}
            </div>

            <div className="d-flex flex-wrap gap-3 align-items-center">
              {/* Import Date combobox */}
              <Form.Select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '220px', fontSize: '14px' }}
              >
                <option value="">— All Import Dates —</option>
                {importDates.map((date, idx) => (
                  <option key={idx} value={date}>
                    {date}
                  </option>
                ))}
              </Form.Select>

              {/* Search box */}
              <InputGroup style={{ width: '260px' }}>
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
                />
              </InputGroup>

              {/* Export to Excel Button */}
              <Button
                variant="success"
                size="sm"
                onClick={handleExportToExcel}
                disabled={isLoading || filteredData.length === 0}
                style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiDownload size={15} /> Export Excel
              </Button>

              {/* Mail Send All Button */}
              {VITE_Institution_No === '2' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMailSendAll}
                  disabled={isLoading || filteredData.length === 0}
                  style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Mail Send All
                </Button>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {isLoading ? (
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
                responsive
                customStyles={customStyles}
                conditionalRowStyles={conditionalRowStyles}
                noDataComponent={
                  <div className="py-5 text-center text-muted">
                    {selectedDate ? `No records found for "${selectedDate}"` : 'No data available'}
                  </div>
                }
              />
              <div className="px-3 py-2 bg-light border-top">
                <small className="text-muted">
                  Showing {filteredData.length} of {paperReviewData.length} records
                  {selectedDate && <> · Filtered by: <strong>{selectedDate}</strong></>}
                </small>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </UploadPageLayout>
  );
};

export default PaperReviewexaminer;
