import React, { useState } from 'react';
import { Container, Card, Table, Button, Spinner, Form, Badge, Row, Col, ButtonGroup, Nav } from 'react-bootstrap';
import { FaCalculator, FaCheckCircle, FaSearch, FaChartLine, FaListAlt, FaUndo } from 'react-icons/fa';
import { useGetTestCodesWithDistrictsQuery } from '../../redux-slice/percentileApiSlice';
import { useGetNeetTestCodesWithDistrictsQuery } from '../../redux-slice/neetPercentileApiSlice';
import { useGetCuetTestCodesWithDistrictsQuery } from '../../redux-slice/cuetPercentileApiSlice';
import { useGetCurrentAffairsTestCodesWithDistrictsQuery } from '../../redux-slice/currentAffairsPercentileApiSlice';
import { useGetGeneralAbilityTestCodesWithDistrictsQuery } from '../../redux-slice/generalAbilityPercentileApiSlice';
import { useGetQuantitativeTestCodesWithDistrictsQuery } from '../../redux-slice/quantitativePercentileApiSlice';
import { useGetFoundationTestCodesWithDistrictsQuery } from '../../redux-slice/foundationPercentileApiSlice';
import { useGetHumanitiesTestCodesWithDistrictsQuery } from '../../redux-slice/humanitiesPercentileApiSlice';
import { useGetSpokenEnglishTestCodesWithDistrictsQuery } from '../../redux-slice/spokenEnglishPercentileApiSlice';
import { usePercentileCalculation } from '../../hooks/usePercentileCalculation';
import { useNeetPercentileCalculation } from '../../hooks/useNeetPercentileCalculation';
import { useCuetPercentileCalculation } from '../../hooks/useCuetPercentileCalculation';
import { useCurrentAffairsPercentileCalculation } from '../../hooks/useCurrentAffairsPercentileCalculation';
import { useGeneralAbilityPercentileCalculation } from '../../hooks/useGeneralAbilityPercentileCalculation';
import { useHumanitiesPercentileCalculation } from '../../hooks/useHumanitiesPercentileCalculation';
import { useQuantitativePercentileCalculation } from '../../hooks/useQuantitativePercentileCalculation';
import { useFoundationPercentileCalculation } from '../../hooks/useFoundationPercentileCalculation';
import { useSpokenEnglishPercentileCalculation } from '../../hooks/useSpokenEnglishPercentileCalculation';
import { useGetClatTestCodesWithDistrictsQuery } from '../../redux-slice/clatPercentileApiSlice';
import { useClatPercentileCalculation } from '../../hooks/useClatPercentileCalculation';
import './PercentileDashboard.css';

const examOptions = [
  { value: 'jee', label: 'JEE Percentile' },
  { value: 'neet', label: 'NEET Percentile' },
  { value: 'cuet', label: 'CUET Percentile' },
  { value: 'quantitative', label: 'Quantitative Aptitude Percentile' },
  { value: 'spokenenglish', label: 'Spoken English Percentile' },
  { value: 'foundation', label: 'Foundation Percentile' },
  { value: 'currentaffairs', label: 'Current Affairs Percentile' },
  { value: 'generalability', label: 'General Ability Percentile' },
  { value: 'humanities', label: 'Humanities Percentile' },
  { value: 'clat', label: 'CLAT Percentile' },
];

const PercentileDashboard = () => {
  const [examType, setExamType] = useState('jee');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestCode, setSelectedTestCode] = useState('');

  // Fetch JEE test codes with districts
  const { data: jeeTestCodesData, isLoading: jeeIsLoading, error: jeeError, refetch: jeeRefetch } = useGetTestCodesWithDistrictsQuery();
  const jeeTestCodes = jeeTestCodesData?.data?.testCodes || [];
  const jeeCompletedTestCodes = jeeTestCodesData?.data?.completedTestCodes || [];

  // Fetch NEET test codes with districts
  const { data: neetTestCodesData, isLoading: neetIsLoading, error: neetError, refetch: neetRefetch } = useGetNeetTestCodesWithDistrictsQuery();
  const neetTestCodes = neetTestCodesData?.data?.testCodes || [];
  const neetCompletedTestCodes = neetTestCodesData?.data?.completedTestCodes || [];

  // Fetch CUET test codes with districts
  const { data: cuetTestCodesData, isLoading: cuetIsLoading, error: cuetError, refetch: cuetRefetch } = useGetCuetTestCodesWithDistrictsQuery();
  const cuetTestCodes = cuetTestCodesData?.data?.testCodes || [];
  const cuetCompletedTestCodes = cuetTestCodesData?.data?.completedTestCodes || [];

  // Fetch Current Affairs test codes with districts
  const { data: caTestCodesData, isLoading: caIsLoading, error: caError, refetch: caRefetch } = useGetCurrentAffairsTestCodesWithDistrictsQuery();
  const caTestCodes = caTestCodesData?.data?.testCodes || [];
  const caCompletedTestCodes = caTestCodesData?.data?.completedTestCodes || [];

  // Fetch General Ability test codes with districts
  const { data: gaTestCodesData, isLoading: gaIsLoading, error: gaError, refetch: gaRefetch } = useGetGeneralAbilityTestCodesWithDistrictsQuery();
  const gaTestCodes = gaTestCodesData?.data?.testCodes || [];
  const gaCompletedTestCodes = gaTestCodesData?.data?.completedTestCodes || [];

  // Fetch Quantitative Aptitude test codes with districts
  const { data: qaTestCodesData, isLoading: qaIsLoading, error: qaError, refetch: qaRefetch } = useGetQuantitativeTestCodesWithDistrictsQuery();
  const qaTestCodes = qaTestCodesData?.data?.testCodes || [];
  const qaCompletedTestCodes = qaTestCodesData?.data?.completedTestCodes || [];

  // Fetch Foundation test codes with districts
  const { data: foundationTestCodesData, isLoading: foundationIsLoading, error: foundationError, refetch: foundationRefetch } = useGetFoundationTestCodesWithDistrictsQuery();
  const foundationTestCodes = foundationTestCodesData?.data?.testCodes || [];
  const foundationCompletedTestCodes = foundationTestCodesData?.data?.completedTestCodes || [];

  // Fetch Humanities test codes with districts
  const { data: humanitiesTestCodesData, isLoading: humanitiesIsLoading, error: humanitiesError, refetch: humanitiesRefetch } = useGetHumanitiesTestCodesWithDistrictsQuery();
  const humanitiesTestCodes = humanitiesTestCodesData?.data?.testCodes || [];
  const humanitiesCompletedTestCodes = humanitiesTestCodesData?.data?.completedTestCodes || [];

  // Fetch Spoken English test codes with districts
  const { data: spokenEnglishTestCodesData, isLoading: spokenEnglishIsLoading, error: spokenEnglishError, refetch: spokenEnglishRefetch } = useGetSpokenEnglishTestCodesWithDistrictsQuery();
  const spokenEnglishTestCodes = spokenEnglishTestCodesData?.data?.testCodes || [];
  const spokenEnglishCompletedTestCodes = spokenEnglishTestCodesData?.data?.completedTestCodes || [];

  const { data: clatTestCodesData, isLoading: clatIsLoading, error: clatError, refetch: clatRefetch } = useGetClatTestCodesWithDistrictsQuery();
  const clatTestCodes = clatTestCodesData?.data?.testCodes || [];
  const clatCompletedTestCodes = clatTestCodesData?.data?.completedTestCodes || [];

  // Use appropriate data based on exam type
  const testCodes = examType === 'jee'
    ? jeeTestCodes
    : examType === 'neet'
      ? neetTestCodes
      : examType === 'cuet'
        ? cuetTestCodes
        : examType === 'quantitative'
          ? qaTestCodes
          : examType === 'spokenenglish'
            ? spokenEnglishTestCodes
            : examType === 'foundation'
              ? foundationTestCodes
              : examType === 'currentaffairs'
                ? caTestCodes
                : examType === 'humanities'
                  ? humanitiesTestCodes
                  : examType === 'clat'
                    ? clatTestCodes
                  : gaTestCodes;
  const completedTestCodes = examType === 'jee'
    ? jeeCompletedTestCodes
    : examType === 'neet'
      ? neetCompletedTestCodes
      : examType === 'cuet'
        ? cuetCompletedTestCodes
        : examType === 'quantitative'
          ? qaCompletedTestCodes
          : examType === 'spokenenglish'
            ? spokenEnglishCompletedTestCodes
            : examType === 'foundation'
              ? foundationCompletedTestCodes
              : examType === 'currentaffairs'
                ? caCompletedTestCodes
                : examType === 'humanities'
                  ? humanitiesCompletedTestCodes
                  : examType === 'clat'
                    ? clatCompletedTestCodes
                  : gaCompletedTestCodes;
  const isLoading = examType === 'jee'
    ? jeeIsLoading
    : examType === 'neet'
      ? neetIsLoading
      : examType === 'cuet'
        ? cuetIsLoading
        : examType === 'quantitative'
          ? qaIsLoading
          : examType === 'spokenenglish'
            ? spokenEnglishIsLoading
            : examType === 'foundation'
              ? foundationIsLoading
              : examType === 'currentaffairs'
                ? caIsLoading
                : examType === 'humanities'
                  ? humanitiesIsLoading
                  : examType === 'clat'
                    ? clatIsLoading
                  : gaIsLoading;
  const error = examType === 'jee'
    ? jeeError
    : examType === 'neet'
      ? neetError
      : examType === 'cuet'
        ? cuetError
        : examType === 'quantitative'
          ? qaError
          : examType === 'spokenenglish'
            ? spokenEnglishError
            : examType === 'foundation'
              ? foundationError
              : examType === 'currentaffairs'
                ? caError
                : examType === 'humanities'
                  ? humanitiesError
                  : examType === 'clat'
                    ? clatError
                  : gaError;
  const refetch = examType === 'jee'
    ? jeeRefetch
    : examType === 'neet'
      ? neetRefetch
      : examType === 'cuet'
        ? cuetRefetch
        : examType === 'quantitative'
          ? qaRefetch
          : examType === 'spokenenglish'
            ? spokenEnglishRefetch
            : examType === 'foundation'
              ? foundationRefetch
              : examType === 'currentaffairs'
                ? caRefetch
                : examType === 'humanities'
                  ? humanitiesRefetch
                  : examType === 'clat'
                    ? clatRefetch
                  : gaRefetch;

  // Use appropriate percentile calculation hook
  const jeePercentileMethods = usePercentileCalculation();
  const neetPercentileMethods = useNeetPercentileCalculation();
  const cuetPercentileMethods = useCuetPercentileCalculation();
  const qaPercentileMethods = useQuantitativePercentileCalculation();
  const spokenEnglishPercentileMethods = useSpokenEnglishPercentileCalculation();
  const clatPercentileMethods = useClatPercentileCalculation();
  const foundationPercentileMethods = useFoundationPercentileCalculation();
  const humanitiesPercentileMethods = useHumanitiesPercentileCalculation();
  const caPercentileMethods = useCurrentAffairsPercentileCalculation();
  const gaPercentileMethods = useGeneralAbilityPercentileCalculation();
  
  const {
    handleCalculateOverall,
    handleCalculateDistrict,
    handleCalculateAllDistricts,
    handleRevokeOverall,
    handleRevokeDistrict,
    handleRevokeAllDistricts,
    isLoading: isCalculating,
  } = examType === 'jee'
    ? jeePercentileMethods
    : examType === 'neet'
      ? neetPercentileMethods
      : examType === 'cuet'
        ? cuetPercentileMethods
        : examType === 'quantitative'
          ? qaPercentileMethods
          : examType === 'spokenenglish'
            ? spokenEnglishPercentileMethods
            : examType === 'foundation'
              ? foundationPercentileMethods
              : examType === 'currentaffairs'
                ? caPercentileMethods
                : examType === 'humanities'
                  ? humanitiesPercentileMethods
                  : examType === 'clat'
                    ? clatPercentileMethods
                  : gaPercentileMethods;

  // Reset selected test code when switching exam type
  const handleExamTypeChange = (type) => {
    setExamType(type);
    setSelectedTestCode('');
    setSearchTerm('');
  };

  // Filter test codes based on search
  const filteredTestCodes = testCodes.filter((test) =>
    test.testCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get districts for selected test code
  const selectedTest = testCodes.find((test) => test.testCode === selectedTestCode);
  const districtsForTest = selectedTest?.districts || [];

  // Calculate overall percentiles for a test code
  const handleOverallCalculation = async (testCode) => {
    const result = await handleCalculateOverall(testCode);
    if (result.success) {
      refetch(); // Refresh data after calculation
    }
  };

  // Calculate district percentiles
  const handleDistrictCalculation = async (testCode, districtCode) => {
    const result = await handleCalculateDistrict(testCode, districtCode);
    if (result.success) {
      refetch(); // Refresh data after calculation
    }
  };

  // Calculate all districts percentiles
  const handleAllDistrictsCalculation = async (testCode) => {
    const result = await handleCalculateAllDistricts(testCode);
    if (result.success) {
      refetch(); // Refresh data after calculation
    }
  };

  // Revoke overall percentiles
  const handleOverallRevoke = async (testCode) => {
    const result = await handleRevokeOverall(testCode);
    if (result.success) {
      refetch(); // Refresh data after revoke
    }
  };

  // Revoke district percentiles
  const handleDistrictRevoke = async (testCode, districtCode) => {
    const result = await handleRevokeDistrict(testCode, districtCode);
    if (result.success) {
      refetch(); // Refresh data after revoke
    }
  };

  // Revoke all districts percentiles
  const handleAllDistrictsRevoke = async (testCode) => {
    const result = await handleRevokeAllDistricts(testCode);
    if (result.success) {
      refetch(); // Refresh data after revoke
    }
  };

  if (isLoading) {
    return (
      <Container className="percentile-dashboard-container mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading test codes...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="percentile-dashboard-container mt-4">
        <Card className="border-danger">
          <Card.Body className="text-center text-danger">
            <p>Error loading data: {error?.data?.message || 'Unknown error'}</p>
            <Button variant="outline-danger" onClick={refetch}>
              Retry
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="percentile-dashboard-container mt-4 px-4">
      {/* Header Card with Exam Type Tabs */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="percentile-header-gradient">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center">
              <FaChartLine className="me-2" size={24} />
              <h4 className="mb-0">Percentile Calculation Dashboard</h4>
            </div>
            <Badge bg="light" text="dark" className="fs-6">
              {testCodes.length} Pending | {completedTestCodes.length} Completed
            </Badge>
          </div>
          <div className="mt-3">
            <Form.Group className="mb-0">
              <Form.Label className="text-white fw-semibold mb-2">Select Subject</Form.Label>
              <Form.Select
                value={examType}
                onChange={(e) => handleExamTypeChange(e.target.value)}
                className="w-auto min-w-250px"
              >
                {examOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-0">
            Calculate overall and district-specific percentiles for {examType === 'currentaffairs' ? 'CURRENT AFFAIRS' : examType === 'foundation' ? 'FOUNDATION' : examType === 'generalability' ? 'GENERAL ABILITY' : examType === 'humanities' ? 'HUMANITIES' : examType === 'quantitative' ? 'QUANTITATIVE APTITUDE' : examType === 'spokenenglish' ? 'SPOKEN ENGLISH' : examType.toUpperCase()} marks data.
            Select a test code to view districts and calculate percentiles.
          </p>
        </Card.Body>
      </Card>

      <Row>
        {/* Left Side - Test Codes List */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="test-codes-header">
              <FaListAlt className="me-2" />
              Pending Test Codes
            </Card.Header>
            <Card.Body>
              {/* Search Box */}
              <Form.Group className="mb-3">
                <div className="search-box-wrapper">
                  <FaSearch className="search-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Search test code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </Form.Group>

              {/* Test Codes List */}
              <div className="test-codes-list">
                {filteredTestCodes.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>No pending test codes found</p>
                  </div>
                ) : (
                  filteredTestCodes.map((test) => (
                    <Card
                      key={test.testCode}
                      className={`test-code-card mb-2 ${
                        selectedTestCode === test.testCode ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedTestCode(test.testCode)}
                    >
                      <Card.Body className="py-2 px-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{test.testCode}</h6>
                            <small className="text-muted">
                              {test.districts.length} District(s)
                            </small>
                          </div>
                          <ButtonGroup size="sm">
                            <Button
                              variant="outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOverallCalculation(test.testCode);
                              }}
                              disabled={isCalculating('overall', test.testCode)}
                            >
                              {isCalculating('overall', test.testCode) ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <>
                                  <FaCalculator className="me-1" />
                                  Calculate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOverallRevoke(test.testCode);
                              }}
                              disabled={isCalculating('revoke-overall', test.testCode)}
                            >
                              {isCalculating('revoke-overall', test.testCode) ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <>
                                  <FaUndo className="me-1" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          </ButtonGroup>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side - Districts Table */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="districts-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <FaCalculator className="me-2" />
                  Districts for Test Code: {selectedTestCode || 'Select a test code'}
                </div>
                {selectedTestCode && (
                  <ButtonGroup size="sm">
                    <Button
                      variant="success"
                      onClick={() => handleAllDistrictsCalculation(selectedTestCode)}
                      disabled={isCalculating('all-districts', selectedTestCode)}
                    >
                      {isCalculating('all-districts', selectedTestCode) ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-1" />
                          Calculate All
                        </>
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleAllDistrictsRevoke(selectedTestCode)}
                      disabled={isCalculating('revoke-all-districts', selectedTestCode)}
                    >
                      {isCalculating('revoke-all-districts', selectedTestCode) ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <FaUndo className="me-1" />
                          Revoke All
                        </>
                      )}
                    </Button>
                  </ButtonGroup>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {!selectedTestCode ? (
                <div className="text-center text-muted py-5">
                  <FaChartLine size={48} className="mb-3 opacity-50" />
                  <p>Select a test code from the left panel to view districts</p>
                </div>
              ) : districtsForTest.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No districts found for this test code</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="districts-table mb-0">
                    <thead>
                      <tr>
                        <th width="15%">District Code</th>
                        <th width="35%">District Name</th>
                        <th width="20%" className="text-center">Students</th>
                        <th width="30%" className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {districtsForTest.map((district) => (
                        <tr key={district.districtCode}>
                          <td>
                            <Badge bg="secondary">{district.districtCode}</Badge>
                          </td>
                          <td>{district.districtName}</td>
                          <td className="text-center">
                            <Badge bg="info">{district.studentCount}</Badge>
                          </td>
                          <td className="text-center">
                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-success"
                                onClick={() =>
                                  handleDistrictCalculation(
                                    selectedTestCode,
                                    district.districtCode
                                  )
                                }
                                disabled={isCalculating(
                                  'district',
                                  selectedTestCode,
                                  district.districtCode
                                )}
                              >
                                {isCalculating(
                                  'district',
                                  selectedTestCode,
                                  district.districtCode
                                ) ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Calculating...
                                  </>
                                ) : (
                                  <>
                                    <FaCalculator className="me-1" />
                                    Calculate
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() =>
                                  handleDistrictRevoke(
                                    selectedTestCode,
                                    district.districtCode
                                  )
                                }
                                disabled={isCalculating(
                                  'revoke-district',
                                  selectedTestCode,
                                  district.districtCode
                                )}
                              >
                                {isCalculating(
                                  'revoke-district',
                                  selectedTestCode,
                                  district.districtCode
                                ) ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Revoking...
                                  </>
                                ) : (
                                  <>
                                    <FaUndo className="me-1" />
                                    Revoke
                                  </>
                                )}
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Completed Test Codes Card */}
      {completedTestCodes.length > 0 && (
        <Card className="completed-card shadow-sm mt-4">
          <Card.Header className="completed-header">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <FaCheckCircle className="me-2" size={20} />
                <h5 className="mb-0">Calculated Test Codes</h5>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {completedTestCodes.length} Completed
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {completedTestCodes.map((test) => (
                <Col key={test.testCode} xs={12} sm={6} md={4} lg={3}>
                  <Card className="completed-test-card">
                    <Card.Body className="text-center py-3">
                      <FaCheckCircle className="text-success mb-2" size={24} />
                      <h6 className="mb-1">{test.testCode}</h6>
                      <small className="text-muted">
                        {test.districts.length} District(s)
                      </small>
                      <div className="mt-2">
                        <Badge bg="success" className="me-1">
                          Overall ✓
                        </Badge>
                        <Badge bg="success">District ✓</Badge>
                      </div>
                      <div className="mt-3 d-grid gap-2">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleOverallRevoke(test.testCode)}
                          disabled={isCalculating('revoke-overall', test.testCode)}
                        >
                          {isCalculating('revoke-overall', test.testCode) ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-1" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <FaUndo className="me-1" />
                              Revoke Overall
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={() => handleAllDistrictsRevoke(test.testCode)}
                          disabled={isCalculating('revoke-all-districts', test.testCode)}
                        >
                          {isCalculating('revoke-all-districts', test.testCode) ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-1" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <FaUndo className="me-1" />
                              Revoke Districts
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Info Card */}
      <Card className="info-card shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="text-primary mb-2">
                <FaCheckCircle className="me-2" />
                Overall Percentiles
              </h6>
              <small className="text-muted">
                Calculated across all students in the test code. Updates: Total_Percentile,
                {examType === 'currentaffairs'
                  ? ' Total1_Percentile, Total2_Percentile'
                  : examType === 'foundation'
                  ? ' Phy_Percentile, Che_Percentile, Bio_Percentile'
                  : examType === 'quantitative'
                  ? ' quantsPercentile, logicalReasoningPercentile, currentAffairsPercentile'
                  : examType === 'cuet'
                  ? ' Sub1_Percentile, Sub2_Percentile, Sub3_Percentile, Sub4_Percentile'
                  : ' Phy_Percentile, Che_Percentile, Mat_Percentile'}
              </small>
            </Col>
            <Col md={6}>
              <h6 className="text-success mb-2">
                <FaCheckCircle className="me-2" />
                District Percentiles
              </h6>
              <small className="text-muted">
                Calculated within each district separately. Updates: d_Total_Percentile,
                {examType === 'jee'
                  ? ' d_Phy_Percentile, d_Che_Percentile, d_Mat_Percentile'
                  : examType === 'cuet'
                  ? ' d_Sub1_Percentile, d_Sub2_Percentile, d_Sub3_Percentile, d_Sub4_Percentile'
                  : examType === 'foundation'
                  ? ' d_Phy_Percentile, d_Che_Percentile, d_Bio_Percentile'
                  : examType === 'currentaffairs'
                  ? ' d_Total1_Percentile, d_Total2_Percentile'
                  : examType === 'generalability'
                  ? ' d_Verbal_Ability_Percentile, d_Quants_Percentile, d_Gk_Current_Affairs_Percentile'
                  : examType === 'quantitative'
                  ? ' d_quantsPercentile, d_logicalReasoningPercentile, d_currentAffairsPercentile'
                  : ''}
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PercentileDashboard;