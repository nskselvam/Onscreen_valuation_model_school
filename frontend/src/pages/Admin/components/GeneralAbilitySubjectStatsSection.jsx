import React from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FaCalculator } from 'react-icons/fa';

const SubjectCard = ({ title, variant, stats }) => (
  <Card className={`border-${variant} mb-3`}>
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className={`mb-0 text-${variant}`}>{title}</h6>
        <Badge bg="info">{stats.count} students</Badge>
      </div>
      <Row className="text-center">
        <Col xs={6} className="border-end">
          <div className="stat-value">{stats.average}</div>
          <small className="text-muted">Average</small>
        </Col>
        <Col xs={6}>
          <div className="stat-value">{stats.median}</div>
          <small className="text-muted">Median</small>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

const GeneralAbilitySubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
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
        ) : !overall?.verbalAbility ? (
          <p className="text-muted text-center py-3">No statistics available.</p>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                {selectedDistrict ? `District Statistics (${selectedDistrict})` : 'Overall Statistics - All Districts'}
              </h6>
              <Row>
                <Col md={4}>
                  <SubjectCard title="Verbal Ability" variant="primary" stats={overall.verbalAbility} />
                </Col>
                <Col md={4}>
                  <SubjectCard title="Gk Current Affairs" variant="success" stats={overall.gkCurrentAffairs} />
                </Col>
                <Col md={4}>
                  <SubjectCard title="Quants" variant="warning" stats={overall.quants} />
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
                        <th className="text-end">Verbal Avg</th>
                        <th className="text-end">Verbal Median</th>
                        <th className="text-end">GK Avg</th>
                        <th className="text-end">GK Median</th>
                        <th className="text-end">Quants Avg</th>
                        <th className="text-end">Quants Median</th>
                        <th className="text-end">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStats.byDistrict.map((district) => (
                        <tr key={district.districtCode}>
                          <td>{district.districtName} ({district.districtCode})</td>
                          <td className="text-end">{district.verbalAbility.average}</td>
                          <td className="text-end">{district.verbalAbility.median}</td>
                          <td className="text-end">{district.gkCurrentAffairs.average}</td>
                          <td className="text-end">{district.gkCurrentAffairs.median}</td>
                          <td className="text-end">{district.quants.average}</td>
                          <td className="text-end">{district.quants.median}</td>
                          <td className="text-end"><Badge bg="secondary">{district.verbalAbility.count}</Badge></td>
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

export default GeneralAbilitySubjectStatsSection;