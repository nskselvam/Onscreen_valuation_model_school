import React from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaCalculator } from "react-icons/fa";

const JeeSubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
        <h5 className="mb-0">
          <FaCalculator className="me-2" />
          Subject-wise Average & Median Report
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
                <Col md={4}>
                  <Card className="border-primary mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-primary">Physics</h6>
                        <Badge bg="info">{subjectStats.overall.physics.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.physics.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.physics.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-success mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-success">Chemistry</h6>
                        <Badge bg="info">{subjectStats.overall.chemistry.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.chemistry.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.chemistry.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-warning mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-warning">Mathematics</h6>
                        <Badge bg="info">{subjectStats.overall.maths.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.maths.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.maths.median}</div>
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
                        <th colSpan="2" className="text-center bg-primary text-white">Physics</th>
                        <th colSpan="2" className="text-center bg-success text-white">Chemistry</th>
                        <th colSpan="2" className="text-center bg-warning">Mathematics</th>
                      </tr>
                      <tr>
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
                            <small className="text-muted">({district.physics.count} students)</small>
                          </td>
                          <td className="text-center">{district.physics.average}</td>
                          <td className="text-center">{district.physics.median}</td>
                          <td className="text-center">{district.chemistry.average}</td>
                          <td className="text-center">{district.chemistry.median}</td>
                          <td className="text-center">{district.maths.average}</td>
                          <td className="text-center">{district.maths.median}</td>
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

export default JeeSubjectStatsSection;
