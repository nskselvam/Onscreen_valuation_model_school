import React from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaCalculator } from "react-icons/fa";

const SpokenEnglishSubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
        <h5 className="mb-0">
          <FaCalculator className="me-2" />
          Section-wise Average & Median Report
        </h5>
      </Card.Header>
      <Card.Body>
        {loadingSubjectStats ? (
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading statistics...</span>
          </div>
        ) : !subjectStats?.overall?.listening ? (
          <p className="text-muted text-center py-3">No statistics available.</p>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                {selectedDistrict ? `District Statistics (${selectedDistrict})` : "Overall Statistics - All Districts"}
              </h6>
              <Row>
                <Col md={3}>
                  <Card className="border-primary mb-3"><Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2"><h6 className="mb-0 text-primary">Listening</h6><Badge bg="info">{subjectStats.overall.listening.count} students</Badge></div>
                    <Row className="text-center"><Col xs={6} className="border-end"><div className="stat-value">{subjectStats.overall.listening.average}</div><small className="text-muted">Average</small></Col><Col xs={6}><div className="stat-value">{subjectStats.overall.listening.median}</div><small className="text-muted">Median</small></Col></Row>
                  </Card.Body></Card>
                </Col>
                <Col md={3}>
                  <Card className="border-success mb-3"><Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2"><h6 className="mb-0 text-success">Speaking</h6><Badge bg="info">{subjectStats.overall.speaking.count} students</Badge></div>
                    <Row className="text-center"><Col xs={6} className="border-end"><div className="stat-value">{subjectStats.overall.speaking.average}</div><small className="text-muted">Average</small></Col><Col xs={6}><div className="stat-value">{subjectStats.overall.speaking.median}</div><small className="text-muted">Median</small></Col></Row>
                  </Card.Body></Card>
                </Col>
                <Col md={3}>
                  <Card className="border-warning mb-3"><Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2"><h6 className="mb-0 text-warning">Reading</h6><Badge bg="info">{subjectStats.overall.reading.count} students</Badge></div>
                    <Row className="text-center"><Col xs={6} className="border-end"><div className="stat-value">{subjectStats.overall.reading.average}</div><small className="text-muted">Average</small></Col><Col xs={6}><div className="stat-value">{subjectStats.overall.reading.median}</div><small className="text-muted">Median</small></Col></Row>
                  </Card.Body></Card>
                </Col>
                <Col md={3}>
                  <Card className="border-danger mb-3"><Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2"><h6 className="mb-0 text-danger">Writing</h6><Badge bg="info">{subjectStats.overall.writing.count} students</Badge></div>
                    <Row className="text-center"><Col xs={6} className="border-end"><div className="stat-value">{subjectStats.overall.writing.average}</div><small className="text-muted">Average</small></Col><Col xs={6}><div className="stat-value">{subjectStats.overall.writing.median}</div><small className="text-muted">Median</small></Col></Row>
                  </Card.Body></Card>
                </Col>
              </Row>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default SpokenEnglishSubjectStatsSection;
