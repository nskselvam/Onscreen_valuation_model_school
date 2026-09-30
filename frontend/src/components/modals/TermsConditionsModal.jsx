import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { useAcceptTermsMutation } from '../../redux-slice/authApiSlice'
import { updateTerms } from '../../redux-slice/authSlice'
import { toast } from 'react-toastify'

const TermsConditionsModal = ({ show, onHide }) => {
  const dispatch = useDispatch()
  const userInfo = useSelector((state) => state.auth.userInfo)
  const [accepted, setAccepted] = useState(false)
  const [acceptTermsMutation, { isLoading }] = useAcceptTermsMutation()

  const handleAccept = async () => {
    if (!accepted) {
      toast.warning('Please check the box to accept the terms and conditions.')
      return
    }
    try {
      await acceptTermsMutation({ id: userInfo?.id }).unwrap()
      dispatch(updateTerms('accepted'))
      toast.success('Terms and conditions accepted successfully.')
      onHide()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to accept terms. Please try again.')
    }
  }

  return (
    <Modal show={show} onHide={() => {}} backdrop="static" keyboard={false} centered size="lg">
      <Modal.Header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Modal.Title className="fw-bold">📋 Terms & Conditions</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '450px', overflowY: 'auto', padding: '24px' }}>
        <p className="text-danger fw-bold text-center fs-5 mb-3">SPECIAL INSTRUCTIONS TO THE EVALUATORS</p>

        <p className="text-muted mb-3">
          Please read the following instructions carefully before proceeding with the evaluation process.
        </p>

        <ol className="lh-lg">
          <li>To login – use your ID, and the OTP that was sent to your Registered Mobile number.</li>
          <li>You will be requested to Reset the Password on first login.</li>
          <li>The Password should be 8 digits, Alpha-Numerical along with at least one special character. <strong>(For Example: Exam@123)</strong>.</li>
          <li>While entering Marks – Enter <strong>'0'</strong> for wrong answers and Enter <strong>'NA'</strong> if Not Answered.</li>
          <li>Award Marks for all attended questions irrespective of choices; this will be handled by the system.</li>
          <li>The <strong>'Save'</strong> button will be enabled only after you have checked the last page of the answer booklet.</li>
          <li>Maintain Silence in the evaluation hall.</li>
          <li>Logout properly before you leave or if keeping the system idle.</li>
          <li>Do not use Mobile Phones in the evaluation hall.</li>
          <li>The evaluator is solely responsible for the marks entered. Ensure accuracy before saving.</li>
          <li>Do not share your login credentials with anyone.</li>
          <li>Any malpractice or misconduct will result in immediate termination of evaluation access.</li>
        </ol>

        <div className="alert alert-warning mt-3">
          <strong>Note:</strong> By accepting these terms, you agree to comply with all the above instructions throughout the evaluation process.
        </div>

        <Form.Check
          type="checkbox"
          id="accept-terms-checkbox"
          label="I have read and agree to the Terms & Conditions and Special Instructions."
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-3 fw-semibold"
        />
      </Modal.Body>

      <Modal.Footer style={{ justifyContent: 'center' }}>
        <Button
          onClick={handleAccept}
          disabled={isLoading || !accepted}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            padding: '10px 40px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          {isLoading ? 'Processing...' : '✅ Accept & Continue'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default TermsConditionsModal
