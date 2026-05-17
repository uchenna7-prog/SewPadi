
export function getInitials(name) {
  if (!name) return ""

  // Common titles to ignore
  const titles = [
    "mr",
    "mrs",
    "miss",
    "ms",
    "master",
    "mistress",
    "dr",
    "doctor",
    "chief",
    "prof",
    "professor",
    "sir",
    "madam",
    "mister",
    "rev",
    "reverend",
    "hon",
    "honorable",
    "alhaji",
    "alhaja",
    "pastor",
    "bishop",
    "prince",
    "princess",
    "capt",
    "captain",
    "eng",
    "engineer",
  ]

  // Clean and split name
  const parts = name
    .toLowerCase()
    .replace(/\./g, "") // remove dots
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  // Remove titles
  const filtered = parts.filter(word => !titles.includes(word))

  if (filtered.length === 0) return ""

  // If only one real name remains
  if (filtered.length === 1) {
    const single = filtered[0].replace(/-/g, "")

    // Return first 2 letters if possible
    return single.slice(0, 2).toUpperCase()
  }

  // Get first and last real names
  const first = filtered[0]
  const last = filtered[filtered.length - 1]

  // Handle hyphenated names like Mary-Jane
  const firstInitial = first.replace(/-/g, "")[0]
  const lastInitial = last.replace(/-/g, "")[0]

  return (firstInitial + lastInitial).toUpperCase()
}


export function getBirthdayStr(birthday) {
  if (!birthday) return ''
  const today = new Date()
  const [month, day] = birthday.split('-').map(Number)
  if (today.getMonth() + 1 === month && today.getDate() === day) return '🎂 Today!'
  const d = new Date(2000, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
