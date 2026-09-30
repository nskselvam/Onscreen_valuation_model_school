import React, { useState, useMemo } from 'react'
import { InputGroup, Button, Form } from 'react-bootstrap'
import { FaEye,FaEyeSlash } from "react-icons/fa"

const scorePassword = (pw) => {
  if (!pw) return { score: 0, label: 'Very weak' }
  let score = 0
  if (pw.length > 7) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Very weak', 'Weak', 'Okay', 'Strong', 'Very strong']
  return { score, label: labels[Math.min(score, labels.length - 1)] }
}

const PasswordInput = ({ value, onChange, placeholder = 'Password', name = 'password' }) => {
  // hidden=true → field is masked (type="password"); hidden=false → field is readable
  const [hidden, setHidden] = useState(true)
  const { score, label } = useMemo(() => scorePassword(value), [value])

  return (
    <div className="password-input">
      <InputGroup>
        <Form.Control
          name={name}
          type={hidden ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={placeholder}
          autoComplete="current-password"
          maxLength={200}
        />
        <Button
          variant="outline-secondary"
          onClick={() => setHidden((h) => !h)}
          aria-label={hidden ? 'Show password' : 'Hide password'}
          type="button"
        >
          {hidden ? <FaEye /> : <FaEyeSlash />}
        </Button>
      </InputGroup>

    
    </div>
  )
}

export default PasswordInput
