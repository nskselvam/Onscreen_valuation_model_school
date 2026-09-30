import React, { useState } from 'react'
import { Container, Card, Row, Col, Form, Button } from 'react-bootstrap'
import { FaBook, FaGraduationCap, FaArrowRight } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setRegulationInfo } from '../../../redux-slice/authSlice'
import { useGetRegulationDataQuery } from '../../../redux-slice/GeneralGetSqlOperationApiSlice.js'
import { toast } from 'react-toastify'
import '../../../style/general/general.css'

const District_Common_Dashboard = () => {
  const [regulation, setRegulation] = useState('')
  const [isCorrespondence, setIsCorrespondence] = useState(false)
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: regulationData, error, isLoading } = useGetRegulationDataQuery();

  const regulations = regulationData?.data || [];

  const handleContinue = () => {
    if (regulation) {
      const mode = isCorrespondence ? 1 : 0;
      const type = isCorrespondence ? 'Correspondence' : 'Regular';
      
      // Store in Redux
      dispatch(setRegulationInfo({ 
        regulation, 
        mode 
      }));
      
      toast.success(`Regulation ${regulation} (${type}) selected successfully!`);
      
      // Navigate to district dashboard
      navigate('/district/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container>
        <Row className="mb-5">
          <Col lg={10} md={12} className="mx-auto">
            <Card className="shadow-lg border-0 rounded-4 mb-4" style={{ overflow: 'hidden' }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div style={{
                    display: 'inline-block',
                    padding: '15px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    marginBottom: '20px'
                  }}>
                    <FaGraduationCap size={40} color="white" />
                  </div>
                  <h2 className="fw-bold text-primary mb-2">Select Regulation</h2>
                </div>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>
                    <FaBook className="me-2" style={{ color: '#667eea' }} />
                    Regulation
                  </Form.Label>
                  <Form.Select
                    value={regulation}
                    onChange={(e) => setRegulation(e.target.value)}
                    className="form-control"
                    style={{
                      padding: '12px 15px',
                      fontSize: '1rem',
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }}
                    size="lg"
                  >
                    <option value="">-- Select a Regulation --</option>
                    {regulations.map((reg) => (
                      <option key={reg.id} value={reg.Regulation}>
                        {reg.Regulation}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="correspondence-checkbox"
                    label={
                      <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                        Correspondence
                      </span>
                    }
                    checked={isCorrespondence}
                    onChange={(e) => setIsCorrespondence(e.target.checked)}
                    style={{ fontSize: '1.1rem' }}
                  />
                  <Form.Text className="text-muted ms-4">
                    {isCorrespondence ? 'Correspondence mode selected' : 'Regular mode (default)'}
                  </Form.Text>
                </Form.Group>

                <div className="text-center">
                  <Button
                    onClick={handleContinue}
                    disabled={!regulation}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      padding: '12px 40px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}
                    className="rounded-3"
                  >
                    Continue <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default District_Common_Dashboard
