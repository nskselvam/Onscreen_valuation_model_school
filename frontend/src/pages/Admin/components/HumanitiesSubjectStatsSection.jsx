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

const HumanitiesSubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
  const overall = subjectStats?.overall;

  return (
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
        ) : !overall?.economics ? (
          <p className="text-muted text-center py-3">No statistics available.</p>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                {selectedDistrict ? `District Statistics (${selectedDistrict})` : 'Overall Statistics - All Districts'}
              </h6>
              <Row>
                <Col md={3}>
                  <SubjectCard title="Economics" variant="primary" stats={overall.economics} />
                </Col>
                <Col md={3}>
                  <SubjectCard title="History" variant="success" stats={overall.history} />
                </Col>
                <Col md={3}>
                  <SubjectCard title="Political Science" variant="warning" stats={overall.politicalScience} />
                </Col>
                <Col md={3}>
                  <SubjectCard title="Geography" variant="info" stats={overall.geography} />
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
                        <th className="text-end">Economics Avg</th>
                        <th className="text-end">Economics Median</th>
                        <th className="text-end">History Avg</th>
                        <th className="text-end">History Median</th>
                        <th className="text-end">Pol. Science Avg</th>
                        <th className="text-end">Pol. Science Median</th>
                        <th className="text-end">Geography Avg</th>
                        <th className="text-end">Geography Median</th>
                        <th className="text-end">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStats.byDistrict.map((district) => (
                        <tr key={district.districtCode}>
                          <td>{district.districtName} ({district.districtCode})</td>
                          <td className="text-end">{district.economics.average}</td>
                          <td className="text-end">{district.economics.median}</td>
                          <td className="text-end">{district.history.average}</td>
                          <td className="text-end">{district.history.median}</td>
                          <td className="text-end">{district.politicalScience.average}</td>
                          <td className="text-end">{district.politicalScience.median}</td>
                          <td className="text-end">{district.geography.average}</td>
                          <td className="text-end">{district.geography.median}</td>
                          <td className="text-end"><Badge bg="secondary">{district.economics.count}</Badge></td>
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

export default HumanitiesSubjectStatsSection;
