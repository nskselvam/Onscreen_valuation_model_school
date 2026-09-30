import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Container, Card, Row, Col, Form, Button, Alert } from 'react-bootstrap'
import { FaBook, FaGraduationCap, FaArrowRight } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { loginSuccess } from '../../../redux-slice/authSlice'
import { useGetServerTimeQuery } from '../../../redux-slice/generalApiSlice'
import {useUpdateRoleDegreeMutation} from '../../../redux-slice/redisApiSlice'
import DashBoard from '../../Dashboard/Common/userDetails.json'
import '../../../style/general/general.css'
import { toast } from 'react-toastify'


const CommonDashboar = () => {

  const [user, setUser] = useState('')
  const [course, setCourse] = useState('')
  const navigate = useNavigate();
  const dispatch = useDispatch();
    const [updateRoleDegree] = useUpdateRoleDegreeMutation();

  const { data: serverData } = useGetServerTimeQuery()
  const degreeData = serverData?.data
  const ipaddress = serverData?.ip_address
  const eva_month_year = serverData?.Month_Year_Data

  //userinfo from redux
  const userExaminer = useSelector((state) => state.auth.userInfo)
  const userRole = useMemo(() => userExaminer?.role.split(",") || [], [userExaminer?.role])
  const users = DashBoard.users;
  const validUsers = useMemo(() => users.filter(u => userRole.includes(u.id)), [userRole]);


  // Derive unique D_Codes for the selected user role, then filter degreeData - Optimized with useMemo
  const selectedKey = useMemo(() => 
    user && user != '0' ? `Dep_Name_${user}` : user == '0' ? 'Dep_Name_0' : null,
    [user]
  );

  const uniqueDCodes = useMemo(() => {
    const rawDCodes = selectedKey ? userExaminer?.[selectedKey] : null;
    return rawDCodes
      ? [...new Set(rawDCodes.split(',').map(c => c.trim()).filter(Boolean))]
      : [];
  }, [selectedKey, userExaminer]);

  const filteredDegrees = useMemo(() => 
    degreeData && uniqueDCodes.length > 0
      ? degreeData.filter(d => uniqueDCodes.includes(d.D_Code))
      : [],
    [degreeData, uniqueDCodes]
  );



  const handleUserSelect = useCallback(() => {
    updateRoleDegree({ Email_Id: userExaminer?.username, userRole: user, degreeCode: course })
      .unwrap()
      .then(() => {
        toast.success('User role and course updated successfully');
      })
      .catch((error) => {
        console.error('Error updating role and degree in Redis:', error);
        toast.error('Failed to update role and course');
      });

    if (user && course) {
      const userData = {
        ...userExaminer,
        selected_role: user,
        selected_course: course,
      }
      dispatch(loginSuccess(userData))
      toast.success('User type and course selected successfully!');
    }
  }, [user, course, userExaminer, dispatch, updateRoleDegree]);


  //return data value
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
                  <h2 className="fw-bold text-primary mb-2">Select What Type Of User</h2>
                </div>
               

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>
                    <FaBook className="me-2" style={{ color: '#667eea' }} />
                    Available Users
                  </Form.Label>
                  <Form.Select
                    value={user}
                    onChange={(e) => { setUser(e.target.value); setCourse(''); }}
                    className="form-control"
                    style={{
                      padding: '12px 15px',
                      fontSize: '1rem',
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }}
                    size="lg"
                  >
                    <option value="">-- Select a User --</option>
                    {validUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                 <Form.Group className="mb-4">
                  <Form.Label className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>
                    <FaGraduationCap className="me-2" style={{ color: '#667eea' }} />
                    Select Course
                  </Form.Label> 
                  <Form.Select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    disabled={!user}
                    className="form-control"
                    style={{
                      padding: '12px 15px',
                      fontSize: '1rem',
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }}
                    size="lg"
                  >
                    <option value="">-- Select a Degree --</option>
                    {filteredDegrees.length > 0 ? (
                      filteredDegrees
                        .filter(degree => (user === '1' || user === '2') ? degree.Flg === 'Y' : true)
                        .map((degree) => (
                        <option key={degree.id} value={degree.D_Code}>
                          {degree.Degree_Name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No degrees available</option>
                    )}
                  </Form.Select>
                </Form.Group>
                <div className="text-center">
                  <Button
                    onClick={handleUserSelect}
                    disabled={!user || !course}
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

export default CommonDashboar
