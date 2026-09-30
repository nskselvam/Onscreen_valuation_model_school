import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Form, InputGroup, Card, Spinner, Badge, Button } from 'react-bootstrap';
import { FiSearch, FiDownload } from 'react-icons/fi';
import DataTableBase from 'react-data-table-component';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {setValuationReviewBasicData} from '../../redux-slice/valuationSlice';
import {  useGetPaperReviewDataByExaminerQuery, usePaperReviewDownloadMutation } from '../../redux-slice/reviewapiSlice';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';
import * as XLSX from 'xlsx';

const DataTable = DataTableBase.default || DataTableBase;

const PaperReviewexaminer = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userInfo = useSelector((state) => state.auth?.userInfo);
  const degreeInfo = useSelector((state) => state.auth?.degreeInfo);
  const userId= userInfo?.username || '';

  const Dep_Name = userInfo?.selected_course || '';
  const deptDescription = Array.isArray(degreeInfo)
    ? degreeInfo.find((d) => d.D_Code === Dep_Name)?.Degree_Name || Dep_Name
    : Dep_Name;

  const { data, isLoading, isError, refetch } = useGetPaperReviewDataByExaminerQuery(
    Dep_Name && userId ? { Dep_Name, username: userId } : undefined, 
    { skip: !Dep_Name || !userId, refetchOnMountOrArgChange: true }
  );

  console.log("Paper Review Data for Examiner:", data); 
  const [paperReviewDownload, { isLoading: isDownloading }] = usePaperReviewDownloadMutation();

  const DownloadAnswerBook = useCallback(async (row) => {
        const reviewData = {
          Dummy_NO: row.Dummy_NO,
          SubjectCode: row.SubjectCode,
          Valuation_Type: row.Valuation_Type,
          Eva_Mon_Year: row.Eva_Mon_Year,
          Dep_Name: row.Dep_Name,
          FACULTY_NAME: row.FACULTY_NAME,
          Evaluator_Id: row.Evaluator_Id,
        };

        dispatch(setValuationReviewBasicData(reviewData));
        
        // Store in sessionStorage to persist across refreshes
        sessionStorage.setItem('valuationReviewBasicData', JSON.stringify(reviewData));

      navigate(`/candidate/valuation-review-main/`, { state: { reviewData: row } });
    
    //613006
    //TSH163
    
      // try {
    //     const response = await paperReviewDownload({
    //       Dummy_NO: row.Dummy_NO,
    //       SubjectCode: row.SubjectCode,
    //       Valuation_Type: row.Valuation_Type,
    //       Eva_Mon_Year: row.Eva_Mon_Year,
    //       Dep_Name: row.Dep_Name,
    //       FACULTY_NAME: row.FACULTY_NAME,
    //       username: userInfo?.username,
    //     }).unwrap();

    //     // The response is a Blob (PDF binary) — create a download link
    //     const blob = new Blob([response], { type: 'application/pdf' });
    //     const url  = window.URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href  = url;
    //     link.download = `${row.RegisterNo}_${row.SubjectCode}_${row.Dummy_NO}.pdf`;
    //     document.body.appendChild(link);
    //     link.click();
    //     link.remove();
    //     window.URL.revokeObjectURL(url);
    // } catch (error) {
    //     console.error("Download failed:", error);
    //     alert("Download failed. Please try again.");
    // }
  }, [dispatch, navigate]);

  const paperReviewData = data?.paperReviewData || [];

  // Filter by search text
  const filteredData = useMemo(() => {
    let rows = paperReviewData;
    if (searchText.trim()) {
      const lower = searchText.toLowerCase().trim();
      rows = rows.filter((row) =>
        String(row.RegisterNo || '').toLowerCase().includes(lower) ||
        String(row.Dummy_NO || '').toLowerCase().includes(lower) ||
        String(row.SubjectCode || '').toLowerCase().includes(lower) ||
        String(row.Evaluator_Id || '').toLowerCase().includes(lower) ||
        String(row.Valuation_Type || '').toLowerCase().includes(lower)
      );
    }
    return rows;
  }, [paperReviewData, searchText]);

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

    const fileName = `Paper_Review_Examiner_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const columns = useMemo(() => [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      width: '65px',
    },
    {
      name: 'Register No',
      selector: (row) => row.RegisterNo || '-',
      sortable: true,
      wrap: true,
      minWidth: '160px',
    },
    {
      name: 'Student Name',
      selector: (row) => row.studentname || '-',
      sortable: true,
      wrap: true,
      minWidth: '200px',

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
      cell: (row) => (
        <span style={{ fontWeight: '600', color: '#2c5282' }}>{row.Dummy_NO || '-'}</span>
      ),
    },
    {
      name: 'Subject Code',
      selector: (row) => row.SubjectCode || '-',
      sortable: true,
      width: '140px',
    },
    {
      name: 'Evaluator ID',
      selector: (row) => row.Evaluator_Id || '-',
      sortable: true,
      width: '130px',
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
    },
    {
      name: 'Val Type',
      selector: (row) => row.Valuation_Type || '-',
      sortable: true,
      width: '100px',
      cell: (row) => (
        <Badge bg="primary" style={{ fontSize: '12px' }}>
          Val-{row.Valuation_Type || '-'}
        </Badge>
      ),
    },
    {
        name: 'Review',
        selector: (row) => row.reviewStatus || 0,
        width: '140px',
        center: true,
        cell: (row) => {
          const status = parseInt(row.reviewStatus);
          if (status === 1) {
            return <Badge bg="success" style={{ fontSize: '13px', padding: '7px 14px' }}>Completed</Badge>;
          }
          if (status === 2) {
            return <Badge bg="danger" style={{ fontSize: '13px', padding: '7px 14px' }}>Rejected</Badge>;
          }
          return (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => DownloadAnswerBook(row)}
              style={{ transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0d6efd';
                e.target.style.color = '#fff';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '';
                e.target.style.color = '';
                e.target.style.transform = '';
              }}
            >Review</button>
          );
        },
    },       
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
  ], [degreeInfo, DownloadAnswerBook]);

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

              <Button
                variant="success"
                size="sm"
                onClick={handleExportToExcel}
                disabled={isLoading || filteredData.length === 0}
                style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiDownload size={15} /> Export Excel
              </Button>
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
                striped
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="py-5 text-center text-muted">
                    No data available
                  </div>
                }
              />
              <div className="px-3 py-2 bg-light border-top">
                <small className="text-muted">
                  Showing {filteredData.length} of {paperReviewData.length} records
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
