import React from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaCalculator } from "react-icons/fa";

const CuetSubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
        <h5 className="mb-0">
          <FaCalculator className="me-2" />
          Subject-wise Average and Median Report
        </h5>
      </Card.Header>
      <Card.Body>
        {loadingSubjectStats ? (
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading statistics...</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                {selectedDistrict
                  ? `District Statistics (${selectedDistrict})`
                  : "Overall Statistics - All Districts"}
              </h6>
              <Row>
                <Col md={3}>
                  <Card className="border-primary mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-primary">Accountancy</h6>
                        <Badge bg="info">{subjectStats.overall.accountancy.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.accountancy.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.accountancy.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-success mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-success">Economics</h6>
                        <Badge bg="info">{subjectStats.overall.economics.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.economics.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.economics.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-warning mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-warning">Business Studies and Commerce</h6>
                        <Badge bg="info">{subjectStats.overall.businessStudiesCommerce.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.businessStudiesCommerce.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.businessStudiesCommerce.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-info mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-info">Business Maths</h6>
                        <Badge bg="info">{subjectStats.overall.businessMaths.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.businessMaths.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.businessMaths.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            {!selectedDistrict && subjectStats.byDistrict.length > 0 && (
              <div>
                <h6 className="text-primary mb-3">District-wise Breakdown</h6>
                <div className="table-responsive">
                  <table className="table table-hover table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th rowSpan="2" className="align-middle">District</th>
                        <th colSpan="2" className="text-center bg-primary text-white">Accountancy</th>
                        <th colSpan="2" className="text-center bg-success text-white">Economics</th>
                        <th colSpan="2" className="text-center bg-warning">Business Studies and Commerce</th>
                        <th colSpan="2" className="text-center bg-info text-white">Business Maths</th>
                      </tr>
                      <tr>
                        <th className="text-center">Avg</th>
                        <th className="text-center">Median</th>
                        <th className="text-center">Avg</th>
                        <th className="text-center">Median</th>
                        <th className="text-center">Avg</th>
                        <th className="text-center">Median</th>
                        <th className="text-center">Avg</th>
                        <th className="text-center">Median</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStats.byDistrict.map((district) => (
                        <tr key={district.districtCode}>
                          <td>
                            <strong>{district.districtCode}</strong> - {district.districtName}
                            <br />
                            <small className="text-muted">({district.accountancy.count} students)</small>
                          </td>
                          <td className="text-center">{district.accountancy.average}</td>
                          <td className="text-center">{district.accountancy.median}</td>
                          <td className="text-center">{district.economics.average}</td>
                          <td className="text-center">{district.economics.median}</td>
                          <td className="text-center">{district.businessStudiesCommerce.average}</td>
                          <td className="text-center">{district.businessStudiesCommerce.median}</td>
                          <td className="text-center">{district.businessMaths.average}</td>
                          <td className="text-center">{district.businessMaths.median}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default CuetSubjectStatsSection;
