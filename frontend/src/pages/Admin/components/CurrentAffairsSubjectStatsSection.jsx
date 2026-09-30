import React from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaCalculator } from "react-icons/fa";

const CurrentAffairsSubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
        <h5 className="mb-0">
          <FaCalculator className="me-2" />
          Part-wise Average &amp; Median Report
        </h5>
      </Card.Header>
      <Card.Body>
        {loadingSubjectStats ? (
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading statistics...</span>
          </div>
        ) : !subjectStats?.overall?.part1 ? (
          <p className="text-muted text-center py-3">No statistics available.</p>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                {selectedDistrict ? `District Statistics (${selectedDistrict})` : "Overall Statistics - All Districts"}
              </h6>
              <Row>
                <Col md={6}>
                  <Card className="border-primary mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-primary">Part 1</h6>
                        <Badge bg="info">{subjectStats.overall.part1.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.part1.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.part1.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-success mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-success">Part 2</h6>
                        <Badge bg="info">{subjectStats.overall.part2.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{subjectStats.overall.part2.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{subjectStats.overall.part2.median}</div>
                          <small className="text-muted">Median</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            {!selectedDistrict && subjectStats.byDistrict && subjectStats.byDistrict.length > 0 && (
              <div>
                <h6 className="text-secondary mb-3">District-wise Breakdown</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover table-sm">
                    <thead className="table-dark">
                      <tr>
                        <th>District</th>
                        <th className="text-end">Part 1 Avg</th>
                        <th className="text-end">Part 1 Median</th>
                        <th className="text-end">Part 2 Avg</th>
                        <th className="text-end">Part 2 Median</th>
                        <th className="text-end">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStats.byDistrict.map((district) => (
                        <tr key={district.districtCode}>
                          <td>{district.districtName} ({district.districtCode})</td>
                          <td className="text-end">{district.part1.average}</td>
                          <td className="text-end">{district.part1.median}</td>
                          <td className="text-end">{district.part2.average}</td>
                          <td className="text-end">{district.part2.median}</td>
                          <td className="text-end"><Badge bg="secondary">{district.part1.count}</Badge></td>
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

export default CurrentAffairsSubjectStatsSection;
