import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ResetCard from '../../components/ResetComponents/ResetCard'
import '../../style/login.css'
import { useResetPasswordMutation } from '../../redux-slice/authApiSlice'
import { toast } from 'react-toastify'

const Resetpassword = () => {

    const navigate = useNavigate()
    const { userInfo } = useSelector((state) => state.auth)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [resetPasswordMutation] = useResetPasswordMutation()

    

    const onSubmit = async ({ tempPassword, newPassword, confirmPassword }) => {
        setError(null)
        setIsLoading(true)

        try {
            const username = userInfo?.username
            const response = await resetPasswordMutation({
                email: username,
                oldPassword: tempPassword,
                password: newPassword,
                confirmPassword,
                passwordStatus: "1"
            }).unwrap()

            toast.success(response.Message || 'Password reset successful')
            navigate('/')
        } catch (err) {
            const errorMessage = err?.data?.message || err.error || 'Failed to reset password'
            setError(errorMessage)
            toast.error(errorMessage)
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

export default Resetpassword
