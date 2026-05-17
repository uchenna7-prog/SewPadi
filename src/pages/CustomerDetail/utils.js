export function formatLastOrderDate(dateStr) {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    if (isNaN(date)) return dateStr
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } 
  catch {
    return dateStr
  }
}

export function getBirthday(birthday) {
  if (!birthday) return null
  const date = new Date(birthday)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
