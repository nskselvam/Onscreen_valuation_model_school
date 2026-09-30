import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Header from '../Header/Header';
import '../../style/uploadLayout.css';

/**
 * Reusable layout for upload pages.
 * Usage:
 * <UploadPageLayout mainTopic="..." subTopic="..." cardTitle="..." rightComponent={<SomeComponent />} bottomComponent={<SomeComponent />}>
 *   {yourCardContent}
 * </UploadPageLayout>
 */
const UploadPageLayout = ({
  mainTopic = '',
  subTopic = '',
  cardTitle = '',
  children,
  rightComponent = null,
  bottomComponent = null,
  cardHeaderButton = null,
}) => (

  <Container fluid className="p-3 p-md-4" style={{ 
    marginTop: '0px', 
    width: '100%', 
    maxWidth: '100%', 
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
    minHeight: 'calc(100vh - 70px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box'
  }}>
    <Header MainTopic={mainTopic} SubTopic={subTopic} />
    <Row className="g-3" style={{ margin: 0 }}>
      {rightComponent != null ? (
        <>
          <Col xs={12} xl={8}>
            <Card className="h-100" style={{ 
              border: 'none', 
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <Card.Header style={{
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 24px'
              }}>
                <h5 className="mb-0" style={{ fontWeight: '600', letterSpacing: '0.3px' }}>{cardTitle}</h5>
              </Card.Header>
              <Card.Body style={{ 
                padding: '1.5rem',
                overflow: 'hidden',
                background: '#ffffff'
              }}>
                {children}
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} xl={4}>
            {rightComponent}
          </Col>
        </>
      ) : (
        <Col xs={12} style={{ padding: '0 0.5rem' }}>
          <Card style={{ 
            border: 'none', 
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#ffffff'
          }}>
            {cardTitle && (
              <Card.Header style={{
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h5 className="mb-0" style={{ fontWeight: '600', letterSpacing: '0.3px' }}>{cardTitle}</h5>
                {cardHeaderButton && <div>{cardHeaderButton}</div>}
              </Card.Header>
            )}
            <Card.Body style={{ 
              padding: '1.25rem',
              overflowY: 'auto',
              overflowX: 'hidden',
              background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)'
            }}>
              {children}
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>
    {bottomComponent && (
      <Row className="g-3 mt-3" style={{ margin: 0 }}>
        <Col xs={12} style={{ padding: '0 0.5rem' }}>
          <Card className="h-100" style={{
            border: 'none',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            {bottomComponent}
          </Card>
        </Col>
      </Row>
    )}
  </Container>
);

export default UploadPageLayout;
