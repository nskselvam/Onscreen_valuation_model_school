import React from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Protected = () => {
  const { userInfo } = useSelector((state) => state.auth)
  const location = useLocation()

  if (!userInfo) return <Navigate to='/' replace />

  // First-time login with temporary password (ResetPass = 0)
  if (userInfo.ResetPass == 0) {
    if (location.pathname === '/temporary-password') return <Outlet />
    return <Navigate to='/temporary-password' replace />
  }

  // Regular password reset required (user_status = 0)
  if (userInfo.user_status === 0) {
    if (location.pathname === '/reset-password') return <Outlet />
    return <Navigate to='/reset-password' replace />
  }

  return <Outlet />
}
export default Protected