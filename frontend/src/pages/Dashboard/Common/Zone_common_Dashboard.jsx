import React, { useState } from 'react'
import { Container, Card, Row, Col, Form, Button } from 'react-bootstrap'
import { FaBook, FaGraduationCap, FaArrowRight, FaBuilding } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setRegulationInfo } from '../../../redux-slice/authSlice'
import { useGetCenterDataQuery, useGetRegulationDataQuery } from '../../../redux-slice/GeneralGetSqlOperationApiSlice'
import { toast } from 'react-toastify'
import '../../../style/general/general.css'

const Zone_common_Dashboard = () => {
  const [regulation, setRegulation] = useState('')
  const [isCorrespondence, setIsCorrespondence] = useState(false)
  const [center, setCenter] = useState('')
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: centerData, error: error1, isLoading: isloading1 } = useGetCenterDataQuery();
  const { data: regulationData, error: error2, isLoading: isloading2 } = useGetRegulationDataQuery();

  const regulations = regulationData?.data || [];
  const centers = centerData?.data || [];

  const handleContinue = () => {
    if (regulation && center) {
      const mode = isCorrespondence ? 1 : 0;
      const type = isCorrespondence ? 'Correspondence' : 'Regular';
      
      // Store in Redux
      dispatch(setRegulationInfo({ 
        regulation, 
        mode,
        center
      }));
      
      toast.success(`Regulation ${regulation} (${type}) and Center selected successfully!`);
      
      // Navigate to zone dashboard (you may create a separate zone dashboard or reuse state dashboard)
      navigate('/zone/dashboard');
    }
  };

  if (isloading1 || isloading2) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Container fluid className="p-4" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <Card.Header className="text-white text-center py-4" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              <FaBuilding className="me-2" />
              Zone User - Dashboard Selection
            </Card.Header>
            <Card.Body className="p-5">
              <Form>
                {/* Regulation Selection */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold d-flex align-items-center">
                    <FaBook className="me-2 text-primary" />
                    Select Regulation
                  </Form.Label>
                  <Form.Select 
                    value={regulation} 
                    onChange={(e) => setRegulation(e.target.value)}
                    className="py-2"
                    style={{ borderRadius: '10px' }}
                  >
                    <option value="">-- Choose Regulation --</option>
                    {regulations.map((reg) => (
                      <option key={reg.Regulation} value={reg.Regulation}>
                        {reg.regulationDesc}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Center Selection */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold d-flex align-items-center">
                    <FaGraduationCap className="me-2 text-success" />
                    Select Center
                  </Form.Label>
                  <Form.Select 
                    value={center} 
                    onChange={(e) => setCenter(e.target.value)}
                    className="py-2"
                    style={{ borderRadius: '10px' }}
                  >
                    <option value="">-- Choose Center --</option>
                    {centers.map((cen) => (
                      <option key={cen.DCODE} value={cen.DCODE}>
                        {cen.DNAME}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Mode Selection */}
                <Form.Group className="mb-4">
                  <Form.Check 
                    type="switch"
                    id="correspondence-switch"
                    label={
                      <span className="fw-bold">
                        {isCorrespondence ? 'Correspondence Mode' : 'Regular Mode'}
                      </span>
                    }
                    checked={isCorrespondence}
                    onChange={(e) => setIsCorrespondence(e.target.checked)}
                    className="fs-5"
                  />
                </Form.Group>

                {/* Continue Button */}
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleContinue}
                    disabled={!regulation || !center}
                    style={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      padding: '12px'
                    }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <span>Continue to Dashboard</span>
                    <FaArrowRight className="ms-2" />
                  </Button>
                </div>

                {/* Info Text */}
                <div className="text-center mt-4 text-muted">
                  <small>
                    Please select regulation and center to access zone-level features
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Zone_common_Dashboard
