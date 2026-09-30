import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ResetCard from '../../components/ResetComponents/ResetCard'
import '../../style/login.css'
import { useResetPasswordMutation } from "../../redux-slice/authApiSlice"
import { toast } from 'react-toastify'


const ResetPassword = () => {

    const navigate = useNavigate()
    const { userInfo } = useSelector((state) => state.auth)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [resetPasswordMutation, { isLoading: isResetting }] = useResetPasswordMutation()

    const onSubmit = async ({ tempPassword, newPassword, confirmPassword }) => {
        setError(null)
        setIsLoading(true)
        
        try {
            const userId = userInfo?.User_Id
            if (!userId) {
                throw new Error("Session expired. Please log in again.");
            }
            const response = await resetPasswordMutation({
                user_id: userId,
                password: newPassword,
                confirmPassword,
            }).unwrap();

            toast.success(response.Message || response.message || "Password reset successful");
            navigate('/');
        } catch (err) {
            const errorMessage = err?.data?.message || err?.message || err.error || "Failed to reset password";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="reset-card-wrapper" style={{ width: '100%', maxWidth: '520px' }}>
                <ResetCard onSubmit={onSubmit} isLoading={isLoading} error={error} />
            </div>
        </div>
    )
}

export default ResetPassword
