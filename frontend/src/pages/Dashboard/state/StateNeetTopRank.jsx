import React, { useState, useMemo } from 'react';
import { Container, Card, Row, Col, Form, Spinner, Badge, Alert, Button } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { FaFileAlt, FaChartLine, FaFileExcel, FaTrophy, FaMedal, FaSchool } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
} from '../../../redux-slice/neetReportApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

const StateNeetTopRank = () => {
  const [selectedTestCode, setSelectedTestCode] = useState('');

  const { data: testCodesData, isLoading: loadingTests, error: testError } = useGetNeetTestCodesForReportQuery();
  const testCodes = testCodesData?.data || [];

  const {
    data: marksData,
    isLoading: loadingMarks,
    error: marksError,
  } = useGetNeetMarksByTestCodeQuery(selectedTestCode, {
    skip: !selectedTestCode,
  });

  const marks = useMemo(() => marksData?.data?.marks || [], [marksData]);
  const testMaster = marksData?.data?.testMaster || null;

  // Calculate overall ranks for all marks
  const overallRanksMap = useMemo(() => {
    if (!marks || marks.length === 0) return new Map();

    const sorted = [...marks].sort((a, b) => (parseFloat(b.TOTAL) || 0) - (parseFloat(a.TOTAL) || 0));
    const rankMap = new Map();
    let currentRank = 1;

    sorted.forEach((item, index) => {
      if (index > 0) {
        const prevTotal = parseFloat(sorted[index - 1].TOTAL) || 0;
        const currentTotal = parseFloat(item.TOTAL) || 0;
        if (currentTotal < prevTotal) {
          currentRank = index + 1;
        }
      }
      rankMap.set(item.ROLLNO || item.id, currentRank);
    });

    return rankMap;
  }, [marks]);

  // Get top 20 students
  const top20Students = useMemo(() => {
    if (!marks || marks.length === 0) return [];

    const ranked = marks.map((item) => ({
      ...item,
      overallRank: overallRanksMap.get(item.ROLLNO || item.id) || '-',
    }));

    return ranked.sort((a, b) => {
      const rankA = typeof a.overallRank === 'number' ? a.overallRank : 999999;
      const rankB = typeof b.overallRank === 'number' ? b.overallRank : 999999;
      return rankA - rankB;
    }).slice(0, 20);
  }, [marks, overallRanksMap]);

  const columns = [
    {
      name: 'Rank',
      selector: (row) => row.overallRank,
      sortable: true,
      width: '80px',
      center: true,
      cell: (row) => (
        <Badge bg={row.overallRank <= 3 ? 'warning' : 'info'} className="px-3 py-2">
          {row.overallRank <= 3 && row.overallRank === 1 && <FaTrophy className="me-1" />}
          {row.overallRank <= 3 && row.overallRank === 2 && <FaMedal className="me-1" />}
          {row.overallRank <= 3 && row.overallRank === 3 && <FaMedal className="me-1" />}
          {row.overallRank}
        </Badge>
      ),
    },
    {
      name: 'EMIS No',
      selector: (row) => row.ROLLNO,
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Student Name',
      selector: (row) => row.Candidate_Name,
      sortable: true,
      minWidth: '200px',
      wrap: true,
    },
    {
      name: 'District',
      selector: (row) => row.District_Name,
      sortable: true,
      minWidth: '140px',
    },
    {
      name: 'District Code',
      selector: (row) => row.BATCHNAME,
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Total Score',
      selector: (row) => row.TOTAL,
      sortable: true,
      right: true,
      minWidth: '120px',
      cell: (row) => <Badge bg="success">{row.TOTAL}</Badge>,
    },
    {
      name: 'Correct',
      selector: (row) => row.CORRECT,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: 'Wrong',
      selector: (row) => row.WRONG,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: 'Blank',
      selector: (row) => row.BLANK,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: 'Physics',
      selector: (row) => row.TOTAL1,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: 'Chemistry',
      selector: (row) => row.TOTAL2,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: 'Botany',
      selector: (row) => row.TOTAL3,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: 'Zoology',
      selector: (row) => row.TOTAL4,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
  ];

  const exportToExcel = () => {
    if (!top20Students || top20Students.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = top20Students.map((row) => ({
      'S.No': row.overallRank,
      'EMIS No': row.ROLLNO,
      'Student Name': row.Candidate_Name,
      'District': row.District_Name,
      'District Code': row.BATCHNAME,
      'Total Score': row.TOTAL,
      'Correct': row.CORRECT,
      'Wrong': row.WRONG,
      'Blank': row.BLANK,
      'Physics': row.TOTAL1,
      'Chemistry': row.TOTAL2,
      'Botany': row.TOTAL3,
      'Zoology': row.TOTAL4,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NEET Top Ranks');
    XLSX.writeFile(wb, `NEET_Top_Ranks_${selectedTestCode}.xlsx`);
  };

  const isLoading = loadingTests || loadingMarks;

  return (
    <Container fluid className="mt-4 mb-5">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex align-items-center gap-2">
            <FaTrophy size={24} />
            <div>
              <h4 className="mb-0">NEET State Top Ranks Dashboard</h4>
              <small>Top 20 performers across the state</small>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          <Row className="g-3 mb-4">
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaChartLine className="me-2" />
                  Select Test Code
                </Form.Label>
                <Form.Select
                  value={selectedTestCode}
                  onChange={(e) => setSelectedTestCode(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Choose Test --</option>
                  {testCodes.map((test) => (
                    <option key={test.testcode} value={test.testcode}>
                      {test.Test_Name} ({test.testcode})
                    </option>
                  ))}
                </Form.Select>
                {isLoading && <Spinner size="sm" className="ms-2" />}
              </Form.Group>
            </Col>

            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="fw-bold">Actions</Form.Label>
                <Button
                  variant="success"
                  size="sm"
                  className="w-100"
                  onClick={exportToExcel}
                  disabled={!selectedTestCode || top20Students.length === 0}
                >
                  <FaFileExcel className="me-2" />
                  Export Excel
                </Button>
              </Form.Group>
            </Col>
          </Row>

          {testError && (
            <Alert variant="danger">
              Error loading test codes: {testError.message}
            </Alert>
          )}

          {marksError && (
            <Alert variant="danger">
              Error loading marks: {marksError.message}
            </Alert>
          )}

          {!selectedTestCode && (
            <Alert variant="info" className="mb-0">
              <FaChartLine className="me-2" />
              Select a test code to view top performers
            </Alert>
          )}

          {selectedTestCode && (
            <>
              {/* Stats Summary */}
              {marks.length > 0 && (
                <Row className="mb-4">
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Total Students</div>
                        <div className="h5 mb-0">{marks.length}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Highest Score</div>
                        <div className="h5 mb-0">
                          {Math.max(...marks.map((m) => m.TOTAL || 0))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Avg Score</div>
                        <div className="h5 mb-0">
                          {(marks.reduce((acc, m) => acc + (m.TOTAL || 0), 0) / marks.length).toFixed(2)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Pass Rate</div>
                        <div className="h5 mb-0">
                          {((marks.filter((m) => m.TOTAL >= 180).length / marks.length) * 100).toFixed(1)}%
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Top 20 Table */}
              <Card>
                <Card.Header className="bg-light py-3">
                  <h6 className="mb-0">
                    <FaTrophy className="me-2" />
                    Top 20 Performers {loadingMarks && <Spinner size="sm" className="ms-2" />}
                  </h6>
                </Card.Header>
                <Card.Body>
                  {isLoading ? (
                    <div className="text-center">
                      <Spinner animation="border" />
                    </div>
                  ) : top20Students.length > 0 ? (
                    <DataTable
                      columns={columns}
                      data={top20Students}
                      highlightOnHover
                      striped
                      responsive
                      pagination
                    />
                  ) : (
                    <Alert variant="warning">No data available for this test</Alert>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StateNeetTopRank;
