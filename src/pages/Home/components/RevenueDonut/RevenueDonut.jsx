export function RevenueDonut({ percentage }) {
  
  const r = 36, cx = 44, cy = 44
  const circ    = 2 * Math.PI * r
  const filled  = Math.min(Math.max(pct, 0), 100)
  const greenDash = (filled / 100) * circ
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth="8" opacity="0.3" />
      {filled > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22c55e" strokeWidth="8"
          strokeDasharray={`${greenDash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text)" fontSize="15" fontWeight="800">{percentage}%</text>
    </svg>
  )
}
