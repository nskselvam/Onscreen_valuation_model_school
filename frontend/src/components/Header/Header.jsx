import React from 'react'
import {Row,Col,Card }  from 'react-bootstrap'


const Header = ({ MainTopic, SubTopic }) => {
    return (
        <Row className="mb-4" style={{ marginTop: '0px' }}>
            <Col xs={12}>
                <Card className="border-0" style={{
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 40%, #667eea 70%, #764ba2 100%)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(30, 60, 114, 0.25)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* Decorative elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                        borderRadius: '50%'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-30%',
                        left: '20%',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                        borderRadius: '50%'
                    }}></div>
                    
                    <Card.Body className="py-4 px-4" style={{ position: 'relative', zIndex: 1 }}>
                        <Row className="align-items-center">
                            <Col xs={12}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        width: '4px',
                                        height: '48px',
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%)',
                                        borderRadius: '2px'
                                    }}></div>
                                    <div>
                                        <h2 className="mb-0 text-white fw-bold text-start" style={{
                                            fontSize: '1.75rem',
                                            letterSpacing: '0.5px',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {MainTopic}
                                        </h2>
                                        <div className="mb-0 mt-1 text-start" style={{
                                            color: 'rgba(255, 255, 255, 0.75)',
                                            fontSize: '0.95rem',
                                            fontWeight: '400',
                                            letterSpacing: '0.3px'
                                        }}>
                                            {SubTopic}
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
}

export default Header
