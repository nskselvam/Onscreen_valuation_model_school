import React, { useState, useMemo } from 'react';
import { Container, Card, Row, Col, Form, Spinner, Badge, Alert, Button, Nav } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { FaFileAlt, FaChartLine, FaFileExcel, FaTrophy, FaMedal } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import {
  useGetTestCodesForReportQuery,
  useGetJeeMarksByTestCodeQuery,
  useGetFieldnamesQuery,
} from '../../../redux-slice/jeeReportApiSlice';
import {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
  useGetNeetFieldnamesQuery,
} from '../../../redux-slice/neetReportApiSlice';
import {
  useGetCuetTestCodesForReportQuery,
  useGetCuetMarksByTestCodeQuery,
  useGetCuetFieldnamesQuery,
} from '../../../redux-slice/cuetReportApiSlice';
import {
  useGetCurrentAffairsTestCodesForReportQuery,
  useGetCurrentAffairsMarksByTestCodeQuery,
} from '../../../redux-slice/currentAffairsReportApiSlice';
import {
  useGetGeneralAbilityTestCodesForReportQuery,
  useGetGeneralAbilityMarksByTestCodeQuery,
  useGetGeneralAbilityFieldnamesQuery,
} from '../../../redux-slice/generalAbilityReportApiSlice';
import {
  useGetQuantitativeTestCodesForReportQuery,
  useGetQuantitativeMarksByTestCodeQuery,
} from '../../../redux-slice/quantitativeReportApiSlice';
import {
  useGetFoundationTestCodesForReportQuery,
  useGetFoundationMarksByTestCodeQuery,
} from '../../../redux-slice/foundationReportApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

const StadeTopRank = () => {
  const [examType, setExamType] = useState('jee');
  const [selectedTestCode, setSelectedTestCode] = useState('');

  // JEE Test Codes
  const { data: jeeTestCodesData, isLoading: jeeTestLoading } = useGetTestCodesForReportQuery();
  
  // NEET Test Codes
  const { data: neetTestCodesData, isLoading: neetTestLoading } = useGetNeetTestCodesForReportQuery();

  // CUET Test Codes
  const { data: cuetTestCodesData, isLoading: cuetTestLoading } = useGetCuetTestCodesForReportQuery();

  // Current Affairs Test Codes
  const { data: caTestCodesData, isLoading: caTestLoading } = useGetCurrentAffairsTestCodesForReportQuery();
  const { data: gaTestCodesData, isLoading: gaTestLoading } = useGetGeneralAbilityTestCodesForReportQuery();
  const { data: qaTestCodesData, isLoading: qaTestLoading } = useGetQuantitativeTestCodesForReportQuery();
  const { data: foundationTestCodesData, isLoading: foundationTestLoading } = useGetFoundationTestCodesForReportQuery();

  const testCodesData = examType === 'jee' ? jeeTestCodesData : examType === 'neet' ? neetTestCodesData : examType === 'cuet' ? cuetTestCodesData : examType === 'quantitative' ? qaTestCodesData : examType === 'foundation' ? foundationTestCodesData : examType === 'currentaffairs' ? caTestCodesData : gaTestCodesData;
  const loadingTests = examType === 'jee' ? jeeTestLoading : examType === 'neet' ? neetTestLoading : examType === 'cuet' ? cuetTestLoading : examType === 'quantitative' ? qaTestLoading : examType === 'foundation' ? foundationTestLoading : examType === 'currentaffairs' ? caTestLoading : gaTestLoading;
  const testError = null;
  const testCodes = testCodesData?.data || [];

  // JEE Marks
  const { data: jeeMarksData, isLoading: jeeMarksLoading } =
    useGetJeeMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'jee',
    });

  // NEET Marks
  const { data: neetMarksData, isLoading: neetMarksLoading } =
    useGetNeetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'neet',
    });

  // CUET Marks
  const { data: cuetMarksData, isLoading: cuetMarksLoading } =
    useGetCuetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'cuet',
    });

  // Current Affairs Marks
  const { data: caMarksData, isLoading: caMarksLoading } =
    useGetCurrentAffairsMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'currentaffairs',
    });
  const { data: gaMarksData, isLoading: gaMarksLoading } =
    useGetGeneralAbilityMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'generalability',
    });
  const { data: qaMarksData, isLoading: qaMarksLoading } =
    useGetQuantitativeMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'quantitative',
    });
  const { data: foundationMarksData, isLoading: foundationMarksLoading } =
    useGetFoundationMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== 'foundation',
    });

  const marksData = examType === 'jee' ? jeeMarksData : examType === 'neet' ? neetMarksData : examType === 'cuet' ? cuetMarksData : examType === 'quantitative' ? qaMarksData : examType === 'foundation' ? foundationMarksData : examType === 'currentaffairs' ? caMarksData : gaMarksData;
  const loadingMarks = examType === 'jee' ? jeeMarksLoading : examType === 'neet' ? neetMarksLoading : examType === 'cuet' ? cuetMarksLoading : examType === 'quantitative' ? qaMarksLoading : examType === 'foundation' ? foundationMarksLoading : examType === 'currentaffairs' ? caMarksLoading : gaMarksLoading;
  const marksError = null;

  const { data: jeeFieldnamesData, isLoading: loadingJeeFieldnames } = useGetFieldnamesQuery();
  const { data: neetFieldnamesData, isLoading: loadingNeetFieldnames } = useGetNeetFieldnamesQuery();
  const { data: cuetFieldnamesData, isLoading: loadingCuetFieldnames } = useGetCuetFieldnamesQuery();
  const { data: gaFieldnamesData, isLoading: loadingGaFieldnames } = useGetGeneralAbilityFieldnamesQuery();
  const columnMapping = useMemo(
    () =>
      examType === 'jee'
        ? jeeFieldnamesData?.data?.mapping || {}
        : examType === 'neet'
          ? neetFieldnamesData?.data?.mapping || {}
          : examType === 'cuet'
            ? cuetFieldnamesData?.data?.mapping || {}
            : examType === 'generalability'
              ? gaFieldnamesData?.data?.mapping || {}
              : {},
    [examType, jeeFieldnamesData, neetFieldnamesData, cuetFieldnamesData, gaFieldnamesData],
  );
  const loadingFieldnames = examType === 'jee' ? loadingJeeFieldnames : examType === 'neet' ? loadingNeetFieldnames : examType === 'cuet' ? loadingCuetFieldnames : loadingGaFieldnames;

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
      name: columnMapping.ROLLNO || 'EMIS No',
      selector: (row) => row.ROLLNO,
      sortable: true,
      minWidth: '120px',
    },
    {
      name: columnMapping.Candidate_Name || 'Student Name',
      selector: (row) => row.Candidate_Name,
      sortable: true,
      minWidth: '200px',
      wrap: true,
    },
    {
      name: columnMapping.District_Name || 'District',
      selector: (row) => row.District_Name,
      sortable: true,
      minWidth: '140px',
    },
    {
      name: columnMapping.BATCHNAME || 'District Code',
      selector: (row) => row.BATCHNAME,
      sortable: true,
      minWidth: '100px',
    },
    {
      name: columnMapping.TOTAL || 'Total Score',
      selector: (row) => row.TOTAL,
      sortable: true,
      right: true,
      minWidth: '120px',
      cell: (row) => <Badge bg="success">{row.TOTAL}</Badge>,
    },
    {
      name: columnMapping.CORRECT || 'Correct',
      selector: (row) => row.CORRECT,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: columnMapping.WRONG || 'Wrong',
      selector: (row) => row.WRONG,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: columnMapping.BLANK || 'Blank',
      selector: (row) => row.BLANK,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name:
        examType === 'jee'
          ? columnMapping.Phy_Tot || 'Physics'
          : examType === 'neet'
            ? columnMapping.TOTAL1 || 'Physics'
            : examType === 'cuet'
              ? columnMapping.TOTAL1 || 'Accountancy'
                : examType === 'quantitative'
                  ? 'Total Percentile'
                : examType === 'foundation'
                  ? 'Physics'
                : examType === 'generalability'
                  ? columnMapping.TOTAL1 || 'Verbal Ability Total'
                  : 'Part 1',
      selector: (row) => (examType === 'jee' ? row.Phy_Tot : examType === 'quantitative' ? row.Total_Percentile : row.TOTAL1),
      sortable: true,
      right: true,
      minWidth: '120px',
    },
    {
      name:
        examType === 'jee'
          ? columnMapping.che_Tot || 'Chemistry'
          : examType === 'neet'
            ? columnMapping.TOTAL2 || 'Chemistry'
            : examType === 'cuet'
              ? columnMapping.TOTAL2 || 'Economics'
                : examType === 'quantitative'
                  ? null
                : examType === 'foundation'
                  ? 'Chemistry'
                : examType === 'generalability'
                  ? columnMapping.TOTAL2 || 'Gk Current Affairs Total'
                  : 'Part 2',
      selector: (row) => (examType === 'jee' ? row.che_Tot : row.TOTAL2),
      sortable: true,
      right: true,
      minWidth: '120px',
      omit: examType === 'quantitative',
    },
    {
      name:
        examType === 'jee'
          ? columnMapping.Mat_Tot || 'Maths'
          : examType === 'neet'
            ? columnMapping.TOTAL3 || 'Botany'
            : examType === 'cuet'
              ? columnMapping.TOTAL3 || 'Business Studies and Commerce'
                : examType === 'quantitative'
                  ? null
                : examType === 'foundation'
                  ? 'Biology'
                : examType === 'generalability'
                  ? columnMapping.TOTAL3 || 'Quants Total'
                  : 'Total Percentile',
      selector: (row) =>
        examType === 'jee'
          ? row.Mat_Tot
          : examType === 'currentaffairs'
            ? row.Total_Percentile
            : examType === 'generalability'
              ? row.TOTAL3
            : row.TOTAL3,
      sortable: true,
      right: true,
      minWidth: examType === 'cuet' ? '220px' : '140px',
      omit: examType === 'quantitative',
    },
    {
      name:
        examType === 'jee'
          ? columnMapping.Total_Percentile || 'Total Percentile'
          : examType === 'neet'
            ? columnMapping.TOTAL4 || 'Zoology'
            : examType === 'cuet'
              ? columnMapping.TOTAL4 || 'Business Maths'
              : null,
      selector: (row) =>
        examType === 'jee'
          ? row.Total_Percentile
          : examType === 'currentaffairs'
            ? null
            : examType === 'generalability'
              ? null
            : row.TOTAL4,
      sortable: true,
      right: true,
      minWidth: '140px',
      omit: examType === 'currentaffairs' || examType === 'generalability' || examType === 'quantitative' || examType === 'foundation',
    },
  ];

  const exportToExcel = () => {
    if (!top20Students || top20Students.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = top20Students.map((row, index) => ({
      Rank: row.overallRank,
      'S.No': index + 1,
      'EMIS No': row.ROLLNO,
      'Student Name': row.Candidate_Name,
      District: row.District_Name,
      'District Code': row.BATCHNAME,
      'Total Score': row.TOTAL,
      Correct: row.CORRECT,
      Wrong: row.WRONG,
      Blank: row.BLANK,
      ...(examType === 'jee'
        ? {
            Physics: row.Phy_Tot,
            Chemistry: row.che_Tot,
            Maths: row.Mat_Tot,
          }
        : examType === 'neet'
          ? {
              Physics: row.TOTAL1,
              Chemistry: row.TOTAL2,
              Botany: row.TOTAL3,
              Zoology: row.TOTAL4,
            }
          : examType === 'cuet'
            ? {
                Accountancy: row.TOTAL1,
                Economics: row.TOTAL2,
                'Business Studies and Commerce': row.TOTAL3,
                'Business Maths': row.TOTAL4,
              }
            : examType === 'foundation'
              ? {
                Physics: row.TOTAL1,
                Chemistry: row.TOTAL2,
                Biology: row.TOTAL3,
              }
            : examType === 'quantitative'
              ? {}
            : examType === 'generalability'
              ? {
                  'Verbal Ability Total': row.TOTAL1,
                  'Gk Current Affairs Total': row.TOTAL2,
                  'Quants Total': row.TOTAL3,
                }
            : {
                'Part 1': row.TOTAL1,
                'Part 2': row.TOTAL2,
              }),
      'Total Percentile': row.Total_Percentile,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top 20 Rank');

    const fileName = `Top_20_Rank_${selectedTestCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2c5aa0',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        minHeight: '48px',
      },
    },
    rows: {
      style: {
        minHeight: '48px',
        '&:hover': {
          backgroundColor: '#f5f5f5',
        },
      },
      stripedStyle: {
        backgroundColor: '#fafafa',
      },
    },
    cells: {
      style: {
        fontSize: '13px',
        padding: '8px',
      },
    },
  };

  return (
    <Container fluid className="py-4">
      {loadingFieldnames && (
        <Card className="shadow-sm mb-4">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading field configurations...</p>
          </Card.Body>
        </Card>
      )}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h3 className="mb-1">
                <FaTrophy className="me-2 text-warning" />
                Top 20 Rank - {examType === 'jee' ? 'JEE' : examType === 'neet' ? 'NEET' : examType === 'cuet' ? 'CUET' : examType === 'quantitative' ? 'QUANTITATIVE APTITUDE' : examType === 'foundation' ? 'FOUNDATION' : examType === 'generalability' ? 'GENERAL ABILITY' : 'CURRENT AFFAIRS'} State Level
              </h3>
              <p className="text-muted mb-0">View top 20 performing {examType === 'jee' ? 'JEE' : examType === 'neet' ? 'NEET' : examType === 'cuet' ? 'CUET' : examType === 'quantitative' ? 'QUANTITATIVE APTITUDE' : examType === 'foundation' ? 'FOUNDATION' : examType === 'generalability' ? 'GENERAL ABILITY' : 'Current Affairs'} students by test code</p>
            </div>
            <div className="text-end">
              <FaChartLine size={48} className="text-primary opacity-25" />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Exam Type Tabs */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link
                active={examType === 'jee'}
                onClick={() => {
                  setExamType('jee');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                JEE Rankings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={examType === 'neet'}
                onClick={() => {
                  setExamType('neet');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                NEET Rankings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={examType === 'cuet'}
                onClick={() => {
                  setExamType('cuet');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                CUET Rankings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={examType === 'quantitative'}
                onClick={() => {
                  setExamType('quantitative');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                Quantitative Rankings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={examType === 'foundation'}
                onClick={() => {
                  setExamType('foundation');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                Foundation Rankings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={examType === 'currentaffairs'}
                onClick={() => {
                  setExamType('currentaffairs');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                Current Affairs Rankings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={examType === 'generalability'}
                onClick={() => {
                  setExamType('generalability');
                  setSelectedTestCode('');
                }}
                style={{ cursor: 'pointer' }}
              >
                <FaFileAlt className="me-2" />
                General Ability Rankings
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
          <h5 className="mb-0">Select Test Code</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={12}>
              <Form.Group>
                {loadingTests ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading test codes...</span>
                  </div>
                ) : testError ? (
                  <Alert variant="danger">Error loading test codes</Alert>
                ) : (
                  <Form.Select
                    value={selectedTestCode}
                    onChange={(e) => {
                      setSelectedTestCode(e.target.value);
                    }}
                    size="lg"
                  >
                    <option value="">-- Select Test Code --</option>
                    {testCodes.map((test) => (
                      <option key={test.testcode} value={test.testcode}>
                        {test.testcode} - {test.Test_Name} - Std: {test.std}th
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
          </Row>

          {testMaster && (
            <Card className="mt-4 bg-light">
              <Card.Body className="py-3">
                <Row className="align-items-center">
                  <Col md={12}>
                    <h5 className="mb-2 text-primary">{testMaster.Test_Name}</h5>
                    <div className="d-flex gap-3 flex-wrap">
                      <Badge bg="info" className="px-3 py-2">Standard: {testMaster.std}th</Badge>
                      <Badge bg="success" className="px-3 py-2">Test Date: {testMaster.testdate}</Badge>
                      <Badge bg="warning" text="dark" className="px-3 py-2">Total Students: {marks.length}</Badge>
                      <Badge bg="secondary" className="px-3 py-2">Showing Top: 20</Badge>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {selectedTestCode && (
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaTrophy />
                <h5 className="mb-0">Top 20 Students</h5>
              </div>
              <Button
                variant="light"
                size="sm"
                onClick={exportToExcel}
                className="d-flex align-items-center gap-2"
              >
                <FaFileExcel /> Export to Excel
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {loadingMarks ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading marks data...</p>
              </div>
            ) : marksError ? (
              <Alert variant="danger" className="m-3">Error loading marks data</Alert>
            ) : marks.length === 0 ? (
              <Alert variant="warning" className="m-3">No marks data available for this test code</Alert>
            ) : (
              <DataTable
                columns={columns}
                data={top20Students}
                pagination={false}
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
              />
            )}
          </Card.Body>
        </Card>
      )}

      {!selectedTestCode && !loadingTests && (
        <Card className="text-center py-5">
          <Card.Body>
            <FaTrophy size={64} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">Select a test code to view top 20 rankings</h5>
            <p className="text-muted mb-0">Choose a test from the dropdown above to display top 20 students</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default StadeTopRank;
