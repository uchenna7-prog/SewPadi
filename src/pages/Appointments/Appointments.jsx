import { 
  useState, 
  useRef, 
  useCallback, 
  useEffect 
} from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders } from '../../contexts/OrdersContext'
import { subscribeToOrders } from '../../services/orderService'
import { useAppointments } from '../../contexts/AppointmentContext'
import { subscribeToAppointments } from '../../services/appointmentService'
import Header from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast from '../../components/Toast/Toast'
import styles from './Appointments.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── Helpers ───────────────────────────────────────────────────

const APPT_TYPES = [
  { id: 'fitting',     label: 'Fitting',     icon: 'checkroom'       },
  { id: 'consultation',label: 'Consultation',icon: 'forum'           },
  { id: 'pickup',      label: 'Pick-up',     icon: 'inventory_2'     },
  { id: 'measurement', label: 'Measurement', icon: 'straighten'      },
  { id: 'delivery',    label: 'Delivery',    icon: 'local_shipping'  },
  { id: 'other',       label: 'Other',       icon: 'calendar_today'  },
]

const TYPE_ICONS = Object.fromEntries(APPT_TYPES.map(t => [t.id, t.icon]))

const STATUS_CONFIG = {
  upcoming:  { label: 'Upcoming',  color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.4)'  },
  done:      { label: 'Done',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.4)'   },
  missed:    { label: 'Missed',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)'   },
  cancelled: { label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.4)' },
}

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'upcoming',  label: 'Upcoming'  },
  { id: 'done',      label: 'Done'      },
  { id: 'missed',    label: 'Missed'    },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

function isOverdue(appt) {
  if (!appt.date || appt.status === 'done' || appt.status === 'cancelled') return false
  const apptDateTime = appt.time
    ? new Date(`${appt.date}T${appt.time}`)
    : new Date(appt.date + 'T23:59:59')
  return apptDateTime < new Date()
}

function timeUntil(dateStr, timeStr) {
  if (!dateStr) return null
  const now   = new Date()
  const appt  = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr + 'T00:00:00')
  const diffMs = appt - now
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 0) {
    const abs = Math.abs(diffMins)
    if (abs < 60)  return `${abs}m ago`
    if (abs < 1440) return `${Math.round(abs / 60)}h ago`
    return `${Math.round(abs / 1440)}d ago`
  }
  if (diffMins < 60)   return `In ${diffMins}m`
  if (diffMins < 1440) return `In ${Math.round(diffMins / 60)}h`
  const days = Math.round(diffMins / 1440)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days}d`
}

// ── Add Appointment Modal ─────────────────────────────────────

function AddAppointmentModal({ isOpen, onClose, onSave, customers }) {
  const { user } = useAuth()

  const [title,        setTitle]        = useState('')
  const [type,         setType]         = useState('fitting')
  const [date,         setDate]         = useState('')
  const [time,         setTime]         = useState('')
  const [location,     setLocation]     = useState('')
  const [notes,        setNotes]        = useState('')
  const [custQuery,    setCustQuery]    = useState('')
  const [selectedCust, setSelectedCust] = useState(null)
  const [custDropOpen, setCustDropOpen] = useState(false)
  const [selectedOrder,setSelectedOrder]= useState(null)
  const [orderDropOpen,setOrderDropOpen]= useState(false)
  const [custOrders,   setCustOrders]   = useState([])
  const [reminder,     setReminder]     = useState(true)

  useEffect(() => {
    if (!user || !selectedCust) { setCustOrders([]); return }
    const unsub = subscribeToOrders(
      user.uid, selectedCust.id,
      (orders) => setCustOrders(orders),
      (err)    => console.error('[Appointments] custOrders:', err)
    )
    return unsub
  }, [user, selectedCust])

  const filteredCusts = custQuery.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(custQuery.toLowerCase()) ||
        c.phone?.includes(custQuery)
      )
    : customers

  const reset = () => {
    setTitle(''); setType('fitting'); setDate(''); setTime(''); setLocation('')
    setNotes(''); setCustQuery(''); setSelectedCust(null); setCustDropOpen(false)
    setSelectedOrder(null); setOrderDropOpen(false); setCustOrders([]); setReminder(true)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = () => {
    if (!title.trim() || !date) return
    onSave({
      title:        title.trim(),
      type,
      date,
      time,
      location:     location.trim(),
      notes:        notes.trim(),
      reminder,
      customerId:   selectedCust  ? String(selectedCust.id)  : null,
      customerName: selectedCust  ? selectedCust.name        : null,
      customerPhone:selectedCust  ? selectedCust.phone       : null,
      orderId:      selectedOrder ? String(selectedOrder.id) : null,
      orderDesc:    selectedOrder ? selectedOrder.desc       : null,
      status:       'upcoming',
    })
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <Header 
        type="back" 
        title="New Appointment" 
        onBackClick={handleClose}
        customActions={[{
          label: 'Save',
          onClick: handleSave,
          disabled: !title.trim() || !date
        }]}
      />

      <div className={styles.modalBody}>

        {/* Title */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Appointment Title *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Final fitting for Senator suit"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Type */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Type</label>
          <div className={styles.categoryGrid}>
            {APPT_TYPES.map(t => (
              <button
                key={t.id}
                className={`${styles.categoryChip} ${type === t.id ? styles.categoryActive : ''}`}
                onClick={() => setType(t.id)}
              >
                <span className="mi" style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date + Time */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Date *</label>
            <input
              type="date"
              className={styles.input}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Time</label>
            <input
              type="time"
              className={styles.input}
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Location */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Location <span className={styles.optional}>(optional)</span></label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Shop, Client's address…"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        {/* Reminder toggle */}
        <div className={styles.fieldGroup}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Reminder</div>
              <div className={styles.toggleSub}>Don't let this slip</div>
            </div>
            <button
              className={`${styles.toggle} ${reminder ? styles.toggleOn : ''}`}
              onClick={() => setReminder(p => !p)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        {/* Client */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Client *</label>
          {selectedCust ? (
            <div className={styles.selectedChip}>
              <div className={styles.chipAvatar}>
                {selectedCust.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.chipName}>{selectedCust.name}</div>
                {selectedCust.phone && <div className={styles.chipSub}>{selectedCust.phone}</div>}
              </div>
              <button
                className={styles.chipRemove}
                onClick={() => { setSelectedCust(null); setSelectedOrder(null) }}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
          ) : (
            <div className={styles.searchWrap}>
              <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search client name or phone…"
                value={custQuery}
                onChange={e => { setCustQuery(e.target.value); setCustDropOpen(true) }}
                onFocus={() => setCustDropOpen(true)}
              />
              {custDropOpen && custQuery && (
                <div className={styles.dropdown}>
                  {filteredCusts.length === 0 ? (
                    <div className={styles.dropEmpty}>No clients found</div>
                  ) : (
                    filteredCusts.slice(0, 6).map(c => (
                      <button
                        key={c.id}
                        className={styles.dropItem}
                        onClick={() => {
                          setSelectedCust(c); setCustQuery(''); setCustDropOpen(false); setSelectedOrder(null)
                        }}
                      >
                        <div className={styles.dropAvatar}>
                          {c.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.dropName}>{c.name}</div>
                          <div className={styles.dropMeta}>{c.phone}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Linked order (only when client selected) */}
        {selectedCust && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Related Order <span className={styles.optional}>(optional)</span>
            </label>
            {selectedOrder ? (
              <div className={styles.selectedChip}>
                <span className="mi" style={{ fontSize: '1rem', color: 'var(--accent)' }}>content_cut</span>
                <span className={styles.chipName}>{selectedOrder.desc}</span>
                <button className={styles.chipRemove} onClick={() => setSelectedOrder(null)}>
                  <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                </button>
              </div>
            ) : (
              <div className={styles.orderDropWrap}>
                <button className={styles.orderDropBtn} onClick={() => setOrderDropOpen(p => !p)}>
                  <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>content_cut</span>
                  <span>{custOrders.length === 0 ? 'No orders for this client' : 'Select an order…'}</span>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)', marginLeft: 'auto' }}>expand_more</span>
                </button>
                {orderDropOpen && custOrders.length > 0 && (
                  <div className={styles.dropdown}>
                    {custOrders.map(o => (
                      <button key={o.id} className={styles.dropItem}
                        onClick={() => { setSelectedOrder(o); setOrderDropOpen(false) }}>
                        <span className="mi" style={{ fontSize: '1.1rem' }}>content_cut</span>
                        <div>
                          <div className={styles.dropName}>{o.desc}</div>
                          <div className={styles.dropMeta}>{o.due ? `Due ${o.due}` : o.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Notes <span className={styles.optional}>(optional)</span></label>
          <textarea
            className={styles.textarea}
            placeholder="Anything to remember about this appointment…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>

      </div>
    </div>
  )
}

// ── Appointment Thumbnail Mosaic ──────────────────────────────
// Shows the linked order's images in mosaic layout when an order
// is linked to the appointment. Falls back to the appointment
// type icon when no order is linked or the order has no images.

function ApptMosaic({ appt, orderItemsMap, overdue, effectiveSc, icon }) {
  const covers = appt.orderId
    ? (orderItemsMap[appt.orderId] || []).map(i => i.imgSrc ?? null).filter(Boolean)
    : []
  const total = appt.orderId ? (orderItemsMap[appt.orderId]?.length ?? 0) : 0

  // ── No linked order images → type icon ──
  if (!covers.length) {
    return (
      <div
        className={styles.apptListOuter}
        style={{
          borderColor: overdue ? 'rgba(239,68,68,0.35)' : undefined,
          background:  overdue ? 'rgba(239,68,68,0.06)' : undefined,
        }}
      >
        <div className={styles.apptListInner}>
          <span className="mi" style={{ fontSize: '1.5rem', color: effectiveSc.color }}>
            {icon}
          </span>
        </div>
      </div>
    )
  }

  // ── 1 image ──
  if (total === 1) {
    return (
      <div className={styles.apptListOuter}>
        <div className={styles.apptListInner}>
          <img src={covers[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
        </div>
      </div>
    )
  }

  // ── 2 images ──
  if (total === 2) {
    return (
      <div className={styles.apptListOuter}>
        <div className={`${styles.apptListInner} ${styles.amMosaicInner}`}>
          <div className={styles.amMosaicLeft}>
            <img src={covers[0]} alt="" className={styles.amMosaicImg} />
          </div>
          <div className={styles.amMosaicDividerV} />
          <div className={styles.amMosaicRight}>
            <div className={styles.amMosaicRightCell}>
              {covers[1]
                ? <img src={covers[1]} alt="" className={styles.amMosaicImg} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 3+ images ──
  const extra = total > 3 ? total - 3 : 0
  return (
    <div className={styles.apptListOuter}>
      <div className={`${styles.apptListInner} ${styles.amMosaicInner}`}>
        <div className={styles.amMosaicLeft}>
          {covers[0]
            ? <img src={covers[0]} alt="" className={styles.amMosaicImg} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.amMosaicDividerV} />
        <div className={styles.amMosaicRight}>
          <div className={styles.amMosaicRightCell}>
            {covers[1]
              ? <img src={covers[1]} alt="" className={styles.amMosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.amMosaicDividerH} />
          <div className={`${styles.amMosaicRightCell} ${extra > 0 ? styles.amMosaicOverlayWrap : ''}`}>
            {covers[2]
              ? <img src={covers[2]} alt="" className={styles.amMosaicImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extra > 0 && <div className={styles.amMosaicOverlay}>+{extra}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────

function AppointmentCard({ appt, onOpen, onStatusChange, isLast, orderItemsMap }) {
  const overdue = isOverdue(appt) && appt.status === 'upcoming'
  const sc      = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.upcoming
  const icon    = TYPE_ICONS[appt.type] || 'calendar_today'
  const until   = timeUntil(appt.date, appt.time)

  const effectiveStatus = overdue ? 'missed' : appt.status
  const effectiveSc     = STATUS_CONFIG[effectiveStatus] ?? sc

  return (
    <div
      className={`${styles.apptListItem} ${isLast ? styles.apptListItemLast : ''}`}
      onClick={onOpen}
    >
      {/* Thumbnail: order mosaic if linked, else type icon */}
      <ApptMosaic
        appt={appt}
        orderItemsMap={orderItemsMap}
        overdue={overdue}
        effectiveSc={effectiveSc}
        icon={icon}
      />

      {/* Info */}
      <div className={styles.apptListInfo}>
        <div className={styles.apptListTitle}>{appt.title}</div>

        {appt.customerName && (
          <div className={styles.apptListMeta}>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>person</span>
            <span className={styles.apptListMetaText}>{appt.customerName}</span>
          </div>
        )}

        <div className={styles.apptListMeta}>
          <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>schedule</span>
          <span className={styles.apptListMetaText}>
            {formatDate(appt.date)}{appt.time ? ` · ${formatTime(appt.time)}` : ''}
          </span>
        </div>

        {appt.location && (
          <div className={styles.apptListMeta}>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', verticalAlign: 'middle' }}>place</span>
            <span className={styles.apptListMetaText}>{appt.location}</span>
          </div>
        )}

        <div className={styles.apptListBottom}>
          <span
            className={styles.statusPill}
            style={{ background: effectiveSc.bg, color: effectiveSc.color, borderColor: effectiveSc.border, borderRadius: '6px' }}
          >
            {overdue ? 'Missed' : effectiveSc.label}
          </span>
          {until && appt.status === 'upcoming' && !overdue && (
            <span className={styles.untilText}>{until}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Appointment Detail Panel ──────────────────────────────────

function AppointmentDetail({ appt, onClose, onStatusChange, onDelete }) {
  if (!appt) return null
  const overdue = isOverdue(appt) && appt.status === 'upcoming'

  return (
    <div className={styles.detailOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.detailPanel}>
        <div className={styles.detailHandle} />

        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>Appointment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>

        <div className={styles.detailBody}>

          {/* Status switcher */}
          <div className={styles.statusRow}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                className={`${styles.statusBtn} ${appt.status === key ? styles.statusBtnActive : ''}`}
                style={appt.status === key ? {
                  background:  cfg.bg,
                  borderColor: cfg.border,
                  color:       cfg.color,
                } : {}}
                onClick={() => onStatusChange(appt.id, key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <p className={styles.detailTitle2}>{appt.title}</p>

          <div className={styles.detailGrid}>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Type</div>
              <div className={styles.detailCellVal} style={{ textTransform: 'capitalize' }}>
                {APPT_TYPES.find(t => t.id === appt.type)?.label || appt.type}
              </div>
            </div>
            <div className={styles.detailCell}>
              <div className={styles.detailCellLabel}>Date</div>
              <div className={`${styles.detailCellVal} ${overdue ? styles.overdueText : ''}`}>
                {formatDate(appt.date)}
              </div>
            </div>
            {appt.time && (
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Time</div>
                <div className={styles.detailCellVal}>{formatTime(appt.time)}</div>
              </div>
            )}
            {appt.location && (
              <div className={styles.detailCell}>
                <div className={styles.detailCellLabel}>Location</div>
                <div className={styles.detailCellVal}>{appt.location}</div>
              </div>
            )}
          </div>

          {(appt.customerName || appt.orderDesc) && (
            <div className={styles.detailLinked}>
              <div className={styles.detailLinkedLabel}>Linked To</div>
              {appt.customerName && (
                <div className={styles.detailLinkedRow}>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>person</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{appt.customerName}</div>
                    {appt.customerPhone && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{appt.customerPhone}</div>
                    )}
                  </div>
                  {appt.customerPhone && (
                    <a
                      href={`tel:${appt.customerPhone}`}
                      className={styles.callBtn}
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="mi" style={{ fontSize: '1rem' }}>call</span>
                    </a>
                  )}
                </div>
              )}
              {appt.orderDesc && (
                <div className={styles.detailLinkedRow}>
                  <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>content_cut</span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{appt.orderDesc}</span>
                </div>
              )}
            </div>
          )}

          {appt.notes && (
            <div className={styles.detailNotes}>
              <div className={styles.detailLinkedLabel}>Notes</div>
              <p>{appt.notes}</p>
            </div>
          )}

          <button className={styles.detailDeleteBtn} onClick={() => onDelete(appt)}>
            <span className="mi" style={{ fontSize: '1rem' }}>delete_outline</span>
            Delete Appointment
          </button>

        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function Appointments({ onMenuClick }) {

  const { user } = useAuth()
  const { customers }  = useCustomers()
  const { addAppointment,updateAppointment,deleteAppointment } = useAppointments()
  const { allOrders }  = useOrders()

  // Build orderId → items[] lookup for mosaic thumbnails
  const orderItemsMap = {}
  for (const order of allOrders) {
    if (order.id && order.items?.length) {
      orderItemsMap[String(order.id)] = order.items
    }
  }

  const [appointments,  setAppointments]  = useState([])
  const [activeTab,     setActiveTab]     = useState('all')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [detailAppt,    setDetailAppt]    = useState(null)
  const [confirmDel,    setConfirmDel]    = useState(null)
  const [toastMsg,      setToastMsg]      = useState('')
  const [search,        setSearch]        = useState('')
  const [filterOpen,    setFilterOpen]    = useState(false)
  const toastTimer = useRef(null)

  // ── Subscribe to Firestore ────────────────────────────────
  useEffect(() => {
    if (!user) return
    const unsub = subscribeToAppointments(
      user.uid,
      (data) => {
        setAppointments(data)
        // Keep detail in sync if open
        setDetailAppt(prev => {
          if (!prev) return null
          return data.find(a => a.id === prev.id) ?? null
        })
      },
      (err) => console.error('[Appointments]', err)
    )
    return unsub
  }, [user])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const handleAdd = async (apptData) => {
    if (!user) return
    try {
      await addAppointment(user.uid, apptData)
      showToast('Appointment saved ✓')
    } 
    catch {
      showToast('Failed to save appointment.')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    if (!user) return
    try {
      await updateAppointment(user.uid, id, { status: newStatus })
      setDetailAppt(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev)
      showToast(`Marked as ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`)
    } catch {
      showToast('Failed to update status.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel || !user) return
    try {
      await deleteAppointment(user.uid, confirmDel.id)
      showToast('Appointment deleted')
    } catch {
      showToast('Failed to delete appointment.')
    }
    setConfirmDel(null)
    setDetailAppt(null)
  }

  // ── Filter by tab ─────────────────────────────────────────
  const filtered = appointments.filter(a => {
    if (activeTab === 'all')      return true
    if (activeTab === 'upcoming') return a.status === 'upcoming'
    if (activeTab === 'done')     return a.status === 'done'
    if (activeTab === 'missed')   return a.status === 'missed' || (isOverdue(a) && a.status === 'upcoming')
    return true
  })

  const counts = {
    all:      appointments.length,
    upcoming: appointments.filter(a => a.status === 'upcoming' && !isOverdue(a)).length,
    done:     appointments.filter(a => a.status === 'done').length,
    missed:   appointments.filter(a => a.status === 'missed' || (isOverdue(a) && a.status === 'upcoming')).length,
  }

  // ── Search filter ────────────────────────────────────────
  const searchFiltered = search.trim()
    ? filtered.filter(a =>
        (a.title        || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.orderDesc    || '').toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  // ── Group by date ─────────────────────────────────────────
  const grouped = searchFiltered.reduce((acc, a) => {
    const key = a.date ? formatDate(a.date) : 'No Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <Header title="Appointments" onMenuClick={onMenuClick} />

      {/* ── Search + filter ── */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Search appointments or clients…"
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
                  {t.id === 'upcoming' ? 'event_available' : t.id === 'done' ? 'check_circle' : t.id === 'missed' ? 'event_busy' : 'calendar_today'}
                </span>
                {t.label}
                {activeTab === t.id && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className={styles.tabs} onClick={() => filterOpen && setFilterOpen(false)}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`${styles.tabBadge} ${tab.id === 'missed' ? styles.badgeMissed : ''}`}>
                {counts[tab.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── LIST ── */}
      <div className={styles.listArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {searchFiltered.length === 0 && (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.2 }}>
              {activeTab === 'done'    ? 'check_circle'   :
               activeTab === 'missed' ? 'event_busy'      :
               activeTab === 'upcoming'? 'event_available' : 'calendar_today'}
            </span>
            <p>
              {activeTab === 'all'      && 'No appointments yet.'}
              {activeTab === 'upcoming' && 'No upcoming appointments.'}
              {activeTab === 'done'     && 'No completed appointments yet.'}
              {activeTab === 'missed'   && "No missed appointments. Good job!"}
            </p>
            {activeTab === 'all' && (
              <span className={styles.emptyHint}>Tap + to schedule your first appointment</span>
            )}
          </div>
        )}

        {Object.entries(grouped).map(([groupKey, groupAppts]) => (
          <div key={groupKey} className={styles.apptGroup}>
            <div className={styles.apptGroupDate}>{groupKey}</div>
            <div className={styles.apptGroupDivider} />
            {groupAppts.map((appt, idx) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                isLast={idx === groupAppts.length - 1}
                onOpen={() => setDetailAppt(appt)}
                onStatusChange={handleStatusChange}
                orderItemsMap={orderItemsMap}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── FAB ── */}
      <button className={styles.fab} onClick={() => setModalOpen(true)}>
        <span className="mi">add</span>
      </button>

      {/* ── Modals ── */}
      <AddAppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
        customers={customers}
      />

      {detailAppt && (
        <AppointmentDetail
          appt={detailAppt}
          onClose={() => setDetailAppt(null)}
          onStatusChange={handleStatusChange}
          onDelete={(a) => { setDetailAppt(null); setConfirmDel(a) }}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Appointment?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      <Toast message={toastMsg} />
      <BottomNav></BottomNav>
    </div>
  )
}
