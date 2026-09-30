import React from 'react';
import { Container, Card, Row, Col, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { FaUser, FaEnvelope, FaIdBadge, FaBuilding, FaUserTag, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import userDetails from '../Dashboard/Common/userDetails.json';

const Profile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  // Get role name from userDetails mapping
  const roleName = userDetails.users.find(u => String(u.id) === String(userInfo?.selected_role))?.name || 
                   userInfo?.role_name || 
                   (userInfo?.selected_role !== undefined ? `Role ${userInfo.selected_role}` : 'Guest');

  const InfoRow = ({ icon, label, value }) => (
    <Row className="mb-3 align-items-center">
      <Col xs={12} md={4} className="d-flex align-items-center gap-2">
        <span style={{ color: '#4a5568', fontSize: '18px' }}>{icon}</span>
        <strong style={{ color: '#2d3748', fontSize: '14px' }}>{label}</strong>
      </Col>
      <Col xs={12} md={8}>
        <span style={{ color: '#4a5568', fontSize: '14px' }}>{value || '-'}</span>
      </Col>
    </Row>
  );

  return (
    <Container fluid className="py-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <Row className="justify-content-center">
        <Col xs={12} lg={8} xl={6}>
          <Card style={{ 
            borderRadius: '16px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Header Section */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '40px 30px',
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* Avatar */}
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: '#fff',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: '700',
                color: '#667eea',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                letterSpacing: '1px'
              }}>
                {(userInfo?.User_Name || userInfo?.name || userInfo?.user_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              
              {/* Name */}
              <h2 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0', 
                fontSize: '28px', 
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {userInfo?.User_Name || userInfo?.name || userInfo?.user_name || 'User'}
              </h2>
              
              {/* Role Badge */}
              <Badge 
                bg="light" 
                text="dark"
                style={{ 
                  fontSize: '13px', 
                  padding: '8px 20px', 
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <FaUserTag style={{ marginRight: '6px' }} />
                {roleName}
              </Badge>
            </div>

            {/* Body Section */}
            <Card.Body style={{ padding: '35px 30px' }}>
              <h5 style={{ 
                color: '#2d3748', 
                marginBottom: '25px', 
                fontSize: '18px', 
                fontWeight: '700',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '12px'
              }}>
                Profile Information
              </h5>

              <InfoRow 
                icon={<FaUser />} 
                label="Username" 
                value={userInfo?.User_Name || userInfo?.user_name || userInfo?.username} 
              />

              <InfoRow 
                icon={<FaIdBadge />} 
                label="User ID" 
                value={userInfo?.User_Id || userInfo?.id || userInfo?.user_id} 
              />

              <InfoRow 
                icon={<FaEnvelope />} 
                label="Email" 
                value={userInfo?.Email_Id || userInfo?.email} 
              />

              {userInfo?.D_Code && (
                <InfoRow 
                  icon={<FaMapMarkerAlt />} 
                  label="District Code" 
                  value={userInfo.D_Code} 
                />
              )}

              {userInfo?.Block && (
                <InfoRow 
                  icon={<FaBuilding />} 
                  label="Block" 
                  value={userInfo.Block} 
                />
              )}

              <InfoRow 
                icon={<FaUserTag />} 
                label="Role" 
                value={roleName} 
              />
            </Card.Body>

            {/* Footer */}
            <div style={{ 
              background: '#f7fafc', 
              padding: '20px 30px', 
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <small style={{ color: '#718096', fontSize: '12px' }}>
                Last updated: {new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </small>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
