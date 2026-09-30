import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
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
  FaClipboardList,
  FaCalculator,
  FaListAlt,
  FaFileExcel,
  FaSchool,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
  useGetNeetQbDetailsByTestCodeQuery,
  useGetNeetSubjectWiseStatsByTestCodeQuery,
  useGetNeetQuestionStatisticsByTestCodeQuery,
} from "../../../redux-slice/neetReportApiSlice";
import "../../Admin/NeetReportDashboard.css";

const DataTable = DataTableBase.default || DataTableBase;

const District_Neet_Report = () => {
  const [selectedTestCode, setSelectedTestCode] = useState("");
  const [filterText, setFilterText] = useState("");
  const [selectedMedium, setSelectedMedium] = useState("");

  const { userInfo } = useSelector((state) => state.auth);
  const role = String(userInfo?.Role ?? userInfo?.role ?? "");
  const districtCode = String(userInfo?.D_Code ?? "").trim();
  const districtName = String(userInfo?.District_Name ?? "").trim();

  // Fetch test codes
  const {
    data: testCodesData,
    isLoading: loadingTests,
    error: testError,
  } = useGetNeetTestCodesForReportQuery();
  const testCodes = testCodesData?.data || [];

  // Fetch marks for selected test code - filtered by district
  const {
    data: marksData,
    isLoading: loadingMarks,
    error: marksError,
  } = useGetNeetMarksByTestCodeQuery(selectedTestCode, {
    skip: !selectedTestCode,
  });

  const testMaster = marksData?.data?.testMaster || null;
  const allMarks = marksData?.data?.marks || [];

  // Filter marks to district level
  const marks = useMemo(
    () => allMarks.filter((m) => m.BATCHNAME === districtCode),
    [allMarks, districtCode]
  );

  // Fetch QB details
  const { data: qbDetailsData, isLoading: loadingQbDetails } =
    useGetNeetQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode,
    });

  const allQbDetails = useMemo(
    () => qbDetailsData?.data?.qbDetails || [],
    [qbDetailsData]
  );

  // Filter QB details to district level
  const qbDetails = useMemo(
    () => allQbDetails.filter((q) => q.BATCHNAME === districtCode),
    [allQbDetails, districtCode]
  );

  // Fetch subject-wise statistics for district
  const { data: subjectStatsData, isLoading: loadingSubjectStats } =
    useGetNeetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode }
    );

  const subjectStats = subjectStatsData?.data || {
    overall: null,
    byDistrict: [],
  };

  // Fetch question statistics
  const { data: questionStatsData, isLoading: loadingQuestionStats } =
    useGetNeetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode,
    });

  const allQuestionStats = questionStatsData?.data?.questionStatistics || [];

  // Filter question stats to district level
  const questionStats = useMemo(
    () =>
      allQuestionStats.filter((q) => q.BATCHNAME === districtCode),
    [allQuestionStats, districtCode]
  );

  // Process marks data with ranking
  const rankedMarks = useMemo(() => {
    if (!marks || marks.length === 0) return [];

    let processedMarks = [...marks];

    // Filter by search text
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      processedMarks = processedMarks.filter(
        (m) =>
          m.Candidate_Name?.toLowerCase().includes(searchLower) ||
          m.ROLLNO?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by total marks descending
    const sorted = processedMarks.sort(
      (a, b) => (b.TOTAL || 0) - (a.TOTAL || 0)
    );

    // Add ranks
    return sorted.map((mark, index) => ({
      ...mark,
      districtRank: index + 1,
    }));
  }, [marks, filterText]);

  // QB Details columns
  const qbDetailsCols = useMemo(
    () => [
      { name: "Question No", selector: (row) => row.Qno, sortable: true },
      { name: "Correct", selector: (row) => row.Correct, sortable: true },
      { name: "Wrong", selector: (row) => row.Wrong, sortable: true },
      { name: "Blank", selector: (row) => row.Blank, sortable: true },
    ],
    []
  );

  // Marks columns
  const marksColumns = useMemo(
    () => [
      {
        name: "Rank",
        selector: (row) => row.districtRank,
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

  // Excel Export Function
  const exportToExcel = () => {
    if (!rankedMarks || rankedMarks.length === 0) {
      alert("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Marks sheet
    const marksExportData = rankedMarks.map((row, index) => ({
      "S.No": index + 1,
      Rank: row.districtRank,
      "Student Name": row.Candidate_Name,
      "EMIS No": row.ROLLNO,
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
      "NEET District Marks"
    );

    // QB Details sheet
    if (qbDetails && qbDetails.length > 0) {
      const qbExportData = qbDetails.map((row, index) => ({
        "S.No": index + 1,
        "Question No": row.Qno,
        Correct: row.Correct,
        Wrong: row.Wrong,
        Blank: row.Blank,
      }));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(qbExportData),
        "QB Details"
      );
    }

    XLSX.writeFile(
      wb,
      `NEET_District_Report_${districtName}_${selectedTestCode}.xlsx`
    );
  };

  const isLoading =
    loadingTests ||
    loadingMarks ||
    loadingQbDetails ||
    loadingSubjectStats ||
    loadingQuestionStats;

  return (
    <Container fluid className="mt-4 mb-5">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex align-items-center gap-2">
            <FaSchool size={24} />
            <div>
              <h4 className="mb-0">
                NEET District Report - {districtName || "District"}
              </h4>
              <small>District-level NEET exam analytics</small>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {!districtCode && (
            <Alert variant="warning">
              Unable to load district information. Please check your user profile.
            </Alert>
          )}

          <Row className="g-3 mb-4">
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaChartLine className="me-2" />
                  Select Test Code
                </Form.Label>
                <Form.Select
                  value={selectedTestCode}
                  onChange={(e) => {
                    setSelectedTestCode(e.target.value);
                    setFilterText("");
                  }}
                  disabled={loadingTests}
                >
                  <option value="">-- Choose Test --</option>
                  {testCodes.map((test) => (
                    <option key={test.testcode} value={test.testcode}>
                      {test.Test_Name} ({test.testcode})
                    </option>
                  ))}
                </Form.Select>
                {loadingTests && <Spinner size="sm" className="ms-2" />}
              </Form.Group>
            </Col>

            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaFileAlt className="me-2" />
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

            <Col md={6} lg={4}>
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
              Select a test code to view district performance data
            </Alert>
          )}

          {selectedTestCode && (
            <>
              {/* Stats Summary */}
              {subjectStats?.overall && (
                <Row className="mb-4">
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Physics Avg</div>
                        <div className="h5 mb-0">
                          {parseFloat(
                            subjectStats.overall.physics?.average || 0
                          ).toFixed(2)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">
                          Chemistry Avg
                        </div>
                        <div className="h5 mb-0">
                          {parseFloat(
                            subjectStats.overall.chemistry?.average || 0
                          ).toFixed(2)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Botany Avg</div>
                        <div className="h5 mb-0">
                          {parseFloat(
                            subjectStats.overall.botany?.average || 0
                          ).toFixed(2)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light border-left-primary mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Zoology Avg</div>
                        <div className="h5 mb-0">
                          {parseFloat(
                            subjectStats.overall.zoology?.average || 0
                          ).toFixed(2)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Student Performance Summary */}
              {rankedMarks.length > 0 && (
                <Row className="mb-4">
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">
                          Total Students
                        </div>
                        <div className="h5 mb-0">{rankedMarks.length}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Avg Total</div>
                        <div className="h5 mb-0">
                          {(
                            rankedMarks.reduce((acc, m) => acc + (m.TOTAL || 0), 0) /
                            rankedMarks.length
                          ).toFixed(2)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Top Score</div>
                        <div className="h5 mb-0">
                          {Math.max(...rankedMarks.map((m) => m.TOTAL || 0))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3}>
                    <Card className="bg-light mb-3">
                      <Card.Body>
                        <div className="text-primary fw-bold">Pass Rate</div>
                        <div className="h5 mb-0">
                          {(
                            (rankedMarks.filter((m) => m.TOTAL >= 180).length /
                              rankedMarks.length) *
                            100
                          ).toFixed(1)}
                          %
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
                    District NEET Marks ({rankedMarks.length} students)
                    {loadingMarks && <Spinner size="sm" className="ms-2" />}
                  </h6>
                </Card.Header>
                <Card.Body>
                  {loadingMarks ? (
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
                    <Alert variant="warning">
                      No NEET marks data available for this district
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* QB Details */}
              <Card>
                <Card.Header className="bg-light py-3">
                  <h6 className="mb-0">
                    <FaClipboardList className="me-2" />
                    Question Bank Performance ({qbDetails.length} questions)
                    {loadingQbDetails && <Spinner size="sm" className="ms-2" />}
                  </h6>
                </Card.Header>
                <Card.Body>
                  {loadingQbDetails ? (
                    <div className="text-center">
                      <Spinner animation="border" />
                    </div>
                  ) : qbDetails.length > 0 ? (
                    <DataTable
                      columns={qbDetailsCols}
                      data={qbDetails}
                      pagination
                      highlightOnHover
                      striped
                      responsive
                    />
                  ) : (
                    <Alert variant="warning">
                      No QB details available for this district
                    </Alert>
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

export default District_Neet_Report;
