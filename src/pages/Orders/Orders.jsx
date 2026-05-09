// src/pages/Orders/Orders.jsx

import { useState, useRef } from 'react'
import Header           from '../../components/Header/Header'
import BottomNav        from '../../components/BottomNav/BottomNav'
import OrderMosaic      from '../../components/OrderMosaic/OrderMosaic'
import OrderDetailModal from '../../components/OrderDetailModal/OrderDetailModal'
import styles           from './Orders.module.css'
import { useOrders }    from '../../contexts/OrdersContext'

// ── Helpers ───────────────────────────────────────────────────

function isOverdue(order) {
  const raw = order.dueRaw || order.dueDate
  if (!raw) return false
  if (['completed', 'delivered', 'cancelled'].includes(order.status)) return false
  return new Date(raw + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown Date'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getOrderGroupDate(o) {
  if (o.date && o.date !== 'Unknown Date') return o.date
  if (o.createdAt) {
    const d = typeof o.createdAt.toDate === 'function'
      ? o.createdAt.toDate()
      : new Date(o.createdAt)
    if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (o.dueDate) return formatDate(o.dueDate)
  return 'Unknown Date'
}

// ── Constants ─────────────────────────────────────────────────

const TABS = [
  { id: 'all',         label: 'All',         icon: 'assignment'    },
  { id: 'pending',     label: 'Pending',     icon: 'schedule'      },
  { id: 'in-progress', label: 'In Progress', icon: 'autorenew'     },
  { id: 'completed',   label: 'Completed',   icon: 'check_circle'  },
  { id: 'delivered',   label: 'Delivered',   icon: 'local_shipping' },
  { id: 'cancelled',   label: 'Cancelled',   icon: 'cancel'        },
  { id: 'overdue',     label: 'Overdue',     icon: 'alarm_on'      },
]

const EMPTY_CONFIG = {
  all:           { icon: 'assignment',     text: 'No orders yet.'               },
  pending:       { icon: 'schedule',       text: 'No pending orders.'            },
  'in-progress': { icon: 'autorenew',      text: 'No orders in progress.'        },
  completed:     { icon: 'check_circle',   text: 'No completed orders yet.'      },
  delivered:     { icon: 'local_shipping', text: 'No delivered orders yet.'      },
  cancelled:     { icon: 'cancel',         text: 'No cancelled orders.'          },
  overdue:       { icon: 'alarm_on',       text: 'No overdue orders. Good job!'  },
}

const STATUS_COLORS = {
  pending:       { color: '#a16207', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)'   },
  'in-progress': { color: '#2563eb', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  completed:     { color: '#15803d', bg: 'rgba(21,128,61,0.12)',   border: 'rgba(21,128,61,0.3)'   },
  delivered:     { color: '#4f46e5', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)' },
  cancelled:     { color: '#dc2626', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
}

const STAGES = [
  { value: 'measurement_taken', label: 'Measurement Taken', icon: 'straighten'    },
  { value: 'fabric_ready',      label: 'Fabric Ready',      icon: 'checkroom'     },
  { value: 'cutting',           label: 'Cutting',           icon: 'content_cut'   },
  { value: 'weaving',           label: 'Weaving',           icon: 'texture'       },
  { value: 'sewing',            label: 'Sewing',            icon: 'construction'  },
  { value: 'embroidery',        label: 'Embroidery',        icon: 'auto_awesome'  },
  { value: 'fitting',           label: 'Fitting',           icon: 'accessibility' },
  { value: 'adjustments',       label: 'Adjustments',       icon: 'tune'          },
  { value: 'finishing',         label: 'Finishing',         icon: 'dry_cleaning'  },
  { value: 'quality_check',     label: 'Quality Check',     icon: 'fact_check'    },
  { value: 'ready',             label: 'Ready',             icon: 'check_circle'  },
]

// ── Order Card ────────────────────────────────────────────────

function OrderCard({ order, isLast, onTap }) {
  const overdue      = isOverdue(order)
  const dueDateRaw   = order.dueRaw || order.dueDate
  const stageObj     = STAGES.find(s => s.value === order.stage)
  const sc           = overdue
    ? { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' }
    : STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
  const statusLabel  = overdue
    ? 'Overdue'
    : order.status
      ? order.status === 'in-progress' ? 'In Progress' : order.status.charAt(0).toUpperCase() + order.status.slice(1)
      : 'Pending'
  const priceStr     = order.price != null ? `₦${Number(order.price).toLocaleString()}` : '—'
  const totalQty     = (order.items || []).reduce((s, i) => s + (parseInt(i.qty, 10) || 0), 0) || order.qty || 0

  return (
    <div
      className={`${styles.orderListItem} ${isLast ? styles.orderListItemLast : ''} ${overdue ? styles.orderListItemOverdue : ''}`}
      onClick={onTap}
    >
      {/* Shared mosaic component — overdue prop tints the border red */}
      <OrderMosaic items={order.items || []} overdue={overdue} />

      {/* LEFT: desc, customer, stage */}
      <div className={styles.orderListInfo}>
        <div className={styles.orderListDesc}>{order.desc || order.name || 'Order'}</div>
        <div className={styles.orderListMeta}>
          <span className="material-icons" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.orderListMetaText}>{order.customerName || '—'}</span>
        </div>
        {stageObj && (
          <div className={styles.orderListStageLine}>
            <span className="material-icons" style={{ fontSize: '0.78rem' }}>{stageObj.icon}</span>
            {stageObj.label}
          </div>
        )}
      </div>

      {/* RIGHT: price, qty badge, status pill, due date */}
      <div className={styles.orderListRight}>
        <div className={styles.orderListPrice}>{priceStr}</div>
        {totalQty > 1 && <div className={styles.orderListQty}>{totalQty} items</div>}
        <span
          className={styles.orderListStatusBadge}
          style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
        >
          {statusLabel}
        </span>
        {dueDateRaw && (
          <div className={styles.orderListDueRight}>
            Due {formatDateShort(dueDateRaw)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Orders({ onMenuClick, onGoToCustomer }) {
  const { allOrders } = useOrders()

  const [activeTab,   setActiveTab]   = useState('all')
  const [detailOrder, setDetailOrder] = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const tabsRef = useRef(null)

  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const filtered = allOrders.filter(o => {
    if (activeTab === 'all')          return true
    if (activeTab === 'pending')      return o.status === 'pending'      && !isOverdue(o)
    if (activeTab === 'in-progress')  return o.status === 'in-progress'  && !isOverdue(o)
    if (activeTab === 'completed')    return o.status === 'completed'
    if (activeTab === 'delivered')    return o.status === 'delivered'
    if (activeTab === 'cancelled')    return o.status === 'cancelled'
    if (activeTab === 'overdue')      return isOverdue(o)
    return true
  })

  const counts = {
    all:           allOrders.length,
    pending:       allOrders.filter(o => o.status === 'pending'     && !isOverdue(o)).length,
    'in-progress': allOrders.filter(o => o.status === 'in-progress' && !isOverdue(o)).length,
    completed:     allOrders.filter(o => o.status === 'completed').length,
    delivered:     allOrders.filter(o => o.status === 'delivered').length,
    cancelled:     allOrders.filter(o => o.status === 'cancelled').length,
    overdue:       allOrders.filter(isOverdue).length,
  }

  const searchFiltered = search.trim()
    ? filtered.filter(o =>
        (o.desc || o.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName || '').toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  const grouped = [...searchFiltered]
    .sort((a, b) => {
      const da = a.dueRaw || a.dueDate || a.date || ''
      const db = b.dueRaw || b.dueDate || b.date || ''
      return db.localeCompare(da)
    })
    .reduce((acc, o) => {
      const key = getOrderGroupDate(o)
      if (!acc[key]) acc[key] = []
      acc[key].push(o)
      return acc
    }, {})

  return (
    <div className={styles.page}>
      <Header title="All Orders" onMenuClick={onMenuClick} />

      {/* ── Search + filter ── */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="material-icons" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search orders or clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer', padding: 0 }}
                onClick={() => setSearch('')}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
          <button
            className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(p => !p)}
          >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>tune</span>
          </button>
        </div>

        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Filter by Status</div>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.filterOption} ${activeTab === t.id ? styles.filterOptionActive : ''}`}
                onClick={() => { setActiveTab(t.id); setFilterOpen(false) }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                {t.label}
                {activeTab === t.id && (
                  <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs} ref={tabsRef} onClick={() => filterOpen && setFilterOpen(false)}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={e => handleTabClick(e, tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'overdue' ? styles.badgeOverdue : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Order list ── */}
      <div className={styles.listArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {searchFiltered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-icons" style={{ fontSize: '2.8rem', opacity: 0.2 }}>
              {EMPTY_CONFIG[activeTab].icon}
            </span>
            <p>{EMPTY_CONFIG[activeTab].text}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateOrders]) => (
            <div key={date} className={styles.orderGroup}>
              <div className={styles.orderGroupDate}>{date}</div>
              <div className={styles.orderGroupDivider} />
              {dateOrders.map((order, idx) => (
                <OrderCard
                  key={`${order.customerId}-${order.id}`}
                  order={order}
                  isLast={idx === dateOrders.length - 1}
                  onTap={() => setDetailOrder(order)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Order detail modal (shared component) ── */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onGoToCustomer={onGoToCustomer}
        />
      )}

      <BottomNav />
    </div>
  )
}