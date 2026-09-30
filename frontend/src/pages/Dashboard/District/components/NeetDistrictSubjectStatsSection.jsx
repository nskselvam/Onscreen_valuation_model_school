import React from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaCalculator } from "react-icons/fa";

const NeetDistrictSubjectStatsSection = ({ districtCode, subjectStats, loadingSubjectStats }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
        <h5 className="mb-0">
          <FaCalculator className="me-2" />
          Subject-wise Average & Median Report - {districtCode}
        </h5>
      </Card.Header>
      <Card.Body>
        {loadingSubjectStats ? (
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading statistics...</span>
          </div>
        ) : (
          <div>
            <h6 className="text-primary mb-3">District Statistics</h6>
            <Row>
              <Col md={3}>
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
              <Col md={3}>
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
              <Col md={3}>
                <Card className="border-warning mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0 text-warning">Botany</h6>
                      <Badge bg="info">{subjectStats.overall.botany.count} students</Badge>
                    </div>
                    <Row className="text-center">
                      <Col xs={6} className="border-end">
                        <div className="stat-value">{subjectStats.overall.botany.average}</div>
                        <small className="text-muted">Average</small>
                      </Col>
                      <Col xs={6}>
                        <div className="stat-value">{subjectStats.overall.botany.median}</div>
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
                      <h6 className="mb-0 text-info">Zoology</h6>
                      <Badge bg="info">{subjectStats.overall.zoology.count} students</Badge>
                    </div>
                    <Row className="text-center">
                      <Col xs={6} className="border-end">
                        <div className="stat-value">{subjectStats.overall.zoology.average}</div>
                        <small className="text-muted">Average</small>
                      </Col>
                      <Col xs={6}>
                        <div className="stat-value">{subjectStats.overall.zoology.median}</div>
                        <small className="text-muted">Median</small>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default NeetDistrictSubjectStatsSection;
