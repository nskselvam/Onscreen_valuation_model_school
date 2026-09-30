import React from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaCalculator } from "react-icons/fa";

const CurrentAffairsDistrictSubjectStatsSection = ({ subjectStats, loadingSubjectStats }) => {
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
        )}
      </Card.Body>
    </Card>
  );
};

export default CurrentAffairsDistrictSubjectStatsSection;
