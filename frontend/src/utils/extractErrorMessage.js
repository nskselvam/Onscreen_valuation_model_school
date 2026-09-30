// Parses the JSON error body out of an axios error whose responseType was 'blob'.
export const extractErrorMessage = async (err) => {
  const blobData = err?.response?.data
  if (blobData instanceof Blob && blobData.type === 'application/json') {
    try {
      const text = await blobData.text()
      const parsed = JSON.parse(text)
      return parsed.message || err.message
    } catch {
      return err.message
    }
  }
  return err?.response?.data?.message || err.message
}
