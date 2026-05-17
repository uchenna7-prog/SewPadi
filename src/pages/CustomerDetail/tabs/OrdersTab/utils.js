
export function formatFirestoreDate(timestamp) {

  if (!timestamp) return 'Unknown Date'
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    })
  }
  if (typeof timestamp === 'string') return timestamp
  return 'Unknown Date'
}

export function formatShortDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

export function getTodayReadable() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

