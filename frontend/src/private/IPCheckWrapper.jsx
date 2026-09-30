import React, { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import IPRestrictedPage from '../pages/IPRestricted/IPRestrictedPage'
import { useGetServerTimeQuery } from '../redux-slice/generalApiSlice'
import { setServerData, setSubdomain } from '../redux-slice/authSlice'

const IPCheckWrapper = () => {
  const dispatch = useDispatch()
  const [clientIP, setClientIP] = useState(null)
  const [isIPForbidden, setIsIPForbidden] = useState(null)
  const hasChecked = useRef(false)

  const { data: serverData, isLoading: isQueryLoading, error: navbarError } = useGetServerTimeQuery()

 // console.log("IP Check - Server Response: ", serverData, "Error: ", navbarError)


  // Only run once when query completes
  useEffect(() => {
    if (isQueryLoading || hasChecked.current) return

    hasChecked.current = true

    // Store serverData in Redux if available
    if (serverData) {
      dispatch(setServerData(serverData))
      
      // Extract and store subdomain
      const hostname = serverData.hostName || window.location.hostname
      const subdomain = hostname.split('.')[0]
      dispatch(setSubdomain(subdomain))
    }

    // Check for 403 Forbidden status
    if (navbarError && navbarError.status === 403) {
      setIsIPForbidden(true)
      if (navbarError.data?.valid_ip) {
        setClientIP(navbarError.data.valid_ip)
      }
    } 
    // Check for ipvalid: false in response
    else if (serverData && serverData.ipvalid === false) {
      setIsIPForbidden(true)
      if (serverData.valid_ip) {
        setClientIP(serverData.valid_ip)
      }
    } 
    // IP is authorized
    else if (serverData) {
      setIsIPForbidden(false)
    }
  }, [isQueryLoading, navbarError, serverData, dispatch])

  // Show IP restricted page if access is forbidden
  if (isIPForbidden === true) {
    return <IPRestrictedPage clientIP={clientIP} />
  }

  // Block everything until check is complete
  if (isIPForbidden === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#667eea',
        margin: 0,
        padding: 0
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: '18px', margin: 0, fontWeight: '500' }}>Verifying Access...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // If authorized (isIPForbidden === false), render all nested routes
  return <Outlet />
}

export default IPCheckWrapper
