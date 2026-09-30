import React, { useState, useEffect } from 'react'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { FaShieldAlt, FaKey, FaLock, FaCheck, FaTimes } from 'react-icons/fa'
import PasswordInput from '../Login/PasswordInput'
import navbarData from '../../hooks/navbar/navbar.json'
import srmImage from '../../assets/srm.jpg'
import thiaImage from '../../assets/thia.png'
import tcartsImage from '../../assets/tcarts.jpg'
import navbarImage from '../../assets/SVN.png'
import '../../style/login.css'

const { VITE_Institution_Name, VITE_Institution_No } = import.meta.env;

const institutionImages = {
  '../../assets/srm.jpg': srmImage,
  '../../assets/thia.png': thiaImage,
  '../../assets/tcarts.jpg': tcartsImage
}

const TemporaryPasswordCard = ({ onSubmit, isLoading, error: externalError }) => {

    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Password validation state
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    const Institution_Details = navbarData.find(n => String(n._id) === String(VITE_Institution_No)) || {}
    
    const resolveImageSrc = (image) => {
        if (!image) return navbarImage
        if (institutionImages[image]) return institutionImages[image]
        if (/^(https?:)|^(data:)|^\//.test(image)) return image
        return navbarImage
    }

    // Check password requirements in real-time
    useEffect(() => {
        const validation = {
            minLength: newPassword.length >= 8,
            hasUpperCase: /[A-Z]/.test(newPassword),
            hasLowerCase: /[a-z]/.test(newPassword),
            hasNumber: /[0-9]/.test(newPassword),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
        };
        setPasswordValidation(validation);
    }, [newPassword]);

    const isPasswordValid = Object.values(passwordValidation).every(val => val === true);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!tempPassword) {
            setError('Please enter your Temporary Password provided to you.');
            return;
        }

        if (!newPassword) {
            setError('Please enter a new password.');
            return;
        }

        if (!confirmPassword) {
            setError('Please confirm your new password.');
            return;
        }

        if (!isPasswordValid) {
            setError('Please ensure all password requirements are met.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        // Call the onSubmit function if provided
        if (onSubmit) {
            onSubmit({ tempPassword, newPassword, confirmPassword });
        } else {
            setSuccess('Password has been reset successfully.');
            setTempPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    }

    const RequirementItem = ({ met, text }) => (
        <li className={`requirement-item ${met ? 'met' : 'unmet'}`}>
            {met ? <FaCheck className="requirement-icon" /> : <FaTimes className="requirement-icon" />}
            <span>{text}</span>
        </li>
    );

    return (
        <Card className="login-card" style={{ borderRadius: '16px' }}>
            {/* Header Section */}
            <div className="login-header" style={{ padding: '24px 32px', minHeight: 'unset', gap: '6px' }}>
                <img src={resolveImageSrc(Institution_Details.Image)} alt="Logo" className="header-logo" style={{ width: '65px', height: '65px' }} />
                <h2 className="header-title" style={{ fontSize: '22px' }}>Reset Temporary Password</h2>
                <p className="header-subtitle" style={{ fontSize: '14px' }}>Create your secure password for first-time login</p>
            </div>

            <Card.Body style={{ padding: '24px 30px' }}>
                {externalError && <Alert variant="danger">{externalError}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {/* Information Alert */}
                <Alert variant="info" style={{ fontSize: '13px', marginBottom: '20px' }}>
                    <FaKey className="me-2" />
                    Please use the temporary password sent to your email to create a new secure password.
                </Alert>

                <Form onSubmit={handleSubmit}>
                    {/* Temporary Password Field */}
                    <Form.Group className="form-group-custom" style={{ marginBottom: '16px' }}>
                        <Form.Label className="label-with-icon" style={{ fontSize: '14px', marginBottom: '8px' }}>
                            <FaKey /> Temporary Password
                        </Form.Label>
                        <PasswordInput
                            value={tempPassword}
                            onChange={setTempPassword}
                            placeholder="Enter your temporary password"
                        />
                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>
                            Use the password received via email
                        </Form.Text>
                    </Form.Group>

                    {/* New Password Field */}
                    <Form.Group className="form-group-custom" style={{ marginBottom: '16px' }}>
                        <Form.Label className="label-with-icon" style={{ fontSize: '14px', marginBottom: '8px' }}>
                            <FaLock /> New Password
                        </Form.Label>
                        <PasswordInput
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="Enter your new secure password"
                        />
                        {newPassword && (
                            <div className="password-requirements-display">
                                <ul className="requirements-list-inline">
                                    <RequirementItem met={passwordValidation.minLength} text="At least 8 characters" />
                                    <RequirementItem met={passwordValidation.hasUpperCase && passwordValidation.hasLowerCase} text="Upper & lowercase" />
                                    <RequirementItem met={passwordValidation.hasNumber} text="Number (0-9)" />
                                    <RequirementItem met={passwordValidation.hasSpecialChar} text="Special character" />
                                </ul>
                            </div>
                        )}
                    </Form.Group>

                    {/* Confirm Password Field */}
                    <Form.Group className="form-group-custom" style={{ marginBottom: '16px' }}>
                        <Form.Label className="label-with-icon" style={{ fontSize: '14px', marginBottom: '8px' }}>
                            <FaShieldAlt /> Confirm Password
                        </Form.Label>
                        <PasswordInput
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm your new password"
                        />
                    </Form.Group>

                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        className="login-btn" 
                        disabled={isLoading || !isPasswordValid || !newPassword || !tempPassword} 
                        aria-busy={isLoading} 
                        style={{ height: '48px', marginTop: '10px', marginBottom: '10px', fontSize: '15px' }}
                    >
                        {isLoading ? 'Setting New Password…' : 'Set New Password →'}
                    </Button>

                    {/* Back to Login */}
                    <div className="forgot-password-section">
                        <a href="/login" className="forgot-link">
                            <FaLock /> Back to Login
                        </a>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    )
}

export default TemporaryPasswordCard
