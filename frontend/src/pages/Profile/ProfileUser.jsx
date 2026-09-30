import React from 'react'
import { Row, Col, Card, Badge } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout'

const Section = ({ title, icon, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      borderBottom: '2px solid #667eea', paddingBottom: '8px', marginBottom: '14px'
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '15px', color: '#2d3748' }}>{title}</span>
    </div>
    <Row className="g-3">{children}</Row>
  </div>
)

const Field = ({ label, value, badge, badgeColor }) => (
  <Col md={6} lg={4}>
    <div style={{
      background: '#f8f9ff', borderRadius: '8px', padding: '12px 14px',
      border: '1px solid #e2e8f0', height: '100%'
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        {label}
      </div>
      {badge ? (
        <Badge bg={badgeColor || 'primary'} style={{ fontSize: '12px', fontWeight: 600 }}>
          {value || '—'}
        </Badge>
      ) : (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2d3748', wordBreak: 'break-word' }}>
          {value || <span style={{ color: '#a0aec0', fontWeight: 400 }}>—</span>}
        </div>
      )}
    </div>
  </Col>
)

const ProfileUser = () => {
  const userInfo = useSelector((state) => state.auth.userInfo)

  if (!userInfo) {
    return (
      <UploadPageLayout mainTopic="Profile" subTopic="Your account details" cardTitle="User Profile">
        <div className="text-center py-5" style={{ color: '#718096' }}>No user data found.</div>
      </UploadPageLayout>
    )
  }

  const deptNames = [
    userInfo.Dep_Name_1, userInfo.Dep_Name_2, userInfo.Dep_Name_3,
    userInfo.Dep_Name_4, userInfo.Dep_Name_5, userInfo.Dep_Name_6,
    userInfo.Dep_Name_7, userInfo.Dep_Name_8, userInfo.Dep_Name_9,
    userInfo.Dep_Name_0,
  ].filter(Boolean)

  return (
    <UploadPageLayout
      mainTopic="Account"
      subTopic="View your profile and assignment details"
      cardTitle="User Profile"
    >
      {/* Avatar Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '18px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px', padding: '20px 24px', marginBottom: '28px', color: '#fff'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 700, flexShrink: 0
        }}>
          {(userInfo.name || userInfo.username || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{userInfo.name || '—'}</div>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>ID: {userInfo.username} &nbsp;|&nbsp; {userInfo.department}</div>
          <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>Role: {userInfo.role}</Badge>
            <Badge bg="warning" text="dark" style={{ fontSize: '11px' }}>Month/Year: {userInfo.eva_month_year}</Badge>
            {userInfo.selected_role && <Badge bg="info" text="dark" style={{ fontSize: '11px' }}>Active: {userInfo.selected_role}</Badge>}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Section title="Basic Information" icon="👤">
        <Field label="Evaluator ID" value={userInfo.username} />
        <Field label="Full Name" value={userInfo.name} />
        <Field label="Department" value={userInfo.department} />
        <Field label="Role" value={userInfo.role} badge badgeColor="primary" />
        <Field label="Mobile Number" value={userInfo.Mobile_Number} />
        <Field label="Email ID" value={userInfo.Email_Id} />
        <Field label="Month / Year" value={userInfo.eva_month_year} />
        <Field label="Terms Accepted" value={userInfo.terms === 1 || userInfo.terms === true ? 'Yes' : 'No'} badge badgeColor={userInfo.terms ? 'success' : 'danger'} />
      </Section>

      {/* Examiner Assignment */}
      <Section title="Examiner Assignment" icon="📋">
        <Field label="Subject Code" value={userInfo.subcode} />
        <Field label="Eva Subject" value={userInfo.Eva_Subject} />
        <Field label="Max Papers (Subject)" value={userInfo.Max_Papers_subject} />
        <Field label="Sub Max Papers" value={userInfo.Sub_Max_Papers} />
        <Field label="Camp ID" value={userInfo.Camp_id} />
        <Field label="Camp Officer ID" value={userInfo.camp_offcer_id_examiner} />
        <Field label="Valuation Status" value={userInfo.Examiner_Valuation_Status} badge
          badgeColor={userInfo.Examiner_Valuation_Status === 'Active' ? 'success' : 'secondary'} />
      </Section>

      {/* Chief Examiner Assignment */}
      <Section title="Chief Examiner Assignment" icon="🏛️">
        <Field label="Chief Examiner" value={userInfo.chief_examiner} />
        <Field label="Chief Subject Code" value={userInfo.Chief_subcode} />
        <Field label="Chief Eva Subjects" value={userInfo.Chief_Eva_Subjects} />
        <Field label="Chief Camp ID" value={userInfo.Camp_id_chief} />
        <Field label="Chief Camp Officer ID" value={userInfo.camp_offcer_id_chief} />
        <Field label="Chief Valuation Status" value={userInfo.Chief_Valuation_Status} badge
          badgeColor={userInfo.Chief_Valuation_Status === 'Active' ? 'success' : 'secondary'} />
      </Section>

      {/* Department Names */}
      {deptNames.length > 0 && (
        <Section title="Assigned Departments" icon="🏫">
          {[
            userInfo.Dep_Name_0, userInfo.Dep_Name_1, userInfo.Dep_Name_2,
            userInfo.Dep_Name_3, userInfo.Dep_Name_4, userInfo.Dep_Name_5,
            userInfo.Dep_Name_6, userInfo.Dep_Name_7, userInfo.Dep_Name_8,
            userInfo.Dep_Name_9,
          ].map((dep, i) =>
            dep ? <Field key={i} label={`Dept ${i}`} value={dep} /> : null
          )}
        </Section>
      )}

    </UploadPageLayout>
  )
}

export default ProfileUser
