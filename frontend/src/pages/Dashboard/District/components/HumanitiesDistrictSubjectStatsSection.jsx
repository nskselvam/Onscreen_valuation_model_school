import React from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FaCalculator } from 'react-icons/fa';

const SubjectCard = ({ title, variant, stats }) => (
  <Card className={`border-${variant} mb-3`}>
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className={`mb-0 text-${variant}`}>{title}</h6>
        <Badge bg="info">{stats?.count ?? 0} students</Badge>
      </div>
      <Row className="text-center">
        <Col xs={6} className="border-end">
          <div className="stat-value">{stats?.average ?? 0}</div>
          <small className="text-muted">Average</small>
        </Col>
        <Col xs={6}>
          <div className="stat-value">{stats?.median ?? 0}</div>
          <small className="text-muted">Median</small>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

const HumanitiesDistrictSubjectStatsSection = ({ subjectStats, loadingSubjectStats }) => (
  <Card className="shadow-sm mb-4">
    <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
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
      ) : !subjectStats?.overall?.economics ? (
        <p className="text-muted text-center py-3">No statistics available.</p>
      ) : (
        <Row>
          <Col md={3}>
            <SubjectCard title="Economics" variant="primary" stats={subjectStats.overall.economics} />
          </Col>
          <Col md={3}>
            <SubjectCard title="History" variant="success" stats={subjectStats.overall.history} />
          </Col>
          <Col md={3}>
            <SubjectCard title="Political Science" variant="warning" stats={subjectStats.overall.politicalScience} />
          </Col>
          <Col md={3}>
            <SubjectCard title="Geography" variant="info" stats={subjectStats.overall.geography} />
          </Col>
        </Row>
      )}
    </Card.Body>
  </Card>
);

export default HumanitiesDistrictSubjectStatsSection;
