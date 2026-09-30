import React, { useMemo, useState } from 'react'
import { Container, Card, Row, Col, Form, Button, Badge, Table } from 'react-bootstrap'
import { FaMapMarkerAlt, FaArrowRight, FaStar, FaCheckSquare, FaSquare } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setRegulationInfo } from '../../../redux-slice/authSlice'
import { useGetDistrictsByCodesQuery } from '../../../redux-slice/GeneralGetSqlOperationApiSlice'
import { toast } from 'react-toastify'
import '../../../style/general/general.css'

const StateCoordinator_Common_Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { userInfo } = useSelector((state) => state.auth)

  // state_coord_dcode is a comma-separated string e.g. "01,02,03,...,39"
  const coordCodes = userInfo?.state_coord_dcode || ''

  const [selectedDistricts, setSelectedDistricts] = useState([]) // array of DCODE strings

  const { data: districtData, error, isLoading } = useGetDistrictsByCodesQuery(coordCodes, {
    skip: !coordCodes,
  })
  const districts = districtData?.data || []

  const allSelected = districts.length > 0 && selectedDistricts.length === districts.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDistricts([])
    } else {
      setSelectedDistricts(districts.map((d) => d.DCODE))
    }
  }

  const toggleDistrict = (dcode) => {
    setSelectedDistricts((prev) =>
      prev.includes(dcode) ? prev.filter((c) => c !== dcode) : [...prev, dcode]
    )
  }

  const handleContinue = () => {
    if (selectedDistricts.length === 0) {
      toast.warning('Please select at least one district to continue.')
      return
    }
    const selectedNames = districts
      .filter((d) => selectedDistricts.includes(d.DCODE))
      .map((d) => d.DNAME)
      .join(', ')

    dispatch(setRegulationInfo({
      districts: selectedDistricts,
      districtNames: selectedNames,
      selectAll: allSelected,
    }))
    toast.success(
      allSelected
        ? 'All assigned districts selected!'
        : `${selectedDistricts.length} district(s) selected successfully!`
    )
    navigate('/state/dashboard')
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading districts...</div>
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

  if (!coordCodes) {
    return (
      <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center text-muted">
          <p>No districts assigned to your coordinator account.</p>
          <p>Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
      <Container>
        <Row className="mb-4">
          <Col lg={10} md={12} className="mx-auto">
            <Card className="shadow-lg border-0 rounded-4" style={{ overflow: 'hidden' }}>
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div style={{
                    display: 'inline-block',
                    padding: '15px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    marginBottom: '16px'
                  }}>
                    <FaStar size={40} color="white" />
                  </div>
                  <h2 className="fw-bold text-primary mb-1">State Coordinator Dashboard</h2>
                  <p className="text-muted mb-0">
                    Welcome, <strong>{userInfo?.User_Name}</strong>
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {districts.length} district(s) assigned to you
                  </p>
                </div>

                {/* Select All Toggle */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <Form.Label className="fw-bold mb-0" style={{ fontSize: '1.05rem' }}>
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    Select Districts
                  </Form.Label>
                  <Button
                    variant={allSelected ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={toggleSelectAll}
                    className="d-flex align-items-center gap-2"
                    style={{ borderRadius: '8px', fontWeight: '600' }}
                  >
                    {allSelected ? <FaCheckSquare /> : <FaSquare />}
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {/* District Table */}
                <div style={{ maxHeight: '340px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #dee2e6' }}>
                  <Table hover className="mb-0" style={{ fontSize: '0.95rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', zIndex: 1 }}>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center', border: 'none', padding: '12px' }}>#</th>
                        <th style={{ width: '100px', border: 'none', padding: '12px' }}>Code</th>
                        <th style={{ border: 'none', padding: '12px' }}>District Name</th>
                        <th style={{ width: '80px', textAlign: 'center', border: 'none', padding: '12px' }}>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {districts.map((district, idx) => {
                        const isSelected = selectedDistricts.includes(district.DCODE)
                        return (
                          <tr
                            key={district.DCODE}
                            onClick={() => toggleDistrict(district.DCODE)}
                            style={{
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(102,126,234,0.10)' : 'transparent',
                              transition: 'background 0.15s',
                            }}
                          >
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '10px 12px' }}>
                              {idx + 1}
                            </td>
                            <td style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                              <Badge
                                bg={isSelected ? 'primary' : 'secondary'}
                                style={{ fontSize: '0.82rem', minWidth: '42px' }}
                              >
                                {district.DCODE}
                              </Badge>
                            </td>
                            <td style={{ verticalAlign: 'middle', padding: '10px 12px', fontWeight: isSelected ? '600' : '400' }}>
                              {district.DNAME}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '10px 12px' }}>
                              <Form.Check
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleDistrict(district.DCODE)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ cursor: 'pointer', transform: 'scale(1.3)' }}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Selection Summary */}
                {selectedDistricts.length > 0 && (
                  <div className="mt-3 p-2 rounded-3" style={{ background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.3)' }}>
                    <small className="text-primary fw-semibold">
                      {selectedDistricts.length} of {districts.length} district(s) selected
                      {allSelected && ' (All)'}
                    </small>
                  </div>
                )}

                {/* Continue Button */}
                <div className="d-grid mt-4">
                  <Button
                    size="lg"
                    onClick={handleContinue}
                    disabled={selectedDistricts.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

export default StateCoordinator_Common_Dashboard
