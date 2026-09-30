import React from 'react';
import { Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FaCalculator } from 'react-icons/fa';

const QuantitativeSubjectStatsSection = ({ selectedDistrict, subjectStats, loadingSubjectStats }) => {
  const overall = subjectStats?.overall?.quantitativeAptitude;

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
        <h5 className="mb-0">
          <FaCalculator className="me-2" />
          Quantitative Aptitude Average & Median Report
        </h5>
      </Card.Header>
      <Card.Body>
        {loadingSubjectStats ? (
          <div className="text-center py-3">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading statistics...</span>
          </div>
        ) : !overall ? (
          <p className="text-muted text-center py-3">No statistics available.</p>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                {selectedDistrict ? `District Statistics (${selectedDistrict})` : 'Overall Statistics - All Districts'}
              </h6>
              <Row>
                <Col md={6}>
                  <Card className="border-primary mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-primary">Quantitative Aptitude</h6>
                        <Badge bg="info">{overall.count} students</Badge>
                      </div>
                      <Row className="text-center">
                        <Col xs={6} className="border-end">
                          <div className="stat-value">{overall.average}</div>
                          <small className="text-muted">Average</small>
                        </Col>
                        <Col xs={6}>
                          <div className="stat-value">{overall.median}</div>
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
                        <th className="text-end">Average</th>
                        <th className="text-end">Median</th>
                        <th className="text-end">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStats.byDistrict.map((district) => (
                        <tr key={district.districtCode}>
                          <td>{district.districtName} ({district.districtCode})</td>
                          <td className="text-end">{district.quantitativeAptitude.average}</td>
                          <td className="text-end">{district.quantitativeAptitude.median}</td>
                          <td className="text-end"><Badge bg="secondary">{district.quantitativeAptitude.count}</Badge></td>
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

export default QuantitativeSubjectStatsSection;
