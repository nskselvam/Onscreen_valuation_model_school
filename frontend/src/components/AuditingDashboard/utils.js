export const normalizeSubject = (item) => {
  if (!item || typeof item !== 'object') return null

  const import1Data = Array.isArray(item.import1Data)
    ? item.import1Data
    : Array.isArray(item.import1)
      ? item.import1
      : []

  const barcode = Array.isArray(item.barcode)
    ? item.barcode.map((entry) => (typeof entry === 'object' ? entry?.barcode : entry)).filter(Boolean)
    : item.barcode
      ? [item.barcode]
      : import1Data.map((entry) => entry?.barcode).filter(Boolean)

  return {
    subcode: item.subcode ?? item.sub_code ?? item.subject_code ?? '',
    subname: item.subname ?? item.sub_name ?? item.subject_name ?? '',
    subEva: item.subEva ?? item.sub_eva ?? item.eva_month_year ?? item.month_year ?? '',
    import1Data,
    barcode,
  }
}
