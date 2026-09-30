import React from 'react'
import { Card } from 'react-bootstrap'
import { FaLock, FaExclamationTriangle, FaEnvelope, FaPhone, FaShieldAlt, FaNetworkWired, FaHeadset } from 'react-icons/fa'
import navbarImage from '../../assets/SVN.png'
import navbarData from '../../hooks/navbar/navbar.json'
import '../../style/login.css'

const IPRestrictedPage = ({ clientIP }) => {
  return (
    <div className="login-container">
      <Card className="login-card" style={{
        minHeight: '528px', maxHeight: '650px', maxWidth: '620px', width: '90%',
        display: 'flex', flexDirection: 'column',
        borderRadius: '28px', overflow: 'hidden', border: 'none',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)',
        background: '#3a5490',
      }}>

        {/* Shimmer top bar */}
        <div style={{
          height: '6px', flexShrink: 0,
          background: 'linear-gradient(90deg, #c0392b, #e74c3c, #f39c12, #e74c3c, #c0392b)',
          backgroundSize: '300% 100%',
          animation: 'ipShimmer 3s linear infinite',
        }} />

        {/* Hero Header */}
        <div style={{
          background: 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '28px 32px 22px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Decorative rings */}
          <div style={{
            position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)',
            width: '120px', height: '120px', borderRadius: '50%',
            border: '1px solid rgba(231,76,60,0.15)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
            width: '140px', height: '140px', borderRadius: '50%',
            border: '1px solid rgba(231,76,60,0.08)',
            pointerEvents: 'none',
          }} />

          {/* Lock icon */}
          <div style={{
            width: '84px', height: '84px', borderRadius: '50%',
            background: 'linear-gradient(145deg, rgba(231,76,60,0.35), rgba(192,57,43,0.25))',
            border: '2px solid rgba(231,76,60,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 0 8px rgba(231,76,60,0.08), 0 8px 28px rgba(231,76,60,0.35)',
            animation: 'ipPulse 2.5s ease-in-out infinite',
            position: 'relative', zIndex: 1,
          }}>
            <FaLock size={36} style={{ color: '#ff6b6b', filter: 'drop-shadow(0 2px 6px rgba(231,76,60,0.6))' }} />
          </div>

          <h2 style={{
            color: '#fff', fontSize: '22px', fontWeight: '800',
            marginBottom: '5px', letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <FaExclamationTriangle size={18} style={{ color: '#f39c12', filter: 'drop-shadow(0 1px 4px rgba(243,156,18,0.6))' }} />
            Access Restricted
          </h2>
          <p style={{
            fontSize: '12px', margin: 0,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.8px', textTransform: 'uppercase',
          }}>
            {navbarData.Name || 'Onscreen Valuation System'}
          </p>
        </div>

        <Card.Body style={{ padding: '22px 28px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Info message */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '14px',
            padding: '13px 16px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(243,156,18,0.35), rgba(243,156,18,0.15))',
              border: '1px solid rgba(243,156,18,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaShieldAlt size={14} style={{ color: '#f39c12' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '13px', margin: 0, lineHeight: '1.65' }}>
              Your IP address is <strong style={{ color: '#fff', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>not authorized</strong> to access this system. Only <strong style={{ color: '#fff' }}>whitelisted networks</strong> are permitted.
            </p>
          </div>

          {/* IP Address */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(231,76,60,0.35), rgba(192,57,43,0.22))',
            border: '2px solid rgba(231,76,60,0.7)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: '16px',
            boxShadow: '0 4px 20px rgba(231,76,60,0.25)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(231,76,60,0.6), rgba(192,57,43,0.4))',
              border: '1px solid rgba(231,76,60,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(231,76,60,0.4)',
            }}>
              <FaNetworkWired size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
                Your IP Address
              </p>
              <p style={{ color: '#fff', fontSize: '22px', fontWeight: '900', margin: 0, fontFamily: '"Courier New", monospace', letterSpacing: '2px', textShadow: '0 2px 10px rgba(231,76,60,0.6)' }}>
                {clientIP || 'Unable to detect'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '1px' }}>NEED HELP?</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* CTA */}
          <p style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.72)', textAlign: 'center',
            margin: 0, lineHeight: '1.55',
          }}>
            Contact <strong style={{
              color: '#ffd166',
              background: 'rgba(255,209,102,0.12)',
              padding: '1px 7px', borderRadius: '6px',
              border: '1px solid rgba(255,209,102,0.25)',
            }}>COE Staff</strong> to whitelist your IP address.
          </p>

          {/* Contact cards */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '14px', padding: '13px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(0,153,204,0.35), rgba(0,102,179,0.2))',
                border: '1px solid rgba(0,173,239,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0,153,204,0.2)',
              }}>
                <FaEnvelope size={13} style={{ color: '#00adef' }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Email</p>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '12px', margin: 0, fontWeight: '600' }}>coe@institution.edu</p>
              </div>
            </div>

            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '14px', padding: '13px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(39,174,96,0.35), rgba(27,144,75,0.2))',
                border: '1px solid rgba(39,174,96,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(39,174,96,0.2)',
              }}>
                <FaPhone size={13} style={{ color: '#2ecc71' }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Phone</p>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '12px', margin: 0, fontWeight: '600' }}>+91-XXXX-XXXX-XXX</p>
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div style={{ textAlign: 'center', paddingTop: '2px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '4px 14px',
              color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.8px',
            }}>
              🔒 Secured Access Control System
            </span>
          </div>
        </Card.Body>
      </Card>

      <style>{`
        @keyframes ipShimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 300% 0; }
        }
        @keyframes ipPulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(231,76,60,0.08), 0 8px 28px rgba(231,76,60,0.35); }
          50% { box-shadow: 0 0 0 14px rgba(231,76,60,0.12), 0 8px 40px rgba(231,76,60,0.55); }
        }
      `}</style>
    </div>
  )
}

export default IPRestrictedPage

