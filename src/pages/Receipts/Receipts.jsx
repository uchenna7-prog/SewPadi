import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCustomers } from '../../contexts/CustomerContext'
import { useGeneralSettings } from '../../contexts/GeneralSettingsContext'
import { useOrders } from '../../contexts/OrdersContext'
import { formatMoney } from '../../utils/moneyUtils'
import { subscribeToReceipts, deleteReceipt } from '../../services/receiptService'
import ReceiptViewer from '../../components/ReceiptViewer/ReceiptViewer'
import Header    from '../../components/Header/Header'
import BottomNav from '../../components/BottomNav/BottomNav'
import styles from './Receipts.module.css'



function formatDate(dateStr) {
  if (!dateStr) return 'Unknown Date'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function resolveCumulativePaid(receipt) {
  if (typeof receipt.cumulativePaid === 'number') return receipt.cumulativePaid
  if (typeof receipt.amountPaid === 'number')     return receipt.amountPaid
  return parseFloat(receipt.amountPaid) || 0
}

function isFullPayment(receipt) {
  const paid  = resolveCumulativePaid(receipt)
  const total = receipt.orderPrice ? parseFloat(receipt.orderPrice) : paid
  return paid >= total && total > 0
}

// ── Tabs ──────────────────────────────────────────────────────

const TABS = [
  { id: 'all',       label: 'All'          },
  { id: 'full',      label: 'Paid in Full' },
  { id: 'part',      label: 'Part Payment' },
]

const STATUS_STYLES = {
  full: { bg: 'rgba(34,197,94,0.12)',  color: '#15803d', border: 'rgba(34,197,94,0.3)'  },
  part: { bg: 'rgba(251,146,60,0.12)', color: '#c2410c', border: 'rgba(251,146,60,0.3)' },
}

// ── Receipt Mosaic Thumbnail ──────────────────────────────────

function ReceiptMosaic({ items, isFull }) {
  const covers = (items || []).map(item => item.imgSrc ?? null).filter(Boolean)
  const total  = items?.length ?? 0

  if (!covers.length) {
    return (
      <div className={styles.receiptListOuter}>
        <div className={styles.receiptListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: isFull ? '#15803d' : 'var(--text3)' }}>
            receipt
          </span>
        </div>
      </div>
    )
  }

  if (total === 1) {
    return (
      <div className={styles.receiptListOuter}>
        <div className={styles.receiptListInner}>
          <img src={covers[0]} alt="" className={styles.orderImg} />
        </div>
      </div>
    )
  }

  if (total === 2) {
    return (
      <div className={styles.receiptListOuter}>
        <div className={`${styles.receiptListInner} ${styles.mosaicInner}`}>
          <div className={styles.mosaicLeft}>
            <img src={covers[0]} alt="" className={styles.mosaicImg} />
          </div>
          <div className={styles.mosaicDividerV} />
          <div className={styles.mosaicRight}>
            <div className={styles.mosaicRightCell}>
              {covers[1]
                ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const extra = total > 3 ? total - 3 : 0
  return (
    <div className={styles.receiptListOuter}>
      <div className={`${styles.receiptListInner} ${styles.mosaicInner}`}>
        <div className={styles.mosaicLeft}>
          {covers[0]
            ? <img src={covers[0]} alt="" className={styles.mosaicImg} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDividerV} />
        <div className={styles.mosaicRight}>
          <div className={styles.mosaicRightCell}>
            {covers[1]
              ? <img src={covers[1]} alt="" className={styles.mosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDividerH} />
          <div className={`${styles.mosaicRightCell} ${extra > 0 ? styles.mosaicOverlayWrap : ''}`}>
            {covers[2]
              ? <img src={covers[2]} alt="" className={styles.mosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extra > 0 && <div className={styles.mosaicOverlay}>+{extra}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Receipt List Item ─────────────────────────────────────────

function ReceiptCard({ receipt, currency, onTap, isLast, orderItems }) {
  const paid   = resolveCumulativePaid(receipt)
  const full   = isFullPayment(receipt)
  const sty    = full ? STATUS_STYLES.full : STATUS_STYLES.part
  const label  = full ? 'Paid in Full' : 'Part Payment'

  return (
    <div
      className={`${styles.receiptListItem} ${isLast ? styles.receiptListItemLast : ''}`}
      onClick={onTap}
    >
      <ReceiptMosaic items={orderItems} isFull={full} />

      <div className={styles.receiptListInfo}>
        <div className={styles.receiptListDesc}>{receipt.orderDesc || 'Order'}</div>
        <div className={styles.receiptListOrdRow}>{receipt.number}</div>
        <div className={styles.receiptListMeta}>
          <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.receiptListMetaText}>{receipt.customerName || '—'}</span>
        </div>
      </div>

      <div className={styles.receiptListRight}>
        <div className={styles.receiptListAmount}>{formatMoney(currency, paid)}</div>
        <span className={styles.receiptStatusPill} style={{
          background: sty.bg,
          color:      sty.color,
          border:     `1px solid ${sty.border}`,
        }}>
          {label}
        </span>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Receipts({ onMenuClick }) {
  const { user }           = useAuth()
  const { customers }      = useCustomers()
  const { generalSettings } = useGeneralSettings()
  const { allOrders }      = useOrders()
  const currency           = generalSettings.invoiceCurrency || '₦'

  const [allReceipts, setAllReceipts] = useState([])
  const [activeTab,   setActiveTab]   = useState('all')
  const [viewing,     setViewing]     = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const unsubsRef = useRef({})

  // ── Subscribe to every customer's receipts ────────────────
  useEffect(() => {
    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    if (!user || !customers.length) {
      setAllReceipts([])
      return
    }

    const receiptMap = {}

    customers.forEach(customer => {
      const unsub = subscribeToReceipts(
        user.uid,
        customer.id,
        (receipts) => {
          receiptMap[customer.id] = receipts.map(rec => ({
            ...rec,
            customerName: rec.customerName || customer.name,
            customerId:   customer.id,
          }))
          const flat = Object.values(receiptMap)
            .flat()
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() ?? 0
              const bTime = b.createdAt?.toMillis?.() ?? 0
              return bTime - aTime
            })
          setAllReceipts([...flat])
        },
        (err) => console.error('[Receipts]', customer.id, err)
      )
      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  // ── Build order image lookup ──────────────────────────────
  const orderItemsMap = {}
  for (const order of allOrders) {
    if (order.customerId && order.id) {
      orderItemsMap[`${order.customerId}__${order.id}`] = order.items || []
    }
  }

  // ── Filter ───────────────────────────────────────────────
  const filtered = allReceipts.filter(rec => {
    if (activeTab === 'all')  return true
    if (activeTab === 'full') return isFullPayment(rec)
    if (activeTab === 'part') return !isFullPayment(rec)
    return true
  })

  // ── Counts ───────────────────────────────────────────────
  const counts = {
    all:  allReceipts.length,
    full: allReceipts.filter(r => isFullPayment(r)).length,
    part: allReceipts.filter(r => !isFullPayment(r)).length,
  }

  const EMPTY_TEXT = {
    all:  'No receipts yet.',
    full: 'No fully paid receipts yet.',
    part: 'No part payment receipts.',
  }

  // ── Search filter ────────────────────────────────────────
  const searchFiltered = search.trim()
    ? filtered.filter(rec =>
        (rec.orderDesc    || '').toLowerCase().includes(search.toLowerCase()) ||
        (rec.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (rec.number       || '').toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  // ── Group by date ─────────────────────────────────────────
  const grouped = searchFiltered.reduce((acc, rec) => {
    const key = rec.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(rec)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <Header title="All Receipts" onMenuClick={onMenuClick} />

      {/* ── Search + filter ── */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search receipts or clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer', padding: 0 }}
                onClick={() => setSearch('')}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
          <button
            className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(p => !p)}
          >
            <span className="mi" style={{ fontSize: '1.2rem' }}>tune</span>
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
                <span className="mi" style={{ fontSize: '1.1rem' }}>
                  {t.id === 'full' ? 'check_circle' : t.id === 'part' ? 'payments' : 'receipt'}
                </span>
                {t.label}
                {activeTab === t.id && (
                  <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs} onClick={() => filterOpen && setFilterOpen(false)}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={(e) => {
              setActiveTab(tab.id)
              e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={styles.tabBadge}>{counts[tab.id]}</span>
            )}
          </div>
        ))}
      </div>

      {/* List */}
      <div className={styles.listArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {searchFiltered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>receipt</span>
            <p>{EMPTY_TEXT[activeTab]}</p>
            {activeTab === 'all' && (
              <span className={styles.emptyHint}>
                Go to a customer → Orders → Generate Receipt
              </span>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateReceipts]) => (
            <div key={date} className={styles.receiptGroup}>
              <div className={styles.receiptGroupDate}>{date}</div>
              <div className={styles.receiptGroupDivider} />
              {dateReceipts.map((rec, idx) => (
                <ReceiptCard
                  key={`${rec.customerId}-${rec.id}`}
                  receipt={rec}
                  currency={currency}
                  isLast={idx === dateReceipts.length - 1}
                  onTap={() => setViewing(rec)}
                  orderItems={orderItemsMap[`${rec.customerId}__${rec.orderId}`] ?? []}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Full receipt view */}
      {viewing && (
        <ReceiptViewer
          receipt={viewing}
          customer={{
            name:    viewing.customerName || '—',
            phone:   viewing.customerPhone || '',
            address: viewing.customerAddress || '',
          }}
          onClose={() => setViewing(null)}
          onDelete={async (id) => {
            try {
              await deleteReceipt(user.uid, viewing.customerId, id)
              setViewing(null)
            } catch { /* silent */ }
          }}
          showToast={() => {}}
        />
      )}

      <BottomNav />
    </div>
  )
}