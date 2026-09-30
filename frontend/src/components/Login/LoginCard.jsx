import React, { useState, useEffect, useRef } from 'react'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { FaArrowRight } from 'react-icons/fa'
import { IoReloadOutline } from 'react-icons/io5'
import PasswordInput from './PasswordInput'

const LoginCard = ({ onSubmit, isLoading, error, isLocked = false }) => {

  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [userInput, setUserInput] = useState('')
  const [captcha, setCaptcha] = useState(() => createCaptcha())
  const [localError, setLocalError] = useState('')
  const canvasRef = useRef(null);

  function createCaptcha() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
    let captchaCode = "";
    for (let i = 0; i < 6; i++) {
      captchaCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return captchaCode;
  }

  const refreshCaptcha = () => {
    setUserInput('')
    setCaptcha(createCaptcha())
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captcha) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 170;
    canvas.height = 37;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#eeeedd");
    gradient.addColorStop(0.5, "#eeeedd");
    gradient.addColorStop(1, "#eeeedd");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#333";
    ctx.textBaseline = "middle";

    for (let i = 0; i < captcha.length; i++) {
      const x = 30 + i * 25;
      const y = 25 + Math.sin(i * 1.5) * 5;
      const angle = Math.random() * 0.3 - 0.15;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = `hsl(${Math.random() * 360},100%, 30%)`;
      ctx.fillText(captcha[i], -20, -5);
      ctx.restore();
    }

    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random()})`;
      ctx.lineWidth = Math.random() * 2;
      ctx.stroke();
    }
  }, [captcha]);

  return (
    <Card className="login-card">
      {/* Header Section */}
      <div className="login-header">
        <h2 className="header-title">LOGIN</h2>
      </div>

      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {localError && <Alert variant="danger">{localError}</Alert>}
        {isLocked && <Alert variant="warning">Account temporarily locked. Please wait before retrying.</Alert>}

        <Form onSubmit={(e) => {
          e.preventDefault();
          setLocalError('');
          
          const trimmedUserId = userId.trim();
          if (!trimmedUserId || !password) {
            setLocalError('Please enter User ID and password');
            return;
          }
          
          if (!userInput) {
            setLocalError('Please enter the captcha code');
            return;
          }
          
          if (userInput.trim().length !== 6) {
            setLocalError('Captcha must be 6 characters long');
            return;
          }
          
          if (userInput.trim().toUpperCase() !== captcha) {
            setLocalError('Captcha does not match. Please try again.');
            setUserInput('');
            setCaptcha(createCaptcha())
            return;
          }
          
          onSubmit({ email: trimmedUserId, password });
        }}>
          {/* Email Field */}
          <Form.Group className="form-group-custom">
            <Form.Label className="label-with-icon">
              User ID
            </Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Enter your User ID" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              autoComplete="username"
              maxLength={200}
              disabled={isLocked}
            />
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="form-group-custom">
            <Form.Label className="label-with-icon">
              Password
            </Form.Label>
            <PasswordInput value={password} onChange={setPassword} />
          </Form.Group>

          {/* Captcha Section */}
          <Form.Group className="form-group-custom">
            <Form.Label className="label-with-icon">
              Security Verification
            </Form.Label>
            
            <div className="captcha-wrapper">
              <div className="captcha-input-section">
                <Form.Control
                  type="text"
                  placeholder="Enter captcha code"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                  className="captcha-input"
                />
              </div>
              
              <div className="captcha-canvas-section">
                <canvas
                  ref={canvasRef}
                  className="captcha-canvas"
                ></canvas>
              </div>
              
              <Button
                variant="outline-primary"
                className="captcha-refresh-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); refreshCaptcha(); }}
                title="Refresh captcha"
                type="button"
              >
                <IoReloadOutline />
              </Button>
            </div>
          </Form.Group>

          {/* Login Button */}
          <Button type="submit" className="login-btn" disabled={isLoading || isLocked} aria-busy={isLoading}>
            <span>{isLoading ? 'Signing in…' : 'Login'}</span>
            {!isLoading && <FaArrowRight className="login-btn-icon" />}
          </Button>

          {/* Forgot Password */}
          {/* <div className="forgot-password-section">
            <a href="/forgot" className="forgot-link">
              <FaLock /> Forgot Password?
            </a>
          </div> */}
        </Form>
      </Card.Body>
    </Card>
  )
}

export default LoginCard
