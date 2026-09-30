const getCardGradient = (index) => {
  const safeIndex = Number.isFinite(index) ? index : 0
  const hue = (safeIndex * 41) % 360
  const hue2 = (hue + 18) % 360
  const hue3 = (hue + 34) % 360

  // Keep colors varied for large card counts, but use a deeper/muted range.
  return `linear-gradient(135deg, hsl(${hue} 48% 26%) 0%, hsl(${hue2} 52% 32%) 45%, hsl(${hue3} 56% 38%) 100%)`
}

const AuditingSubjectCard = ({ item, index, onClick }) => {
  const cardGradient = getCardGradient(index)
  const barcodeCount = Array.isArray(item.import1Data) && item.import1Data.length > 0
    ? item.import1Data.length
    : Array.isArray(item.barcode)
      ? item.barcode.length
      : 0

  return (
    <article
      className="auditing-subject-card"
      style={{ background: cardGradient }}
      onClick={() => onClick(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(item)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="auditing-subject-code">{item.subcode || 'N/A'}</div>
      <h3 className="auditing-subject-name">{item.subname || 'Subject name not available'}</h3>
      <div className="auditing-subject-eva">
        <span className="auditing-subject-eva-label">Evaluation:</span>
        <span className="auditing-subject-eva-value">{item.subEva || '-'}</span>
      </div>
      <div className="auditing-subject-barcode">
        <span className="auditing-subject-barcode-label">Barcode Count:</span>
        <span className="auditing-subject-barcode-value">{barcodeCount}</span>
      </div>
    </article>
  )
}

export default AuditingSubjectCard
