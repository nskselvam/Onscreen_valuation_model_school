import React from 'react'
import UploadPageLayout from '../../../components/DashboardComponents/UploadPageLayout'
import { useSelector } from 'react-redux'
import { useGetSubjectCodeQuery } from '../../../redux-slice/auditingOperationSlice'
import AuditingSubjectCard from '../../../components/AuditingDashboard/AuditingSubjectCard'
import BarcodeModal from '../../../components/AuditingDashboard/BarcodeModal'
import { normalizeSubject } from '../../../components/AuditingDashboard/utils'
import '../../../style/auditingDashboard.css'

const AuditingDashboard = () => {
  const userInfo = useSelector((state) => state.auth.userInfo)
  const [selectedSubject, setSelectedSubject] = React.useState(null)

  const { data: subjectCodeData, error: subjectCodeError, isLoading: subjectCodeLoading } = useGetSubjectCodeQuery(userInfo?.username, {
    skip: !userInfo?.username, // Skip the query if userInfo.id is not available
  })

  console.log('AuditingDashboard - subjectCodeData:', subjectCodeData)

  const subjectList = React.useMemo(() => {
    const source = Array.isArray(subjectCodeData)
      ? subjectCodeData
      : Array.isArray(subjectCodeData?.data)
        ? subjectCodeData.data
        : []

    const normalized = source
      .map(normalizeSubject)
      .filter((item) => item && item.subcode)

    return normalized
  }, [subjectCodeData])

  const handleOpenBarcodeModal = React.useCallback((subject) => {
    setSelectedSubject(subject)
  }, [])

  const handleCloseBarcodeModal = React.useCallback(() => {
    setSelectedSubject(null)
  }, [])

  return (
    <UploadPageLayout
      mainTopic="Auditing Dashboard"
    >
      {subjectCodeLoading ? (
        <div className="auditing-dashboard-state">Loading subjects...</div>
      ) : subjectCodeError ? (
        <div className="auditing-dashboard-state auditing-dashboard-error">
          Failed to load subject list.
        </div>
      ) : null}

      <div className="auditing-dashboard-cards-grid">
        {subjectList.map((item, index) => (
          <AuditingSubjectCard
            key={`${item.subcode}-${index}`}
            item={item}
            index={index}
            onClick={handleOpenBarcodeModal}
          />
        ))}
      </div>

      {!subjectCodeLoading && !subjectCodeError && subjectList.length === 0 ? (
        <div className="auditing-dashboard-state">No subjects found.</div>
      ) : null}

      <BarcodeModal
        selectedSubject={selectedSubject}
        onClose={handleCloseBarcodeModal}
      />
    </UploadPageLayout>
  )
}

export default AuditingDashboard