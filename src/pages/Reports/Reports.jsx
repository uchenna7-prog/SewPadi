// src/pages/Reports/Reports.jsx

import { useState, useMemo } from 'react'
import { useOrders }    from '../../contexts/OrdersContext'
import { useTasks }     from '../../contexts/TaskContext'
import { usePayments }  from '../../contexts/PaymentContext'
import { useCustomers } from '../../contexts/CustomerContext'
import Header from '../../components/Header/Header'
import styles from './Reports.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── Period helpers ────────────────────────────────────────────

const PERIODS = [
  { id: 'week',  label: 'This week'     },
  { id: 'month', label: 'This month'    },
  { id: '3mo',   label: 'Last 3 months' },
  { id: 'year',  label: 'This year'     },
  { id: 'all',   label: 'All time'      },
]

function periodStart(id) {
  const now = new Date()
  switch (id) {
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay())
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1)
    case '3mo':   return new Date(now.getFullYear(), now.getMonth() - 2, 1)
    case 'year':  return new Date(now.getFullYear(), 0, 1)
    default:      return null
  }
}

function parseItemDate(item) {
  if (item.createdAt?.toDate)  return item.createdAt.toDate()
  if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000)
  if (item.date)               return new Date(item.date)
  return null
}

function inPeriod(item, start) {
  if (!start) return true
  const d = parseItemDate(item)
  if (!d) return false
  return d >= start
}

function fmt(amount) {
  const n = parseFloat(amount) || 0
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return `₦${n.toLocaleString('en-NG')}`
}

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

// ── Build payment bars ────────────────────────────────────────

function buildPaymentBars(installments, period) {
  const start = periodStart(period)

  if (period === 'week' || period === 'month') {
    const map = {}
    installments.forEach(inst => {
      const d = new Date(inst.date)
      if (!d || isNaN(d)) return
      if (start && d < start) return
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      map[key] = (map[key] || 0) + (parseFloat(inst.amount) || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value })).slice(-14)
  }

  if (period === '3mo' || period === 'year' || period === 'all') {
    const map = {}
    installments.forEach(inst => {
      const d = new Date(inst.date)
      if (!d || isNaN(d)) return
      if (start && d < start) return
      const key = d.toLocaleDateString('en-US', {
        month: 'short',
        year: period === 'all' ? '2-digit' : undefined,
      })
      map[key] = (map[key] || 0) + (parseFloat(inst.amount) || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  }

  return []
}

// ── Donut Chart ───────────────────────────────────────────────

function DonutChart({ segments, centerLabel, centerSub }) {
  const R = 42, CX = 54, CY = 54
  const circumference = 2 * Math.PI * R
  const GAP = 3

  const sum = segments.reduce((s, seg) => s + seg.value, 0)
  let offset = 0
  const arcs = segments.map(seg => {
    const fraction = sum > 0 ? seg.value / sum : 0
    const dash = Math.max(0, fraction * circumference - GAP)
    const arc = {
      dash,
      gap: circumference - dash,
      offset: circumference - offset,
      color: seg.color,
    }
    offset += fraction * circumference
    return arc
  })

  return (
    <svg width="108" height="108" viewBox="0 0 108 108" className={styles.donutSvg}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="12" />
      {sum === 0 ? (
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border2)" strokeWidth="12" />
      ) : (
        arcs.map((arc, i) =>
          arc.dash > 0 && (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth="12"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          )
        )
      )}
      <text x={CX} y={CY - 5} textAnchor="middle" className={styles.donutNum}>{centerLabel}</text>
      <text x={CX} y={CY + 9} textAnchor="middle" className={styles.donutSub}>{centerSub}</text>
    </svg>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────

function BarChart({ bars }) {
  if (!bars.length) return null
  const max = Math.max(...bars.map(b => b.value), 1)
  const avg = bars.reduce((s, b) => s + b.value, 0) / bars.length
  const avgPct = Math.max(3, (avg / max) * 68)

  return (
    <div className={styles.barChartWrap}>
      <div className={styles.barAvgLine} style={{ bottom: `${avgPct + 18}px` }}>
        <span className={styles.barAvgLabel}>avg {fmt(avg)}</span>
      </div>
      <div className={styles.barChart}>
        {bars.map((bar, i) => (
          <div key={i} className={styles.barCol}>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ height: `${Math.max(3, (bar.value / max) * 100)}%` }}
                title={fmt(bar.value)}
              />
            </div>
            <div className={styles.barLabel}>{bar.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Period Selector ───────────────────────────────────────────

function PeriodSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = PERIODS.find(p => p.id === value)
  return (
    <div className={styles.periodWrap}>
      <button className={styles.periodBtn} onClick={() => setOpen(p => !p)}>
        {current.label}
        <span className="mi" style={{ fontSize: '0.85rem' }}>expand_more</span>
      </button>
      {open && (
        <>
          <div className={styles.periodBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.periodDropdown}>
            {PERIODS.map(p => (
              <button
                key={p.id}
                className={`${styles.periodOption} ${value === p.id ? styles.periodOptionActive : ''}`}
                onClick={() => { onChange(p.id); setOpen(false) }}
              >
                {p.label}
                {value === p.id && (
                  <span className="mi" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>check</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────

function Section({ title, period, onPeriodChange, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <PeriodSelector value={period} onChange={onPeriodChange} />
      </div>
      {children}
    </section>
  )
}
function StatCard({ icon, label, value, sub, iconColor }) {
  const bg = iconColor
    ? `color-mix(in srgb, ${iconColor} 15%, transparent)`
    : 'var(--accent)'
  const border = iconColor
    ? `color-mix(in srgb, ${iconColor} 25%, transparent)`
    : 'var(--accent)'
  return (
    <div className={styles.statCard}>
      <div className={styles.statIconWrap} style={{ background: bg, border: `1px solid ${border}` }}>
        <span className="mi" style={{ fontSize: '1.2rem', color: iconColor ?? 'var(--accent)' }}>{icon}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

// ── Status row with inline progress bar ──────────────────────

function StatusRow({ label, count, total, color = 'var(--accent)' }) {
  const w = total > 0 ? Math.max(2, (count / total) * 100) : 0
  return (
    <div className={styles.statusRow}>
      <div className={styles.statusRowTop}>
        <span className={styles.statusRowLabel}>
          <span className={styles.statusRowDot} style={{ background: color }} />
          {label}
        </span>
        <span className={styles.statusRowCount}>{count}</span>
      </div>
      <div className={styles.statusRowTrack}>
        <div className={styles.statusRowFill} style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Collection Rate bar ───────────────────────────────────────

function CollectionBar({ rate }) {
  return (
    <div className={styles.collectionCard}>
      <div className={styles.collectionTop}>
        <div>
          <div className={styles.collectionLabel}>Collection Rate</div>
          <div className={styles.collectionSub}>Payments received vs order value</div>
        </div>
        <div className={styles.collectionRate}>{rate}%</div>
      </div>
      <div className={styles.collectionTrack}>
        <div className={styles.collectionFill} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
    </div>
  )
}

// ── Payment 3-col row ─────────────────────────────────────────

// ── 3. PaymentBreakdown — add coloured dots above each column ─────────────
function PaymentBreakdown({ partCount, partOutstanding, fullCount, unpaidCount }) {
  return (
    <div className={styles.payRow}>
      <div className={styles.payCol}>
        <span className={styles.payDot} style={{ background: '#fb923c' }} />
        <div className={styles.payVal}>{partCount}</div>
        <div className={styles.payLbl}>Part Payments</div>
        {partOutstanding > 0 && (
          <div className={styles.paySub}>{fmt(partOutstanding)} left</div>
        )}
      </div>
      <div className={styles.payDivider} />
      <div className={styles.payCol}>
        <span className={styles.payDot} style={{ background: '#22c55e' }} />
        <div className={styles.payVal}>{fullCount}</div>
        <div className={styles.payLbl}>Full Payments</div>
      </div>
      <div className={styles.payDivider} />
      <div className={styles.payCol}>
        <span className={styles.payDot} style={{ background: '#ef4444' }} />
        <div className={styles.payVal}>{unpaidCount}</div>
        <div className={styles.payLbl}>Unpaid</div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────

export default function Reports({ onMenuClick }) {
  const { allOrders }   = useOrders()
  const { tasks }       = useTasks()
  const { allPayments } = usePayments()
  const { customers }   = useCustomers()

  const [perfPeriod,  setPerfPeriod]  = useState('month')
  const [orderPeriod, setOrderPeriod] = useState('month')
  const [taskPeriod,  setTaskPeriod]  = useState('month')
  const [payPeriod,   setPayPeriod]   = useState('month')
  const [custPeriod,  setCustPeriod]  = useState('month')

  // ── Orders ────────────────────────────────────────────────
  const orderStats = useMemo(() => {
    const start    = periodStart(orderPeriod)
    const flat     = Array.isArray(allOrders) ? allOrders : []
    const filtered = flat.filter(o => inPeriod(o, start))
    const delivered  = filtered.filter(o => o.status === 'delivered').length
    const inProgress = filtered.filter(o => o.status === 'pending' || o.status === 'in_progress').length
    const completed  = filtered.filter(o => o.status === 'completed').length
    const overdue    = filtered.filter(o => {
      if (!o.due) return false
      return new Date(o.due + 'T23:59:59') < new Date() &&
        o.status !== 'delivered' && o.status !== 'completed'
    }).length
    return { total: filtered.length, delivered, inProgress, completed, overdue }
  }, [allOrders, orderPeriod])

  // ── Tasks ─────────────────────────────────────────────────
  const taskStats = useMemo(() => {
    const start    = periodStart(taskPeriod)
    const filtered = tasks.filter(t => inPeriod(t, start))
    const done     = filtered.filter(t => t.done).length
    const pending  = filtered.filter(t => !t.done && new Date(t.dueDate + 'T23:59:59') >= new Date()).length
    const overdue  = filtered.filter(t => {
      if (!t.dueDate || t.done) return false
      return new Date(t.dueDate + 'T23:59:59') < new Date()
    }).length
    return { total: filtered.length, done, pending, overdue }
  }, [tasks, taskPeriod])

  // ── Payments ──────────────────────────────────────────────
  const payStats = useMemo(() => {
    const start = periodStart(payPeriod)
    const installments = []
    allPayments.forEach(p => {
      ;(p.installments || []).forEach(inst => installments.push({ ...inst, paymentStatus: p.status }))
    })
    const filtered = installments.filter(inst => {
      const d = new Date(inst.date)
      return !isNaN(d) && (!start || d >= start)
    })
    const totalReceived = filtered.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const unpaidCount   = allPayments.filter(p => p.status === 'not_paid').length
    const partCount     = allPayments.filter(p => p.status === 'part').length
    const fullCount     = allPayments.filter(p => p.status === 'paid').length
    const outstanding   = allPayments
      .filter(p => p.status === 'part')
      .reduce((s, p) => {
        const total = parseFloat(p.totalAmount) || 0
        const paid  = (p.installments || []).reduce((a, i) => a + (parseFloat(i.amount) || 0), 0)
        return s + Math.max(0, total - paid)
      }, 0)
    const bars = buildPaymentBars(filtered, payPeriod)
    return { totalReceived, unpaidCount, partCount, fullCount, outstanding, bars }
  }, [allPayments, payPeriod])

  // ── Performance ───────────────────────────────────────────
  const perfStats = useMemo(() => {
    const start    = periodStart(perfPeriod)
    const flat     = Array.isArray(allOrders) ? allOrders : []
    const filtered = flat.filter(o => inPeriod(o, start))
    const totalOrders = filtered.length
    const orderValue  = filtered.reduce((s, o) => s + (parseFloat(o.price) || 0), 0)

    let payReceived = 0
    const instStart = periodStart(perfPeriod)
    allPayments.forEach(p => {
      ;(p.installments || []).forEach(inst => {
        const d = new Date(inst.date)
        if (!isNaN(d) && (!instStart || d >= instStart)) {
          payReceived += parseFloat(inst.amount) || 0
        }
      })
    })

    const collectionRate = orderValue > 0 ? Math.round((payReceived / orderValue) * 100) : 0
    const outstanding    = Math.max(0, orderValue - payReceived)
    return { totalOrders, orderValue, payReceived, collectionRate, outstanding }
  }, [allOrders, allPayments, perfPeriod])

  // ── Customers ─────────────────────────────────────────────
  const custStats = useMemo(() => {
    const start      = periodStart(custPeriod)
    const newClients = customers.filter(c => inPeriod(c, start)).length
    const orderMap   = {}
    ;(Array.isArray(allOrders) ? allOrders : []).forEach(o => {
      if (o.customerId) orderMap[o.customerId] = (orderMap[o.customerId] || 0) + 1
    })
    const repeatCount = Object.values(orderMap).filter(c => c > 1).length
    const avgOrders   = customers.length > 0
      ? ((Array.isArray(allOrders) ? allOrders : []).length / customers.length).toFixed(1)
      : '—'
    return { total: customers.length, newClients, repeatCount, avgOrders }
  }, [customers, custPeriod, allOrders])

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="Reports" />

      <div className={styles.scrollArea}>

        {/* ── PERFORMANCE ── */}
        <Section title="Performance" period={perfPeriod} onPeriodChange={setPerfPeriod}>
          <CollectionBar rate={perfStats.collectionRate} />
          <div className={styles.statsGrid}>
            <StatCard icon="receipt_long"        label="Total Orders"  value={perfStats.totalOrders} sub="in period"       />
            <StatCard icon="sell"                 label="Order Value"   value={fmt(perfStats.orderValue)} sub="est. revenue" />
            <StatCard icon="account_balance_wallet" label="Received"   value={fmt(perfStats.payReceived)}                   />
            <StatCard icon="pending_actions"      label="Outstanding"  value={fmt(perfStats.outstanding)} sub="unpaid balance" />
          </div>
        </Section>

  // ── 4. Orders section — coloured donut + matching StatusRow colours ────────
// Replace the Orders <Section> block with:
<Section title="Orders" period={orderPeriod} onPeriodChange={setOrderPeriod}>
  <div className={styles.chartCard}>
    <div className={styles.chartCardInner}>
      <DonutChart
        segments={[
          { value: orderStats.delivered,  color: '#818cf8' },   // indigo
          { value: orderStats.inProgress, color: '#fb923c' },   // amber
          { value: orderStats.completed,  color: '#22c55e' },   // green
          { value: orderStats.overdue,    color: '#ef4444' },   // red
        ]}
        centerLabel={orderStats.total}
        centerSub="Total"
      />
      <div className={styles.statusRows}>
        <StatusRow label="Delivered"   count={orderStats.delivered}  total={orderStats.total} color="#818cf8" />
        <StatusRow label="In Progress" count={orderStats.inProgress} total={orderStats.total} color="#fb923c" />
        <StatusRow label="Completed"   count={orderStats.completed}  total={orderStats.total} color="#22c55e" />
        <StatusRow label="Overdue"     count={orderStats.overdue}    total={orderStats.total} color="#ef4444" />
      </div>
    </div>
  </div>
</Section>
        {/* ── PAYMENTS ── */}
        <Section title="Payments" period={payPeriod} onPeriodChange={setPayPeriod}>
          <div className={styles.chartCard}>
            <div className={styles.receivedHero}>
              <span className={styles.receivedLabel}>Total Received</span>
              <span className={styles.receivedVal}>{fmt(payStats.totalReceived)}</span>
            </div>
            <PaymentBreakdown
              partCount={payStats.partCount}
              partOutstanding={payStats.outstanding}
              fullCount={payStats.fullCount}
              unpaidCount={payStats.unpaidCount}
            />
            {payStats.bars.length > 0
              ? <BarChart bars={payStats.bars} />
              : <div className={styles.noData}>No payment data for this period</div>
            }
          </div>
        </Section>

        // ── 5. Tasks section — coloured donut + matching StatusRow colours ─────────
<Section title="Tasks" period={taskPeriod} onPeriodChange={setTaskPeriod}>
  <div className={styles.chartCard}>
    <div className={styles.chartCardInner}>
      <DonutChart
        segments={[
          { value: taskStats.done,    color: '#22c55e' },   // green
          { value: taskStats.pending, color: '#818cf8' },   // indigo
          { value: taskStats.overdue, color: '#ef4444' },   // red
        ]}
        centerLabel={`${pct(taskStats.done, taskStats.total)}%`}
        centerSub="Done"
      />
      <div className={styles.statusRows}>
        <StatusRow label="Completed"   count={taskStats.done}    total={taskStats.total} color="#22c55e" />
        <StatusRow label="In Progress" count={taskStats.pending} total={taskStats.total} color="#818cf8" />
        <StatusRow label="Overdue"     count={taskStats.overdue} total={taskStats.total} color="#ef4444" />
      </div>
    </div>
  </div>
</Section>

        {/* ── CUSTOMERS ── */}
        <Section title="Customers" period={custPeriod} onPeriodChange={setCustPeriod}>
          <div className={styles.statsGrid}>
 // ── 8. Customer stat cards — coloured icons ───────────────────────────────
<StatCard icon="people"     label="Total Clients"   value={custStats.total}       iconColor="#818cf8" />
<StatCard icon="person_add" label="New This Period" value={custStats.newClients}  iconColor="#22c55e" />
<StatCard icon="repeat"     label="Repeat Clients"  value={custStats.repeatCount} sub="2+ orders"  iconColor="#06b6d4" />
<StatCard icon="bar_chart"  label="Avg Orders"      value={custStats.avgOrders}   sub="per client" iconColor="#fb923c" />
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>
      <BottomNav></BottomNav>
    </div>
  )
}
