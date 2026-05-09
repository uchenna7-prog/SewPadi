import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers }     from '../../contexts/CustomerContext'
import { useOrders }        from '../../contexts/OrdersContext'
import { useTasks }         from '../../contexts/TaskContext'
import { useInvoices }      from '../../contexts/InvoiceContext'
import { useAppointments }  from '../../contexts/AppointmentContext'
import { useAuth }          from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useGeneralSettings }      from '../../contexts/GeneralSettingsContext'
import { usePayments }      from '../../contexts/PaymentContext'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import Header    from '../../components/Header/Header'
import BottomNav from '../../components/BottomNav/BottomNav'
import OrderMosaic      from '../../components/OrderMosaic/OrderMosaic'
import OrderDetailModal from '../../components/OrderDetailModal/OrderDetailModal'
import styles    from './Home.module.css'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function isTaskOverdue(task) {
  if (!task.dueDate || task.done) return false
  return new Date(task.dueDate + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatApptDate(dateStr, timeStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return timeStr ? `${datePart} · ${timeStr}` : datePart
}

function dueThisWeek(dateStr) {
  if (!dateStr) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end   = new Date(today); end.setDate(today.getDate() + 7)
  const due   = new Date(dateStr + 'T00:00:00')
  return due >= today && due <= end
}

function isDateInLastMonth(dateStr) {
  if (!dateStr) return false
  const now          = new Date()
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const d = new Date(dateStr)
  return d >= lastMonth && d <= lastMonthEnd
}

function formatNairaCompact(amount) {
  if (!amount || amount <= 0) return null
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return `₦${amount.toLocaleString()}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Good night'
}
function getGreetingEmoji() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return '☀️'
  if (h >= 12 && h < 17) return '👋'
  if (h >= 17 && h < 21) return '🌙'
  return '😴'
}
function formatUpdatedTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const SUBTEXTS = [
  "Here's what's happening in your shop today.",
  "Let's see how your shop is doing right now.",
  "Your shop summary is ready, take a look.",
  "Stay on top of your shop with today's snapshot.",
  "Everything at a glance, your shop, your day.",
  "Here's your daily shop overview. Let's get to work.",
  "Check in on your orders, tasks and appointments.",
  "A fresh look at what needs your attention today.",
  "Your shop is waiting, here's what's on the list.",
  "Quick recap: here's where things stand today.",
]
function getRandomSubtext() {
  return SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)]
}

function makeDelta(current, previous) {
  const diff = current - previous
  if (diff > 0) return { value: diff, direction: 'up'   }
  if (diff < 0) return { value: Math.abs(diff), direction: 'down' }
  return             { value: 0,    direction: 'same'  }
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  low: '#94a3b8', normal: '#818cf8', high: '#fb923c', urgent: '#ef4444',
}
const CATEGORY_ICONS = {
  general: 'assignment', sewing: 'content_cut', delivery: 'local_shipping',
  payment: 'payments', fitting: 'checkroom', shopping: 'shopping_cart',
}
const APPT_TYPE_ICONS = {
  fitting: 'checkroom', measurement: 'straighten', delivery: 'local_shipping',
  consultation: 'chat_bubble_outline', pickup: 'inventory_2', other: 'event',
}
const APPT_STATUS_COLORS = {
  scheduled: '#818cf8', confirmed: '#15803d', completed: '#94a3b8',
  cancelled: '#ef4444', missed: '#ef4444',
}
const ORDER_STATUS_STYLES = {
  pending:     { bg: 'rgba(234,179,8,0.10)',   color: '#a16207', border: 'rgba(234,179,8,0.25)'   },
  'in-progress':{ bg: 'rgba(59,130,246,0.10)', color: '#2563eb', border: 'rgba(59,130,246,0.25)'  },
  completed:   { bg: 'rgba(21,128,61,0.10)',   color: '#15803d', border: 'rgba(21,128,61,0.25)'   },
  delivered:   { bg: 'rgba(129,140,248,0.10)', color: '#4f46e5', border: 'rgba(129,140,248,0.25)' },
  cancelled:   { bg: 'rgba(239,68,68,0.10)',   color: '#dc2626', border: 'rgba(239,68,68,0.25)'   },
}
const TASK_STATUS_STYLES = {
  completed: { bg: 'rgba(21,128,61,0.10)',   color: '#15803d', border: 'rgba(21,128,61,0.25)'   },
  overdue:   { bg: 'rgba(239,68,68,0.10)',   color: '#dc2626', border: 'rgba(239,68,68,0.25)'   },
  pending:   { bg: 'rgba(234,179,8,0.10)',   color: '#a16207', border: 'rgba(234,179,8,0.25)'   },
}

const STAGES = [
  { value: 'measurement_taken', label: 'Measurement Taken', icon: 'straighten'    },
  { value: 'fabric_ready',      label: 'Fabric Ready',      icon: 'layers'        },
  { value: 'cutting',           label: 'Cutting',           icon: 'content_cut'   },
  { value: 'weaving',           label: 'Weaving',           icon: 'texture'       },
  { value: 'sewing',            label: 'Sewing',            icon: 'send'          },
  { value: 'embroidery',        label: 'Embroidery',        icon: 'auto_awesome'  },
  { value: 'fitting',           label: 'Fitting',           icon: 'accessibility' },
  { value: 'adjustments',       label: 'Adjustments',       icon: 'tune'          },
  { value: 'finishing',         label: 'Finishing',         icon: 'dry_cleaning'  },
  { value: 'quality_check',     label: 'Quality Check',     icon: 'fact_check'    },
  { value: 'ready',             label: 'Ready',             icon: 'check_circle'  },
]

// ─────────────────────────────────────────────────────────────
// PERFORMANCE CHART COMPONENT
// SVG area chart with dashed target line — matches screenshots
// ─────────────────────────────────────────────────────────────

const CHART_PERIODS = ['1M', '3M', '6M', '1Y']

function PerformanceChart({ payments }) {
  const [period, setPeriod]   = useState('6M')
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  // Build monthly revenue data from payments
  const chartData = useCallback(() => {
    const now    = new Date()
    const months = period === '1M' ? 1 : period === '3M' ? 3 : period === '6M' ? 6 : 12
    const pts    = []

    for (let i = months - 1; i >= 0; i--) {
      const d      = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label  = d.toLocaleDateString('en-US', { month: 'short' })
      const yr     = d.getFullYear()
      const mo     = d.getMonth()

      const rev = (payments || []).flatMap(p => {
        const insts = p.installments || []
        if (!insts.length) return []
        return insts
          .filter(inst => {
            const ds = inst.date || p.date
            if (!ds) return false
            const id = new Date(ds)
            return id.getFullYear() === yr && id.getMonth() === mo
          })
          .map(inst => Number(inst.amount) || 0)
      }).reduce((s, a) => s + a, 0)

      pts.push({ label, rev, yr, mo })
    }
    return pts
  }, [payments, period])

  const data   = chartData()
  const maxRev = Math.max(...data.map(d => d.rev), 1000)

  // Build a simple linear target trend (from first to last * 1.2)
  const baseTarget = data.length > 0 ? (data[0].rev || maxRev * 0.4) : 1000
  const targets    = data.map((_, i) =>
    baseTarget + ((maxRev * 1.1 - baseTarget) / Math.max(data.length - 1, 1)) * i
  )

  // SVG dimensions
  const W = 320, H = 140, PAD_L = 36, PAD_R = 8, PAD_T = 10, PAD_B = 30
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const xPos = (i) => PAD_L + (i / Math.max(data.length - 1, 1)) * innerW
  const yPos = (v) => PAD_T + innerH - (v / (maxRev * 1.15)) * innerH

  // Build SVG path
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(d.rev)}`).join(' ')
  const areaPath = data.length > 0
    ? `${linePath} L ${xPos(data.length - 1)} ${H - PAD_B} L ${xPos(0)} ${H - PAD_B} Z`
    : ''

  const targetPath = targets.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(v)}`).join(' ')

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: f * maxRev * 1.15,
    y: yPos(f * maxRev * 1.15),
  }))

  const formatK = (v) => {
    if (v >= 1_000_000) return `₦${(v/1_000_000).toFixed(0)}m`
    if (v >= 1_000)     return `₦${(v/1_000).toFixed(0)}k`
    return `₦${v}`
  }

  const handleMouseMove = (e) => {
    if (!svgRef.current || data.length === 0) return
    const rect   = svgRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const mx     = (e.clientX - rect.left) * scaleX - PAD_L
    const step   = innerW / Math.max(data.length - 1, 1)
    const idx    = Math.min(Math.max(Math.round(mx / step), 0), data.length - 1)
    const d      = data[idx]
    const tgt    = targets[idx]
    setTooltip({
      x:      xPos(idx),
      y:      yPos(d.rev),
      label:  d.label,
      rev:    d.rev,
      target: Math.round(tgt),
      idx,
    })
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!svgRef.current || data.length === 0) return
    const touch  = e.touches[0]
    const rect   = svgRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const mx     = (touch.clientX - rect.left) * scaleX - PAD_L
    const step   = innerW / Math.max(data.length - 1, 1)
    const idx    = Math.min(Math.max(Math.round(mx / step), 0), data.length - 1)
    const d      = data[idx]
    const tgt    = targets[idx]
    setTooltip({
      x:      xPos(idx),
      y:      yPos(d.rev),
      label:  d.label,
      rev:    d.rev,
      target: Math.round(tgt),
      idx,
    })
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartCardTop}>
        <div>
          <div className={styles.chartEyebrow}>Revenue</div>
          <div className={styles.chartTitle}>Atelier<br />Performance</div>
        </div>
        <div className={styles.chartPeriodTabs}>
          {CHART_PERIODS.map(p => (
            <button key={p}
              className={`${styles.chartPeriodBtn} ${period === p ? styles.chartPeriodBtnActive : ''}`}
              onClick={() => { setPeriod(p); setTooltip(null) }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%" height="100%"
          style={{ overflow: 'visible', userSelect: 'none' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--chart-line)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0.01" />
            </linearGradient>
            <clipPath id="chartClip">
              <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH + 1} />
            </clipPath>
          </defs>

          {/* Y-axis grid lines */}
          {yLabels.map((yl, i) => (
            <g key={i}>
              <line x1={PAD_L} y1={yl.y} x2={W - PAD_R} y2={yl.y}
                stroke="var(--border)" strokeWidth="1"
                strokeDasharray={i === 0 ? 'none' : '4 4'} />
              <text x={PAD_L - 4} y={yl.y + 3.5} textAnchor="end"
                fontSize="8" fill="var(--text3)" fontFamily="Manrope,sans-serif">
                {formatK(yl.v)}
              </text>
            </g>
          ))}

          {/* Target dashed line */}
          {data.length > 1 && (
            <path d={targetPath} fill="none"
              stroke="var(--chart-target)" strokeWidth="1.5"
              strokeDasharray="5 4" clipPath="url(#chartClip)" />
          )}

          {/* Area fill */}
          {data.length > 1 && (
            <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#chartClip)" />
          )}

          {/* Revenue line */}
          {data.length > 1 && (
            <path d={linePath} fill="none"
              stroke="var(--chart-line)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              clipPath="url(#chartClip)" />
          )}

          {/* X-axis labels — show fewer on small screens */}
          {data.map((d, i) => {
            const showLabel = data.length <= 6 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1
            return showLabel ? (
              <text key={i} x={xPos(i)} y={H - PAD_B + 16}
                textAnchor="middle" fontSize="8.5"
                fill={tooltip?.idx === i ? 'var(--text)' : 'var(--text3)'}
                fontFamily="Manrope,sans-serif" fontWeight={tooltip?.idx === i ? '700' : '500'}>
                {d.label}
              </text>
            ) : null
          })}

          {/* Tooltip crosshair + dot */}
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={PAD_T} x2={tooltip.x} y2={H - PAD_B}
                stroke="var(--text)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <circle cx={tooltip.x} cy={tooltip.y} r="5"
                fill="var(--surface)" stroke="var(--chart-line)" strokeWidth="2.5" />
              {/* Target dot */}
              <circle cx={tooltip.x} cy={yPos(tooltip.target)} r="3.5"
                fill="var(--chart-tooltip-bg)" stroke="var(--chart-target)" strokeWidth="2" />
            </>
          )}
        </svg>

        {/* Tooltip box */}
        {tooltip && (() => {
          const svgEl  = svgRef.current
          if (!svgEl) return null
          const rect   = svgEl.getBoundingClientRect()
          const scaleX = rect.width  / W
          const scaleY = rect.height / H
          let left = tooltip.x * scaleX + 8
          if (left + 110 > rect.width) left = tooltip.x * scaleX - 118
          const top = Math.max(4, tooltip.y * scaleY - 24)
          return (
            <div className={styles.chartTooltip} style={{ left, top }}>
              <div className={styles.chartTooltipMonth}>{tooltip.label}</div>
              <div className={styles.chartTooltipRow}>
                <span>target</span>
                <span className={styles.chartTooltipVal}>{formatK(tooltip.target)}</span>
              </div>
              <div className={styles.chartTooltipRow}>
                <span>rev</span>
                <span className={styles.chartTooltipVal}>{formatK(tooltip.rev)}</span>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SKELETON PAGE
// ─────────────────────────────────────────────────────────────

function SkeletonPage() {
  return (
    <div className={styles.skeletonPage}>
      <div className={styles.skHero}>
        <Skeleton width={80}  height={12} borderRadius={4} />
        <Skeleton width={160} height={32} borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton width={240} height={11} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width={100} height={10} borderRadius={4} style={{ marginTop: 6, opacity: 0.5 }} />
      </div>
      <div className={styles.skStatsGrid}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={styles.skStatCard}>
            <Skeleton width={32} height={32} borderRadius={50} />
            <Skeleton width={48} height={28} borderRadius={5} style={{ marginTop: 18 }} />
            <Skeleton width={72} height={10} borderRadius={4} style={{ marginTop: 8 }} />
            <Skeleton width={56} height={9}  borderRadius={4} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
      <div className={styles.skFullCard} style={{ flexDirection: 'column', gap: 16, height: 240 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width={60}  height={10} borderRadius={4} />
            <Skeleton width={120} height={24} borderRadius={5} />
          </div>
          <Skeleton width={100} height={28} borderRadius={20} />
        </div>
        <Skeleton height={140} borderRadius={8} style={{ width: '100%' }} />
      </div>
      <div className={styles.skFullCard}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width={90}  height={10} borderRadius={4} />
          <Skeleton width={130} height={28} borderRadius={5} />
          <Skeleton width={80}  height={10} borderRadius={4} />
        </div>
        <Skeleton width={88} height={88} circle />
      </div>
      {[0, 1].map(s => (
        <div key={s} className={styles.skSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Skeleton width={140} height={11} borderRadius={4} />
            <Skeleton width={44}  height={11} borderRadius={4} />
          </div>
          <Skeleton height={1} borderRadius={0} style={{ width: 'calc(100% + 40px)', marginLeft: -20 }} />
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.skListItem}>
              <Skeleton width={72} height={72} borderRadius={14} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Skeleton width="70%" height={13} borderRadius={4} />
                <Skeleton width="50%" height={10} borderRadius={4} />
                <Skeleton width="60%" height={10} borderRadius={4} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function RevenueDonut({ pct }) {
  const r = 36, cx = 44, cy = 44
  const circ    = 2 * Math.PI * r
  const filled  = Math.min(Math.max(pct, 0), 100)
  const greenDash = (filled / 100) * circ
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border2)" strokeWidth="7" />
      {filled > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeWidth="7"
          strokeDasharray={`${greenDash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="var(--text)" fontSize="15" fontWeight="800">{pct}%</text>
    </svg>
  )
}

function Delta({ delta, positiveIsGood = true }) {
  if (!delta || delta.direction === 'same') return null
  const isPositive = delta.direction === 'up'
  const isGood     = positiveIsGood ? isPositive : !isPositive
  return (
    <span className={isGood ? styles.deltaUp : styles.deltaDown}>
      <span className="mi" style={{ fontSize: '0.6rem', verticalAlign: 'middle' }}>
        {isPositive ? 'arrow_upward' : 'arrow_downward'}
      </span>
      {' '}{delta.value} vs last wk
    </span>
  )
}

function StatusPill({ status }) {
  const s   = (status || 'pending').toLowerCase()
  const sty = ORDER_STATUS_STYLES[s] || ORDER_STATUS_STYLES.pending
  return (
    <span className={styles.statusPill}
      style={{ background: sty.bg, color: sty.color, borderColor: sty.border }}>
      {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

function UrgentStrip({ items, navigate }) {
  if (!items || items.length === 0) return null
  return (
    <div className={styles.urgentStrip}>
      <div className={styles.urgentStripHeader}>
        <span className={`mi ${styles.urgentStripHeaderIcon}`}>warning_amber</span>
        <span className={styles.urgentStripTitle}>Needs attention</span>
      </div>
      <div className={styles.urgentStripItems}>
        {items.map((item, i) => (
          <button key={i} className={styles.urgentItem} onClick={() => navigate(item.route)}>
            <span className={`mi ${styles.urgentItemIcon}`}>{item.icon}</span>
            <span className={styles.urgentItemText}>{item.text}</span>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', marginLeft: 'auto', flexShrink: 0 }}>chevron_right</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function RevenueGoalModal({ onSave, onClose }) {
  const [period, setPeriod]       = useState('monthly')
  const [goalInput, setGoalInput] = useState('')
  const [currency, setCurrency]   = useState('₦')
  const handleSave = () => {
    const amount = Number(goalInput.replace(/,/g, ''))
    if (!amount || amount <= 0) return
    onSave({ period, goal: amount, currency })
  }
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Set Revenue Goal</h2>
          <p className={styles.modalSub}>Choose your tracking period and target amount</p>
        </div>
        <div className={styles.modalSection}>
          <div className={styles.modalSectionLabel}>Track by</div>
          <div className={styles.periodTabs}>
            {['weekly','monthly','yearly'].map(p => (
              <button key={p}
                className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalSection}>
          <div className={styles.modalSectionLabel}>Revenue target</div>
          <div className={styles.goalInputRow}>
            <select className={styles.currencySelect} value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="₦">₦ NGN</option>
              <option value="$">$ USD</option>
              <option value="£">£ GBP</option>
              <option value="€">€ EUR</option>
            </select>
            <input className={styles.goalInput} type="number" placeholder="e.g. 500000"
              value={goalInput} onChange={e => setGoalInput(e.target.value)} min="1" />
          </div>
        </div>
        <div className={styles.periodHint}>
          {period === 'weekly'  && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>date_range</span>Resets every Monday</>}
          {period === 'monthly' && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>calendar_month</span>Resets on the 1st of each month</>}
          {period === 'yearly'  && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>event_repeat</span>Resets on January 1st each year</>}
        </div>
        <button className={styles.modalSaveBtn} onClick={handleSave}
          disabled={!goalInput || Number(goalInput) <= 0}>Save Goal</button>
        <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function NotifBanner({ onEnable, onDismiss }) {
  return (
    <div className={styles.notifBanner}>
      <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)', flexShrink: 0 }}>notifications</span>
      <div className={styles.notifBannerText}>
        <div className={styles.notifBannerTitle}>Enable Notifications</div>
        <div className={styles.notifBannerSub}>Get alerts for orders, invoices &amp; birthdays</div>
      </div>
      <div className={styles.notifBannerActions}>
        <button className={styles.notifBannerEnable} onClick={onEnable}>Allow</button>
        <button className={styles.notifBannerDismiss} onClick={onDismiss}>Not now</button>
      </div>
    </div>
  )
}

// Monochrome stat card icon — gray disc, no color
function StatCard({ card, navigate }) {
  const [showTip, setShowTip] = useState(false)
  const isEmpty = card.value === 0

  return (
    <div className={styles.statCard} onClick={() => navigate(card.route)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Monochrome gray disc — matches screenshots */}
        <div className={styles.statIconWrap}>
          <span className="mi" style={{ fontSize: '1.15rem', color: 'var(--icon-color)' }}>
            {card.desktopIcon}
          </span>
        </div>
        {card.tooltip && (
          <div style={{ position: 'relative' }}>
            <span className="mi"
              style={{ fontSize: '0.85rem', color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}
              onClick={e => { e.stopPropagation(); setShowTip(v => !v) }}>
              info
            </span>
            {showTip && (
              <div style={{
                position: 'absolute', top: '22px', right: 0, zIndex: 50,
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: '10px', padding: '8px 10px',
                fontSize: '0.68rem', fontWeight: 500, color: 'var(--text2)',
                width: '160px', lineHeight: 1.45, boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              }} onClick={e => e.stopPropagation()}>
                {card.tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.statValue}
        style={{ color: isEmpty ? 'var(--text3)' : 'var(--text)', opacity: isEmpty ? 0.4 : 1 }}>
        {card.value}
      </div>
      <div className={styles.statLabel}>{card.label}</div>
      {card.sub && (
        <div className={styles.statSub} style={{ color: card.subColor }}>{card.sub}</div>
      )}
      <Delta delta={card.delta} positiveIsGood={card.positiveIsGood} />
    </div>
  )
}

function EmptyState({ icon, message, sub }) {
  return (
    <div className={styles.emptyState}>
      <span className={`mi ${styles.emptyStateIcon}`}>{icon}</span>
      <p className={styles.emptyStateMsg}>{message}</p>
      {sub && <p className={styles.emptyStateSub}>{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REVENUE HELPERS
// ─────────────────────────────────────────────────────────────
const REVENUE_STORAGE_KEY = 'tf_revenue_goal'

function getWindowStart(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(now.getFullYear(), 0, 1)
}

function getPrevWindowStart(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return new Date(now.getFullYear() - 1, 0, 1)
}

function periodLabel(period) {
  if (period === 'weekly')  return 'This week · Revenue'
  if (period === 'monthly') return 'This month · Revenue'
  return 'This year · Revenue'
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
function Home({ onMenuClick, onGoToCustomer }) {
  const navigate = useNavigate()
  const { user }          = useAuth()
  const { customers, loading: loadingCustomers } = useCustomers()
  const { allOrders }     = useOrders()
  const { tasks, loading: loadingTasks } = useTasks()
  const { allInvoices }   = useInvoices()
  const {
    upcoming, todayAppointments, recent: recentAppts, missedCount, upcomingThisWeek,
  } = useAppointments()
  const { pushEnabled, requestPushPermission } = useNotifications()
  const { generalSettings }    = useGeneralSettings()
  const { allPayments } = usePayments()

  const noCustomersYet  = !loadingCustomers && customers.length === 0
  const ordersSettled   = allOrders.length   > 0 || noCustomersYet
  const invoicesSettled = allInvoices.length  > 0 || noCustomersYet
  const paymentsSettled = allPayments.length  > 0 || noCustomersYet
  const apptsSettled    = upcoming.length > 0 || recentAppts.length > 0 || missedCount > 0 || (!loadingCustomers && !loadingTasks)
  const allSettled      = !loadingCustomers && !loadingTasks && ordersSettled && invoicesSettled && paymentsSettled && apptsSettled

  const settledRef = useRef(false)
  if (allSettled) settledRef.current = true
  const isLoading = !settledRef.current

  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('tf_notif_dismissed') === 'true'
  )
  const [revenueGoal, setRevenueGoal] = useState(() => {
    try { const r = localStorage.getItem(REVENUE_STORAGE_KEY); return r ? JSON.parse(r) : null }
    catch { return null }
  })
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [detailOrder,   setDetailOrder]   = useState(null)

  const greetingRef   = useRef(getGreeting())
  const greetEmojiRef = useRef(getGreetingEmoji())
  const subtextRef    = useRef(getRandomSubtext())
  const updatedAtRef  = useRef(new Date())

  const handleSaveGoal = data => {
    setRevenueGoal(data)
    localStorage.setItem(REVENUE_STORAGE_KEY, JSON.stringify(data))
    setShowGoalModal(false)
  }

  const showBanner = !pushEnabled && !bannerDismissed
    && 'Notification' in window && Notification.permission !== 'denied'

  const handleEnable = async () => {
    await requestPushPermission()
    setBannerDismissed(true)
    localStorage.setItem('tf_notif_dismissed', 'true')
  }
  const handleDismiss = () => {
    setBannerDismissed(true)
    localStorage.setItem('tf_notif_dismissed', 'true')
  }

  const displayName = (() => {
    const full = user?.displayName?.trim()
    if (full) { const p = full.split(/\s+/); return p.length >= 2 ? p[1] : p[0] }
    return user?.email?.split('@')[0] ?? 'there'
  })()

  const now       = new Date()
  const todayStr  = now.toISOString().slice(0, 10)
  const weekAgo   = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWksAgo = new Date(now); twoWksAgo.setDate(twoWksAgo.getDate() - 14)

  // ── Customers ─────────────────────────────────────────────
  const totalCustomers   = customers.length
  const newCustThisMonth = customers.filter(c => {
    if (!c.date) return false
    const d = new Date(c.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const topCustomer = (() => {
    if (!customers.length) return { name: '—', orderCount: 0, totalSpend: 0 }
    const counts = {}; const spend = {}
    allOrders.forEach(o => {
      if (!o.customerId) return
      counts[o.customerId] = (counts[o.customerId] || 0) + 1
      spend[o.customerId]  = (spend[o.customerId]  || 0) + (Number(o.price) || 0)
    })
    let bestId = null, bestCount = 0
    Object.entries(counts).forEach(([id, cnt]) => { if (cnt > bestCount) { bestCount = cnt; bestId = id } })
    const best = bestId ? customers.find(c => c.id === bestId) : customers[0]
    if (!best) return { name: '—', orderCount: 0, totalSpend: 0 }
    return {
      name:       best.name || `${best.firstName ?? ''} ${best.lastName ?? ''}`.trim() || '—',
      orderCount: counts[best.id] || 0,
      totalSpend: spend[best.id]  || 0,
    }
  })()

  // ── Orders ────────────────────────────────────────────────
  const pendingOrders         = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))
  const ordersDueToday        = pendingOrders.filter(o => (o.dueDate || o.dueRaw) === todayStr).length
  const ordersDueThisWeek     = pendingOrders.filter(o => dueThisWeek(o.dueDate || o.dueRaw)).length
  const ordersCreatedThisWeek = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= weekAgo).length

  // ── Invoices ──────────────────────────────────────────────
  const getInvDueDate = (i) => {
    const explicit = i.due || i.dueDate || i.due_date || i.dueOn
    if (explicit) return explicit
    let ms = null; const ca = i.createdAt
    if (!ca) return null
    if (typeof ca.toMillis === 'function')   ms = ca.toMillis()
    else if (typeof ca.toDate === 'function') ms = ca.toDate().getTime()
    else if (typeof ca.seconds === 'number') ms = ca.seconds * 1000
    else if (typeof ca === 'number')         ms = ca
    else if (typeof ca === 'string')         ms = new Date(ca).getTime()
    else if (ca instanceof Date)             ms = ca.getTime()
    if (!ms || isNaN(ms)) return null
    const dueDays = generalSettings.invoiceDueDays ?? 7
    return new Date(ms + dueDays * 86400000).toISOString().slice(0, 10)
  }
  const isInvOverdue = (i) => {
    if (i.status === 'paid') return false
    const due = getInvDueDate(i)
    if (!due) return false
    return new Date(due + 'T23:59:59') < new Date()
  }
  const unpaidInvoices  = allInvoices.filter(i => i.status !== 'paid' && !isInvOverdue(i))
  const overdueInvoices = allInvoices.filter(i => isInvOverdue(i))
  const totalOverdue    = overdueInvoices.length
  const zeroPaidInvoices    = allInvoices.filter(i => i.status === 'unpaid')
  const zeroPaidDueThisWeek = zeroPaidInvoices.filter(i => dueThisWeek(getInvDueDate(i))).length
  const zeroPaidDueToday    = zeroPaidInvoices.filter(i => getInvDueDate(i) === todayStr).length

  // ── Tasks ─────────────────────────────────────────────────
  const pendingTasks     = tasks.filter(t => !t.done && !isTaskOverdue(t))
  const overdueTasks     = tasks.filter(t => isTaskOverdue(t))
  const tasksDueToday    = pendingTasks.filter(t => t.dueDate === todayStr).length
  const tasksDueThisWeek = pendingTasks.filter(t => dueThisWeek(t.dueDate)).length
  const tasksThisWeek    = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= weekAgo).length

  // ── Appointments ──────────────────────────────────────────
  const todayCount   = todayAppointments.length
  const apptThisWeek = upcoming.filter(a => dueThisWeek(a.date)).length

  // ── Revenue ───────────────────────────────────────────────
  const calcRevenue = (sinceDate, beforeDate = null) => {
    if (!revenueGoal) return 0
    return allPayments.flatMap(p => {
      const insts = p.installments || []
      if (!insts.length) return []
      return insts.filter(inst => {
        const ds = inst.date || p.date
        if (!ds) return false
        const d = new Date(ds)
        if (d < sinceDate) return false
        if (beforeDate && d >= beforeDate) return false
        return true
      }).map(inst => Number(inst.amount) || 0)
    }).reduce((s, a) => s + a, 0)
  }
  const revenueEarned     = revenueGoal ? calcRevenue(getWindowStart(revenueGoal.period)) : 0
  const revenuePrevPeriod = revenueGoal ? calcRevenue(getPrevWindowStart(revenueGoal.period), getWindowStart(revenueGoal.period)) : 0
  const revenuePct        = revenueGoal?.goal > 0 ? Math.min(Math.round((revenueEarned / revenueGoal.goal) * 100), 100) : 0
  const revenueDiff       = revenueEarned - revenuePrevPeriod
  const revenueUp         = revenueDiff >= 0

  // ── Urgent items ──────────────────────────────────────────
  const urgentItems = []
  const soonAppt = upcoming.find(a => {
    if (!a.date || !a.time || a.date !== todayStr) return false
    const [hh, mm] = a.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(hh, mm, 0, 0)
    const diff = apptTime - Date.now()
    return diff > 0 && diff < 2 * 60 * 60 * 1000
  })
  if (soonAppt) {
    const [hh, mm] = soonAppt.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(hh, mm, 0, 0)
    const minsLeft = Math.round((apptTime - Date.now()) / 60000)
    urgentItems.push({
      icon: APPT_TYPE_ICONS[soonAppt.type] || 'event',
      text: `Appointment in ${minsLeft} min${minsLeft !== 1 ? 's' : ''}${soonAppt.customerName ? ` · ${soonAppt.customerName}` : ''}`,
      route: '/appointments',
    })
  }
  if (overdueTasks.length > 0)  urgentItems.push({ icon: 'assignment_late', text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`, route: '/tasks' })
  if (ordersDueToday > 0)       urgentItems.push({ icon: 'content_cut', text: `${ordersDueToday} order${ordersDueToday > 1 ? 's' : ''} due today`, route: '/orders' })
  if (totalOverdue > 0)         urgentItems.push({ icon: 'receipt_long', text: `${totalOverdue} overdue invoice${totalOverdue > 1 ? 's' : ''}`, route: '/invoices' })

  // ── Recent lists — LIMITED TO 3 ───────────────────────────
  const recentOrders       = [...pendingOrders].slice(0, 3)
  const recentTasks        = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 3)
  const recentAppointments = upcoming.slice(0, 3)
  const pastAppointments   = recentAppts.slice(0, 3)

  // ── Stat card sub messages ────────────────────────────────
  const ordersSub = (() => {
    if (pendingOrders.length === 0) return { text: 'All caught up', color: '#22c55e' }
    if (ordersDueToday > 0) return { text: `${ordersDueToday} due today`, color: '#ef4444' }
    if (ordersDueThisWeek > 0) return { text: `${ordersDueThisWeek} due this wk`, color: '#fb923c' }
    if (ordersCreatedThisWeek > 0) return { text: `${ordersCreatedThisWeek} new this wk`, color: 'var(--text2)' }
    return null
  })()

  const invoicesSub = (() => {
    if (zeroPaidInvoices.length === 0) return { text: 'Fully paid up', color: '#22c55e' }
    if (zeroPaidDueToday > 0) return { text: `${zeroPaidDueToday} due today`, color: '#ef4444' }
    if (zeroPaidDueThisWeek > 0) return { text: `${zeroPaidDueThisWeek} due this wk`, color: '#fb923c' }
    if (totalOverdue > 0) return { text: `${totalOverdue} overdue`, color: '#ef4444' }
    return { text: `${zeroPaidInvoices.length} pending`, color: '#fb923c' }
  })()

  const apptSub = (() => {
    if (todayCount > 0) return { text: `${todayCount} today`, color: 'var(--text)' }
    if (missedCount > 0) return { text: `${missedCount} missed`, color: '#ef4444' }
    if (upcomingThisWeek > 0) return { text: `${upcomingThisWeek} this wk`, color: 'var(--text2)' }
    return { text: 'Clear schedule', color: '#22c55e' }
  })()

  const tasksSub = (() => {
    if (pendingTasks.length === 0 && overdueTasks.length === 0) return { text: 'All done', color: '#22c55e' }
    if (overdueTasks.length > 0) return { text: `${overdueTasks.length} overdue`, color: '#ef4444' }
    if (tasksDueToday > 0) return { text: `${tasksDueToday} due today`, color: '#ef4444' }
    if (tasksDueThisWeek > 0) return { text: `${tasksDueThisWeek} due this wk`, color: '#fb923c' }
    if (tasksThisWeek > 0) return { text: `${tasksThisWeek} new this wk`, color: 'var(--text2)' }
    return null
  })()

  // Active orders uses scissors icon — content_cut
  const statCards = [
    {
      desktopIcon:    'content_cut',   // ← scissors for active orders
      value:          pendingOrders.length,
      label:          'Active Orders',
      sub:            ordersSub?.text ?? null,
      subColor:       ordersSub?.color ?? 'var(--text3)',
      delta:          null,
      positiveIsGood: true,
      route:          '/orders',
    },
    {
      desktopIcon:    'receipt_long',
      value:          zeroPaidInvoices.length,
      label:          'Unpaid Invoices',
      sub:            invoicesSub?.text ?? null,
      subColor:       invoicesSub?.color ?? 'var(--text3)',
      delta:          null,
      positiveIsGood: false,
      route:          '/invoices',
      tooltip:        'Only invoices with no payment recorded yet.',
    },
    {
      desktopIcon:    'event',
      value:          todayCount,
      label:          "Today's Appts",
      sub:            apptSub?.text ?? null,
      subColor:       apptSub?.color ?? 'var(--text3)',
      delta:          null,
      positiveIsGood: true,
      route:          '/appointments',
    },
    {
      desktopIcon:    'task_alt',
      value:          pendingTasks.length,
      label:          'Pending Tasks',
      sub:            tasksSub?.text ?? null,
      subColor:       tasksSub?.color ?? 'var(--text3)',
      delta:          null,
      positiveIsGood: false,
      route:          '/tasks',
    },
  ]

  const topCustomerMeta = (() => {
    const { orderCount, totalSpend } = topCustomer
    if (!orderCount) return null
    const parts = []
    const spendStr = formatNairaCompact(totalSpend)
    if (spendStr) parts.push(spendStr)
    parts.push(`${orderCount} order${orderCount !== 1 ? 's' : ''}`)
    return parts.join(' · ')
  })()

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className={styles.pageWrapper}>
      <Header onMenuClick={onMenuClick} />

      <main className={styles.main}>
        {isLoading ? (
          <SkeletonTheme baseColor="var(--surface2)" highlightColor="var(--surface)">
            <SkeletonPage />
          </SkeletonTheme>
        ) : (
          <>
            {/* ── HERO ── */}
            <section className={styles.hero}>
              <p className={styles.welcomeLabel}>
                {greetingRef.current}
                <span className={styles.greetingEmoji}>{greetEmojiRef.current}</span>
              </p>
              <h1 className={styles.title}>{displayName}</h1>
              <p className={styles.subtitle}>{subtextRef.current}</p>
              <p className={styles.updatedAt}>
                <span className="mi" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px' }}>update</span>
                Updated at {formatUpdatedTime(updatedAtRef.current)}
              </p>
            </section>

            {/* ── NOTIFICATION BANNER ── */}
            {showBanner && <NotifBanner onEnable={handleEnable} onDismiss={handleDismiss} />}

            {/* ── URGENT STRIP ── */}
            <UrgentStrip items={urgentItems} navigate={navigate} />

            {/* 1. STAT CARDS GRID ── */}
            <section className={styles.statsGrid}>
              {statCards.map((card, i) => (
                <StatCard key={i} card={card} navigate={navigate} />
              ))}
            </section>

            {/* 2. PERFORMANCE CHART ── positioned here between stats and revenue */}
            <PerformanceChart payments={allPayments} />

            {/* 3. REVENUE GOAL CARD ── */}
            {!revenueGoal ? (
              <div className={styles.revenueCard} onClick={() => setShowGoalModal(true)}
                style={{ justifyContent: 'flex-start', gap: '20px' }}>
                <div className={styles.revenueEmptyIconWrap}>
                  <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--icon-color)' }}>ads_click</span>
                </div>
                <div className={styles.revenueCardLeft} style={{ gap: '2px' }}>
                  <div className={styles.revenueEmptyTitle}>Set your first goal</div>
                  <div className={styles.revenueEmptySub}>Tap to track your shop's revenue growth</div>
                </div>
              </div>
            ) : (
              <div className={styles.revenueCard} onClick={() => setShowGoalModal(true)}>
                <div className={styles.revenueCardLeft}>
                  <div className={styles.revenueLabel}>{periodLabel(revenueGoal.period)}</div>
                  <div className={styles.revenueAmount}>
                    {revenueGoal.currency}{revenueEarned.toLocaleString()}
                  </div>
                  <div className={styles.revenueTarget}>
                    Goal: {revenueGoal.currency}{revenueGoal.goal.toLocaleString()}
                  </div>
                  {revenueDiff !== 0 && (
                    <div className={styles.revenueVs}>
                      <span className="mi" style={{
                        fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px',
                        color: revenueUp ? '#15803d' : '#ef4444'
                      }}>{revenueUp ? 'arrow_upward' : 'arrow_downward'}</span>
                      <span style={{ color: revenueUp ? '#15803d' : '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
                        {revenueGoal.currency}{Math.abs(revenueDiff).toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--text3)', fontSize: '0.7rem', marginLeft: '4px' }}>
                        vs last {revenueGoal.period === 'weekly' ? 'week' : revenueGoal.period === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.revenueDonutWrap}>
                  <RevenueDonut pct={revenuePct} />
                </div>
              </div>
            )}

            {/* 4. CUSTOMER INSIGHTS CARD ── */}
            <div className={styles.customerCard} onClick={() => navigate('/customers')}>
              <div className={styles.customerCardHeader}>
                <span className={styles.customerCardSectionLabel}>Customer Insights</span>
                <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>chevron_right</span>
              </div>
              <div className={styles.customerHeroBlock}>
                <div className={styles.customerHeroNumber}>{totalCustomers.toLocaleString()}</div>
                <div className={styles.customerHeroLabel}>Total Customers</div>
              </div>
              <div className={styles.customerCardRule} />
              <div className={styles.customerStatStack}>
                <div className={styles.customerStatRow}>
                  <span className={styles.customerStatLbl}>Top Customer</span>
                  <div className={styles.customerTopVal}>
                    <span style={{ color: 'var(--text)', fontWeight: 700 }}>{topCustomer.name}</span>
                    {topCustomerMeta && (
                      <span className={styles.customerTopMeta}>{topCustomerMeta}</span>
                    )}
                  </div>
                </div>
                <div className={styles.customerStatRow}>
                  <span className={styles.customerStatLbl}>New This Month</span>
                  <span className={styles.customerStatVal}>{newCustThisMonth}</span>
                </div>
              </div>
            </div>

            {showGoalModal && (
              <RevenueGoalModal onSave={handleSaveGoal} onClose={() => setShowGoalModal(false)} />
            )}

            {/* ── UPCOMING APPOINTMENTS — 3 max ── */}
            {recentAppointments.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Upcoming Appointments</h3>
                  <button className={styles.seeAllBtn} onClick={() => navigate('/appointments')}>See all</button>
                </div>
                <div className={styles.listSection}>
                  <div className={styles.listDivider} />
                  {recentAppointments.map((appt, idx) => {
                    const isLast    = idx === recentAppointments.length - 1
                    const icon      = APPT_TYPE_ICONS[appt.type] || 'event'
                    const iconColor = APPT_STATUS_COLORS[appt.status] || '#818cf8'
                    const isToday   = todayAppointments.some(a => a.id === appt.id)
                    return (
                      <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                        <div className={styles.listOuter}
                          style={isToday ? { borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.04)' } : {}}>
                          <div className={styles.listInner}>
                            <span className="mi" style={{ fontSize: '1.2rem', color: 'var(--icon-color)' }}>{icon}</span>
                          </div>
                        </div>
                        <div className={styles.listInfo}>
                          <div className={styles.listDesc}>{appt.title || appt.type || 'Appointment'}</div>
                          {appt.customerName && (
                            <div className={styles.listMeta}>
                              <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                              <span className={styles.listMetaText}>{appt.customerName}</span>
                            </div>
                          )}
                          <div className={styles.listMeta}>
                            <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)', verticalAlign: 'middle' }}>schedule</span>
                            <span className={styles.listMetaText}>{formatApptDate(appt.date, appt.time)}</span>
                          </div>
                          {isToday && <div className={styles.listApptToday}>Today</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── RECENT APPOINTMENTS — 3 max ── */}
            {pastAppointments.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Recent Appointments</h3>
                  <button className={styles.seeAllBtn} onClick={() => navigate('/appointments')}>See all</button>
                </div>
                <div className={styles.listSection}>
                  <div className={styles.listDivider} />
                  {pastAppointments.map((appt, idx) => {
                    const isLast    = idx === pastAppointments.length - 1
                    const iconColor = appt.status === 'completed' ? '#15803d'
                      : appt.status === 'cancelled' ? '#94a3b8' : '#ef4444'
                    return (
                      <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                        <div className={styles.listOuter} style={
                          appt.status === 'completed'
                            ? { borderColor: 'rgba(21,128,61,0.25)', background: 'rgba(21,128,61,0.03)' }
                            : appt.status === 'cancelled'
                            ? { borderColor: 'rgba(148,163,184,0.25)' }
                            : { borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.03)' }
                        }>
                          <div className={styles.listInner}>
                            <span className="mi" style={{ fontSize: '1.2rem', color: 'var(--icon-color)' }}>
                              {APPT_TYPE_ICONS[appt.type] || 'event'}
                            </span>
                          </div>
                        </div>
                        <div className={styles.listInfo}>
                          <div className={styles.listDesc}>{appt.title || appt.type || 'Appointment'}</div>
                          {appt.customerName && (
                            <div className={styles.listMeta}>
                              <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                              <span className={styles.listMetaText}>{appt.customerName}</span>
                            </div>
                          )}
                          <div className={styles.listMeta}>
                            <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)', verticalAlign: 'middle' }}>schedule</span>
                            <span className={styles.listMetaText}
                              style={{ color: appt.status === 'missed' ? '#ef4444' : undefined }}>
                              {formatApptDate(appt.date, appt.time)}
                            </span>
                          </div>
                          <div className={styles.listApptStatus}
                            style={{ color: iconColor, borderColor: `${iconColor}35`, background: `${iconColor}0e` }}>
                            {appt.status === 'completed' ? 'Completed' : appt.status === 'cancelled' ? 'Cancelled' : 'Missed'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── QUICK ACTIONS — desktop only ── */}
            <section className={styles.quickActionsDesktop}>
              <h3 className={styles.sectionTitle}>Quick Actions</h3>
              <div className={styles.statsGrid}>
                {[
                  { icon: 'person_add', label: 'Add Customer',     route: '/customers'    },
                  { icon: 'event',      label: 'Book Appointment', route: '/appointments' },
                  { icon: 'assignment', label: 'New Task',         route: '/tasks'        },
                  { icon: 'receipt',    label: 'New Invoice',      route: '/invoices'     },
                ].map(a => (
                  <div key={a.label} className={styles.actionCard} onClick={() => navigate(a.route)}>
                    <div className={styles.statIconWrap}>
                      <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--icon-color)' }}>{a.icon}</span>
                    </div>
                    <div className={styles.actionCardText}>
                      <div className={styles.actionLabel}>{a.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── RECENT ORDERS — 3 max ── */}
            {recentOrders.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Recent Orders</h3>
                  <button className={styles.seeAllBtn} onClick={() => navigate('/orders')}>See all</button>
                </div>
                <div className={styles.listSection}>
                  <div className={styles.listDivider} />
                  {recentOrders.map((order, idx) => {
                    const isLast     = idx === recentOrders.length - 1
                    const priceStr   = order.price != null ? `₦${Number(order.price).toLocaleString()}` : '—'
                    const itemsList  = order.items || []
                    const stageObj   = STAGES.find(s => s.value === order.stage)
                    const dueDateRaw = order.dueRaw || order.dueDate
                    const dueDateShort = dueDateRaw ? `Due ${formatDateShort(dueDateRaw)}`
                      : order.due ? `Due ${order.due}` : null
                    return (
                      <div key={order.id}
                        className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}
                        onClick={() => setDetailOrder(order)}>
                        <OrderMosaic items={itemsList} />
                        <div className={styles.listInfo}>
                          <div className={styles.listDesc}>{order.desc ?? 'Order'}</div>
                          <div className={styles.listMeta}>
                            <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                            <span className={styles.listMetaText}>{order.customerName || '—'}</span>
                          </div>
                          {stageObj && (
                            <div className={styles.listStageLine}>
                              <span className="mi" style={{ fontSize: '0.75rem' }}>{stageObj.icon}</span>
                              {stageObj.label}
                            </div>
                          )}
                        </div>
                        <div className={styles.listRight}>
                          <div className={styles.listPrice}>{priceStr}</div>
                          {order.qty > 1 && <div className={styles.listQty}>{order.qty} items</div>}
                          <StatusPill status={order.status} />
                          {dueDateShort && (
                            <div className={styles.listDueRight}>{dueDateShort}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── RECENT TASKS — 3 max ── */}
            {recentTasks.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Recent Tasks</h3>
                  <button className={styles.seeAllBtn} onClick={() => navigate('/tasks')}>See all</button>
                </div>
                <div className={styles.listSection}>
                  <div className={styles.listDivider} />
                  {recentTasks.map((task, idx) => {
                    const isLast    = idx === recentTasks.length - 1
                    const overdue   = isTaskOverdue(task)
                    const catIcon   = CATEGORY_ICONS[task.category] || 'assignment'
                    const iconColor = overdue ? '#ef4444' : task.done ? '#22c55e' : 'var(--text2)'
                    return (
                      <div key={task.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
                        <div className={styles.listOuter}
                          style={
                            overdue  ? { borderColor: 'rgba(239,68,68,0.25)',  background: 'rgba(239,68,68,0.03)' }
                          : task.done ? { borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.03)' }
                          : {}
                          }>
                          <div className={styles.listInner}>
                            <span className="mi" style={{ fontSize: '1.2rem', color: 'var(--icon-color)' }}>{catIcon}</span>
                          </div>
                        </div>
                        <div className={styles.listInfo}>
                          <div className={styles.listDesc}>{task.desc}</div>
                          {task.customerName && (
                            <div className={styles.listMeta}>
                              <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
                              <span className={styles.listMetaText}>{task.customerName}</span>
                            </div>
                          )}
                          {(() => {
                            const statusKey = overdue ? 'overdue' : task.done ? 'completed' : 'pending'
                            const sty = TASK_STATUS_STYLES[statusKey]
                            return (
                              <span className={styles.statusPill}
                                style={{ background: sty.bg, color: sty.color, borderColor: sty.border }}>
                                {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                              </span>
                            )
                          })()}
                          {task.dueDate && (
                            <div className={styles.listDue}>Due {formatDate(task.dueDate)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── ORDER DETAIL MODAL ── */}
            {detailOrder && (
              <OrderDetailModal
                order={detailOrder}
                onClose={() => setDetailOrder(null)}
                onGoToCustomer={onGoToCustomer}
                noBlur
              />
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default Home
