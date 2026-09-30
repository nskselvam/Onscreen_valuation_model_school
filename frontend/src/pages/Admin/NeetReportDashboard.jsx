import React, { useState, useMemo } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Spinner,
  Badge,
  Alert,
  Button,
} from "react-bootstrap";
import DataTableBase from "react-data-table-component";
import {
  FaFileAlt,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaClipboardList,
  FaCalculator,
  FaListAlt,
  FaFileExcel,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
  useGetNeetQbDetailsByTestCodeQuery,
  useGetNeetSubjectWiseStatsByTestCodeQuery,
  useGetNeetQuestionStatisticsByTestCodeQuery,
} from "../../redux-slice/neetReportApiSlice";
import "./NeetReportDashboard.css";

const DataTable = DataTableBase.default || DataTableBase;

const NeetReportDashboard = () => {
  const [selectedTestCode, setSelectedTestCode] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [filterText, setFilterText] = useState("");
  const [showAnswerAnalysis, setShowAnswerAnalysis] = useState(false);
  const [selectedQbDistrict, setSelectedQbDistrict] = useState("");
  const [selectedQsDistrict, setSelectedQsDistrict] = useState("");

  // Fetch test codes
  const { data: testCodesData, isLoading: testCodesLoading } =
    useGetNeetTestCodesForReportQuery();

  // Fetch marks for selected test code
  const { data: marksData, isLoading: marksLoading } =
    useGetNeetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode,
    });

  // Fetch QB details
  const { data: qbData, isLoading: qbLoading } =
    useGetNeetQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode,
    });

  // Fetch subject-wise statistics
  const { data: statsData, isLoading: statsLoading } =
    useGetNeetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode }
    );

  // Fetch question statistics
  const { data: questionStatsData, isLoading: questionStatsLoading } =
    useGetNeetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode,
    });

  // Excel Export Function
  const exportToExcel = () => {
    if (!rankedMarks || rankedMarks.length === 0) {
      alert("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Marks sheet
    if (!showAnswerAnalysis) {
      const marksExportData = rankedMarks.map((row, index) => ({
        "S.No": index + 1,
        "Test Code": row.Test_Code,
        "District Code": row.BATCHNAME,
        "District Name": row.District_Name,
        "Candidate Name": row.Candidate_Name,
        "EMIS No": row.ROLLNO,
        "Overall Rank": row.overallRank,
        ...(selectedDistrict && { "District Rank": row.districtRank }),
        Total: row.TOTAL,
        Correct: row.CORRECT,
        Wrong: row.WRONG,
        Blank: row.BLANK,
        Physics: row.TOTAL1,
        Chemistry: row.TOTAL2,
        Botany: row.TOTAL3,
        Zoology: row.TOTAL4,
      }));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(marksExportData),
        "NEET Marks"
      );
    }

    // QB Details sheet
    if (qbDetailsCols) {
      const qbExportData = filteredQbDetails.map((row, index) => ({
        "S.No": index + 1,
        ...qbDetailsCols.reduce((acc, col) => {
          acc[col.name] = row[col.selector(row)];
          return acc;
        }, {}),
      }));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(qbExportData),
        "QB Details"
      );
    }

    XLSX.writeFile(wb, `NEET_Report_${selectedTestCode}.xlsx`);
  };

  // Process marks data
  const rankedMarks = useMemo(() => {
    if (!marksData?.data?.marks) return [];

    let marks = marksData.data.marks;

    // Filter by district if selected
    if (selectedDistrict) {
      marks = marks.filter((m) => m.BATCHNAME === selectedDistrict);
    }

    // Filter by search text
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      marks = marks.filter(
        (m) =>
          m.Candidate_Name?.toLowerCase().includes(searchLower) ||
          m.ROLLNO?.toLowerCase().includes(searchLower) ||
          m.District_Name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort and rank
    const sorted = [...marks].sort((a, b) => (b.TOTAL || 0) - (a.TOTAL || 0));
    const ranked = sorted.map((mark, index) => ({
      ...mark,
      overallRank: index + 1,
    }));

    // Add district rank if district is selected
    if (selectedDistrict) {
      return ranked.map((mark, index) => ({
        ...mark,
        districtRank: index + 1,
      }));
    }

    return ranked;
  }, [marksData, selectedDistrict, filterText]);

  // QB Details columns
  const qbDetailsCols = useMemo(
    () => [
      {
        name: "District",
        selector: (row) => row.District_Name || row.BATCHNAME,
        sortable: true,
      },
      { name: "Qno", selector: (row) => row.Qno, sortable: true },
      { name: "Correct", selector: (row) => row.Correct, sortable: true },
      { name: "Wrong", selector: (row) => row.Wrong, sortable: true },
      { name: "Blank", selector: (row) => row.Blank, sortable: true },
    ],
    []
  );

  const filteredQbDetails = useMemo(() => {
    if (!qbData?.data?.qbDetails) return [];
    let qb = qbData.data.qbDetails;

    if (selectedQbDistrict) {
      qb = qb.filter((q) => q.BATCHNAME === selectedQbDistrict);
    }

    return qb;
  }, [qbData, selectedQbDistrict]);

  // Marks columns
  const marksColumns = useMemo(
    () => [
      {
        name: "Rank",
        selector: (row) => row.overallRank,
        sortable: true,
        width: "60px",
      },
      {
        name: "Student Name",
        selector: (row) => row.Candidate_Name,
        sortable: true,
      },
      {
        name: "EMIS No",
        selector: (row) => row.ROLLNO,
        sortable: true,
      },
      {
        name: "District",
        selector: (row) => row.District_Name,
        sortable: true,
      },
      {
        name: "Total",
        selector: (row) => row.TOTAL,
        sortable: true,
        right: true,
      },
      {
        name: "Correct",
        selector: (row) => row.CORRECT,
        sortable: true,
        right: true,
      },
      {
        name: "Physics",
        selector: (row) => row.TOTAL1,
        sortable: true,
        right: true,
      },
      {
        name: "Chemistry",
        selector: (row) => row.TOTAL2,
        sortable: true,
        right: true,
      },
      {
        name: "Botany",
        selector: (row) => row.TOTAL3,
        sortable: true,
        right: true,
      },
      {
        name: "Zoology",
        selector: (row) => row.TOTAL4,
        sortable: true,
        right: true,
      },
    ],
    []
  );

  const testCodes = testCodesData?.data || [];
  const districts = useMemo(() => {
    if (!marksData?.data?.marks) return [];
    const unique = [...new Set(marksData.data.marks.map((m) => m.BATCHNAME))];
    return unique.sort();
  }, [marksData]);

  const qbDistricts = useMemo(() => {
    if (!qbData?.data?.qbDetails) return [];
    const unique = [...new Set(qbData.data.qbDetails.map((q) => q.BATCHNAME))];
    return unique.sort();
  }, [qbData]);

  return (
    <Container fluid className="mt-4 mb-5">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex align-items-center gap-2">
            <FaFileAlt size={24} />
            <div>
              <h4 className="mb-0">NEET Report Dashboard</h4>
              <small>View and analyze NEET exam data</small>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          <Row className="g-3 mb-4">
            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaFilter className="me-2" />
                  Select Test Code
                </Form.Label>
                <Form.Select
                  value={selectedTestCode}
                  onChange={(e) => {
                    setSelectedTestCode(e.target.value);
                    setSelectedDistrict("");
                    setFilterText("");
                  }}
                  disabled={testCodesLoading}
                >
                  <option value="">-- Choose Test --</option>
                  {testCodes.map((test) => (
                    <option key={test.testcode} value={test.testcode}>
                      {test.Test_Name} ({test.testcode})
                    </option>
                  ))}
                </Form.Select>
                {testCodesLoading && <Spinner size="sm" className="ms-2" />}
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="fw-bold">Filter by District</Form.Label>
                <Form.Select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedTestCode}
                >
                  <option value="">-- All Districts --</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaSearch className="me-2" />
                  Search Student
                </Form.Label>
                <Form.Control
                  placeholder="Name or EMIS No"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  disabled={!selectedTestCode}
                />
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="fw-bold">Actions</Form.Label>
                <Button
                  variant="success"
                  size="sm"
                  className="w-100"
                  onClick={exportToExcel}
                  disabled={!selectedTestCode || rankedMarks.length === 0}
                >
                  <FaFileExcel className="me-2" />
                  Export Excel
                </Button>
              </Form.Group>
            </Col>
          </Row>

          {!selectedTestCode && (
            <Alert variant="info" className="mb-0">
              <FaChartLine className="me-2" />
              Select a test code to view marks and QB details
            </Alert>
          )}

          {selectedTestCode && (
            <>
              {/* Stats Summary */}
              {statsData?.data?.overall && (
                <Row className="mb-4">
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Physics Avg</div>
                        <div className="h5 mb-0">
                          {statsData.data.overall.physics?.average}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Chemistry Avg</div>
                        <div className="h5 mb-0">
                          {statsData.data.overall.chemistry?.average}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Botany Avg</div>
                        <div className="h5 mb-0">
                          {statsData.data.overall.botany?.average}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Zoology Avg</div>
                        <div className="h5 mb-0">
                          {statsData.data.overall.zoology?.average}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Marks Table */}
              <Card className="mb-4">
                <Card.Header className="bg-light py-3">
                  <h6 className="mb-0">
                    <FaListAlt className="me-2" />
                    NEET Marks ({rankedMarks.length} students)
                    {marksLoading && <Spinner size="sm" className="ms-2" />}
                  </h6>
                </Card.Header>
                <Card.Body>
                  {marksLoading ? (
                    <div className="text-center">
                      <Spinner animation="border" />
                    </div>
                  ) : rankedMarks.length > 0 ? (
                    <DataTable
                      columns={marksColumns}
                      data={rankedMarks}
                      pagination
                      highlightOnHover
                      striped
                      responsive
                      defaultSortFieldId="Rank"
                    />
                  ) : (
                    <Alert variant="warning">No marks data available</Alert>
                  )}
                </Card.Body>
              </Card>

              {/* QB Details */}
              <Card>
                <Card.Header className="bg-light py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <FaClipboardList className="me-2" />
                      QB Details ({filteredQbDetails.length} questions)
                      {qbLoading && <Spinner size="sm" className="ms-2" />}
                    </h6>
                    {qbDistricts.length > 0 && (
                      <Form.Select
                        style={{ width: "200px" }}
                        size="sm"
                        value={selectedQbDistrict}
                        onChange={(e) => setSelectedQbDistrict(e.target.value)}
                      >
                        <option value="">All Districts</option>
                        {qbDistricts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  {qbLoading ? (
                    <div className="text-center">
                      <Spinner animation="border" />
                    </div>
                  ) : filteredQbDetails.length > 0 ? (
                    <DataTable
                      columns={qbDetailsCols}
                      data={filteredQbDetails}
                      pagination
                      highlightOnHover
                      striped
                      responsive
                    />
                  ) : (
                    <Alert variant="warning">No QB details available</Alert>
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

export default NeetReportDashboard;
