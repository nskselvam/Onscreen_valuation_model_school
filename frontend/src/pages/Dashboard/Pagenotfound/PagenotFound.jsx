import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Button } from 'react-bootstrap'
import { FaHome, FaExclamationTriangle } from 'react-icons/fa'
import '../../../style/PageNotFound.css'

const PagenotFound = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/common/dashboard')
  }

  return (
    <Container className="page-not-found-container">
      <div className="error-content">
        <div className="error-icon">
          <FaExclamationTriangle size={80} color="#dc3545" />
        </div>
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-message">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="error-actions">
          <Button 
            variant="primary" 
            onClick={handleGoHome}
            className="me-3"
          >
            <FaHome className="me-2" />
            Go to Dashboard / Login 
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={handleGoBack}
          >
            Go Back
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default PagenotFound
