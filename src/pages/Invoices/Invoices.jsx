import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGeneralSettings }  from '../../contexts/GeneralSettingsContext'
import { useOrders } from '../../contexts/OrdersContext'
import { useInvoices } from '../../contexts/InvoiceContext'
import { INVOICE_STATUS_STYLES, INVOICE_STATUS_LABELS } from '../../datas/invoiceDatas'
import InvoiceViewer from '../../components/InvoiceViewer/InvoiceViewer'
import Header from '../../components/Header/Header'
import styles from './Invoices.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'
import OrderMosaic from '../../components/OrderMosaic/OrderMosaic'



function fmt(currency = '₦', amount) {
  const n = parseFloat(amount) || 0
  return `${currency}${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function isOverdue(invoice) {
  if (invoice.status === 'paid') return false
  if (!invoice.due) return false
  return new Date(invoice.due + 'T23:59:59') < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown Date'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Tabs ──────────────────────────────────────────────────────

const TABS = [
  { id: 'all',       label: 'All'          },
  { id: 'unpaid',    label: 'Unpaid'       },
  { id: 'part_paid', label: 'Part Payment' },
  { id: 'paid',      label: 'Paid'         },
  { id: 'overdue',   label: 'Overdue'      },
]


// ── Invoice List Item ─────────────────────────────────────────

function InvoiceCard({ invoice, currency, onTap, isLast, orderItems }) {
  const total = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    : (parseFloat(invoice.price) || 0)
  const overdue    = isOverdue(invoice)
  const statusKey  = overdue && invoice.status !== 'paid' ? 'overdue' : (invoice.status || 'unpaid')
  const sty        = INVOICE_STATUS_STYLES[statusKey] ?? INVOICE_STATUS_STYLES.unpaid

  return (
    <div
      className={`${styles.invoiceListItem} ${isLast ? styles.invoiceListItemLast : ''} ${overdue ? styles.invoiceListItemOverdue : ''}`}
      onClick={onTap}
    >
      <OrderMosaic items={orderItems} overdue={overdue} />

      {/* Centre: description, number, customer */}
      <div className={styles.invoiceListInfo}>
        <div className={styles.invoiceListDesc}>{invoice.orderDesc || 'Order'}</div>
        <div className={styles.invoiceListOrdRow}>{invoice.number}</div>
        <div className={styles.invoiceListMeta}>
          <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
          <span className={styles.invoiceListMetaText}>{invoice.customerName || '—'}</span>
        </div>
      </div>

      {/* Right: amount + status pill */}
      <div className={styles.invoiceListRight}>
        <div className={styles.invoiceListAmount}>{fmt(currency, total)}</div>
        <span className={styles.invoiceStatusPill} style={{
          background: sty.bg,
          color:      sty.color,
          border:     `1px solid ${sty.border}`,
        }}>
          {INVOICE_STATUS_LABELS[statusKey] ?? statusKey}
        </span>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Invoices({ onMenuClick }) {
  const { user }      = useAuth()
  const { generalSettings }  = useGeneralSettings()
  const { allOrders } = useOrders()
  const currency      = generalSettings.invoiceCurrency || '₦'


  const [activeTab,   setActiveTab]   = useState('all')
  const [viewing,     setViewing]     = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterOpen,  setFilterOpen]  = useState(false)

 const { allInvoices } = useInvoices()
  // ── Build order image lookup: "customerId__orderId" → items[] ──
  const orderItemsMap = {}
  for (const order of allOrders) {
    if (order.customerId && order.id) {
      orderItemsMap[`${order.customerId}__${order.id}`] = order.items || []
    }
  }

  // ── Filter ───────────────────────────────────────────────
  const filtered = allInvoices.filter(inv => {
    if (activeTab === 'all')       return true
    if (activeTab === 'paid')      return inv.status === 'paid'
    if (activeTab === 'unpaid')    return inv.status !== 'paid' && inv.status !== 'part_paid' && !isOverdue(inv)
    if (activeTab === 'part_paid') return inv.status === 'part_paid' && !isOverdue(inv)
    if (activeTab === 'overdue')   return isOverdue(inv)
    return true
  })

  // ── Counts ───────────────────────────────────────────────
  const counts = {
    all:       allInvoices.length,
    unpaid:    allInvoices.filter(i => i.status !== 'paid' && i.status !== 'part_paid' && !isOverdue(i)).length,
    part_paid: allInvoices.filter(i => i.status === 'part_paid' && !isOverdue(i)).length,
    paid:      allInvoices.filter(i => i.status === 'paid').length,
    overdue:   allInvoices.filter(i => isOverdue(i)).length,
  }

  const EMPTY_TEXT = {
    all:       'No invoices yet.',
    unpaid:    'No unpaid invoices.',
    part_paid: 'No part-payment invoices.',
    paid:      'No paid invoices yet.',
    overdue:   'No overdue invoices. All good!',
  }

  // ── Search filter ────────────────────────────────────────
  const searchFiltered = search.trim()
    ? filtered.filter(inv =>
        (inv.orderDesc    || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.number       || '').toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  // ── Group by date ─────────────────────────────────────────
  const grouped = searchFiltered.reduce((acc, inv) => {
    const key = inv.date || 'Unknown Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(inv)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <Header title="All Invoices" onMenuClick={onMenuClick} />

      {/* ── Search + filter ── */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search invoices or clients…"
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
                  {t.id === 'paid' ? 'check_circle' : t.id === 'unpaid' ? 'pending' : t.id === 'part_paid' ? 'payments' : t.id === 'overdue' ? 'alarm' : 'receipt_long'}
                </span>
                {t.label}
                {activeTab === t.id && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
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
              <span className={`${styles.tabBadge} ${tab.id === 'overdue' ? styles.badgeOverdue : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* List */}
      <div className={styles.listArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {searchFiltered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>receipt_long</span>
            <p>{EMPTY_TEXT[activeTab]}</p>
            {activeTab === 'all' && (
              <span className={styles.emptyHint}>
                Go to a customer → Orders → Generate Invoice
              </span>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateInvoices]) => (
            <div key={date} className={styles.invoiceGroup}>
              <div className={styles.invoiceGroupDate}>{date}</div>
              <div className={styles.invoiceGroupDivider} />
              {dateInvoices.map((inv, idx) => (
                <InvoiceCard
                  key={`${inv.customerId}-${inv.id}`}
                  invoice={inv}
                  currency={currency}
                  isLast={idx === dateInvoices.length - 1}
                  onTap={() => setViewing(inv)}
                  orderItems={orderItemsMap[`${inv.customerId}__${inv.orderId}`] ?? []}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Full invoice view — uses InvoiceView so template is preserved */}
      {viewing && (
        <InvoiceView
          invoice={viewing}
          customer={{
            name:    viewing.customerName || '—',
            phone:   viewing.customerPhone || '',
            address: viewing.customerAddress || '',
          }}
          onClose={() => setViewing(null)}
          onStatusChange={async (id, newStatus) => {
            try {
              await updateInvoiceStatus(user.uid, id, newStatus)
              setViewing(prev => prev ? { ...prev, status: newStatus } : null)
            } catch { /* silent */ }
          }}
          onDelete={async (id) => {
            try {
              await deleteInvoice(user.uid, id)
              setViewing(null)
            } catch { /* silent */ }
          }}
          showToast={() => {}}
        />
      )}

      <BottomNav></BottomNav>
    </div>
  )
}