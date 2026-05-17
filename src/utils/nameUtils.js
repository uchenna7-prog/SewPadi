
export function getInitials(name) {
  if (!name) return ""

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

  const parts = name
    .toLowerCase()
    .replace(/\./g, "") 
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const filtered = parts.filter(word => !titles.includes(word))

  if (filtered.length === 0) return ""

  if (filtered.length === 1) {
    const single = filtered[0].replace(/-/g, "")

    return single.slice(0, 2).toUpperCase()
  }

  const first = filtered[0]
  const last = filtered[filtered.length - 1]

  const firstInitial = first.replace(/-/g, "")[0]
  const lastInitial = last.replace(/-/g, "")[0]

  return (firstInitial + lastInitial).toUpperCase()
}