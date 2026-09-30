import React from 'react'
import { Container, Card, Row, Col, Form, Button, Badge } from 'react-bootstrap'
import { FaMapMarkerAlt, FaArrowRight, FaUserTie } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setRegulationInfo } from '../../../redux-slice/authSlice'
import { useGetDistrictDataQuery } from '../../../redux-slice/GeneralGetSqlOperationApiSlice'
import { toast } from 'react-toastify'
import '../../../style/general/general.css'

const StateAssistant_Common_Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { userInfo } = useSelector((state) => state.auth)
  const userDCode = userInfo?.D_Code || ''

  const { data: districtData, error, isLoading } = useGetDistrictDataQuery()
  const districts = districtData?.data || []

  const myDistrict = districts.find((d) => d.DCODE === userDCode)

  const handleContinue = () => {
    if (!myDistrict) {
      toast.error('No district assigned to your account. Please contact administrator.')
      return
    }
    dispatch(setRegulationInfo({ district: myDistrict.DCODE, districtName: myDistrict.DNAME }))
    toast.success(`${myDistrict.DNAME} selected successfully!`)
    navigate('/zone/common/dashboard')
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading district data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Error loading districts: {error?.data?.message || 'Unknown error'}</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container>
        <Row className="mb-5">
          <Col lg={8} md={10} className="mx-auto">
            <Card className="shadow-lg border-0 rounded-4 mb-4" style={{ overflow: 'hidden' }}>
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div style={{
                    display: 'inline-block',
                    padding: '15px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    marginBottom: '20px'
                  }}>
                    <FaUserTie size={40} color="white" />
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: '#4facfe' }}>State Assistant Dashboard</h2>
                  <p className="text-muted mb-0">
                    Welcome, <strong>{userInfo?.User_Name}</strong>
                  </p>
                </div>

                {/* District Display */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>
                    <FaMapMarkerAlt className="me-2" style={{ color: '#4facfe' }} />
                    Your Assigned District
                  </Form.Label>

                  {myDistrict ? (
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f4ff 100%)',
                        border: '2px solid #4facfe',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <Badge style={{ background: '#4facfe' }} className="me-2 fs-6">{myDistrict.DCODE}</Badge>
                          <span className="fw-semibold fs-5">{myDistrict.DNAME}</span>
                        </div>
                        <FaMapMarkerAlt size={24} color="#4facfe" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-3 border text-muted text-center">
                      No district found for D_Code: <strong>{userDCode || 'N/A'}</strong>
                    </div>
                  )}
                </Form.Group>

                {/* Continue Button */}
                <div className="d-grid mt-4">
                  <Button
                    size="lg"
                    onClick={handleContinue}
                    disabled={!myDistrict}
                    style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none',
                      padding: '14px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      borderRadius: '10px',
                    }}
                  >
                    Continue to Dashboard <FaArrowRight className="ms-2" />
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

export default StateAssistant_Common_Dashboard
